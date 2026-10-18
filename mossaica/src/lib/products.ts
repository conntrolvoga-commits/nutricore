import { getPublicClient } from './supabase';
import { seedProducts } from './seed';
import type { Product } from './types';

interface Row {
  id: string; slug: string; name: string; description: string; price: number; rango: Product['rango'];
  category: string; stock: number; emoji: string | null; color: string | null; images: string[] | null;
  weight_kg: number | null; featured: boolean; is_new: boolean; best_seller: boolean;
}

const fromRow = (r: Row): Product => ({
  id: r.id, slug: r.slug, name: r.name, description: r.description, price: Number(r.price), rango: r.rango,
  category: r.category, stock: r.stock, emoji: r.emoji ?? '🎁', color: r.color ?? '#7c3aed',
  images: r.images ?? [], weightKg: Number(r.weight_kg ?? 0.1), featured: r.featured, isNew: r.is_new, bestSeller: r.best_seller,
});

export async function getProducts(): Promise<Product[]> {
  const db = getPublicClient();
  if (!db) return seedProducts;
  const { data, error } = await db.from('products').select('*').order('created_at', { ascending: false });
  if (error || !data?.length) return seedProducts;
  return (data as Row[]).map(fromRow);
}

export async function getProduct(slug: string): Promise<Product | null> {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getRelated(p: Product, limit = 4): Promise<Product[]> {
  const all = await getProducts();
  return all.filter((x) => x.id !== p.id && (x.rango === p.rango || x.category === p.category)).slice(0, limit);
}
