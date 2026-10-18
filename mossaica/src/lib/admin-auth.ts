import { cookies } from 'next/headers';
import { createHash } from 'crypto';

export async function isAdmin(): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const expected = createHash('sha256').update(`mosaicca:${pw}`).digest('hex');
  return (await cookies()).get('mos_admin')?.value === expected;
}
