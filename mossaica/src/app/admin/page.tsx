import type { Metadata } from 'next';
import { isAdmin } from '@/lib/admin-auth';
import { getProducts } from '@/lib/products';
import { supabaseEnabled } from '@/lib/supabase';
import AdminPanel from '@/components/AdminPanel';
import AdminLogin from '@/components/AdminLogin';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function Admin() {
  if (!isAdmin()) return <AdminLogin />;
  const products = await getProducts();
  return <AdminPanel products={products} writable={supabaseEnabled && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)} />;
}
