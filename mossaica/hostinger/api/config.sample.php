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

    // Envío que se cobra (MXN): base + 25 por cada kg adicional al primero.
    'shipping' => [
        'Estafeta' => ['service' => 'Terrestre', 'base' => 99],
        'FedEx'    => ['service' => 'Económico', 'base' => 119],
        'DHL'      => ['service' => 'Express',   'base' => 169],
    ],
    'shipping_extra_per_kg' => 25,
];
