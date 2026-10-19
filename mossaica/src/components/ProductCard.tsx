'use client';

import Link from 'next/link';
import type { Product } from '@/lib/types';
import { mxn } from '@/lib/format';
import { useCart } from '@/store/cart';
import ProductArt from './ProductArt';

export default function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const soldOut = product.stock < 1;
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border-2 border-grape-900 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-pop">
      <Link href={`/producto/${product.slug}`} className="relative block aspect-square overflow-hidden">
        <ProductArt product={product} />
        <span className="chip absolute left-3 top-3 bg-white text-grape-700">Rango {product.rango}</span>
        {product.isNew && <span className="chip absolute right-3 top-3 bg-candy text-white">Nuevo</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-grape-500">{product.category}</p>
        <h3 className="font-display text-lg leading-tight"><Link href={`/producto/${product.slug}`}>{product.name}</Link></h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="font-display text-xl font-bold">{mxn(product.price)}</span>
          <button className="btn-primary !px-4 !py-1.5 text-sm" disabled={soldOut} onClick={() => add(product)} aria-label={`Añadir ${product.name} al carrito`}>
            {soldOut ? 'Agotado' : 'Añadir'}
          </button>
        </div>
      </div>
    </article>
  );
}
