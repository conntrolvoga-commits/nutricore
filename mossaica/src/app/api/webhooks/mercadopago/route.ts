import { NextResponse } from 'next/server';
import { fetchMpPayment } from '@/lib/payments/mercadopago';
import { verifyMpSignature } from '@/lib/payments/payloads';
import { markFailed, markPaid } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const type = url.searchParams.get('type') ?? url.searchParams.get('topic') ?? body.type;
  const dataId = String(url.searchParams.get('data.id') ?? body?.data?.id ?? '');
  if (type !== 'payment' || !dataId) return NextResponse.json({ ok: true, ignored: true });

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret && !verifyMpSignature({ secret, signature: req.headers.get('x-signature'), requestId: req.headers.get('x-request-id'), dataId })) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  const payment = await fetchMpPayment(dataId);
  if (!payment?.orderId) return NextResponse.json({ ok: true, ignored: true });
  if (payment.outcome === 'paid') return NextResponse.json({ ok: true, paid: await markPaid(payment.orderId, 'mercadopago', dataId) });
  if (payment.outcome === 'failed') await markFailed(payment.orderId);
  return NextResponse.json({ ok: true, paid: false });
}
