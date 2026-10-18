import type { MetadataRoute } from 'next';
import { getProducts } from '@/lib/products';
import { SITE_URL } from '@/lib/format';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    ...products.map((p) => ({ url: `${SITE_URL}/producto/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
  ];
}
