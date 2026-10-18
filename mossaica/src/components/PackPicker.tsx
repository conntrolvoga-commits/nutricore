'use client';

import { useState } from 'react';
import { PACK_SIZES, getPack, packPrice, type PackRango, type PackSize } from '@/lib/packs';
import { mxn } from '@/lib/format';
import { useCart } from '@/store/cart';

const RANGOS: { id: PackRango; label: string }[] = [
  { id: 'A', label: 'Rango A' }, { id: 'B', label: 'Rango B' }, { id: 'C', label: 'Rango C' }, { id: 'MIX', label: 'Surtido A+B+C' },
];

export default function PackPicker() {
  const [rango, setRango] = useState<PackRango>('MIX');
  const add = useCart((s) => s.add);

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Rango del paquete">
        {RANGOS.map((r) => (
          <button key={r.id} aria-pressed={rango === r.id} onClick={() => setRango(r.id)} className={`chip ${rango === r.id ? 'bg-grape-600 text-white' : 'bg-white'}`}>{r.label}</button>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {PACK_SIZES.map((size: PackSize) => {
          const price = packPrice(size, rango);
          return (
            <article key={size} className="relative flex flex-col rounded-3xl border-2 border-grape-900 bg-white p-6 shadow-pop">
              <p className="font-display text-6xl font-bold">{size}</p>
              <p className="font-display text-xl">fichas</p>
              <p className="mt-4 font-display text-4xl font-bold">{mxn(price)}</p>
              <p className="text-sm">{mxn(Math.round((price / size) * 100) / 100)} por ficha</p>
              <ul className="mt-4 flex-1 space-y-1 text-sm">
                <li>✔ Diseños surtidos al azar</li>
                <li>✔ {rango === 'MIX' ? 'Mezcla de los rangos A, B y C' : `Solo diseños del Rango ${rango}`}</li>
                <li>✔ Ideal para fiestas, rifas y reventa</li>
              </ul>
              <button className="btn-primary mt-6" onClick={() => add(getPack(`pack-${size}-${rango}`)!)}>Añadir al carrito</button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
