'use client';

import { useState } from 'react';

export default function AdminLogin() {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (res.ok) location.reload(); else setErr('Clave incorrecta');
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 px-4 py-24">
      <h1 className="text-3xl font-bold">Panel Mossaica</h1>
      <input className="input" type="password" placeholder="Clave de administrador" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
      {err && <p role="alert" className="text-red-600">{err}</p>}
      <button className="btn-primary w-full">Entrar</button>
    </form>
  );
}
