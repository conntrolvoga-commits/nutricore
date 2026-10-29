<?php
define('MOS_API', 1); require __DIR__ . '/lib.php';

/** Configuración de mayoreo (config.php → 'mayoreo'). Apagado por defecto hasta que el dueño confirme precios y costos. */
function may_cfg(): array {
    return (array) (cfg()['mayoreo'] ?? []) + ['enabled' => false, 'min_order' => 1500, 'tiers' => [[1500, 0.40], [5000, 0.45], [10000, 0.50]],
        'banco' => '', 'clabe' => '', 'titular' => '', 'terms' => 'Primer pedido con pago del 100% por transferencia. Envío por cotizar.'];
}
function may_discount(array $m, float $publicSubtotal): float {
    $d = 0.0; foreach ($m['tiers'] as [$min, $pct]) if ($publicSubtotal >= $min) $d = (float) $pct; return $d;
}
/** Artículos con precio y opciones expandidas (id del carrito: id||opción|). */
function may_items(): array {
    $out = [];
    foreach (catalog() as $id => $p) {
        if ($p['price'] <= 0) continue;
        if (!empty($p['sp'])) foreach ($p['sp'] as $opt => $price) $out["$id||$opt|"] = ['id' => "$id||$opt|", 'name' => $p['name'] . ' · ' . $opt, 'price' => $price, 'g' => $p['g'] ?? ''];
        else $out[$id] = ['id' => $id, 'name' => $p['name'], 'price' => $p['price'], 'g' => $p['g'] ?? ''];
    }
    return $out;
}

$m = may_cfg();
if (!$m['enabled']) out(['enabled' => false, 'message' => 'El pedido de mayoreo en línea aún no está activo. Escríbenos por WhatsApp.'], $_SERVER['REQUEST_METHOD'] === 'GET' ? 200 : 503);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    out(['enabled' => true, 'min_order' => $m['min_order'], 'tiers' => $m['tiers'], 'terms' => $m['terms'], 'items' => array_values(may_items())]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(['error' => 'Método no permitido'], 405);

// Freno básico: 6 solicitudes por hora por IP.
$ip = preg_replace('/[^0-9a-f:.]/i', '', explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'x')[0]);
$rf = data_dir() . '/rate-may-' . md5($ip) . '.json';
$hits = array_filter((array) json_decode((string) @file_get_contents($rf), true), fn($t) => $t > time() - 3600);
if (count($hits) >= 6) out(['error' => 'Demasiados intentos. Intenta más tarde o escríbenos por WhatsApp.'], 429);
$hits[] = time(); file_put_contents($rf, json_encode(array_values($hits)), LOCK_EX);

$b = body();
if (trim((string) ($b['website'] ?? '')) !== '') out(['ok' => true], 200);          // campo trampa para bots
$c = [];
foreach (['business', 'contact', 'email', 'phone', 'city', 'state', 'rfc', 'notes'] as $k) $c[$k] = trim(preg_replace('/[\r\n\t]+/', ' ', (string) ($b['buyer'][$k] ?? '')));
$c['invoice'] = !empty($b['buyer']['invoice']);
if ($c['business'] === '' || $c['contact'] === '' || !filter_var($c['email'], FILTER_VALIDATE_EMAIL) || strlen(preg_replace('/\D/', '', $c['phone'])) < 10 || $c['city'] === '' || $c['state'] === '')
    out(['error' => 'Completa negocio, contacto, correo, teléfono (10 dígitos), ciudad y estado'], 400);
if ($c['invoice'] && !preg_match('/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/u', strtoupper($c['rfc']))) out(['error' => 'Para factura escribe un RFC válido'], 400);
$c['rfc'] = strtoupper($c['rfc']); $c['notes'] = mb_substr($c['notes'], 0, 500);

