<?php
define('MOS_API', 1); require __DIR__ . '/lib.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(['error' => 'Método no permitido'], 405);

// Freno básico: 12 pedidos por hora por IP.
$ip = preg_replace('/[^0-9a-f:.]/i', '', explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'x')[0]);
$rf = data_dir() . '/rate-' . md5($ip) . '.json';
$hits = array_filter((array) json_decode((string) @file_get_contents($rf), true), fn($t) => $t > time() - 3600);
if (count($hits) >= 12) out(['error' => 'Demasiados intentos. Intenta más tarde o escríbenos por WhatsApp.'], 429);
$hits[] = time(); file_put_contents($rf, json_encode(array_values($hits)), LOCK_EX);

$b = body(); $c = $b['customer'] ?? [];
foreach (['name', 'email', 'phone', 'street', 'colony', 'city', 'state', 'postalCode'] as $k) $c[$k] = trim((string) ($c[$k] ?? ''));
if ($c['name'] === '' || !filter_var($c['email'], FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{5}$/', $c['postalCode']) || $c['street'] === '' || strlen(preg_replace('/\D/', '', $c['phone'])) < 10)
    out(['error' => 'Completa todos los datos de envío con un correo, teléfono y código postal válidos'], 400);

$avail = array_column(providers(), 'id');
if (!$avail) out(['error' => 'El pago en línea no está disponible. Envía tu pedido por WhatsApp.'], 503);
$prov = in_array($b['provider'] ?? '', $avail, true) ? $b['provider'] : $avail[0];

try {
    $cart = price_cart((array) ($b['items'] ?? []));
    $ship = shipping_cost((string) ($b['shipping']['carrier'] ?? ''), $cart['weight']);
} catch (RuntimeException $e) { out(['error' => $e->getMessage()], 400); }

$total = round($cart['subtotal'] + $ship['price'], 2);
$id = 'MOS-' . strtoupper(base_convert((string) time(), 10, 36)) . strtoupper(bin2hex(random_bytes(5)));
$site = rtrim(cfg()['site_url'], '/');
order_save(['id' => $id, 'status' => 'pendiente', 'provider' => $prov, 'created_at' => date('c'), 'customer' => $c, 'lines' => $cart['lines'], 'subtotal' => $cart['subtotal'], 'shipping' => $ship, 'total' => $total]);

$cents = fn(float $m): int => (int) round($m * 100);
if ($prov === 'mercadopago') {
    $items = array_map(fn($l) => ['title' => "{$l['qty']} x {$l['name']}", 'quantity' => 1, 'unit_price' => $l['total'], 'currency_id' => 'MXN'], $cart['lines']);
    if ($ship['price'] > 0) $items[] = ['title' => 'Envío ' . $ship['carrier'], 'quantity' => 1, 'unit_price' => $ship['price'], 'currency_id' => 'MXN'];
    $r = http_json('POST', cfg()['mp_api'] . '/checkout/preferences', ['Authorization: Bearer ' . cfg()['mp_access_token'], "X-Idempotency-Key: $id"], [
        'items' => $items, 'payer' => ['name' => $c['name'], 'email' => $c['email']], 'external_reference' => $id,
        'notification_url' => "$site/api/webhook-mercadopago.php",
        'back_urls' => ['success' => "$site/gracias.html?order=$id", 'pending' => "$site/gracias.html?order=$id&pending=1", 'failure' => "$site/?pago=error"],
        'auto_return' => 'approved']);
    $url = $r['json']['init_point'] ?? null;
} else {
    $phone = substr(preg_replace('/\D/', '', $c['phone']), -10);
    $payload = ['currency' => 'MXN', 'customer_info' => ['name' => $c['name'], 'email' => $c['email'], 'phone' => "+52$phone"],
        'line_items' => array_map(fn($l) => ['name' => mb_substr("{$l['qty']} x {$l['name']}", 0, 250), 'unit_price' => $cents($l['total']), 'quantity' => 1], $cart['lines']),
        'metadata' => ['order_id' => $id],
        'shipping_contact' => ['receiver' => $c['name'], 'address' => ['street1' => $c['street'], 'city' => $c['city'], 'state' => $c['state'], 'postal_code' => $c['postalCode'], 'country' => 'MX']],
        'checkout' => ['type' => 'HostedPayment', 'allowed_payment_methods' => ['card', 'cash', 'bank_transfer'], 'success_url' => "$site/gracias.html?order=$id", 'failure_url' => "$site/?pago=error", 'monthly_installments_enabled' => false]];
    if ($ship['price'] > 0) $payload['shipping_lines'] = [['amount' => $cents($ship['price']), 'carrier' => 'Envío ' . $ship['carrier']]];
    $r = http_json('POST', cfg()['conekta_api'] . '/orders', ['Accept: application/vnd.conekta-v2.1.0+json', 'Authorization: Bearer ' . cfg()['conekta_private_key']], $payload);
    $url = $r['json']['checkout']['url'] ?? null;
}
if (!$url) { error_log("[mosaicca] $prov respondió {$r['code']}"); out(['error' => 'No se pudo iniciar el pago. Intenta de nuevo o escríbenos por WhatsApp.'], 502); }
out(['orderId' => $id, 'total' => $total, 'url' => $url, 'provider' => $prov]);
