// Constructores puros (sin red ni variables de entorno) para poder probarlos sin credenciales.
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { CheckoutInput } from './types';

/** Conekta recibe montos enteros en centavos. */
export const centavos = (mxn: number) => Math.round(mxn * 100);

/**
 * Orden de Conekta con Checkout alojado (HostedPayment).
 * `cash` = OXXO, `bank_transfer` = SPEI, `card` = tarjeta.
 */
export function buildConektaOrder(input: CheckoutInput) {
  const phone = (input.customer.phone ?? '').replace(/\D/g, '');
  return {
    currency: 'MXN',
    customer_info: {
      name: input.customer.name,
      email: input.customer.email,
      phone: phone.length >= 10 ? `+52${phone.slice(-10)}` : '+525555555555',
    },
    line_items: input.items.map((i) => ({ name: i.title.slice(0, 250), unit_price: centavos(i.unitPrice), quantity: i.quantity })),
    ...(input.shippingCost > 0 ? { shipping_lines: [{ amount: centavos(input.shippingCost), carrier: 'Envío Mosaicca' }] } : {}),
    ...(input.address
      ? {
          shipping_contact: {
            receiver: input.customer.name,
            address: { street1: input.address.street, city: input.address.city, state: input.address.state, postal_code: input.address.postalCode, country: 'MX' },
          },
        }
      : {}),
    metadata: { order_id: input.orderId },
    checkout: {
      type: 'HostedPayment',
      allowed_payment_methods: ['card', 'cash', 'bank_transfer'],
      success_url: `${input.siteUrl}/gracias?order=${input.orderId}`,
      failure_url: `${input.siteUrl}/checkout?error=pago`,
      monthly_installments_enabled: false,
    },
  };
}

/** Preferencia de Checkout Pro de Mercado Pago (tarjeta, OXXO, SPEI y saldo en su pantalla de pago). */
export function buildMpPreference(input: CheckoutInput) {
  const items = input.items.map((i) => ({ title: i.title, quantity: i.quantity, unit_price: i.unitPrice, currency_id: 'MXN' }));
  if (input.shippingCost > 0) items.push({ title: 'Envío', quantity: 1, unit_price: input.shippingCost, currency_id: 'MXN' });
  return {
    items,
    payer: { name: input.customer.name, email: input.customer.email },
    external_reference: input.orderId,
    notification_url: `${input.siteUrl}/api/webhooks/mercadopago`,
    back_urls: {
      success: `${input.siteUrl}/gracias?order=${input.orderId}`,
      pending: `${input.siteUrl}/gracias?order=${input.orderId}&pending=1`,
      failure: `${input.siteUrl}/checkout?error=pago`,
    },
    auto_return: 'approved',
  };
}

/**
 * Firma `x-signature` de los webhooks de Mercado Pago:
 *   manifest = `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` → HMAC-SHA256 con el secreto del webhook.
 */
export function verifyMpSignature(p: { secret: string; signature: string | null; requestId: string | null; dataId: string }): boolean {
  if (!p.signature) return false;
  const parts = Object.fromEntries(p.signature.split(',').map((kv) => kv.trim().split('=') as [string, string]));
  if (!parts.ts || !parts.v1) return false;
  const id = /^[a-z0-9]+$/i.test(p.dataId) ? p.dataId.toLowerCase() : p.dataId;
  const manifest = `id:${id};request-id:${p.requestId ?? ''};ts:${parts.ts};`;
  const expected = createHmac('sha256', p.secret).update(manifest).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
