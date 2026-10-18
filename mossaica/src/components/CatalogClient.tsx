'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import ProductCard from './ProductCard';

const PAGE_SIZE = 12;

export default function CatalogClient({ products, initialRango }: { products: Product[]; initialRango?: string }) {
  const [q, setQ] = useState('');
  const [rango, setRango] = useState(initialRango ?? 'all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort(), [products]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((p) =>
      (rango === 'all' || p.rango === rango) &&
      (category === 'all' || p.category === category) &&
      (!term || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(term)));
  }, [products, q, rango, category]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  return (
    <div>
      <div className="mb-6 space-y-4 rounded-3xl border-2 border-grape-900 bg-white p-4 shadow-soft">
        <input className="input" type="search" placeholder="Buscar: concha, elote, alienígena…" value={q} onChange={(e) => reset(setQ)(e.target.value)} aria-label="Buscar productos" />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por rango">
          {['all', 'A', 'B', 'C'].map((r) => (
            <button key={r} onClick={() => reset(setRango)(r)} aria-pressed={rango === r} className={`chip ${rango === r ? 'bg-grape-600 text-white' : 'bg-white'}`}>
              {r === 'all' ? 'Todos los rangos' : `Rango ${r}`}
            </button>
          ))}
        </div>
        <select className="input" value={category} onChange={(e) => reset(setCategory)(e.target.value)} aria-label="Tipo de figura">
          <option value="all">Todos los tipos de figura</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <p className="mb-4 text-sm text-grape-500" aria-live="polite">{filtered.length} producto{filtered.length === 1 ? '' : 's'}</p>

      {visible.length === 0 ? (
        <p className="py-16 text-center font-display text-xl">No encontramos nada 🔍 Prueba con otra búsqueda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-8 flex justify-center gap-2" aria-label="Paginación">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)} aria-current={n === current ? 'page' : undefined} className={`chip ${n === current ? 'bg-sun' : 'bg-white'}`}>{n}</button>
          ))}
        </nav>
      )}
    </div>
  );
}
