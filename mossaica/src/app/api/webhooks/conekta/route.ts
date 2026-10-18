import { NextResponse } from 'next/server';
import { fetchConektaOrder } from '@/lib/payments/conekta';
import { markFailed, markPaid } from '@/lib/orders';

export const dynamic = 'force-dynamic';

/**
 * Conekta avisa con eventos (order.paid, order.pending_payment, order.expired…).
 * El evento solo dice QUÉ orden cambió; el estado real se consulta a la API con la llave privada.
 */
export async function POST(req: Request) {
  const event = await req.json().catch(() => null);
  const conektaId = event?.data?.object?.id ?? event?.data?.object?.order_id;
  if (!event?.type || !String(event.type).startsWith('order.') || !conektaId) return NextResponse.json({ ok: true, ignored: true });

  const order = await fetchConektaOrder(String(conektaId));
  if (!order?.orderId) return NextResponse.json({ ok: true, ignored: true });
  if (order.outcome === 'paid') return NextResponse.json({ ok: true, paid: await markPaid(order.orderId, 'conekta', String(conektaId)) });
  if (order.outcome === 'failed') await markFailed(order.orderId, 'expirado');
  return NextResponse.json({ ok: true, paid: false });
}
