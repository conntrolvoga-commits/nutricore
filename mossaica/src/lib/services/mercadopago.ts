import { SITE_URL } from '../format';

interface PreferenceItem { title: string; quantity: number; unit_price: number }
interface PreferenceInput {
  orderId: string;
  items: PreferenceItem[];
  shippingCost: number;
  payer: { name: string; email: string };
}

/**
 * Crea una preferencia de Checkout Pro. Mercado Pago ofrece tarjeta, OXXO y SPEI
 * en su pantalla de pago, así que no hay que integrarlos por separado.
 */
export async function createPreference(input: PreferenceInput): Promise<{ url: string; demo: boolean }> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return { url: `/gracias?order=${input.orderId}&demo=1`, demo: true };

  const items = [...input.items];
  if (input.shippingCost > 0) items.push({ title: 'Envío', quantity: 1, unit_price: input.shippingCost });

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      items: items.map((i) => ({ ...i, currency_id: 'MXN' })),
      payer: { name: input.payer.name, email: input.payer.email },
      external_reference: input.orderId,
      back_urls: {
        success: `${SITE_URL}/gracias?order=${input.orderId}`,
        pending: `${SITE_URL}/gracias?order=${input.orderId}&pending=1`,
        failure: `${SITE_URL}/checkout?error=pago`,
      },
      auto_return: 'approved',
    }),
  });
  if (!res.ok) throw new Error(`Mercado Pago respondió ${res.status}`);
  const json = await res.json();
  return { url: json.init_point as string, demo: false };
}
