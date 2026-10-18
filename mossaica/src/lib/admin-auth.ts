import { cookies } from 'next/headers';
import { createHash } from 'crypto';

/** Rechaza claves ausentes, cortas o la de ejemplo del .env.example: el panel no funciona con una clave adivinable. */
export const strongPassword = (pw: string | undefined): pw is string => Boolean(pw) && pw!.length >= 10 && pw !== 'cambia-esta-clave';

export async function isAdmin(): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!strongPassword(pw)) return false;
  const expected = createHash('sha256').update(`mosaicca:${pw}`).digest('hex');
  return (await cookies()).get('mos_admin')?.value === expected;
}
