<?php
// 1) Copia este archivo como  config.php  (en esta misma carpeta api/) y llena tus datos.
// 2) config.php NUNCA se publica ni se comparte: contiene tus llaves secretas.
// Deja vacía una pasarela para desactivarla. Con las dos llenas, el cliente elige cuál usar.
return [
    'site_url'    => 'https://www.mosaicca.mx',
    'owner_email' => '',          // aquí te llega el aviso de cada pedido pagado
    'owner_whatsapp' => '528147902474',

    // Mercado Pago (tarjeta, OXXO, SPEI): Credenciales de producción -> Access Token
    'mp_access_token'   => '',
    'mp_webhook_secret' => '',    // opcional pero recomendado: Webhooks -> clave secreta

    // Conekta (tarjeta, OXXO, SPEI): Llave privada
    'conekta_private_key' => '',

    // Dónde se guardan los pedidos. Vacío = automático (fuera de public_html, lo más seguro). No lo cambies si no sabes.
    'data_dir' => '',

    // Envío que se cobra (MXN): base + 25 por cada kg adicional al primero.
    'shipping' => [
        'Estafeta' => ['service' => 'Terrestre', 'base' => 99],
        'FedEx'    => ['service' => 'Económico', 'base' => 119],
        'DHL'      => ['service' => 'Express',   'base' => 169],
    ],
    'shipping_extra_per_kg' => 25,

    // Pedido de mayoreo en línea (/mayoreo.html). Apagado hasta que confirmes que los descuentos dejan margen sobre tu costo.
    'mayoreo' => [
        'enabled'   => false,
        'min_order' => 1500,                                   // pedido mínimo, a precio público (MXN)
        'tiers'     => [[1500, 0.40], [5000, 0.45], [10000, 0.50]],   // [monto a precio público, descuento]
        'banco' => '', 'clabe' => '', 'titular' => '',         // datos para el pago por transferencia SPEI
        'terms' => 'Primer pedido con pago del 100% por transferencia. Envío por cotizar.',
    ],
];
