import type { Product, Rango } from './types';

export const PACK_SIZES = [25, 50, 100] as const;
export type PackSize = (typeof PACK_SIZES)[number];
export type PackRango = Rango | 'MIX';

/** Precio fijo en MXN por tamaño de paquete (igual para cualquier rango). */
export const PACK_PRICE: Record<PackSize, number> = { 25: 70, 50: 135, 100: 280 };

export const packPrice = (size: PackSize, _rango?: PackRango): number => PACK_PRICE[size];

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
