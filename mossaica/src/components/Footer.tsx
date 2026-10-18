import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-20 border-t-2 border-grape-900 bg-grape-900 text-grape-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-bold text-white">Mossa<span className="text-sun">i</span>ca</p>
          <p className="mt-2 text-sm">Coleccionables mexicanos con mucho color. Envíos a todo México con Estafeta, FedEx y DHL.</p>
        </div>
        <div className="text-sm">
          <p className="font-display font-semibold text-white">Tienda</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/catalogo">Catálogo</Link></li>
            <li><Link href="/catalogo?rango=A">Rango A</Link></li>
            <li><Link href="/catalogo?rango=B">Rango B</Link></li>
            <li><Link href="/catalogo?rango=C">Rango C</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-display font-semibold text-white">Pagos seguros</p>
          <p className="mt-2">Tarjeta, OXXO y SPEI vía Mercado Pago.</p>
        </div>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs">© {new Date().getFullYear()} Mossaica · mossaica.mx</p>
    </footer>
  );
}
