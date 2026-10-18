import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

const adminToken = () =>
  createHash('sha256').update(`mossaica:${process.env.ADMIN_PASSWORD ?? ''}`).digest('hex');

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Clave incorrecta' }, { status: 401 });
  }
  cookies().set('mos_admin', adminToken(), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 8 });
  return NextResponse.json({ ok: true });
}
