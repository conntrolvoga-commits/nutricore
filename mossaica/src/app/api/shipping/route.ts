import { NextResponse } from 'next/server';
import { quoteShipping } from '@/lib/services/envia';

export async function POST(req: Request) {
  const { postalCode, state, city, weightKg, declaredValue } = await req.json().catch(() => ({}));
  if (!/^\d{5}$/.test(String(postalCode ?? ''))) {
    return NextResponse.json({ error: 'Código postal inválido' }, { status: 400 });
  }
  const result = await quoteShipping({
    postalCode, state, city,
    weightKg: Number(weightKg) || 0.1,
    declaredValue: Number(declaredValue) || 0,
  });
  return NextResponse.json(result);
}
