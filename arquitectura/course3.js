window.COURSE.push(
{id:"m9", emoji:"🧪", title:"Pruebas y calidad del código", summary:"Estrategia de pruebas, pirámide de testing, pruebas de contrato y cómo la arquitectura facilita (o dificulta) probar.",
 practice:"Para un servicio de pedidos con base de datos y un proveedor de pagos externo, decide qué pruebas serían unitarias, de integración y de contrato, y cuáles dobles de prueba usarías en cada una.",
 lessons:[
 {title:"La pirámide de pruebas", body:[
  "Una buena arquitectura hace que el código sea **fácil de probar**. Y una buena estrategia de pruebas da confianza para cambiar la arquitectura.",
  "## Niveles de prueba",
  "- **Unitarias**: una unidad de lógica aislada. Rápidas, numerosas y baratas.",
  "- **De integración**: varios componentes juntos, p. ej. el código con una base de datos real. Más lentas y menos numerosas.",
  "- **End-to-end (E2E)**: recorren el sistema completo como un usuario. Valiosas pero lentas y frágiles; pocas y para los flujos críticos.",
  "## La pirámide",
  "Muchas pruebas unitarias en la base, menos de integración en medio y muy pocas E2E arriba. Invertirla (el «cono de helado») produce suites lentas y poco fiables.",
  "## Dobles de prueba",
  "- **Stub**: devuelve respuestas fijas.",
  "- **Mock**: verifica que se hicieron ciertas llamadas.",
  "- **Fake**: implementación simple y funcional (una base en memoria).",
  "> La inversión de dependencias es lo que permite sustituir una dependencia real por un doble en las pruebas."]},
 {title:"Pruebas en arquitecturas distribuidas", body:[
  "Cuando hay varios servicios, probar todo en conjunto es lento y poco determinista. Hay técnicas para mantener la confianza sin ese coste.",
  "## Pruebas de contrato",
  "Verifican que un **consumidor** y un **proveedor** de una API se ponen de acuerdo en el formato de las peticiones y respuestas, sin levantar ambos sistemas completos. Un cambio que rompe el contrato falla en la integración continua, no en producción.",
  "## Otras prácticas",
  "- **Pruebas en producción controladas**: despliegues canary y feature flags con monitorización.",
  "- **Ingeniería del caos**: provocar fallos a propósito para comprobar la resiliencia.",
  "- **Pruebas de carga y rendimiento**: validan los atributos de calidad con cifras reales.",
  "- **Fitness functions**: pruebas automáticas de propiedades arquitectónicas.",
  "## Calidad del código",
  "Revisiones de código, análisis estático, cobertura como indicador (no como meta) y **deuda técnica** visible en el backlog.",
  "> Una cobertura del 100 % no garantiza buenas pruebas: mide líneas ejecutadas, no comportamientos verificados."]}
 ],
 quiz:[
  {q:"En la pirámide de pruebas, ¿cuál debería ser el nivel más numeroso?", opts:["End-to-end","Unitarias","Manuales","De carga"], a:1, why:"Las unitarias son rápidas y baratas, por eso forman la base."},
  {q:"¿Qué es un fake como doble de prueba?", opts:["Una respuesta fija","Una implementación simple y funcional, como una base de datos en memoria","Un verificador de llamadas","Un error simulado"], a:1, why:"Un fake funciona de verdad pero de forma simplificada."},
  {q:"Las pruebas de contrato sirven para...", opts:["Medir la carga del servidor","Comprobar que consumidor y proveedor de una API coinciden en el formato de intercambio","Revisar el estilo del código","Probar la interfaz gráfica"], a:1, why:"Detectan cambios incompatibles sin necesidad de levantar todo el sistema."},
  {q:"El «cono de helado» en testing se refiere a...", opts:["Muchas pruebas E2E y pocas unitarias","Muchas pruebas unitarias y pocas E2E","No tener pruebas","Probar solo en producción"], a:0, why:"Es el antipatrón: suites lentas, frágiles y costosas de mantener."},
  {q:"La ingeniería del caos consiste en...", opts:["Escribir código sin planificar","Provocar fallos controlados para validar la resiliencia","Eliminar los entornos de prueba","Hacer despliegues sin aviso"], a:1, why:"Se descubren debilidades antes de que las encuentre un fallo real."}
 ],
 cards:[
  ["Pirámide de pruebas","Muchas pruebas unitarias, menos de integración y muy pocas end-to-end."],
  ["Stub, mock y fake","Stub: respuestas fijas. Mock: verifica llamadas. Fake: implementación simple y funcional."],
  ["Prueba de contrato","Verifica que consumidor y proveedor de una API cumplen el mismo acuerdo de formato."],
  ["Ingeniería del caos","Provocar fallos controlados a propósito para comprobar la resiliencia del sistema."],
  ["Prueba end-to-end","Recorre el sistema completo como lo haría un usuario; valiosa pero lenta y frágil."],
  ["Cobertura de código","Porcentaje de líneas ejecutadas por las pruebas; es un indicador, no una garantía de calidad."]
 ]},

{id:"m10", emoji:"☁️", title:"Nube y sistemas distribuidos", summary:"Modelos de nube, falacias de la computación distribuida, multirregión, costes y decisiones de plataforma.",
 practice:"Elige un sistema que hoy esté en un solo servidor y diseña su paso a la nube: qué servicios gestionados usarías, cómo repartirías zonas de disponibilidad y qué estimarías de coste mensual.",
 lessons:[
 {title:"Modelos de nube y patrones cloud", body:[
  "## IaaS, PaaS, SaaS",
  "- **IaaS**: máquinas virtuales, redes y discos; tú gestionas casi todo el software.",
  "- **PaaS**: plataforma gestionada para desplegar aplicaciones sin administrar servidores.",
  "- **SaaS**: software completo como servicio.",
  "## Aplicaciones cloud-native",
  "Basadas en las prácticas de **The Twelve-Factor App**: configuración en el entorno, procesos sin estado, logs como flujo de eventos, dependencias declaradas, paridad entre entornos.",
  "## Disponibilidad en la nube",
  "- **Zonas de disponibilidad (AZ)**: centros de datos aislados dentro de una región. Repartir instancias entre varias AZ sobrevive a la caída de una.",
  "- **Multirregión**: protege contra fallos regionales, pero añade complejidad y coste de datos.",
  "- **Servicios gestionados**: bases de datos, colas, caché... delegan la operación al proveedor.",
  "## Evitar el lock-in a ciegas",
  "La dependencia del proveedor es un trade-off: los servicios propios dan productividad, la portabilidad cuesta esfuerzo. Decídelo con un ADR."]},
 {title:"Computación distribuida y costes", body:[
  "## Las falacias de la computación distribuida",
  "Supuestos falsos que causan fallos: la red es fiable, la latencia es cero, el ancho de banda es infinito, la red es segura, la topología no cambia, hay un único administrador, el coste de transporte es cero y la red es homogénea.",
  "## Consecuencias de diseño",
  "- Usa **timeouts**, reintentos idempotentes y **circuit breakers**.",
  "- Asume **consistencia eventual** y relojes que no coinciden.",
  "- Diseña operaciones que toleren **duplicados y desorden**.",
  "## FinOps: el coste como atributo de calidad",
  "En la nube se paga por uso, así que la arquitectura determina la factura.",
  "- Etiqueta recursos para saber quién gasta qué.",
  "- Dimensiona bien, apaga lo que no se usa y aprovecha el autoescalado.",
  "- Revisa transferencias de datos entre regiones y salidas a Internet, que suelen sorprender.",
  "> Una arquitectura excelente que no puedes pagar no es una buena arquitectura."]}
 ],
 quiz:[
  {q:"En un modelo PaaS, ¿qué gestionas principalmente?", opts:["El hardware físico","Tu aplicación y sus datos, no los servidores","El sistema operativo y la red","Nada, todo lo gestiona el proveedor"], a:1, why:"La plataforma se encarga de la infraestructura subyacente."},
  {q:"Repartir instancias en varias zonas de disponibilidad sirve para...", opts:["Reducir el coste a cero","Sobrevivir a la caída de un centro de datos","Evitar el uso de balanceadores","Eliminar la necesidad de copias de seguridad"], a:1, why:"Las AZ son centros de datos aislados dentro de una región."},
  {q:"¿Cuál es una de las falacias de la computación distribuida?", opts:["La red es fiable","Los servicios pueden fallar","La latencia no es cero","Las máquinas se averían"], a:0, why:"Las falacias son suposiciones falsas; «la red es fiable» es la primera de ellas."},
  {q:"Según The Twelve-Factor App, la configuración debe guardarse...", opts:["Dentro del código fuente","En el entorno de ejecución","En un archivo binario","En la base de datos de usuarios"], a:1, why:"Así el mismo artefacto se despliega en distintos entornos sin cambios."},
  {q:"FinOps trata el coste como...", opts:["Un problema exclusivo de finanzas","Un atributo de calidad a gestionar de forma continua","Algo irrelevante en la nube","Un asunto que se mira una vez al año"], a:1, why:"Las decisiones de arquitectura influyen directamente en la factura."}
 ],
 cards:[
  ["IaaS, PaaS y SaaS","Infraestructura, plataforma y software como servicio, de más a menos control para el cliente."],
  ["Zona de disponibilidad","Centro de datos aislado dentro de una región cloud; repartir instancias entre varias da tolerancia a fallos."],
  ["Twelve-Factor App","Conjunto de prácticas para apps cloud-native: configuración en el entorno, procesos sin estado, logs como flujos, etc."],
  ["Falacias de la computación distribuida","Supuestos falsos como «la red es fiable» o «la latencia es cero» que provocan fallos."],
  ["FinOps","Práctica de gestionar y optimizar el coste de la nube de forma continua."],
  ["Lock-in","Dependencia de un proveedor que encarece o dificulta migrar; es un trade-off que conviene decidir conscientemente."]
 ]}
);
