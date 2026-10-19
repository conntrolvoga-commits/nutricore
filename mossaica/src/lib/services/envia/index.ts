import { enviaConfigured, enviaPost } from './client';
import { buildLabelBody, buildRateBody, packageFor, parseLabel, parseRates, parseTracking } from './payloads';
import type { Address, Label, LabelInput, QuoteInput, ShippingRate, Tracking } from './types';

export { EnviaError, enviaConfigured } from './client';
export { normalizeState } from './payloads';
export type { Label, LabelInput, QuoteInput, Tracking } from './types';

const CARRIERS = (process.env.ENVIA_CARRIERS ?? 'estafeta,fedex,dhl').split(',').map((c) => c.trim()).filter(Boolean);

/** Dirección de origen (tu taller). Para cotizar basta el código postal; para generar guías hace falta completa. */
export function getOrigin(): Address {
  const e = process.env;
  return {
    name: e.ENVIA_ORIGIN_NAME ?? 'Mosaicca',
    company: e.ENVIA_ORIGIN_COMPANY ?? 'Mosaicca',
    email: e.ENVIA_ORIGIN_EMAIL ?? '',
    phone: e.ENVIA_ORIGIN_PHONE ?? '8147902474',
    street: e.ENVIA_ORIGIN_STREET ?? 'Domicilio conocido',
    number: e.ENVIA_ORIGIN_NUMBER ?? 'S/N',
    district: e.ENVIA_ORIGIN_DISTRICT ?? '',
    city: e.ENVIA_ORIGIN_CITY ?? 'Monterrey',
    state: e.ENVIA_ORIGIN_STATE ?? 'NL',
    postalCode: e.ENVIA_ORIGIN_POSTAL_CODE ?? '64000',
  };
}

// ── Cotización ──────────────────────────────────────────────────────────────
const CACHE_MS = 10 * 60_000;
const cache = new Map<string, { at: number; rates: ShippingRate[] }>();

/**
 * Cotiza con todas las paqueterías en paralelo. Si una falla se omite; si fallan todas (o no hay token)
 * devuelve tarifas estimadas con `estimated: true` para que el cliente nunca se quede sin opción.
 */
export async function quoteShipping(input: QuoteInput): Promise<{ rates: ShippingRate[]; estimated: boolean }> {
  const pkg = packageFor(input.weightKg, input.declaredValue);
  if (!enviaConfigured()) return { rates: estimate(pkg.weight), estimated: true };

  const key = `${input.postalCode}|${pkg.weight}|${Math.round(pkg.declaredValue / 100)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { rates: hit.rates, estimated: false };

  const dest: Address = { name: 'Cliente', street: 'Calle 1', city: input.city || 'Ciudad', state: input.state ?? '', postalCode: input.postalCode };
  const settled = await Promise.allSettled(CARRIERS.map(async (carrier) => parseRates(await enviaPost('/ship/rate/', buildRateBody(getOrigin(), dest, pkg, carrier)))));
  const rates = settled.flatMap((s) => (s.status === 'fulfilled' ? s.value : [])).sort((a, b) => a.price - b.price);
  if (!rates.length) return { rates: estimate(pkg.weight), estimated: true };

  cache.set(key, { at: Date.now(), rates });
  return { rates, estimated: false };
}

function estimate(weightKg: number): ShippingRate[] {
  const extra = Math.max(0, Math.ceil(weightKg) - 1) * 25;
  return [
    { carrier: 'estafeta', service: 'Terrestre (estimado)', price: 99 + extra, days: 5 },
    { carrier: 'fedex', service: 'Económico (estimado)', price: 119 + extra, days: 4 },
    { carrier: 'dhl', service: 'Express (estimado)', price: 169 + extra, days: 2 },
  ];
}

// ── Guía de envío ───────────────────────────────────────────────────────────
/** Genera la guía (PDF 4x6) con la paquetería elegida. Cobra a tu saldo de Envia: se llama a mano desde el panel. */
export async function createLabel(input: LabelInput): Promise<Label> {
  if (!enviaConfigured()) throw new Error('Envia.com no está configurado (falta ENVIA_API_TOKEN)');
  const c = input.customer;
  const dest: Address = { name: c.name, email: c.email, phone: c.phone, street: c.street, district: c.colony, city: c.city, state: c.state, postalCode: c.postalCode };
  const pkg = packageFor(input.weightKg, input.declaredValue);
  const label = parseLabel(await enviaPost('/ship/generate/', buildLabelBody(getOrigin(), dest, pkg, input.rate, input.comments), 30_000));
  if (!label) throw new Error('Envia no devolvió el número de guía');
  return label;
}

// ── Rastreo y cancelación ───────────────────────────────────────────────────
export async function trackShipment(trackingNumber: string): Promise<Tracking> {
  if (!enviaConfigured()) throw new Error('Envia.com no está configurado (falta ENVIA_API_TOKEN)');
  return parseTracking(await enviaPost('/ship/generaltrack/', { trackingNumbers: [trackingNumber] }), trackingNumber);
}

export async function cancelLabel(carrier: string, trackingNumber: string): Promise<void> {
  if (!enviaConfigured()) throw new Error('Envia.com no está configurado (falta ENVIA_API_TOKEN)');
  await enviaPost('/ship/cancel/', { carrier, trackingNumber });
}
