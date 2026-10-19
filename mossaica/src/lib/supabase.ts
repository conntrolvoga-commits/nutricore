import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseEnabled = Boolean(url && anon);

/** Cliente de solo lectura (catálogo público). */
export function getPublicClient(): SupabaseClient | null {
  return url && anon ? createClient(url, anon, { auth: { persistSession: false } }) : null;
}

/** Cliente con privilegios, SOLO para rutas de servidor (admin / pedidos). */
export function getServiceClient(): SupabaseClient | null {
  return url && service ? createClient(url, service, { auth: { persistSession: false } }) : null;
}
