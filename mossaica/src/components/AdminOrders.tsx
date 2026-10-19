'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { mxn } from '@/lib/format';

export interface AdminOrder {
  id: string;
  status: string;
  total: number;
  created_at: string;
  customer: { name?: string };
  shipping: { carrier?: string; service?: string };
  tracking_number: string | null;
  label_url: string | null;
}

export default function AdminOrders({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  async function act(method: 'POST' | 'DELETE', orderId: string) {
    setBusy(orderId); setMsg('');
    const res = await fetch('/api/admin/shipments', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) });
    const data = await res.json();
    setMsg(res.ok ? (method === 'POST' ? `Guía ${data.trackingNumber} generada ✔` : 'Guía cancelada ✔') : data.error);
    setBusy('');
    if (res.ok) router.refresh();
  }

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-bold">Pedidos</h2>
      {msg && <p role="status" className="rounded-xl bg-white p-3">{msg}</p>}
      <div className="overflow-x-auto rounded-3xl border-2 border-grape-900 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-grape-100 font-display"><tr><th className="p-3">Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Envío</th><th /></tr></thead>
          <tbody>
            {orders.length === 0 && <tr><td className="p-3 text-grape-500" colSpan={6}>Todavía no hay pedidos.</td></tr>}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-grape-100">
                <td className="p-3 font-semibold">{o.id}</td>
                <td>{o.customer?.name}</td>
                <td>{mxn(Number(o.total))}</td>
                <td>{o.status}</td>
                <td>{o.tracking_number ? <span>{o.shipping?.carrier} · {o.tracking_number}</span> : <span className="text-grape-500">{o.shipping?.carrier} {o.shipping?.service}</span>}</td>
                <td className="space-x-3 pr-3 text-right">
                  {o.label_url && <a className="underline" href={o.label_url} target="_blank" rel="noreferrer">Imprimir guía</a>}
                  {!o.tracking_number && o.status === 'pagado' && o.shipping?.carrier !== 'Recolección' && (
                    <button className="btn-primary !px-3 !py-1 text-xs" disabled={busy === o.id} onClick={() => act('POST', o.id)}>{busy === o.id ? 'Generando…' : 'Generar guía'}</button>
                  )}
                  {o.tracking_number && <button className="text-red-600 underline" disabled={busy === o.id} onClick={() => act('DELETE', o.id)}>Cancelar guía</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
