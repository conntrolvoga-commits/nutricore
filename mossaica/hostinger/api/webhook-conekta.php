<?php
define('MOS_API', 1); require __DIR__ . '/lib.php';
$e = body();
$cid = (string) ($e['data']['object']['id'] ?? '');
if (!str_starts_with((string) ($e['type'] ?? ''), 'order.') || !preg_match('/^ord_[A-Za-z0-9]+$/', $cid)) out(['ok' => true, 'ignored' => true]);
// El evento solo dice QUÉ orden cambió; el estado real se consulta a Conekta con la llave privada.
$r = http_json('GET', cfg()['conekta_api'] . "/orders/$cid", ['Accept: application/vnd.conekta-v2.1.0+json', 'Authorization: Bearer ' . cfg()['conekta_private_key']]);
$ref = $r['json']['metadata']['order_id'] ?? '';
if ($r['code'] !== 200 || $ref === '') out(['ok' => true, 'ignored' => true]);
try { out(['ok' => true, 'paid' => ($r['json']['payment_status'] ?? '') === 'paid' && order_mark_paid($ref, 'conekta', $cid)]); }
catch (RuntimeException $x) { out(['ok' => true, 'ignored' => true]); }
