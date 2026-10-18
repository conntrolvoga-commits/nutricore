<?php
declare(strict_types=1);
// Utilidades compartidas por los endpoints de cobro. No se ejecuta directamente.
if (!defined('MOS_API')) { http_response_code(403); exit; }

/**
 * Carpeta de pedidos. Por seguridad se guarda FUERA de public_html (donde la web no llega), en
 * <carpeta del dominio>/mosaicca-data. Si no se puede escribir ahí, usa api/data (protegida por .htaccess).
 * Se puede forzar con 'data_dir' en config.php.
 */
function data_dir(): string {
    static $d = null;
    if ($d !== null) return $d;
    $forced = (string) (cfg()['data_dir'] ?? '');
    $outside = dirname(__DIR__, 2) . '/mosaicca-data';
    foreach (array_filter([$forced, $outside]) as $cand) {
        if ((is_dir($cand) || (is_writable(dirname($cand)) && @mkdir($cand, 0750, true))) && is_writable($cand)) { return $d = rtrim($cand, '/'); }
    }
    if (!is_dir(__DIR__ . '/data')) @mkdir(__DIR__ . '/data', 0750, true);
    return $d = __DIR__ . '/data';
}

function cfg(): array {
    static $c = null;
    if ($c === null) {
        $f = getenv('MOS_CONFIG') ?: (__DIR__ . '/config.php');
        $c = is_file($f) ? (array) require $f : [];
        $c += ['site_url' => 'https://www.mosaicca.mx', 'owner_email' => '', 'owner_whatsapp' => '528147902474', 'mp_access_token' => '', 'mp_webhook_secret' => '', 'conekta_private_key' => '',
               'data_dir' => '', 'mp_api' => 'https://api.mercadopago.com', 'conekta_api' => 'https://api.conekta.io', 'shipping_extra_per_kg' => 25,
               'shipping' => ['Estafeta' => ['service' => 'Terrestre', 'base' => 99], 'FedEx' => ['service' => 'Económico', 'base' => 119], 'DHL' => ['service' => 'Express', 'base' => 169]]];
    }
    return $c;
}

function out(array $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function body(): array {
    $raw = file_get_contents('php://input') ?: '';
    if (strlen($raw) > 100_000) out(['error' => 'Solicitud demasiado grande'], 413);
    $j = json_decode($raw, true);
    return is_array($j) ? $j : [];
}

/** Pasarelas con credenciales configuradas. */
function providers(): array {
    $c = cfg(); $p = [];
    if ($c['mp_access_token'] !== '') $p[] = ['id' => 'mercadopago', 'label' => 'Mercado Pago'];
    if ($c['conekta_private_key'] !== '') $p[] = ['id' => 'conekta', 'label' => 'Conekta'];
    return $p;
}

function http_json(string $method, string $url, array $headers, ?array $payload = null): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers)]);
    if ($payload !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE));
    $res = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    $json = is_string($res) ? json_decode($res, true) : null;
    return ['code' => $code, 'json' => is_array($json) ? $json : []];
}

// ── Catálogo y precios (el servidor NUNCA confía en los precios del navegador) ──
function catalog(): array { static $c = null; return $c ??= (array) require __DIR__ . '/catalog.php'; }

function tier_discount(array $tiers, int $qty): float {
    $d = 0.0;
    foreach ($tiers as [$min, $pct]) if ($qty >= $min) $d = (float) $pct;
    return $d;
}

/** Valida el carrito y devuelve renglones con total recalculado. Lanza excepción con mensaje para el cliente. */
function price_cart(array $items): array {
    if (!$items || count($items) > 40) throw new RuntimeException('Carrito vacío o demasiado grande');
    $cat = catalog(); $lines = []; $subtotal = 0.0; $weight = 0.0;
    foreach ($items as $it) {
        $id = explode('|', (string) ($it['id'] ?? ''))[0];
        $qty = (int) ($it['qty'] ?? 0);
        if (!isset($cat[$id]) || $qty < 1 || $qty > 99) throw new RuntimeException('Hay un artículo no válido en tu carrito');
        $p = $cat[$id];
        if ($p['price'] <= 0) throw new RuntimeException('«' . $p['name'] . '» se cotiza por WhatsApp: no se puede pagar en línea.');
        $name = $p['name'];
        if (!empty($it['label'])) $name .= ' · ' . mb_substr(preg_replace('/\s+/u', ' ', (string) $it['label']), 0, 80);
        $total = round($p['price'] * $qty * (1 - tier_discount($p['tiers'], $qty)), 2);
        $lines[] = ['name' => $name, 'qty' => $qty, 'unit' => $p['price'], 'total' => $total];
        $subtotal += $total; $weight += $p['w'] * $qty;
    }
    return ['lines' => $lines, 'subtotal' => round($subtotal, 2), 'weight' => $weight];
}

