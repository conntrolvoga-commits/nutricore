// Pruebas del servicio de Envia.com con un servidor falso (sin token real ni red).
// Ejecutar: node --experimental-strip-types --import ./scripts/register.mjs --test scripts/envia.test.mts
import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, test } from 'node:test';
import { buildLabelBody, buildRateBody, normalizeState, packageFor, parseRates, splitStreet } from '../src/lib/services/envia/payloads.ts';

type Req = { url: string; auth?: string; body: any };
const seen: Req[] = [];
let server: http.Server;
let envia: typeof import('../src/lib/services/envia/index.ts');

before(async () => {
  server = http.createServer((req, res) => {
    let raw = ''; req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const body = raw ? JSON.parse(raw) : {};
      seen.push({ url: req.url!, auth: req.headers.authorization, body });
      const send = (o: unknown, c = 200) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
      if (req.url === '/ship/rate/') {
        if (body.destination.postalCode === '99999' || body.shipment.carrier === 'dhl') return send({ meta: 'error', error: { message: 'sin cobertura' } }, 400);
        const price = body.shipment.carrier === 'fedex' ? 131.2 : 112.4;
        return send({ meta: 'rate', data: [{ carrier: body.shipment.carrier, service: 'ground', serviceDescription: 'Terrestre', totalPrice: price, deliveryEstimate: '2-3 días' }] });
      }
      if (req.url === '/ship/generate/' && body.destination.postalCode === '99999') return send({ meta: 'error', error: { message: 'no existe cobertura para ese código postal' } }, 400);
      if (req.url === '/ship/generate/') return send({ meta: 'generate', data: [{ carrier: 'estafeta', service: body.shipment.service, trackingNumber: 'EST123456', trackUrl: 'https://track.test/EST123456', label: 'https://labels.test/EST123456.pdf', totalPrice: 112.4 }] });
      if (req.url === '/ship/generaltrack/') return send({ meta: 'tracking', data: [{ carrier: 'estafeta', status: 'In transit', eventHistory: [{ timestamp: '2026-05-01 10:00', description: 'Recolectado', location: 'Monterrey' }] }] });
      if (req.url === '/ship/cancel/') return send({ meta: 'cancel', data: [{ balanceReturned: true }] });
      send({ error: { message: 'no existe' } }, 404);
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address() as { port: number };
  Object.assign(process.env, { ENVIA_API_TOKEN: 'tok_test', ENVIA_API_URL: `http://127.0.0.1:${port}`, ENVIA_ORIGIN_STREET: 'Av. Taller', ENVIA_ORIGIN_NUMBER: '10' });
  envia = await import('../src/lib/services/envia/index.ts');
});
after(() => server.close());

test('normalizeState reconoce nombres, siglas y acentos', () => {
  assert.equal(normalizeState('Nuevo León'), 'NL');
  assert.equal(normalizeState('CDMX'), 'DF');
  assert.equal(normalizeState('estado de méxico'), 'EM');
  assert.equal(normalizeState('jalisco'), 'JA');
  assert.equal(normalizeState('nl'), 'NL');
  assert.equal(normalizeState('Atlantida'), 'ATLANTIDA');
});

test('splitStreet separa calle y número', () => {
  assert.deepEqual(splitStreet('Av. Juárez 123 B'), { street: 'Av. Juárez', number: '123 B' });
  assert.deepEqual(splitStreet('Calle Hidalgo #45'), { street: 'Calle Hidalgo', number: '45' });
  assert.deepEqual(splitStreet('Calle Sin Numero'), { street: 'Calle Sin Numero', number: 'S/N' });
});

test('packageFor: peso facturable mínimo 1 kg y caja por rangos', () => {
  assert.deepEqual([packageFor(0.1, 50).weight, packageFor(0.1, 50).length], [1, 20]);
  assert.deepEqual([packageFor(2.5, 0).weight, packageFor(2.5, 0).length], [3, 30]);
  assert.equal(packageFor(7, 0).length, 50);
});

test('cuerpo de cotización y de guía', () => {
  const o = { name: 'T', street: 'Av. Taller', number: '10', city: 'Monterrey', state: 'Nuevo León', postalCode: '64000', phone: '+52 81 4790 2474' };
  const d = { name: 'Ana', street: 'Calle 1 #5', city: 'CDMX', state: 'CDMX', postalCode: '06600' };
  const rate = buildRateBody(o, d, packageFor(0.3, 100), 'fedex');
  assert.equal(rate.origin.state, 'NL'); assert.equal(rate.origin.phone, '8147902474');
  assert.equal(rate.destination.number, '5'); assert.equal(rate.destination.state, 'DF');
  assert.equal(rate.packages[0].weightUnit, 'KG'); assert.equal(rate.shipment.carrier, 'fedex');
  const label = buildLabelBody(o, d, packageFor(0.3, 100), { carrier: 'fedex', service: 'Económico', serviceCode: 'ground' }, 'MOS-1');
  assert.equal(label.shipment.service, 'ground');
  assert.equal(label.settings.printSize, 'STOCK_4X6'); assert.equal(label.settings.comments, 'MOS-1');
});

test('parseRates descarta basura y redondea hacia arriba', () => {
  const r = parseRates({ data: [{ carrier: 'x', service: 'a', totalPrice: 10.2, deliveryEstimate: '1-4 días' }, { carrier: 'x', service: 'b', totalPrice: 0 }, { carrier: 'y' }] });
  assert.equal(r.length, 1); assert.equal(r[0].price, 11); assert.equal(r[0].days, 4);
});

test('quoteShipping: tarifas reales ordenadas, omite la paquetería que falla y usa caché', async () => {
  const q = await envia.quoteShipping({ postalCode: '06600', state: 'CDMX', city: 'CDMX', weightKg: 0.3, declaredValue: 500 });
  assert.equal(q.estimated, false);
  assert.deepEqual(q.rates.map((r) => [r.carrier, r.price, r.serviceCode]), [['estafeta', 113, 'ground'], ['fedex', 132, 'ground']]);
  assert.equal(seen.at(-1)!.auth, 'Bearer tok_test');
  const calls = seen.length;
  await envia.quoteShipping({ postalCode: '06600', state: 'CDMX', city: 'CDMX', weightKg: 0.3, declaredValue: 500 });
  assert.equal(seen.length, calls, 'la segunda cotización sale de la caché');
});

test('quoteShipping: si fallan todas las paqueterías devuelve tarifas estimadas', async () => {
  const q = await envia.quoteShipping({ postalCode: '99999', weightKg: 0.3, declaredValue: 0 });
  assert.equal(q.estimated, true);
  assert.equal(q.rates.length, 3);
});

test('createLabel usa el código de servicio y devuelve guía y PDF', async () => {
  const l = await envia.createLabel({ customer: { name: 'Ana', email: 'a@b.mx', phone: '8147902474', street: 'Calle 1 #5', colony: 'Centro', city: 'CDMX', state: 'CDMX', postalCode: '06600' }, rate: { carrier: 'estafeta', service: 'Terrestre', serviceCode: 'ground' }, weightKg: 0.3, declaredValue: 500, comments: 'MOS-1' });
  assert.equal(l.trackingNumber, 'EST123456'); assert.equal(l.labelUrl, 'https://labels.test/EST123456.pdf');
  assert.equal(seen.at(-1)!.body.shipment.service, 'ground');
});

test('trackShipment y cancelLabel', async () => {
  const t = await envia.trackShipment('EST123456');
  assert.equal(t.status, 'In transit'); assert.equal(t.events[0].location, 'Monterrey');
  await envia.cancelLabel('estafeta', 'EST123456');
  assert.deepEqual(seen.at(-1)!.body, { carrier: 'estafeta', trackingNumber: 'EST123456' });
});

test('un error de Envia se convierte en un mensaje legible', async () => {
  await assert.rejects(() => envia.createLabel({ customer: { name: 'A', street: 'x', city: 'y', state: 'NL', postalCode: '99999' }, rate: { carrier: 'dhl', service: 's' }, weightKg: 1, declaredValue: 0 }), (e: Error) => /no existe/.test(e.message));
});
