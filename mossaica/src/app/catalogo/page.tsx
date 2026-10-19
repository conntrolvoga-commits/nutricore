import type { Metadata } from 'next';
import { getProducts } from '@/lib/products';
import CatalogClient from '@/components/CatalogClient';

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Todas las fichas de lotería, miniaturas y coleccionables mexicanos de Mosaicca. Filtra por rango y tipo de figura.',
  alternates: { canonical: '/catalogo' },
};

export default async function Catalogo(props: { searchParams: Promise<{ rango?: string }> }) {
  const searchParams = await props.searchParams;
  const products = await getProducts();
  const rango = ['A', 'B', 'C'].includes(searchParams.rango ?? '') ? searchParams.rango : undefined;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-4xl font-bold">Catálogo</h1>
      <CatalogClient products={products} initialRango={rango} />
    </div>
  );
}
