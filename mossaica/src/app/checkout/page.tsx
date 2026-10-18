'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart, selectSubtotal, selectWeight } from '@/store/cart';
import { mxn } from '@/lib/format';
import type { ShippingRate } from '@/lib/types';

const empty = { name: '', email: '', phone: '', street: '', colony: '', city: '', state: '', postalCode: '' };

export default function Checkout() {
  const { items } = useCart();
  const subtotal = useCart(selectSubtotal);
  const weight = useCart(selectWeight);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState(empty);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [estimated, setEstimated] = useState(false);
  const [selected, setSelected] = useState<ShippingRate | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setMounted(true), []);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Cotización automática en cuanto el CP tiene 5 dígitos (se cancela si cambia el carrito o el CP).
  useEffect(() => {
    setRates([]); setSelected(null);
    if (!/^\d{5}$/.test(form.postalCode) || !items.length) return;
    const ctrl = new AbortController();
    setQuoting(true);
    fetch('/api/shipping', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
      body: JSON.stringify({ postalCode: form.postalCode, state: form.state, city: form.city, weightKg: weight, declaredValue: subtotal }),
    })
      .then((r) => r.json())
      .then((d) => { setRates(d.rates ?? []); setEstimated(Boolean(d.estimated)); setSelected(d.rates?.[0] ?? null); })
      .catch(() => {})
      .finally(() => setQuoting(false));
    return () => ctrl.abort();
  }, [form.postalCode, subtotal, weight]); // eslint-disable-line react-hooks/exhaustive-deps

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return setError('Elige una paquetería para continuar.');
    setPaying(true); setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })), address: form, shipping: { carrier: selected.carrier, service: selected.service } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al procesar el pedido');
      if (data.demo) useCart.getState().clear();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setPaying(false);
    }
  }

  if (!mounted) return null;
  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-6xl">🧺</p>
        <h1 className="mt-4 text-3xl font-bold">Tu carrito está vacío</h1>
        <Link href="/catalogo" className="btn-primary mt-6">Ir al catálogo</Link>
      </div>
    );
  }

  const total = subtotal + (selected?.price ?? 0);
  return (
    <form onSubmit={pay} className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold">Checkout</h1>
        <fieldset className="grid gap-3 rounded-3xl border-2 border-grape-900 bg-white p-5 sm:grid-cols-2">
          <legend className="px-2 font-display text-xl font-bold">Datos de envío</legend>
          <input className="input sm:col-span-2" required placeholder="Nombre completo" autoComplete="name" value={form.name} onChange={set('name')} />
          <input className="input" required type="email" placeholder="Correo" autoComplete="email" value={form.email} onChange={set('email')} />
          <input className="input" required type="tel" placeholder="Teléfono" autoComplete="tel" value={form.phone} onChange={set('phone')} />
          <input className="input sm:col-span-2" required placeholder="Calle y número" autoComplete="street-address" value={form.street} onChange={set('street')} />
          <input className="input" required placeholder="Colonia" value={form.colony} onChange={set('colony')} />
          <input className="input" required inputMode="numeric" maxLength={5} pattern="\d{5}" placeholder="Código postal" autoComplete="postal-code" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value.replace(/\D/g, '') }))} />
          <input className="input" required placeholder="Ciudad / Municipio" value={form.city} onChange={set('city')} />
          <input className="input" required placeholder="Estado" value={form.state} onChange={set('state')} />
        </fieldset>

        <fieldset className="rounded-3xl border-2 border-grape-900 bg-white p-5">
          <legend className="px-2 font-display text-xl font-bold">Paquetería</legend>
          {quoting && <p>Cotizando envío…</p>}
          {!quoting && !rates.length && <p className="text-grape-500">Escribe tu código postal para ver las tarifas de Estafeta, FedEx y DHL.</p>}
          <div className="space-y-2">
            {rates.map((r) => (
              <label key={`${r.carrier}-${r.service}`} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 ${selected === r ? 'border-grape-600 bg-grape-50' : 'border-grape-100'}`}>
                <input type="radio" name="rate" checked={selected === r} onChange={() => setSelected(r)} />
                <span className="flex-1"><b className="uppercase">{r.carrier}</b> · {r.service}{r.days ? ` · ${r.days} días` : ''}</span>
                <b>{mxn(r.price)}</b>
              </label>
            ))}
          </div>
          {estimated && rates.length > 0 && <p className="mt-2 text-xs text-grape-500">Tarifas estimadas (modo demo). Se cotizan en vivo al configurar Envia.com.</p>}
        </fieldset>
      </div>

      <aside className="h-fit space-y-4 rounded-3xl border-2 border-grape-900 bg-white p-5 shadow-pop lg:sticky lg:top-24">
        <h2 className="text-2xl font-bold">Resumen</h2>
        <ul className="space-y-1 text-sm">
          {items.map((i) => <li key={i.productId} className="flex justify-between"><span>{i.quantity} × {i.name}</span><span>{mxn(i.price * i.quantity)}</span></li>)}
        </ul>
        <div className="space-y-1 border-t-2 border-grape-100 pt-3">
          <div className="flex justify-between"><span>Subtotal</span><span>{mxn(subtotal)}</span></div>
          <div className="flex justify-between"><span>Envío</span><span>{selected ? mxn(selected.price) : '—'}</span></div>
          <div className="flex justify-between font-display text-2xl font-bold"><span>Total</span><span>{mxn(total)}</span></div>
        </div>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full" disabled={paying || !selected}>{paying ? 'Procesando…' : 'Pagar con Mercado Pago'}</button>
        <p className="text-center text-xs text-grape-500">Tarjeta, OXXO o SPEI. Pago seguro.</p>
      </aside>
    </form>
  );
}