$avail = may_items(); $lines = []; $pub = 0.0;
$req = (array) ($b['items'] ?? []); if (!$req || count($req) > 80) out(['error' => 'Agrega al menos un artículo'], 400);
foreach ($req as $it) {
    $id = (string) ($it['id'] ?? ''); $q = (int) ($it['qty'] ?? 0);
    if (!isset($avail[$id]) || $q < 1 || $q > 9999) out(['error' => 'Hay un artículo no válido en tu pedido'], 400);
    $lines[] = ['id' => $id, 'name' => $avail[$id]['name'], 'qty' => $q, 'public' => $avail[$id]['price']]; $pub += $avail[$id]['price'] * $q;
}
if ($pub < $m['min_order']) out(['error' => 'El pedido mínimo de mayoreo es de $' . number_format($m['min_order'], 0) . ' a precio público (llevas $' . number_format($pub, 0) . ').'], 400);
$disc = may_discount($m, $pub); $total = 0.0;
foreach ($lines as &$l) { $l['unit'] = round($l['public'] * (1 - $disc), 2); $l['total'] = round($l['unit'] * $l['qty'], 2); $total += $l['total']; } unset($l);
$total = round($total, 2);
$id = 'MAY-' . strtoupper(base_convert((string) time(), 10, 36)) . strtoupper(bin2hex(random_bytes(4)));
$o = ['id' => $id, 'status' => 'pendiente de pago', 'created_at' => date('c'), 'buyer' => $c, 'lines' => $lines, 'public_subtotal' => round($pub, 2), 'discount' => $disc, 'total' => $total, 'shipping' => 'Por cotizar'];
$dir = data_dir() . '/mayoreo'; if (!is_dir($dir)) mkdir($dir, 0750, true);
file_put_contents("$dir/$id.json", json_encode($o, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);

$txt = ["PEDIDO DE MAYOREO $id", ''];
foreach ($lines as $l) $txt[] = "{$l['qty']} x {$l['name']} @ $" . number_format($l['unit'], 2) . ' = $' . number_format($l['total'], 2);
$txt[] = ''; $txt[] = 'Precio público: $' . number_format($pub, 2) . ' · Descuento mayoreo: ' . round($disc * 100) . '%';
$txt[] = 'TOTAL (sin envío): $' . number_format($total, 2); $txt[] = '';
$txt[] = "{$c['business']} · {$c['contact']} · {$c['phone']} · {$c['email']}"; $txt[] = "{$c['city']}, {$c['state']}" . ($c['invoice'] ? " · Factura RFC {$c['rfc']}" : '');
if ($c['notes'] !== '') $txt[] = "Notas: {$c['notes']}";
$summary = implode("\n", $txt);
file_put_contents(data_dir() . '/mayoreo-pedidos.log', date('c') . "\n$summary\n---\n", FILE_APPEND | LOCK_EX);
$host = parse_url(cfg()['site_url'], PHP_URL_HOST); $hdr = "Content-Type: text/plain; charset=UTF-8\r\nFrom: pedidos@$host";
if (cfg()['owner_email'] !== '' && function_exists('mail')) @mail(cfg()['owner_email'], "Pedido de mayoreo $id - Mosaicca", $summary, $hdr . "\r\nReply-To: " . $c['email']);
$pay = $m['clabe'] !== '' ? "Paga por transferencia SPEI:\nBanco: {$m['banco']}\nCLABE: {$m['clabe']}\nTitular: {$m['titular']}\nReferencia: $id\nImporte: $" . number_format($total, 2) : 'Te enviaremos los datos de pago por WhatsApp.';
if (function_exists('mail')) @mail($c['email'], "Recibimos tu pedido de mayoreo $id - Mosaicca", "Hola {$c['contact']},\n\nRecibimos tu pedido. Confirmaremos existencias, tiempo de producción y el envío por WhatsApp o correo.\n\n$summary\n\n$pay\n\n{$m['terms']}\n\nMosaicca · $host", $hdr);
out(['ok' => true, 'orderId' => $id, 'total' => $total, 'discount' => $disc, 'payment' => $pay, 'terms' => $m['terms']]);
