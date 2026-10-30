create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  rango text not null check (rango in ('A','B','C')),
  category text not null default '',
  stock integer not null default 0 check (stock >= 0),
  emoji text, color text,
  images text[] default '{}',
  weight_kg numeric(6,3) default 0.1,
  featured boolean default false,
  is_new boolean default false,
  best_seller boolean default false,
  created_at timestamptz default now()
);

create table if not exists orders (
  id text primary key,
  status text not null default 'pendiente',
  customer jsonb not null,
  shipping jsonb not null,
  items jsonb not null,
  subtotal numeric(10,2) not null,
  shipping_cost numeric(10,2) not null,
  total numeric(10,2) not null,
  created_at timestamptz default now()
);

-- RLS: el catálogo es público (solo lectura); pedidos solo vía service role.
alter table products enable row level security;
alter table orders enable row level security;
create policy "catalogo publico" on products for select using (true);

-- ── Envíos (Envia.com) ──────────────────────────────────────────────────
alter table orders add column if not exists weight_kg numeric(8,3);
alter table orders add column if not exists tracking_number text;
alter table orders add column if not exists label_url text;
alter table orders add column if not exists shipment_status text;

-- ── Pagos ──────────────────────────────────────────────────────────────
alter table orders add column if not exists payment_provider text;
alter table orders add column if not exists payment_id text;
alter table orders add column if not exists paid_at timestamptz;

-- Marca el pedido como pagado y descuenta stock en una sola transacción.
-- Idempotente: un webhook repetido devuelve false y no vuelve a descontar.
create or replace function mark_order_paid(p_order_id text, p_provider text, p_payment_id text)
returns boolean language plpgsql security definer set search_path = public as $$
declare o orders%rowtype; it jsonb;
begin
  select * into o from orders where id = p_order_id for update;
  if not found or o.status = 'pagado' then return false; end if;
  update orders set status = 'pagado', payment_provider = p_provider, payment_id = p_payment_id, paid_at = now() where id = p_order_id;
  for it in select * from jsonb_array_elements(o.items) loop
    if (it->>'productId') ~ '^[0-9a-f-]{36}$' then
      update products set stock = greatest(0, stock - (it->>'quantity')::int) where id = (it->>'productId')::uuid;
    end if;
  end loop;
  return true;
end $$;
revoke execute on function mark_order_paid(text, text, text) from public, anon, authenticated;
