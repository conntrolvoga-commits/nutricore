import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct, getProducts, getRelated } from '@/lib/products';
import { SITE_URL, mxn } from '@/lib/format';
import ProductArt from '@/components/ProductArt';
import ProductCard from '@/components/ProductCard';
import AddToCart from '@/components/AddToCart';

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const title = `${p.name} · Rango ${p.rango}`;
  const description = `${p.description} ${mxn(p.price)} MXN. Envíos a todo México.`;
  return {
    title, description,
    alternates: { canonical: `/producto/${p.slug}` },
    openGraph: { title, description, images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const related = await getRelated(p);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.images,
    category: p.category,
    sku: p.id,
    brand: { '@type': 'Brand', name: 'Mosaicca' },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/producto/${p.slug}`,
      priceCurrency: 'MXN',
      price: p.price,
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav className="mb-6 text-sm text-grape-500" aria-label="Migas de pan">
        <Link href="/catalogo">Catálogo</Link> / <Link href={`/catalogo?rango=${p.rango}`}>Rango {p.rango}</Link> / {p.name}
      </nav>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl border-2 border-grape-900 shadow-pop">
            <ProductArt product={p} priority sizes="(max-width:768px) 100vw, 50vw" />
          </div>
          {p.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {p.images.slice(1, 5).map((src, i) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-2xl border-2 border-grape-900">
                  <ProductArt product={{ ...p, images: [src], name: `${p.name} vista ${i + 2}` }} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <span className="chip bg-sun">Rango {p.rango}</span>
          <h1 className="mt-3 text-4xl font-bold">{p.name}</h1>
          <p className="mt-1 text-sm font-bold uppercase text-grape-500">{p.category}</p>
          <p className="mt-4 font-display text-4xl font-bold">{mxn(p.price)}</p>
          <p className="mt-4 text-lg">{p.description}</p>
          <p className={`mt-4 font-semibold ${p.stock > 0 && p.stock <= 10 ? 'text-candy' : 'text-grape-600'}`}>
            {p.stock === 0 ? 'Agotado' : p.stock <= 10 ? `¡Últimas ${p.stock} piezas!` : `${p.stock} disponibles`}
          </p>
          <div className="mt-6"><AddToCart product={p} /></div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-3xl font-bold">Te puede gustar</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} product={r} />)}</div>
        </section>
      )}
    </div>
  );
}
