# Mosaicca — tienda en línea (mosaicca.mx)

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
src/app/api/             shipping (Envia.com) · checkout · payments · webhooks/{mercadopago,conekta} · admin
src/components/          Header, SideCart, ProductCard, CatalogClient, AdminPanel...
src/lib/services/envia/  cotizar, guía, rastreo y cancelación (ver Logística)
src/lib/payments/        Mercado Pago y Conekta (ver Pagos)
src/lib/products.ts      Supabase si está configurado; si no, src/lib/seed.ts
src/store/cart.ts        carrito (Zustand + localStorage)
supabase/schema.sql      tablas products y orders con RLS
```

## Pagos: Mercado Pago y Conekta
Las dos pasarelas cumplen el mismo contrato (`src/lib/payments/types.ts`). Se activa cada una con sus llaves; si hay las dos, el cliente elige en el checkout; si no hay ninguna, el checkout funciona en modo demo y no cobra.

```
src/lib/payments/
  types.ts         contrato PaymentProvider (agregar Stripe/PayPal = un archivo nuevo)
  payloads.ts      constructores puros de la orden/preferencia + firma de webhook (con pruebas)
  mercadopago.ts   Checkout Pro: tarjeta, OXXO y SPEI en su pantalla de pago
  conekta.ts       Checkout alojado: card, cash (OXXO) y bank_transfer (SPEI)
  index.ts         registro: lista solo las pasarelas con credenciales
src/lib/orders.ts  markPaid (idempotente, descuenta stock en una transacción SQL)
src/app/api/{payments,checkout}/route.ts
src/app/api/webhooks/{mercadopago,conekta}/route.ts
```

**Flujo:** el cliente elige envío y pasarela → `/api/checkout` recalcula precios en el servidor, guarda el pedido como `pendiente` y devuelve la URL de pago → el cliente paga (tarjeta al momento; OXXO/SPEI genera una referencia y paga después) → la pasarela avisa al **webhook** → el servidor consulta el pago directo a la API y solo entonces marca el pedido `pagado` y descuenta stock.

**Seguridad:** el cuerpo del webhook nunca se da por bueno; siempre se confirma con la API usando la llave privada. Con `MP_WEBHOOK_SECRET` además se verifica la firma `x-signature` de Mercado Pago. Los montos de Conekta van en centavos.

**Configurar (una sola vez):**
1. Mercado Pago: crea una aplicación en Mercado Pago Developers → copia el *Access Token* a `MP_ACCESS_TOKEN`; en Webhooks agrega `https://TU-DOMINIO/api/webhooks/mercadopago` (evento *Pagos*) y copia el secreto a `MP_WEBHOOK_SECRET`.
2. Conekta: en el panel copia la *llave privada* a `CONEKTA_PRIVATE_KEY`; en Webhooks agrega `https://TU-DOMINIO/api/webhooks/conekta`.
3. En Supabase corre `supabase/schema.sql` (agrega la función `mark_order_paid`).
4. Prueba primero con las llaves de **pruebas** de cada pasarela; cambia a las de producción al salir.

**Pruebas:** `node --experimental-strip-types --test scripts/payments.test.mts` (payloads de ambas pasarelas y firma del webhook; no requiere llaves).

## Logística: Envia.com (Estafeta, FedEx, DHL)
Servicio en `src/lib/services/envia/`:

```
payloads.ts   cuerpos de cotización/guía y lectores de respuesta (puros, con pruebas); normaliza estados ("Nuevo León" → NL) y calle/número
client.ts     POST autenticado con timeout y errores legibles
index.ts      quoteShipping · createLabel · trackShipment · cancelLabel
```

| Ruta | Quién | Qué hace |
|---|---|---|
| `POST /api/shipping` | checkout | cotiza las 3 paqueterías en paralelo (caché de 10 min; si una falla se omite; si fallan todas o no hay token, tarifas estimadas) |
| `GET /api/tracking?tn=…` o `?order=…&email=…` | cliente | rastreo; por pedido exige el correo del pedido |
| `POST /api/admin/shipments` | panel `/admin` | genera la guía PDF 4x6 de un pedido **pagado** (cobra a tu saldo de Envia, por eso es manual) |
| `DELETE /api/admin/shipments` | panel `/admin` | cancela la guía |

**Flujo:** el cliente cotiza por código postal → el pedido guarda la tarifa elegida (con el código de servicio de Envia) y el peso → al confirmarse el pago, en `/admin` → *Pedidos* pulsas **Generar guía** → imprimes el PDF y rastreas con el número.

**Configurar:** `ENVIA_API_TOKEN` (con `ENVIA_ENV=sandbox` usa api-test.envia.com y no cobra guías reales) y la dirección de origen completa `ENVIA_ORIGIN_*` (calle, número, colonia, CP, ciudad, estado, teléfono). Corre `supabase/schema.sql` (columnas de envío).

**Pruebas:** `node --experimental-strip-types --import ./scripts/register.mjs --test scripts/envia.test.mts`

## Activar servicios
| Servicio | Variables | Sin configurar |
|---|---|---|
| Supabase (catálogo, pedidos, admin CRUD) | `NEXT_PUBLIC_SUPABASE_URL`, `..._ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (+ correr `supabase/schema.sql`) | catálogo semilla, admin solo lectura |
| Mercado Pago / Conekta | ver sección Pagos | checkout demo, no cobra |
| Envia.com (Estafeta, FedEx, DHL) | `ENVIA_API_TOKEN`, `ENVIA_ORIGIN_*` | tarifas estimadas, sin guías |
| Admin `/admin` | `ADMIN_PASSWORD` (mín. 10 caracteres, distinta de la de ejemplo) | el panel se desactiva (503) |

## Seguridad
El panel `/admin` solo funciona con una clave de 10+ caracteres que no sea la del ejemplo, compara en tiempo constante y bloquea 15 min tras 5 intentos fallidos desde la misma IP.
El servidor recalcula precios, stock y envío en `/api/checkout`; nunca confía en montos del navegador.

## Pendiente antes de producción
- Imágenes reales (subir a Supabase Storage y poner URLs en `images`; hoy se usa arte con emoji).
- Correos transaccionales con el número de guía (la guía y el rastreo ya existen; falta enviarlos por correo).
- PayPal: no incluido; Mercado Pago ya cubre tarjeta, OXXO y SPEI.

## Tienda en HTML + cobro con PHP en Hostinger
`hostinger-src/api/` es un servidor de cobro en PHP (Mercado Pago y Conekta) que acompaña al HTML estático (`mosaicca-hostinger.zip`, carpeta `hostinger/`). Recalcula precios, descuentos y envío en el servidor desde `api/catalog.php` (generado de los datos de la tienda), rechaza artículos "por cotizar", crea el pago y recibe el webhook, que confirma el pago directo con la pasarela, marca el pedido como pagado y avisa al dueño (correo y `api/data/pedidos-pagados.log`). Las llaves van en `api/config.php` (copiar de `config.sample.php`), que no se versiona ni se sirve por web. Sin `config.php` la tienda sigue funcionando con pedidos por WhatsApp.
