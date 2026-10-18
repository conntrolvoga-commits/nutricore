import type { Product, Rango } from './types';

type Row = [string, string, Rango, string, number, string, string, string, number];

// nombre, descripción, rango, categoría, precio, emoji, color, flags(n=nuevo,b=más vendido,f=destacado), stock
const rows: Row[] = [
  ['Bolillo Crujiente', 'Miniatura de bolillo recién horneado, con todo y su greca dorada.', 'A', 'Pan dulce', 35, '🥖', '#ffd23f', 'bf', 120],
  ['Concha Rosa', 'La concha clásica de azúcar rosa, tamaño ficha de lotería.', 'A', 'Pan dulce', 35, '🐚', '#ff4fa3', 'bf', 150],
  ['Elote con Todo', 'Elotito con mayonesa, queso y chile. Coleccionable de resina.', 'A', 'Antojitos', 39, '🌽', '#ffd23f', 'f', 90],
  ['Jarrito de Tamarindo', 'El refresco de barro favorito, versión miniatura brillante.', 'A', 'Bebidas', 39, '🏺', '#c2410c', 'b', 80],
  ['Nopal Contento', 'Nopalito sonriente listo para tu vitrina.', 'A', 'Antojitos', 35, '🌵', '#7ee05a', '', 100],
  ['Taco al Pastor', 'Taquito con piña y cilantro, detalle en relieve.', 'A', 'Antojitos', 42, '🌮', '#fb923c', 'nf', 70],
  ['Alebrije Mágico', 'Mini alebrije de colores llenos de vida.', 'B', 'Artesanía', 59, '🦎', '#a855f7', 'f', 60],
  ['Luchador Enmascarado', 'El campeón del ring en versión miniatura.', 'B', 'Pop mexicano', 59, '🤼', '#2563eb', 'b', 55],
  ['Calavera Catrina', 'Calavera floral para tu altar o escritorio.', 'B', 'Artesanía', 65, '💀', '#ff4fa3', 'nf', 45],
  ['Alienígena Curioso', 'Visitante del espacio con ojos grandes y brillantes.', 'B', 'Pop', 59, '👽', '#7ee05a', 'n', 65],
  ['Pokebola Retro', 'Esfera de captura coleccionable, pintada a mano.', 'B', 'Pop', 62, '🔴', '#ef4444', 'b', 75],
  ['Paleta Payaso', 'Dulce nostálgico de la tiendita de la esquina.', 'B', 'Dulces', 55, '🍭', '#ff4fa3', '', 85],
  ['Piñata de Siete Picos', 'Mini piñata de colores, perfecta para fiestas.', 'C', 'Fiesta', 79, '🪅', '#ffd23f', 'f', 40],
  ['Mariachi Cantor', 'Guitarrón en mano y sombrero de charro.', 'C', 'Pop mexicano', 85, '🎺', '#7c3aed', 'n', 30],
  ['Lotería: El Corazón', 'Ficha clásica de lotería con acabado esmaltado.', 'C', 'Lotería', 79, '❤️', '#ef4444', 'bf', 50],
  ['Lotería: La Luna', 'Ficha de lotería edición nocturna.', 'C', 'Lotería', 79, '🌙', '#4c1d9e', 'n', 50],
  ['Ofrenda Miniatura', 'Altar de muertos en miniatura con cempasúchil.', 'C', 'Artesanía', 95, '🕯️', '#fb923c', 'nf', 25],
  ['Dragón de Jade', 'Pieza de colección edición limitada, rango C.', 'C', 'Pop', 99, '🐉', '#10b981', 'n', 20],
];

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const seedProducts: Product[] = rows.map(([name, description, rango, category, price, emoji, color, flags, stock], i) => ({
  id: `seed-${i + 1}`,
  slug: slugify(name),
  name,
  description,
  price,
  rango,
  category,
  stock,
  emoji,
  color,
  images: [],
  weightKg: 0.08,
  featured: flags.includes('f'),
  isNew: flags.includes('n'),
  bestSeller: flags.includes('b'),
}));
