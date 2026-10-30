'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Product } from '@/lib/types';
import { mxn } from '@/lib/format';

const blank = { name: '', slug: '', description: '', price: 0, rango: 'A', category: '', stock: 0, emoji: '🎁', color: '#7c3aed', weight_kg: 0.1, featured: false, is_new: true, best_seller: false };

export default function AdminPanel({ products, writable }: { products: Product[]; writable: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<typeof blank & { id?: string }>(blank);
  const [msg, setMsg] = useState('');

  async function call(method: string, body: unknown) {
    const res = await fetch('/api/admin/products', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setMsg(res.ok ? 'Guardado ✔' : data.error);
    if (res.ok) { setForm(blank); router.refresh(); }
  }
  const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const edit = (p: Product) => setForm({ id: p.id, name: p.name, slug: p.slug, description: p.description, price: p.price, rango: p.rango, category: p.category, stock: p.stock, emoji: p.emoji, color: p.color, weight_kg: p.weightKg, featured: p.featured, is_new: p.isNew, best_seller: p.bestSeller });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <h1 className="text-4xl font-bold">Panel de administración</h1>
      {!writable && <p className="rounded-2xl bg-sun/40 p-4">Solo lectura: configura Supabase (variables en .env) para crear y editar productos.</p>}
      {msg && <p role="status" className="rounded-xl bg-white p-3">{msg}</p>}

      <form className="grid gap-3 rounded-3xl border-2 border-grape-900 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => { e.preventDefault(); const { id, ...rest } = form; id ? call('PATCH', { id, ...rest }) : call('POST', rest); }}>
        <h2 className="text-xl font-bold sm:col-span-2 lg:col-span-4">{form.id ? 'Editar producto' : 'Nuevo producto'}</h2>
        <input className="input" required placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} />
        <input className="input" required placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <input className="input" required placeholder="Categoría / tipo de figura" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <select className="input" value={form.rango} onChange={(e) => setForm({ ...form, rango: e.target.value })}>{['A', 'B', 'C'].map((r) => <option key={r} value={r}>Rango {r}</option>)}</select>
        <input className="input" type="number" min={0} step="0.01" required placeholder="Precio MXN" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
        <input className="input" type="number" min={0} required placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
        <input className="input" placeholder="Emoji" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        <input className="input" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} aria-label="Color" />
        <textarea className="input sm:col-span-2 lg:col-span-4" placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex flex-wrap gap-4 sm:col-span-2 lg:col-span-4">
          {([['featured', 'Destacado'], ['is_new', 'Nuevo'], ['best_seller', 'Más vendido']] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} />{l}</label>
          ))}
          <button className="btn-primary ml-auto" disabled={!writable}>{form.id ? 'Actualizar' : 'Crear'}</button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-3xl border-2 border-grape-900 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-grape-100 font-display"><tr><th className="p-3">Producto</th><th>Rango</th><th>Precio</th><th>Stock</th><th /></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-grape-100">
                <td className="p-3">{p.emoji} {p.name}</td><td>{p.rango}</td><td>{mxn(p.price)}</td>
                <td className={p.stock < 10 ? 'font-bold text-candy' : ''}>{p.stock}</td>
                <td className="space-x-3 pr-3 text-right">
                  <button className="underline" disabled={!writable} onClick={() => edit(p)}>Editar</button>
                  <button className="text-red-600 underline" disabled={!writable} onClick={() => confirm(`¿Eliminar ${p.name}?`) && call('DELETE', { id: p.id })}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
