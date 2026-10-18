import Link from 'next/link';
import { getProducts } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

const rangos = [
  { r: 'A', title: 'Rango A', text: '9 diseños: bolillo, bota, empanada, chocolate Abuelita y más.', bg: 'bg-sun' },
  { r: 'B', title: 'Rango B', text: '27 diseños: ajolotito, pokebola, conchas, alien, queso y más.', bg: 'bg-candy text-white' },
  { r: 'C', title: 'Rango C', text: '9 diseños: Dr. Simi, Grinch, Gengar, papitas y caguama.', bg: 'bg-sky-500 text-white' },
];

export default async function Home() {
  const products = await getProducts();
  const news = products.filter((p) => p.isNew).slice(0, 4);
  const best = products.filter((p) => p.bestSeller).slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-grape-600 via-grape-500 to-sky-500 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:grid-cols-2 md:py-24">
          <div>
            <p className="chip inline-block bg-sun text-grape-900">Fichas de lotería y miniaturas</p>
            <h1 className="mt-4 text-5xl font-bold leading-[1.05] sm:text-6xl">Colecciona lo <span className="text-sun">más chido</span> de México</h1>
            <p className="mt-4 max-w-md text-lg text-grape-100">Bolillos, conchas, elotes, ajolotitos, alienígenas y pokebolas en 45 diseños. Elige tu rango y arma tu colección.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/catalogo" className="btn-primary">Ver catálogo</Link>
              <Link href="/catalogo?rango=C" className="btn-ghost">Rango C</Link>
            </div>
          </div>
          <div className="relative mx-auto grid h-72 w-72 grid-cols-3 place-items-center gap-2 text-6xl sm:h-96 sm:w-96 sm:text-7xl" aria-hidden>
            {['🥖', '🌽', '👽', '🐚', '🔴', '🦎', '🍟', '🧀', '🎃'].map((e, i) => (
              <span key={i} className="animate-float" style={{ animationDelay: `${i * 0.35}s` }}>{e}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-6 text-3xl font-bold">Colecciones</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {rangos.map((c) => (
            <Link key={c.r} href={`/catalogo?rango=${c.r}`} className={`${c.bg} group rounded-3xl border-2 border-grape-900 p-6 shadow-pop transition hover:-translate-y-1`}>
              <p className="font-display text-5xl font-bold">{c.r}</p>
              <h3 className="mt-2 text-xl font-bold">{c.title}</h3>
              <p className="mt-1 text-sm opacity-90">{c.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {news.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <h2 className="mb-6 text-3xl font-bold">Novedades ✨</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{news.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}

      {best.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <h2 className="mb-6 text-3xl font-bold">Más vendidos 🔥</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{best.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
    </>
  );
}
