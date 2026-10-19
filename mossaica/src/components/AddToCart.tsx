'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Product } from '@/lib/types';
import { useCart } from '@/store/cart';

export default function AddToCart({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const router = useRouter();
  if (product.stock < 1) return <p className="rounded-2xl bg-grape-100 p-4 font-display font-semibold">Agotado por ahora 😢</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-display font-semibold">Cantidad</span>
        <button className="chip bg-white" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">−</button>
        <span className="w-8 text-center text-lg font-bold">{qty}</span>
        <button className="chip bg-white" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} aria-label="Más">+</button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="btn-primary flex-1" onClick={() => add(product, qty)}>Añadir al carrito</button>
        <button className="btn-dark flex-1" onClick={() => { add(product, qty); useCart.getState().setOpen(false); router.push('/checkout'); }}>Comprar ahora</button>
      </div>
    </div>
  );
}
