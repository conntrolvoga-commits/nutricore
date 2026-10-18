import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/products';
import { getPack } from '@/lib/packs';
import { quoteShipping } from '@/lib/services/envia';
import { createPreference } from '@/lib/services/mercadopago';
import { getServiceClient } from '@/lib/supabase';

interface Body {
  items: { productId: string; quantity: number }[];
  address: Record<string, string>;
  shipping: { carrier: string; service: string };
}

/**
 * El servidor NUNCA confía en precios del cliente: recalcula subtotal y envío
 * desde el catálogo y la cotización antes de crear el cobro.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const a = body?.address;
  if (!body?.items?.length || !a || !a.name || !/^\S+@\S+\.\S+$/.test(a.email ?? '') || !/^\d{5}$/.test(a.postalCode ?? '') || !a.street) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  const catalog = await getProducts();
  const lines = [];
  for (const it of body.items) {
    const p = getPack(String(it.productId)) ?? catalog.find((x) => x.id === it.productId);
    const qty = Math.floor(Number(it.quantity));
    if (!p || qty < 1) return NextResponse.json({ error: 'Producto no válido' }, { status: 400 });
    if (qty > p.stock) return NextResponse.json({ error: `Stock insuficiente de ${p.name}` }, { status: 409 });
    lines.push({ p, qty });
  }

  const subtotal = lines.reduce((n, l) => n + l.p.price * l.qty, 0);
  const weightKg = lines.reduce((n, l) => n + l.p.weightKg * l.qty, 0);
  const { rates } = await quoteShipping({ postalCode: a.postalCode, state: a.state, city: a.city, weightKg, declaredValue: subtotal });
  const rate = rates.find((r) => r.carrier === body.shipping?.carrier && r.service === body.shipping?.service) ?? rates[0];
  const total = subtotal + rate.price;

  const orderId = `MOS-${Date.now().toString(36).toUpperCase()}`;
  const db = getServiceClient();
  if (db) {
    const { error } = await db.from('orders').insert({
      id: orderId, status: 'pendiente', customer: a, shipping: rate, subtotal, shipping_cost: rate.price, total,
      items: lines.map((l) => ({ productId: l.p.id, name: l.p.name, price: l.p.price, quantity: l.qty })),
    });
    if (error) return NextResponse.json({ error: 'No se pudo registrar el pedido' }, { status: 500 });
  }

  try {
    const pref = await createPreference({
      orderId,
      items: lines.map((l) => ({ title: l.p.name, quantity: l.qty, unit_price: l.p.price })),
      shippingCost: rate.price,
      payer: { name: a.name, email: a.email },
    });
    return NextResponse.json({ orderId, total, url: pref.url, demo: pref.demo });
  } catch {
    return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 502 });
  }
}
