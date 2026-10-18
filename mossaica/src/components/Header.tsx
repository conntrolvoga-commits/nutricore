'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart, selectCount } from '@/store/cart';

const links = [
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/catalogo?rango=A', label: 'Rango A' },
  { href: '/catalogo?rango=B', label: 'Rango B' },
  { href: '/catalogo?rango=C', label: 'Rango C' },
];

export default function Header() {
  const count = useCart(selectCount);
  const setOpen = useCart((s) => s.setOpen);
  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-grape-900 bg-grape-600 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight">
          Mossa<span className="text-sun">i</span>ca
        </Link>
        <nav className="hidden gap-6 font-display font-semibold md:flex" aria-label="Principal">
          {links.map((l) => <Link key={l.href} href={l.href} className="transition hover:text-sun">{l.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <button className="btn-primary !px-4 !py-1.5" onClick={() => setOpen(true)} aria-label={`Abrir carrito, ${mounted ? count : 0} artículos`}>
            🛒 <span>{mounted ? count : 0}</span>
          </button>
          <button className="rounded-full p-2 text-2xl md:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menú" aria-expanded={menu}>☰</button>
        </div>
      </div>
      {menu && (
        <nav className="flex flex-col gap-3 border-t border-white/20 px-4 pb-4 pt-3 font-display font-semibold md:hidden" aria-label="Móvil">
          {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setMenu(false)}>{l.label}</Link>)}
        </nav>
      )}
    </header>
  );
}
