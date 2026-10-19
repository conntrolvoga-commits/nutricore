import { NextResponse } from 'next/server';
import { listProviders } from '@/lib/payments';

export const dynamic = 'force-dynamic'; // lee las llaves al momento de la petición, no en el build

/** Lista las pasarelas activas para que el checkout muestre solo las disponibles. */
export async function GET() {
  const providers = listProviders().map((p) => ({ id: p.id, label: p.label, methods: p.methods }));
  return NextResponse.json({ providers, demo: providers.length === 0 });
}
