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
