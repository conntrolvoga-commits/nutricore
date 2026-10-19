import type { Metadata } from 'next';
import PackPicker from '@/components/PackPicker';

export const metadata: Metadata = {
  title: 'Paquetes de 25, 50 y 100 fichas',
  description: 'Paquetes surtidos de fichas de lotería de 25, 50 y 100 piezas desde $70 MXN. Ideal para fiestas, rifas y reventa.',
  alternates: { canonical: '/paquetes' },
};

export default function Paquetes() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-bold">Paquetes de fichas 📦</h1>
      <p className="mb-8 mt-2 max-w-xl text-lg">Elige el tamaño del paquete y el rango.</p>
      <PackPicker />
    </div>
  );
}
