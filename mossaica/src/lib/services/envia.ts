import type { ShippingRate } from '../types';

const ENDPOINT = 'https://api.envia.com/ship/rate/';
const CARRIERS = ['estafeta', 'fedex', 'dhl'];

interface QuoteInput {
  postalCode: string;
  state?: string;
  city?: string;
  weightKg: number;
  declaredValue: number;
}

/** Cotiza con Envia.com; sin token devuelve tarifas estimadas para poder probar el flujo. */
export async function quoteShipping(input: QuoteInput): Promise<{ rates: ShippingRate[]; estimated: boolean }> {
  const token = process.env.ENVIA_API_TOKEN;
  if (!token) return { rates: estimate(input.weightKg), estimated: true };

  const origin = {
    postalCode: process.env.ENVIA_ORIGIN_POSTAL_CODE ?? '06600',
    state: process.env.ENVIA_ORIGIN_STATE ?? 'DF',
    city: process.env.ENVIA_ORIGIN_CITY ?? 'Ciudad de Mexico',
    country: 'MX',
  };
  const destination = { postalCode: input.postalCode, state: input.state ?? '', city: input.city ?? '', country: 'MX' };
  // Los envíos de miniaturas caben en una caja chica; el peso mínimo facturable es 1 kg.
  const packages = [{
    type: 'box', content: 'Figuras coleccionables', amount: 1, declaredValue: input.declaredValue,
    lengthUnit: 'CM', weightUnit: 'KG', weight: Math.max(1, Math.ceil(input.weightKg)),
    dimensions: { length: 20, width: 15, height: 10 },
  }];

  const results = await Promise.all(
    CARRIERS.map(async (carrier) => {
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ origin, destination, packages, shipment: { carrier, type: 1 } }),
          cache: 'no-store',
        });
        if (!res.ok) return [];
        const json = await res.json();
        return (json.data ?? []) as Array<{ carrier: string; serviceDescription?: string; service: string; totalPrice: number; deliveryEstimate?: string }>;
      } catch {
        return [];
      }
    }),
  );

  const rates: ShippingRate[] = results.flat().map((r) => ({
    carrier: r.carrier,
    service: r.serviceDescription ?? r.service,
    price: Math.ceil(Number(r.totalPrice)),
    days: parseInt(r.deliveryEstimate ?? '', 10) || null,
  }));
  return rates.length ? { rates: rates.sort((a, b) => a.price - b.price), estimated: false } : { rates: estimate(input.weightKg), estimated: true };
}

function estimate(weightKg: number): ShippingRate[] {
  const extra = Math.max(0, Math.ceil(weightKg) - 1) * 25;
  return [
    { carrier: 'estafeta', service: 'Terrestre (estimado)', price: 99 + extra, days: 5 },
    { carrier: 'fedex', service: 'Económico (estimado)', price: 119 + extra, days: 4 },
    { carrier: 'dhl', service: 'Express (estimado)', price: 169 + extra, days: 2 },
  ];
}