/** Envío cobrado según la paquetería elegida; "Recolección" es gratis. */
function shipping_cost(string $carrier, float $weight): array {
    if ($carrier === 'Recolección') return ['carrier' => 'Recolección', 'service' => 'Sin costo de envío', 'price' => 0.0];
    $c = cfg();
    if (!isset($c['shipping'][$carrier])) throw new RuntimeException('Paquetería no válida');
    $extra = max(0, (int) ceil($weight) - 1) * (float) $c['shipping_extra_per_kg'];
    return ['carrier' => $carrier, 'service' => $c['shipping'][$carrier]['service'], 'price' => (float) $c['shipping'][$carrier]['base'] + $extra];
}

// ── Pedidos en archivos (carpeta data/, protegida con .htaccess) ──
function order_path(string $id): string {
    if (!preg_match('/^MOS-[A-Z0-9]{6,20}$/', $id)) throw new RuntimeException('Pedido inválido');
    return data_dir() . "/orders/$id.json";
}
function order_save(array $o): void {
    if (!is_dir(data_dir() . '/orders')) mkdir(data_dir() . '/orders', 0750, true);
    file_put_contents(order_path($o['id']), json_encode($o, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}
function order_load(string $id): ?array {
    $f = order_path($id);
    return is_file($f) ? json_decode((string) file_get_contents($f), true) : null;
}

/** Marca pagado una sola vez y avisa al dueño (correo + bitácora). Devuelve false si ya estaba pagado. */
function order_mark_paid(string $id, string $provider, string $paymentId): bool {
    $f = order_path($id);
    if (!is_file($f)) return false;
    $fh = fopen($f, 'c+'); flock($fh, LOCK_EX);
    $o = json_decode((string) stream_get_contents($fh), true) ?: [];
    if (($o['status'] ?? '') === 'pagado') { flock($fh, LOCK_UN); fclose($fh); return false; }
    $o['status'] = 'pagado'; $o['provider'] = $provider; $o['payment_id'] = $paymentId; $o['paid_at'] = date('c');
    ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($o, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)); fflush($fh); flock($fh, LOCK_UN); fclose($fh);
    notify_owner($o);
    return true;
}

function order_summary(array $o): string {
    $l = ["PEDIDO PAGADO {$o['id']}", ''];
    foreach ($o['lines'] as $x) $l[] = "{$x['qty']} x {$x['name']} - $" . number_format($x['total'], 2);
    $l[] = ''; $l[] = 'Subtotal: $' . number_format($o['subtotal'], 2);
    $l[] = "Envío ({$o['shipping']['carrier']} {$o['shipping']['service']}): $" . number_format($o['shipping']['price'], 2);
    $l[] = 'TOTAL: $' . number_format($o['total'], 2); $l[] = '';
    $c = $o['customer'];
    $l[] = "{$c['name']} · {$c['phone']} · {$c['email']}";
    $l[] = "{$c['street']}, {$c['colony']}, {$c['city']}, {$c['state']}, C.P. {$c['postalCode']}";
    return implode("\n", $l);
}

function notify_owner(array $o): void {
    $txt = order_summary($o);
    file_put_contents(data_dir() . '/pedidos-pagados.log', date('c') . "\n$txt\n---\n", FILE_APPEND | LOCK_EX);
    $to = cfg()['owner_email'];
    if ($to !== '' && function_exists('mail')) {
        @mail($to, "Pedido pagado {$o['id']} - Mosaicca", $txt, "Content-Type: text/plain; charset=UTF-8\r\nFrom: pedidos@" . parse_url(cfg()['site_url'], PHP_URL_HOST));
    }
}
