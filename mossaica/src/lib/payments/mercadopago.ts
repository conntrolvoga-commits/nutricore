import { buildMpPreference } from './payloads';
import type { CheckoutInput, PaymentOutcome, PaymentProvider } from './types';

const API = () => process.env.MP_API_URL ?? 'https://api.mercadopago.com';
const token = () => process.env.MP_ACCESS_TOKEN;

export const mercadopago: PaymentProvider = {
  id: 'mercadopago',
  label: 'Mercado Pago',
  methods: ['card', 'oxxo', 'spei'],
  enabled: () => Boolean(token()),
  async createCheckout(input: CheckoutInput) {
    const res = await fetch(`${API()}/checkout/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, 'X-Idempotency-Key': input.orderId },
      body: JSON.stringify(buildMpPreference(input)),
    });
    if (!res.ok) throw new Error(`Mercado Pago respondió ${res.status}`);
    const json = await res.json();
    return { url: (json.init_point ?? json.sandbox_init_point) as string };
  },
};

/** Consulta el pago directo a Mercado Pago: nunca se confía en el cuerpo del webhook. */
export async function fetchMpPayment(paymentId: string): Promise<{ outcome: PaymentOutcome; orderId: string | null } | null> {
  const res = await fetch(`${API()}/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: `Bearer ${token()}` }, cache: 'no-store' });
  if (!res.ok) return null;
  const p = await res.json();
  const outcome: PaymentOutcome = p.status === 'approved' ? 'paid' : ['rejected', 'cancelled', 'refunded', 'charged_back'].includes(p.status) ? 'failed' : 'pending';
  return { outcome, orderId: p.external_reference ?? null };
}
