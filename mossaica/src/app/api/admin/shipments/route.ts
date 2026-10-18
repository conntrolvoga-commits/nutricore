import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { cancelLabel, createLabel } from '@/lib/services/envia';
import { getServiceClient } from '@/lib/supabase';

function guard() {
  if (!isAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!getServiceClient()) return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 503 });
  return null;
}

async function loadOrder(id: unknown) {
  const { data } = await getServiceClient()!.from('orders').select('*').eq('id', String(id ?? '')).maybeSingle();
  return data;
}

/** Genera la guía de un pedido ya pagado. Cobra a tu saldo de Envia, por eso es una acción manual. */
export async function POST(req: Request) {
  const denied = guard();
  if (denied) return denied;
  const { orderId } = await req.json().catch(() => ({}));
  const order = await loadOrder(orderId);
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  if (order.status !== 'pagado') return NextResponse.json({ error: 'El pedido aún no está pagado' }, { status: 409 });
  if (order.tracking_number) return NextResponse.json({ error: 'El pedido ya tiene guía' }, { status: 409 });
  if (order.shipping?.carrier === 'Recolección') return NextResponse.json({ error: 'Es una recolección: no lleva guía' }, { status: 409 });

  try {
    const label = await createLabel({
      customer: order.customer, rate: order.shipping, weightKg: Number(order.weight_kg) || 0.5,
      declaredValue: Number(order.subtotal), comments: order.id,
    });
    await getServiceClient()!.from('orders').update({ tracking_number: label.trackingNumber, label_url: label.labelUrl, shipment_status: 'guia_generada' }).eq('id', order.id);
    return NextResponse.json({ trackingNumber: label.trackingNumber, labelUrl: label.labelUrl, trackUrl: label.trackUrl, carrier: label.carrier });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'No se pudo generar la guía' }, { status: 502 });
  }
}

/** Cancela la guía de un pedido (Envia reembolsa a tu saldo según la paquetería). */
export async function DELETE(req: Request) {
  const denied = guard();
  if (denied) return denied;
  const { orderId } = await req.json().catch(() => ({}));
  const order = await loadOrder(orderId);
  if (!order?.tracking_number) return NextResponse.json({ error: 'El pedido no tiene guía' }, { status: 404 });
  try {
    await cancelLabel(order.shipping?.carrier ?? '', order.tracking_number);
    await getServiceClient()!.from('orders').update({ tracking_number: null, label_url: null, shipment_status: 'guia_cancelada' }).eq('id', order.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'No se pudo cancelar la guía' }, { status: 502 });
  }
}
