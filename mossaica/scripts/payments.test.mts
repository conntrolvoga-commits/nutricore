// Pruebas de los constructores de pago y la firma del webhook. Sin credenciales ni red.
// Ejecutar: node --experimental-strip-types --test scripts/payments.test.mts
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { buildConektaOrder, buildMpPreference, centavos, verifyMpSignature } from '../src/lib/payments/payloads.ts';

const input = {
  orderId: 'MOS-TEST1',
  items: [{ title: 'Ficha Ajolotito', quantity: 3, unitPrice: 5 }, { title: 'Termo 18 oz', quantity: 1, unitPrice: 600.5 }],
  shippingCost: 99,
  customer: { name: 'Ana Prueba', email: 'ana@example.mx', phone: '81 4790 2474' },
  address: { street: 'Calle 1', colony: 'Centro', city: 'Monterrey', state: 'NL', postalCode: '64000' },
  siteUrl: 'https://mosaicca.mx',
};

test('centavos redondea sin errores de flotante', () => {
  assert.equal(centavos(5), 500);
  assert.equal(centavos(600.5), 60050);
  assert.equal(centavos(0.1 + 0.2), 30);
});

test('orden de Conekta: montos en centavos, métodos OXXO/SPEI/tarjeta y order_id en metadata', () => {
  const o = buildConektaOrder(input);
  assert.deepEqual(o.line_items.map((i) => i.unit_price), [500, 60050]);
  assert.equal(o.shipping_lines?.[0].amount, 9900);
  assert.deepEqual(o.checkout.allowed_payment_methods, ['card', 'cash', 'bank_transfer']);
  assert.equal(o.metadata.order_id, 'MOS-TEST1');
  assert.equal(o.customer_info.phone, '+528147902474');
  assert.equal(o.checkout.success_url, 'https://mosaicca.mx/gracias?order=MOS-TEST1');
});

test('orden de Conekta sin envío no manda shipping_lines', () => {
  assert.equal('shipping_lines' in buildConektaOrder({ ...input, shippingCost: 0 }), false);
});

test('preferencia de Mercado Pago: envío como renglón, referencia externa y webhook', () => {
  const p = buildMpPreference(input);
  assert.equal(p.items.length, 3);
  assert.equal(p.items[2].title, 'Envío');
  assert.equal(p.external_reference, 'MOS-TEST1');
  assert.equal(p.notification_url, 'https://mosaicca.mx/api/webhooks/mercadopago');
});

test('firma de Mercado Pago: acepta la válida y rechaza alteraciones', () => {
  const secret = 's3cret', dataId = 'ABC123', requestId = 'req-1', ts = '1704908010';
  const v1 = createHmac('sha256', secret).update(`id:abc123;request-id:${requestId};ts:${ts};`).digest('hex');
  const ok = { secret, signature: `ts=${ts},v1=${v1}`, requestId, dataId };
  assert.equal(verifyMpSignature(ok), true);
  assert.equal(verifyMpSignature({ ...ok, dataId: 'OTRO' }), false);
  assert.equal(verifyMpSignature({ ...ok, secret: 'otra' }), false);
  assert.equal(verifyMpSignature({ ...ok, signature: null }), false);
  assert.equal(verifyMpSignature({ ...ok, signature: `ts=${ts},v1=${'0'.repeat(64)}` }), false);
});
