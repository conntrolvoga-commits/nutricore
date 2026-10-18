'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/lib/types';

interface CartState {
  items: CartItem[];
  open: boolean;
  add: (p: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      add: (p, qty = 1) =>
        set((s) => {
          const found = s.items.find((i) => i.productId === p.id);
          if (found) {
            const quantity = Math.min(p.stock, found.quantity + qty);
            return { items: s.items.map((i) => (i.productId === p.id ? { ...i, quantity } : i)), open: true };
          }
          const item: CartItem = {
            productId: p.id, slug: p.slug, name: p.name, price: p.price, quantity: Math.min(p.stock, qty),
            emoji: p.emoji, color: p.color, image: p.images[0], stock: p.stock, weightKg: p.weightKg,
          };
          return { items: [...s.items, item], open: true };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.productId === id ? { ...i, quantity: Math.min(i.stock, qty) } : i))
            .filter((i) => i.quantity > 0),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.productId !== id) })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ open }),
    }),
    { name: 'mosaicca-cart', partialize: (s) => ({ items: s.items }) },
  ),
);

export const selectCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
export const selectSubtotal = (s: CartState) => s.items.reduce((n, i) => n + i.price * i.quantity, 0);
export const selectWeight = (s: CartState) => s.items.reduce((n, i) => n + i.weightKg * i.quantity, 0);
