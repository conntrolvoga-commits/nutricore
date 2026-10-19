import { buildConektaOrder } from './payloads';
import type { CheckoutInput, PaymentOutcome, PaymentProvider } from './types';

const API = () => process.env.CONEKTA_API_URL ?? 'https://api.conekta.io';
const key = () => process.env.CONEKTA_PRIVATE_KEY;
const headers = () => ({
  'Content-Type': 'application/json',
  Accept: `application/vnd.conekta-v2.${process.env.CONEKTA_API_VERSION ?? '1.0'}+json`,
  Authorization: `Bearer ${key()}`,
});

export const conekta: PaymentProvider = {
  id: 'conekta',
  label: 'Conekta',
  methods: ['card', 'oxxo', 'spei'],
  enabled: () => Boolean(key()),
  async createCheckout(input: CheckoutInput) {
    const res = await fetch(`${API()}/orders`, { method: 'POST', headers: headers(), body: JSON.stringify(buildConektaOrder(input)) });
    if (!res.ok) throw new Error(`Conekta respondió ${res.status}`);
    const json = await res.json();
    const url = json?.checkout?.url as string | undefined;
    if (!url) throw new Error('Conekta no devolvió la URL del checkout');
    return { url };
  },
};

/** Consulta la orden directo a Conekta: nunca se confía en el cuerpo del webhook. */
export async function fetchConektaOrder(conektaOrderId: string): Promise<{ outcome: PaymentOutcome; orderId: string | null } | null> {
  const res = await fetch(`${API()}/orders/${encodeURIComponent(conektaOrderId)}`, { headers: headers(), cache: 'no-store' });
  if (!res.ok) return null;
  const o = await res.json();
  const outcome: PaymentOutcome = o.payment_status === 'paid' ? 'paid' : ['expired', 'canceled', 'declined', 'refunded'].includes(o.payment_status) ? 'failed' : 'pending';
  return { outcome, orderId: o.metadata?.order_id ?? null };
}
