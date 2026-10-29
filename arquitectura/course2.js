window.COURSE.push(
{id:"m5", emoji:"🗄️", title:"Datos y persistencia", summary:"Modelos relacionales y NoSQL, consistencia, caché, particionado, CQRS y event sourcing.",
 practice:"Para una red social, decide qué datos irían en una base relacional, cuáles en una de documentos o clave-valor y cuáles en una caché. Justifica cada elección.",
 lessons:[
 {title:"Modelos de datos", body:[
  "## Bases de datos relacionales",
  "Tablas con esquema fijo, relaciones y **transacciones ACID** (Atomicidad, Consistencia, Aislamiento, Durabilidad). Ideales cuando la integridad de los datos es crítica.",
  "## Bases NoSQL",
  "- **Clave-valor**: acceso muy rápido por clave (sesiones, caché).",
  "- **Documentos**: JSON flexible, buen encaje con agregados (catálogos, perfiles).",
  "- **Columnares**: escrituras masivas y analítica sobre grandes volúmenes.",
  "- **Grafos**: relaciones complejas (recomendaciones, redes sociales).",
  "## Criterios de elección",
  "Piensa en los **patrones de acceso**, la necesidad de transacciones, el volumen y cómo evolucionará el esquema.",
  "- Un **índice** acelera las lecturas pero encarece las escrituras y ocupa espacio.",
  "> Empieza por una base relacional salvo que un requisito concreto indique lo contrario."]},
 {title:"Consistencia, escala y CQRS", body:[
  "## Teorema CAP",
  "Ante una **partición de red**, un sistema distribuido debe elegir entre **consistencia** y **disponibilidad**. Muchas bases NoSQL optan por disponibilidad con **consistencia eventual**: las réplicas convergen con el tiempo.",
  "## Escalar datos",
  "- **Réplicas de lectura**: reparten consultas, pueden ir con retraso.",
  "- **Sharding**: divide los datos entre nodos según una clave de partición.",
  "- **Caché**: patrón *cache-aside*: leer de caché, si falla leer de la base y guardar con un **TTL**. La invalidación es el punto difícil.",
  "## CQRS y Event Sourcing",
  "- **CQRS**: separa el modelo de escritura (comandos) del de lectura (consultas) para optimizar cada uno.",
  "- **Event Sourcing**: en vez de guardar el estado actual, se guarda la **secuencia de eventos**; el estado se reconstruye reproduciéndolos. Da auditoría completa, pero añade complejidad."]}
 ],
 quiz:[
  {q:"ACID es un conjunto de propiedades de...", opts:["Las transacciones en bases de datos","Los contenedores Docker","Los protocolos HTTP","Los patrones de diseño"], a:0, why:"Atomicidad, Consistencia, Aislamiento y Durabilidad."},
  {q:"El teorema CAP indica que ante una partición de red debes elegir entre...", opts:["Velocidad y coste","Consistencia y disponibilidad","Seguridad y usabilidad","Lectura y escritura"], a:1, why:"No se pueden garantizar a la vez consistencia y disponibilidad durante una partición."},
  {q:"¿Qué tipo de base encaja mejor con relaciones complejas como «amigos de amigos»?", opts:["Clave-valor","Columnar","Grafos","Archivos planos"], a:2, why:"Las bases de grafos modelan y recorren relaciones de forma natural."},
  {q:"El sharding consiste en...", opts:["Copiar toda la base en cada nodo","Dividir los datos entre nodos según una clave","Cifrar la base de datos","Comprimir los índices"], a:1, why:"Reparte el volumen de datos y la carga entre varios nodos."},
  {q:"En Event Sourcing, el estado actual se obtiene...", opts:["Leyendo la última fila de una tabla","Reproduciendo la secuencia de eventos","Consultando una caché","Preguntando al usuario"], a:1, why:"Los eventos son la fuente de verdad; el estado es derivado."}
 ],
 cards:[
  ["ACID","Atomicidad, Consistencia, Aislamiento y Durabilidad: propiedades de las transacciones."],
  ["Teorema CAP","En una partición de red hay que elegir entre consistencia y disponibilidad."],
  ["Consistencia eventual","Las réplicas pueden diferir temporalmente pero convergen al mismo valor si no hay nuevas escrituras."],
  ["Sharding","Dividir los datos entre varios nodos usando una clave de partición."],
  ["CQRS","Separar el modelo de escritura (comandos) del de lectura (consultas)."],
  ["Cache-aside","La aplicación consulta la caché; si falla, lee de la base y guarda el resultado con un TTL."]
 ]},

{id:"m6", emoji:"🔌", title:"APIs e integración", summary:"REST, gRPC y GraphQL; mensajería, idempotencia, outbox y sagas.",
 practice:"Diseña la API REST de un sistema de reservas: recursos, verbos, códigos de estado, paginación y qué endpoint necesitaría una clave de idempotencia.",
 lessons:[
 {title:"Estilos de API", body:[
  "## REST",
  "Recursos identificados por URL y manipulados con verbos HTTP: `GET` leer, `POST` crear, `PUT` reemplazar, `PATCH` modificar, `DELETE` borrar. Usa códigos de estado con sentido (200, 201, 400, 401, 404, 409, 500).",
  "## gRPC",
  "Contratos con Protocol Buffers y transporte binario sobre HTTP/2. Muy eficiente y con generación de código; ideal para **comunicación entre servicios internos**.",
  "## GraphQL",
  "El cliente pide exactamente los campos que necesita en una sola consulta. Evita el exceso y el defecto de datos, pero exige cuidar la complejidad de consultas y la caché.",
  "## Buenas prácticas comunes",
  "- **Versionado** para no romper a los clientes (`/v2/` o cabeceras).",
  "- **Paginación** en las colecciones (por cursor o por página).",
  "- **Idempotencia**: repetir una petición produce el mismo resultado. `GET`, `PUT` y `DELETE` lo son; en `POST` se usa una *clave de idempotencia*.",
  "- Contratos documentados (OpenAPI)."]},
 {title:"Mensajería y transacciones distribuidas", body:[
  "## Colas y pub/sub",
  "- **Cola**: cada mensaje lo procesa un solo consumidor (reparto de trabajo).",
  "- **Publicación/suscripción**: cada suscriptor recibe una copia del evento.",
  "## Garantías de entrega",
  "La más común es **al menos una vez** (*at-least-once*): puede haber duplicados, así que los consumidores deben ser **idempotentes**. Los mensajes que fallan repetidamente van a una **dead-letter queue**.",
  "## Outbox",
  "Para no perder eventos, se guarda el evento en una tabla **en la misma transacción** que el cambio de datos y un proceso aparte lo publica.",
  "## Saga",
  "Sin transacciones distribuidas (2PC), una operación entre servicios se divide en pasos locales con **acciones compensatorias** si algo falla. Puede ser por **coreografía** (eventos) o por **orquestación** (un coordinador).",
  "> Ejemplo: reservar vuelo, hotel y pago; si el pago falla, se cancelan hotel y vuelo."]}
 ],
 quiz:[
  {q:"¿Qué verbo HTTP es idempotente?", opts:["POST siempre","PUT","Ninguno","Solo GET"], a:1, why:"PUT, GET y DELETE son idempotentes; POST normalmente no lo es."},
  {q:"GraphQL destaca porque el cliente...", opts:["No necesita red","Pide exactamente los campos que necesita","Usa solo Protocol Buffers","No requiere esquema"], a:1, why:"Evita pedir de más o de menos y reduce llamadas."},
  {q:"Con entrega «al menos una vez», el consumidor debe ser...", opts:["Idempotente","Síncrono","Monolítico","Stateful"], a:0, why:"Puede recibir duplicados, así que reprocesar un mensaje no debe causar efectos dobles."},
  {q:"El patrón Outbox resuelve...", opts:["La caché desactualizada","Publicar eventos de forma fiable junto al cambio en la base","El versionado de APIs","La paginación"], a:1, why:"El evento se guarda en la misma transacción y se publica después."},
  {q:"Una saga con acciones compensatorias sirve para...", opts:["Cifrar mensajes","Mantener consistencia entre servicios sin transacción distribuida","Acelerar consultas SQL","Generar documentación"], a:1, why:"Cada paso local tiene un paso inverso que deshace sus efectos si algo falla."}
 ],
 cards:[
  ["Idempotencia","Repetir una operación produce el mismo resultado que ejecutarla una vez."],
  ["REST vs. gRPC","REST: recursos sobre HTTP, texto, muy extendido. gRPC: contratos binarios sobre HTTP/2, eficiente entre servicios."],
  ["Dead-letter queue","Cola donde se envían los mensajes que fallan repetidamente para analizarlos aparte."],
  ["Patrón Outbox","Guardar el evento en la misma transacción que el cambio de datos y publicarlo después con un proceso aparte."],
  ["Saga","Secuencia de transacciones locales con acciones compensatorias en caso de fallo."],
  ["Coreografía vs. orquestación","Coreografía: servicios reaccionan a eventos. Orquestación: un coordinador central dirige los pasos."]
 ]},

{id:"m7", emoji:"🛡️", title:"Calidad operativa: escala, resiliencia y seguridad", summary:"Cómo hacer que un sistema aguante carga y fallos, sea seguro y pueda observarse en producción.",
 practice:"Imagina que un servicio externo de pagos responde con lentitud. Define timeouts, política de reintentos, circuit breaker y qué verá el usuario mientras tanto.",
 lessons:[
 {title:"Escalabilidad y resiliencia", body:[
  "## Escalar",
  "- **Vertical**: máquinas más grandes. Simple, con techo y punto único de fallo.",
  "- **Horizontal**: más instancias detrás de un **balanceador de carga**. Requiere servicios **sin estado** (*stateless*): el estado vive en bases de datos o cachés.",
  "## Resiliencia: asumir que todo falla",
  "- **Timeouts**: nunca esperes indefinidamente.",
  "- **Reintentos con backoff exponencial y jitter**, solo en operaciones idempotentes.",
  "- **Circuit breaker**: si un servicio falla mucho, se deja de llamarlo un tiempo para no agravar el problema.",
  "- **Bulkhead**: aislar recursos para que un fallo no hunda todo el sistema.",
  "- **Rate limiting**: limitar peticiones para protegerse de abusos y picos.",
  "- **Degradación elegante**: ofrecer funcionalidad reducida en vez de caer por completo."]},
 {title:"Seguridad y observabilidad", body:[
  "## Seguridad desde el diseño",
  "- **Autenticación** (quién eres) vs. **autorización** (qué puedes hacer). Estándares habituales: OAuth 2.0 y OpenID Connect.",
  "- **Mínimo privilegio**: cada componente o persona solo recibe los permisos imprescindibles.",
  "- **Defensa en profundidad**: varias capas de protección, no una sola barrera.",
  "- Cifrado **en tránsito** (TLS) y **en reposo**; secretos en un gestor, nunca en el repositorio.",
  "- Conoce el **OWASP Top 10** (inyección, control de acceso roto, configuración insegura...).",
  "## Observabilidad",
  "Se apoya en tres señales: **logs** (eventos), **métricas** (números agregados) y **trazas** (el recorrido de una petición entre servicios).",
  "- **SLI**: indicador medido (p. ej. latencia p99).",
  "- **SLO**: objetivo interno sobre ese indicador (p. ej. 99,9 % de peticiones bajo 300 ms).",
  "- **SLA**: compromiso contractual con el cliente.",
  "- **Presupuesto de error**: margen de fallo permitido por el SLO."]}
 ],
 quiz:[
  {q:"Para escalar horizontalmente con facilidad, los servicios deben ser...", opts:["Stateful","Stateless","Monolíticos","Síncronos"], a:1, why:"Sin estado local, cualquier instancia puede atender cualquier petición."},
  {q:"¿Qué hace un circuit breaker?", opts:["Cifra el tráfico","Deja de llamar a un servicio que falla para evitar sobrecargarlo","Balancea la carga","Genera logs"], a:1, why:"Corta las llamadas temporalmente y permite que el servicio se recupere."},
  {q:"Los reintentos deberían usar...", opts:["Intervalos fijos de 1 ms","Backoff exponencial con jitter","Reintentos infinitos sin pausa","Nunca deben usarse"], a:1, why:"Espaciar y aleatorizar los reintentos evita tormentas de peticiones."},
  {q:"¿Cuál es el principio de mínimo privilegio?", opts:["Dar permisos de administrador por defecto","Conceder solo los permisos estrictamente necesarios","Compartir contraseñas en equipo","Desactivar la autenticación en entornos internos"], a:1, why:"Limita el daño posible si una cuenta o componente se compromete."},
  {q:"Los tres pilares clásicos de la observabilidad son...", opts:["Logs, métricas y trazas","CPU, RAM y disco","Dev, QA y Prod","Lectura, escritura y borrado"], a:0, why:"Cada señal responde a preguntas distintas sobre el comportamiento del sistema."}
 ],
 cards:[
  ["Escalado horizontal vs. vertical","Horizontal: añadir más instancias. Vertical: usar una máquina más potente."],
  ["Circuit breaker","Patrón que corta temporalmente las llamadas a un servicio que falla para dejarlo recuperarse."],
  ["Backoff exponencial con jitter","Reintentos con esperas crecientes y aleatorizadas para evitar picos sincronizados."],
  ["Autenticación vs. autorización","Autenticación: verificar quién eres. Autorización: decidir qué puedes hacer."],
  ["Tres pilares de la observabilidad","Logs, métricas y trazas distribuidas."],
  ["SLI, SLO y SLA","SLI: indicador medido. SLO: objetivo interno. SLA: compromiso contractual con consecuencias."]
 ]},

{id:"m8", emoji:"🚀", title:"Entrega y evolución", summary:"CI/CD, contenedores, infraestructura como código, métricas DORA y cómo evolucionar una arquitectura sin reescribirla.",
 practice:"Elige un monolito que conozcas y propón un plan de tres pasos con Strangler Fig para extraer un módulo, incluyendo cómo medirías que el cambio salió bien.",
 lessons:[
 {title:"CI/CD, contenedores e infraestructura como código", body:[
  "## Integración y entrega continuas",
  "- **CI**: integrar cambios con frecuencia y validarlos automáticamente (compilación, pruebas, análisis).",
  "- **CD**: mantener el software siempre listo para desplegar, o desplegarlo automáticamente.",
  "- Estrategias de despliegue: **blue/green** (dos entornos y cambio de tráfico), **canary** (un porcentaje pequeño de usuarios primero) y **feature flags** (activar funciones sin redesplegar).",
  "## Contenedores y orquestación",
  "**Docker** empaqueta la app con sus dependencias para que se ejecute igual en todas partes. **Kubernetes** orquesta contenedores: despliegue, escalado y recuperación automática.",
  "## Infraestructura como código",
  "Definir la infraestructura en archivos versionados (Terraform, CloudFormation) permite entornos reproducibles y revisables.",
  "## Métricas DORA",
  "Frecuencia de despliegue, plazo de entrega de cambios, tasa de fallos en cambios y tiempo de recuperación."]},
 {title:"Evolución, deuda técnica y revisión", body:[
  "Una arquitectura no se termina: **evoluciona**. El objetivo es poder cambiar de rumbo sin pagar un precio desmedido.",
  "## Deuda técnica",
  "Atajos que aceleran hoy y cobran intereses mañana. Se gestiona haciéndola visible, priorizándola y pagándola de forma continua con **refactorización**.",
  "## Estrategias de cambio",
  "- **Strangler Fig**: se construye lo nuevo alrededor de lo viejo y se redirige el tráfico poco a poco hasta retirarlo.",
  "- **Fitness functions**: comprobaciones automáticas que protegen características de la arquitectura (p. ej. «el dominio no importa la capa web»).",
  "- Reescribir desde cero rara vez compensa: es lento, arriesgado y pierde conocimiento acumulado.",
  "## Lista de revisión de una arquitectura",
  "- ¿Qué atributos de calidad son prioritarios y cómo se miden?",
  "- ¿Dónde están las fronteras y quién es dueño de cada dato?",
  "- ¿Qué pasa cuando falla cada dependencia?",
  "- ¿Se puede desplegar, observar y revertir con seguridad?",
  "- ¿Están registradas las decisiones y su porqué?"]}
 ],
 quiz:[
  {q:"En un despliegue canary...", opts:["Se apaga todo el sistema","Se expone la nueva versión a un pequeño porcentaje de usuarios primero","Se cambia de lenguaje","Se despliega solo de noche"], a:1, why:"Permite detectar problemas con impacto limitado antes de extender el cambio."},
  {q:"Infraestructura como código permite...", opts:["Entornos reproducibles y versionados","Eliminar las pruebas","Evitar usar la nube","Escribir menos documentación de negocio"], a:0, why:"La infraestructura se define en archivos revisables, igual que el software."},
  {q:"El patrón Strangler Fig consiste en...", opts:["Reescribir todo de una vez","Reemplazar un sistema antiguo gradualmente redirigiendo el tráfico a piezas nuevas","Duplicar la base de datos","Eliminar la documentación"], a:1, why:"Permite migrar sin un «big bang» arriesgado."},
  {q:"¿Cuál es una métrica DORA?", opts:["Líneas de código por día","Frecuencia de despliegue","Número de commits por persona","Tamaño del repositorio"], a:1, why:"Las cuatro: frecuencia de despliegue, plazo de entrega, tasa de fallos y tiempo de recuperación."},
  {q:"Una fitness function arquitectónica es...", opts:["Un ejercicio para el equipo","Una comprobación automática que protege una característica de la arquitectura","Un tipo de base de datos","Un patrón de diseño creacional"], a:1, why:"Evita que la arquitectura se degrade sin que nadie lo note."}
 ],
 cards:[
  ["CI vs. CD","CI: integrar y validar cambios continuamente. CD: mantener el software listo para desplegar o desplegarlo automáticamente."],
  ["Blue/green","Dos entornos idénticos; se cambia el tráfico del actual (blue) al nuevo (green) de una vez."],
  ["Despliegue canary","Liberar primero a un porcentaje pequeño de usuarios para detectar problemas pronto."],
  ["Métricas DORA","Frecuencia de despliegue, plazo de entrega, tasa de fallos en cambios y tiempo de recuperación."],
  ["Strangler Fig","Migración gradual: lo nuevo crece alrededor de lo viejo hasta reemplazarlo."],
  ["Deuda técnica","Atajos de diseño que aceleran hoy pero generan costes futuros de mantenimiento."]
 ]}
);
