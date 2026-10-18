# Mossaica — tienda en línea (mossaica.mx)

Next.js 14 (App Router) + Tailwind + Zustand. Funciona **sin configurar nada** (catálogo semilla,
envíos estimados, checkout demo) y se activa por servicio al llenar `.env`.

```bash
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000
```

## Estructura
```
src/app/                 páginas: / · /catalogo · /producto/[slug] · /checkout · /gracias · /admin
src/app/api/             shipping (Envia.com) · checkout (Mercado Pago) · admin/{login,products}
src/components/          Header, SideCart, ProductCard, CatalogClient, AdminPanel...
src/lib/services/        envia.ts · mercadopago.ts
src/lib/products.ts      Supabase si está configurado; si no, src/lib/seed.ts
src/store/cart.ts        carrito (Zustand + localStorage)
supabase/schema.sql      tablas products y orders con RLS
```

## Activar servicios
| Servicio | Variables | Sin configurar |
|---|---|---|
| Supabase (catálogo, pedidos, admin CRUD) | `NEXT_PUBLIC_SUPABASE_URL`, `..._ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (+ correr `supabase/schema.sql`) | catálogo semilla, admin solo lectura |
| Mercado Pago (tarjeta, OXXO, SPEI) | `MP_ACCESS_TOKEN` | checkout demo, no cobra |
| Envia.com (Estafeta, FedEx, DHL) | `ENVIA_API_TOKEN`, `ENVIA_ORIGIN_*` | tarifas estimadas |
| Admin `/admin` | `ADMIN_PASSWORD` | no se puede entrar |

## Seguridad
El servidor recalcula precios, stock y envío en `/api/checkout`; nunca confía en montos del navegador.

## Pendiente antes de producción
- Imágenes reales (subir a Supabase Storage y poner URLs en `images`; hoy se usa arte con emoji).
- Webhook de Mercado Pago para marcar pedidos como pagados y descontar stock.
- Correos transaccionales y guía de rastreo (generar etiqueta con Envia.com).
- PayPal: no incluido; Mercado Pago ya cubre tarjeta, OXXO y SPEI.
