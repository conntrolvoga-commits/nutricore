import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { getServiceClient } from '@/lib/supabase';

const FIELDS = ['slug', 'name', 'description', 'price', 'rango', 'category', 'stock', 'emoji', 'color', 'images', 'weight_kg', 'featured', 'is_new', 'best_seller'];
const pick = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([k]) => FIELDS.includes(k)));

async function guard() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!getServiceClient()) return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 503 });
  return null;
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const { data, error } = await getServiceClient()!.from('products').insert(pick(await req.json())).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const { id, ...rest } = await req.json();
  const { data, error } = await getServiceClient()!.from('products').update(pick(rest)).eq('id', id).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await req.json();
  const { error } = await getServiceClient()!.from('products').delete().eq('id', id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}
