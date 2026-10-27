# Backend de suscripciones (Stripe)

Servidor sin dependencias (Node 18+). Prueba local: `node test.js` (usa un Stripe simulado, no toca dinero).

## Puesta en marcha
1. En Stripe crea dos productos con precio recurrente: **5 USD/mes** y **20 USD/año**. Copia los `price_...`.
2. Configura tu cuenta bancaria de cobros en Stripe → Pagos (Payouts). No va en el código.
3. Copia `.env.example` a las variables de entorno del servidor y rellénalo (claves `sk_...` y `whsec_...` solo en el servidor).
4. En Stripe → Webhooks añade `https://TU-API/api/webhook` con los eventos `checkout.session.completed` y `customer.subscription.created|updated|deleted`. Copia el `whsec_...`.
5. Activa el Customer Portal en Stripe (para «Gestionar o cancelar»).
6. `node server.js`, detrás de HTTPS.
7. En `marvital/index.html` pon `API_BASE` con la URL pública de la API.

## Endpoints
| Ruta | Función |
|---|---|
| `POST /api/checkout {plan}` | Crea la sesión de pago de Stripe y devuelve su URL |
| `GET /api/status?session_id=` | Al volver del pago: confirma con Stripe y entrega un token firmado |
| `POST /api/verify {token}` | Al abrir la app: revalida la suscripción |
| `POST /api/portal {token}` | URL del portal para cancelar o gestionar |
| `POST /api/webhook` | Eventos de Stripe (firma verificada); activa o revoca el acceso |

## Pendiente antes de producción
- Sustituir el archivo JSON por una base de datos.
- Probar un pago real en modo test de Stripe de extremo a extremo (aquí solo se probó con un Stripe simulado).
- Apple/Google exigen su propia compra dentro de la app para contenido digital en apps móviles; este flujo vale para web/PWA. Para tiendas hace falta IAP y validación de recibos propia.
- PayPal (opcional): crea una app y dos planes de suscripción (5 USD/mes, 20 USD/año) en PayPal Developer, rellena las variables `PAYPAL_*` y prueba primero en sandbox. El acceso se consulta en vivo a PayPal; tras cancelar se conserva hasta el último fin de periodo conocido. Solo se probó con un PayPal simulado.

## Despliegue gratuito (Render)
`render.yaml` en la raíz del repositorio define el servicio. En Render: New → Blueprint → elige el repositorio, rellena las variables y despliega. Aviso: el plan gratuito duerme tras un rato de inactividad (la primera petición tarda) y su disco es efímero; el servidor se recupera consultando a Stripe/PayPal, pero conviene una base de datos para producción.
