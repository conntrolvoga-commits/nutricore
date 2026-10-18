import type { Product, Rango } from './types';
import { seedProducts } from './seed';

export const PACK_SIZES = [25, 50, 100] as const;
export type PackSize = (typeof PACK_SIZES)[number];
export type PackRango = Rango | 'MIX';

// ⚠ Descuentos PROVISIONALES por volumen; el precio base sale del precio unitario del catálogo.
export const PACK_DISCOUNT: Record<PackSize, number> = { 25: 0.1, 50: 0.15, 100: 0.2 };

const avg = (list: Product[]) => list.reduce((n, p) => n + p.price, 0) / (list.length || 1);

export function unitPrice(rango: PackRango): number {
  const list = rango === 'MIX' ? seedProducts : seedProducts.filter((p) => p.rango === rango);
  return avg(list);
}

export function packPrice(size: PackSize, rango: PackRango): number {
  return Math.round((size * unitPrice(rango) * (1 - PACK_DISCOUNT[size])) / 5) * 5;
}

export const packId = (size: PackSize, rango: PackRango) => `pack-${size}-${rango}`;

/** Devuelve el paquete como "producto" (para carrito y checkout) o null si el id no es válido. */
export function getPack(id: string): Product | null {
  const m = /^pack-(25|50|100)-(A|B|C|MIX)$/.exec(id);
  if (!m) return null;
  const size = Number(m[1]) as PackSize;
  const rango = m[2] as PackRango;
  const label = rango === 'MIX' ? 'Surtido A+B+C' : `Rango ${rango}`;
  return {
    id, slug: 'paquetes', name: `Paquete de ${size} fichas · ${label}`,
    description: `${size} fichas de lotería surtidas, ${label}.`,
    price: packPrice(size, rango), rango: rango === 'MIX' ? 'B' : rango, category: 'Paquetes',
    stock: 99, emoji: '📦', color: '#ffd23f', images: [], weightKg: size * 0.05,
    featured: false, isNew: false, bestSeller: false,
  };
}
