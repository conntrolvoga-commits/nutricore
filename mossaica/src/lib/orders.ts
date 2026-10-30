import { getServiceClient } from './supabase';

/**
 * Marca el pedido como pagado y descuenta stock en UNA transacción (función SQL `mark_order_paid`).
 * Es idempotente: si el webhook llega repetido, la segunda vez devuelve false y no vuelve a descontar.
 */
export async function markPaid(orderId: string, provider: string, paymentId: string): Promise<boolean> {
  const db = getServiceClient();
  if (!db) {
    console.warn(`[orders] Supabase no configurado: pedido ${orderId} pagado con ${provider} (${paymentId}) sin persistir`);
    return true;
  }
  const { data, error } = await db.rpc('mark_order_paid', { p_order_id: orderId, p_provider: provider, p_payment_id: paymentId });
  if (error) throw new Error(`No se pudo marcar el pedido ${orderId}: ${error.message}`);
  return Boolean(data);
}

export async function markFailed(orderId: string, status: 'cancelado' | 'expirado' = 'cancelado'): Promise<void> {
  const db = getServiceClient();
  if (!db) return;
  await db.from('orders').update({ status }).eq('id', orderId).eq('status', 'pendiente');
}
