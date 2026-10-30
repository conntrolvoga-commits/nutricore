import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash, timingSafeEqual } from 'crypto';
import { strongPassword } from '@/lib/admin-auth';

const sha = (s: string) => createHash('sha256').update(s).digest();
const adminToken = () => createHash('sha256').update(`mosaicca:${process.env.ADMIN_PASSWORD ?? ''}`).digest('hex');

// Freno básico a la fuerza bruta: 5 intentos fallidos por IP cada 15 minutos (por instancia del servidor).
const WINDOW_MS = 15 * 60_000;
const attempts = new Map<string, { n: number; reset: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && now < entry.reset && entry.n >= 5) return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 });

  const { password } = await req.json().catch(() => ({}));
  const real = process.env.ADMIN_PASSWORD;
  if (!strongPassword(real)) return NextResponse.json({ error: 'El panel está desactivado: configura ADMIN_PASSWORD (mínimo 10 caracteres, distinta de la del ejemplo).' }, { status: 503 });
  if (typeof password !== 'string' || !timingSafeEqual(sha(password), sha(real))) {
    attempts.set(ip, entry && now < entry.reset ? { n: entry.n + 1, reset: entry.reset } : { n: 1, reset: now + WINDOW_MS });
    return NextResponse.json({ error: 'Clave incorrecta' }, { status: 401 });
  }
  attempts.delete(ip);
  (await cookies()).set('mos_admin', adminToken(), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 8 });
  return NextResponse.json({ ok: true });
}
