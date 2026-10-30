'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useCart, selectSubtotal } from '@/store/cart';
import { mxn } from '@/lib/format';

export default function SideCart() {
  const { items, open, setOpen, setQty, remove } = useCart();
  const subtotal = useCart(selectSubtotal);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrito de compras">
      <div className="absolute inset-0 animate-fadeIn bg-grape-900/60" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md animate-slideIn flex-col border-l-2 border-grape-900 bg-white">
        <div className="flex items-center justify-between border-b-2 border-grape-100 p-4">
          <h2 className="text-2xl font-bold">Tu carrito</h2>
          <button className="text-2xl" onClick={() => setOpen(false)} aria-label="Cerrar carrito">✕</button>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-6xl">🧺</p>
            <p className="font-display text-lg">Tu carrito está vacío</p>
            <Link href="/catalogo" onClick={() => setOpen(false)} className="btn-primary">Ver catálogo</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-grape-100 overflow-y-auto">
              {items.map((i) => (
                <li key={i.productId} className="flex gap-3 p-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-grape-900 text-3xl" style={{ background: i.color }} aria-hidden>{i.emoji}</div>
                  <div className="flex-1">
                    <p className="font-display font-semibold leading-tight">{i.name}</p>
                    <p className="text-sm text-grape-500">{mxn(i.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button className="chip bg-white" onClick={() => setQty(i.productId, i.quantity - 1)} aria-label="Quitar uno">−</button>
                      <span className="w-6 text-center font-bold" aria-live="polite">{i.quantity}</span>
                      <button className="chip bg-white" disabled={i.quantity >= i.stock} onClick={() => setQty(i.productId, i.quantity + 1)} aria-label="Añadir uno">+</button>
                      <button className="ml-auto text-sm underline" onClick={() => remove(i.productId)}>Eliminar</button>
                    </div>
                  </div>
                  <p className="font-display font-bold">{mxn(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t-2 border-grape-100 p-4">
              <div className="flex justify-between font-display text-xl font-bold"><span>Subtotal</span><span>{mxn(subtotal)}</span></div>
              <p className="text-xs text-grape-500">El envío se calcula en el checkout con tu código postal.</p>
              <Link href="/checkout" onClick={() => setOpen(false)} className="btn-primary w-full">Ir a pagar</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
