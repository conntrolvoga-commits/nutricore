<?php
define('MOS_API', 1); require __DIR__ . '/lib.php';
$type = $_GET['type'] ?? $_GET['topic'] ?? (body()['type'] ?? '');
$pid = (string) ($_GET['data_id'] ?? $_GET['data.id'] ?? (body()['data']['id'] ?? ''));
if ($type !== 'payment' || !preg_match('/^\d{3,20}$/', $pid)) out(['ok' => true, 'ignored' => true]);

$secret = cfg()['mp_webhook_secret'];
if ($secret !== '') {
    $sig = []; foreach (explode(',', $_SERVER['HTTP_X_SIGNATURE'] ?? '') as $kv) { $p = explode('=', trim($kv), 2); if (count($p) === 2) $sig[$p[0]] = $p[1]; }
    $manifest = "id:" . strtolower($pid) . ";request-id:" . ($_SERVER['HTTP_X_REQUEST_ID'] ?? '') . ";ts:" . ($sig['ts'] ?? '') . ";";
    if (!isset($sig['v1']) || !hash_equals(hash_hmac('sha256', $manifest, $secret), $sig['v1'])) out(['error' => 'Firma inválida'], 401);
}
// Nunca se confía en el aviso: se consulta el pago directo a Mercado Pago.
$r = http_json('GET', cfg()['mp_api'] . "/v1/payments/$pid", ['Authorization: Bearer ' . cfg()['mp_access_token']]);
$ref = $r['json']['external_reference'] ?? '';
if ($r['code'] !== 200 || $ref === '') out(['ok' => true, 'ignored' => true]);
try { out(['ok' => true, 'paid' => ($r['json']['status'] ?? '') === 'approved' && order_mark_paid($ref, 'mercadopago', $pid)]); }
catch (RuntimeException $e) { out(['ok' => true, 'ignored' => true]); }
