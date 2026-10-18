import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Gracias por tu compra', robots: { index: false } };

export default function Gracias({ searchParams }: { searchParams: { order?: string; pending?: string; demo?: string } }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-7xl">🎉</p>
      <h1 className="mt-4 text-4xl font-bold">{searchParams.pending ? 'Pago pendiente' : '¡Gracias por tu compra!'}</h1>
      {searchParams.order && <p className="mt-2">Pedido <b>{searchParams.order}</b></p>}
      <p className="mt-2 text-grape-500">
        {searchParams.pending ? 'Tu pedido se confirmará en cuanto recibamos tu pago (OXXO/SPEI).' : 'Te enviaremos los datos de rastreo por correo.'}
      </p>
      {searchParams.demo && <p className="mt-4 rounded-xl bg-sun/40 p-3 text-sm">Modo demo: no se realizó ningún cobro. Configura MP_ACCESS_TOKEN para cobrar.</p>}
      <Link href="/catalogo" className="btn-primary mt-8">Seguir comprando</Link>
    </div>
  );
}
