import { NextResponse } from 'next/server';
import { enviaConfigured, trackShipment } from '@/lib/services/envia';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Rastreo para el cliente. Dos formas:
 *  - ?tn=<guía>                    consulta directa por número de guía
 *  - ?order=<MOS-…>&email=<correo> busca la guía del pedido (el correo debe coincidir con el del pedido)
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  let tn = q.get('tn') ?? '';

  if (!tn && q.get('order')) {
    const db = getServiceClient();
    if (!db) return NextResponse.json({ error: 'Rastreo por pedido no disponible' }, { status: 503 });
    const { data } = await db.from('orders').select('tracking_number, customer').eq('id', q.get('order')).maybeSingle();
    const email = String(q.get('email') ?? '').trim().toLowerCase();
    if (!data || String(data.customer?.email ?? '').toLowerCase() !== email) return NextResponse.json({ error: 'No encontramos ese pedido' }, { status: 404 });
    if (!data.tracking_number) return NextResponse.json({ status: 'Tu pedido aún no tiene guía', events: [] });
    tn = data.tracking_number;
  }

  if (!/^[A-Za-z0-9-]{6,40}$/.test(tn)) return NextResponse.json({ error: 'Número de guía inválido' }, { status: 400 });
  if (!enviaConfigured()) return NextResponse.json({ error: 'Rastreo no disponible' }, { status: 503 });
  try {
    return NextResponse.json(await trackShipment(tn));
  } catch {
    return NextResponse.json({ error: 'No se pudo consultar el rastreo' }, { status: 502 });
  }
}
