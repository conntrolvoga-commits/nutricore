import Image from 'next/image';
import type { Product } from '@/lib/types';

/** Imagen real si existe; si no, arte de respaldo (emoji sobre color de la marca). */
export default function ProductArt({ product, priority = false, sizes = '(max-width:768px) 50vw, 25vw' }: { product: Pick<Product, 'name' | 'images' | 'emoji' | 'color'>; priority?: boolean; sizes?: string }) {
  if (product.images[0]) {
    return <Image src={product.images[0]} alt={product.name} fill sizes={sizes} priority={priority} className="object-cover" />;
  }
  return (
    <div role="img" aria-label={product.name} className="flex h-full w-full items-center justify-center text-7xl transition duration-300 group-hover:scale-110 group-hover:rotate-6 sm:text-8xl" style={{ background: `radial-gradient(circle at 30% 25%, #fff8 0, transparent 45%), ${product.color}` }}>
      <span aria-hidden>{product.emoji}</span>
    </div>
  );
}
