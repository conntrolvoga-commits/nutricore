import type { Metadata } from 'next';
import { isAdmin } from '@/lib/admin-auth';
import { getProducts } from '@/lib/products';
import { getServiceClient, supabaseEnabled } from '@/lib/supabase';
import AdminOrders from '@/components/AdminOrders';
import AdminPanel from '@/components/AdminPanel';
import AdminLogin from '@/components/AdminLogin';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function Admin() {
  if (!(await isAdmin())) return <AdminLogin />;
  const products = await getProducts();
  const { data: orders } = (await getServiceClient()?.from('orders').select('id,status,total,created_at,customer,shipping,tracking_number,label_url').order('created_at', { ascending: false }).limit(50)) ?? { data: null };
  return (
    <>
      <AdminPanel products={products} writable={supabaseEnabled && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)} />
      <div className="mx-auto max-w-6xl px-4 pb-12"><AdminOrders orders={orders ?? []} /></div>
    </>
  );
}
