import { cookies } from 'next/headers';
import { createHash } from 'crypto';

export function isAdmin(): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const expected = createHash('sha256').update(`mosaicca:${pw}`).digest('hex');
  return cookies().get('mos_admin')?.value === expected;
}
