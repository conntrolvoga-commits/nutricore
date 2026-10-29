window.COURSE = [
{id:"m1", emoji:"🏛️", title:"Fundamentos de la arquitectura", summary:"Qué es una arquitectura, qué atributos de calidad persigue y cómo se documentan las decisiones.",
 practice:"Elige una app que uses a diario (banca, mensajería, reparto). Escribe sus tres atributos de calidad más críticos, ordénalos y explica qué sacrificarías si hubiera que elegir.",
 lessons:[
 {title:"¿Qué es la arquitectura de software?", body:[
  "La **arquitectura de software** es la estructura de alto nivel de un sistema: sus componentes, las relaciones entre ellos y los principios que guían su diseño y su evolución.",
  "## Lo que la distingue del diseño detallado",
  "- Agrupa las decisiones **difíciles de cambiar** después (lenguaje principal, estilo, base de datos, límites entre módulos).",
  "- Se evalúa por sus efectos en los **atributos de calidad**: rendimiento, seguridad, mantenibilidad...",
  "- Es un acuerdo del equipo, no solo un dibujo del arquitecto.",
  "## Leyes que conviene recordar",
  "- **Ley de Conway**: un sistema refleja la estructura de comunicación de la organización que lo construye.",
  "- **Todo es un trade-off**: no existe la mejor arquitectura, solo la que mejor encaja con tus prioridades.",
  "- El **porqué** de una decisión importa más que el **cómo**.",
  "> Una buena arquitectura no elimina el cambio: lo hace barato."]},
 {title:"Atributos de calidad", body:[
  "Los requisitos **funcionales** dicen qué hace el sistema. Los **atributos de calidad** (requisitos no funcionales) dicen qué tan bien lo hace, y son los que más condicionan la arquitectura.",
  "## Los más habituales",
  "- **Rendimiento**: latencia y throughput bajo una carga dada.",
  "- **Escalabilidad**: capacidad de crecer en usuarios o datos sin rediseñar.",
  "- **Disponibilidad**: porcentaje de tiempo operativo. 99,9 % son unas 8,76 h de caída al año; 99,99 % son unos 52 min.",
  "- **Mantenibilidad y testabilidad**: lo fácil que es cambiar y verificar el sistema.",
  "- **Seguridad**, **desplegabilidad** y **observabilidad**.",
  "## Priorizar",
  "No puedes maximizarlos todos. Un buen ejercicio es elegir los **tres atributos principales** del sistema y aceptar conscientemente los costes en los demás.",
  "> Ejemplo: un sistema de pagos prioriza consistencia y seguridad sobre latencia mínima."]},
 {title:"Decisiones y documentación (ADR y C4)", body:[
  "Documentar la arquitectura evita que el conocimiento viva solo en la cabeza de alguien. Dos herramientas ligeras bastan para empezar.",
  "## ADR: Architecture Decision Record",
  "Un documento corto por decisión importante, guardado junto al código. Estructura típica:",
  "- **Título** y **estado** (propuesta, aceptada, reemplazada).",
  "- **Contexto**: la situación y las fuerzas en juego.",
  "- **Decisión**: lo que se eligió.",
  "- **Consecuencias**: ventajas y costes aceptados.",
  "## Modelo C4",
  "Cuatro niveles de zoom para dibujar un sistema: **Contexto** (el sistema y sus usuarios), **Contenedores** (apps, bases de datos), **Componentes** y **Código**.",
  "@code\n# ADR-007: Usar PostgreSQL como base principal\nEstado: Aceptada\nContexto: necesitamos transacciones ACID para pedidos.\nDecisión: PostgreSQL gestionado en la nube.\nConsecuencias: escalado de escritura más limitado; el equipo ya lo conoce."]}
 ],
 quiz:[
  {q:"¿Cuál describe mejor las decisiones arquitectónicas?", opts:["Las que se toman al nombrar variables","Las difíciles y costosas de cambiar más adelante","Las que decide solo el jefe de proyecto","Las que afectan únicamente a la interfaz"], a:1, why:"La arquitectura agrupa las decisiones estructurales de alto impacto que cuestan mucho revertir."},
  {q:"La Ley de Conway afirma que...", opts:["Los sistemas reflejan la estructura de comunicación de la organización","Más desarrolladores aceleran siempre un proyecto","El código debe comentarse en cada línea","Los microservicios siempre escalan mejor"], a:0, why:"La estructura del sistema tiende a copiar la de los equipos que lo construyen."},
  {q:"¿Cuál es un atributo de calidad y no un requisito funcional?", opts:["El usuario puede restablecer su contraseña","El sistema genera facturas en PDF","El sistema responde en menos de 200 ms","El usuario puede editar su perfil"], a:2, why:"Un límite de latencia habla de cómo funciona el sistema, no de qué hace."},
  {q:"Una disponibilidad del 99,99 % equivale aproximadamente a...", opts:["8,76 horas de caída al año","52 minutos de caída al año","1 semana de caída al año","5 segundos de caída al año"], a:1, why:"99,99 % deja un 0,01 % de tiempo caído: unos 52,6 minutos al año."},
  {q:"¿Qué NO forma parte de un ADR típico?", opts:["Contexto","Decisión","Consecuencias","Código fuente completo de la solución"], a:3, why:"Un ADR es breve: contexto, decisión y consecuencias. El código vive en el repositorio."}
 ],
 cards:[
  ["¿Qué es la arquitectura de software?","La estructura de alto nivel de un sistema: componentes, relaciones y principios que guían su diseño y evolución."],
  ["Ley de Conway","Un sistema refleja la estructura de comunicación de la organización que lo construye."],
  ["Atributo de calidad","Requisito no funcional que describe qué tan bien opera el sistema: rendimiento, seguridad, mantenibilidad, etc."],
  ["¿Qué contiene un ADR?","Título, estado, contexto, decisión y consecuencias."],
  ["Niveles del modelo C4","Contexto, Contenedores, Componentes y Código."],
  ["Primera ley de la arquitectura","Todo es un trade-off: cada decisión gana algo y sacrifica algo."]
 ]},

{id:"m2", emoji:"📐", title:"Principios de diseño", summary:"SOLID y los principios que mantienen el código flexible: cohesión, acoplamiento, DRY, KISS y YAGNI.",
 practice:"Toma una clase de tu código que haga demasiadas cosas. Identifica qué responsabilidades mezcla y proponla dividida en dos o tres clases con una sola razón de cambio cada una.",
 lessons:[
 {title:"SOLID", body:[
  "Cinco principios de diseño orientado a objetos que reducen el coste de cambiar el código.",
  "- **S · Responsabilidad única**: una clase debe tener una sola razón para cambiar.",
  "- **O · Abierto/cerrado**: abierto a extensión, cerrado a modificación; se añade comportamiento nuevo sin editar el código estable.",
  "- **L · Sustitución de Liskov**: una subclase debe poder usarse donde se espera la clase base sin romper nada.",
  "- **I · Segregación de interfaces**: mejor varias interfaces pequeñas que una enorme que obliga a implementar lo que no se usa.",
  "- **D · Inversión de dependencias**: los módulos de alto nivel dependen de abstracciones, no de detalles concretos.",
  "## Ejemplo de inversión de dependencias",
  "@code\ninterface Notificador { enviar(msg: string): void }\n\nclass Pedidos {\n  constructor(private notificador: Notificador) {}\n  confirmar() { this.notificador.enviar('Pedido confirmado'); }\n}\n// Se puede inyectar EmailNotificador, SmsNotificador o un doble de pruebas."]},
 {title:"Cohesión, acoplamiento y otros principios", body:[
  "## Alta cohesión, bajo acoplamiento",
  "- **Cohesión**: lo bien que encajan entre sí las partes de un módulo. Queremos que sea **alta**.",
  "- **Acoplamiento**: cuánto depende un módulo de otros. Queremos que sea **bajo**.",
  "## Principios de uso diario",
  "- **DRY** (Don't Repeat Yourself): cada conocimiento tiene una única representación. No significa unir código que solo se parece por casualidad.",
  "- **KISS**: la solución más simple que resuelve el problema.",
  "- **YAGNI**: no construyas lo que aún no necesitas.",
  "- **Ley de Demeter**: habla solo con tus vecinos directos, evita cadenas como `a.b.c.d()`.",
  "- **Composición sobre herencia**: combina objetos pequeños antes que crear jerarquías profundas.",
  "- **Separación de responsabilidades**: cada parte del sistema trata un solo asunto.",
  "> La duplicación accidental es más barata que una mala abstracción."]}
 ],
 quiz:[
  {q:"El principio de responsabilidad única dice que una clase...", opts:["Solo debe tener un método","Debe tener una única razón para cambiar","Solo puede heredar de una clase","Debe ser inmutable"], a:1, why:"Se trata de razones de cambio, no del número de métodos."},
  {q:"¿Qué principio busca depender de abstracciones y no de implementaciones concretas?", opts:["Open/Closed","Liskov","Inversión de dependencias","KISS"], a:2, why:"Es la D de SOLID: los detalles dependen de las abstracciones."},
  {q:"Queremos que un módulo tenga...", opts:["Baja cohesión y alto acoplamiento","Alta cohesión y bajo acoplamiento","Alta cohesión y alto acoplamiento","Baja cohesión y bajo acoplamiento"], a:1, why:"Partes muy relacionadas dentro del módulo y pocas dependencias hacia fuera."},
  {q:"YAGNI recomienda...", opts:["Documentar todo","No implementar funcionalidades hasta que se necesiten","Reutilizar siempre código existente","Usar patrones en cada clase"], a:1, why:"Evita complejidad especulativa: construye lo que hoy hace falta."},
  {q:"Una subclase que lanza error al usar un método heredado viola...", opts:["Liskov","DRY","Segregación de interfaces","Demeter"], a:0, why:"Liskov exige que las subclases sean sustituibles por su clase base sin romper el comportamiento esperado."}
 ],
 cards:[
  ["¿Qué significa SOLID?","Responsabilidad única, Abierto/cerrado, Sustitución de Liskov, Segregación de interfaces e Inversión de dependencias."],
  ["Principio de responsabilidad única","Una clase debe tener una sola razón para cambiar."],
  ["Inversión de dependencias","Los módulos de alto nivel dependen de abstracciones, no de implementaciones concretas."],
  ["Cohesión vs. acoplamiento","Cohesión: relación interna de un módulo (alta es buena). Acoplamiento: dependencia entre módulos (bajo es bueno)."],
  ["DRY","Cada pieza de conocimiento debe tener una representación única y sin ambigüedad en el sistema."],
  ["YAGNI","You Aren't Gonna Need It: no construyas funcionalidad hasta que haga falta."]
 ]},

{id:"m3", emoji:"🧱", title:"Estilos arquitectónicos", summary:"Capas, monolitos, microservicios, eventos, hexagonal y DDD: cuándo conviene cada uno.",
 practice:"Dibuja los bloques de un e-commerce como monolito modular y luego como microservicios. Anota qué problema resuelve cada versión y cuál cuesta más operar.",
 lessons:[
 {title:"Capas y monolitos", body:[
  "## Arquitectura en capas",
  "Divide el sistema en capas con responsabilidades claras, normalmente **presentación → lógica de negocio → acceso a datos**. Cada capa solo habla con la inmediatamente inferior.",
  "## Monolito",
  "Todo se despliega como una sola unidad. Es **simple de desarrollar, probar y desplegar**, y suficiente para muchos productos. Su riesgo es crecer sin límites internos y convertirse en una «bola de barro».",
  "## Monolito modular",
  "Un único despliegue, pero con módulos de **fronteras estrictas** y dependencias controladas. Da gran parte de las ventajas de los microservicios sin su complejidad operativa.",
  "> Regla práctica: empieza por un monolito modular y extrae servicios cuando un dolor concreto lo justifique."]},
 {title:"Microservicios y arquitectura orientada a eventos", body:[
  "## Microservicios",
  "Servicios pequeños, **desplegables de forma independiente**, cada uno dueño de sus datos y organizado alrededor de una capacidad de negocio.",
  "- **Ventajas**: equipos autónomos, escalado selectivo, fallos más aislados, libertad tecnológica.",
  "- **Costes**: complejidad de red, consistencia distribuida, observabilidad, despliegue y pruebas más difíciles.",
  "## Orientada a eventos (EDA)",
  "Los componentes se comunican emitiendo **eventos** (algo ya ocurrido) a través de un broker. Los productores no conocen a los consumidores: bajo acoplamiento y buena escalabilidad, a cambio de más dificultad para seguir el flujo completo.",
  "## Serverless",
  "Funciones que ejecuta el proveedor bajo demanda. Se paga por uso y no se gestionan servidores, pero hay límites de ejecución, arranques en frío y dependencia del proveedor."]},
 {title:"Hexagonal, Clean y DDD", body:[
  "## Hexagonal (puertos y adaptadores)",
  "El **núcleo de negocio** no conoce la tecnología. Se comunica con el exterior mediante **puertos** (interfaces) y los **adaptadores** (HTTP, base de datos, colas) los implementan.",
  "## Clean Architecture",
  "Capas concéntricas con la **regla de dependencia**: las dependencias de código fuente apuntan siempre hacia dentro, hacia el dominio. Frameworks y bases de datos quedan en el borde.",
  "## Domain-Driven Design (DDD)",
  "- **Lenguaje ubicuo**: el mismo vocabulario entre negocio y código.",
  "- **Bounded context**: frontera dentro de la cual un modelo y sus términos tienen un significado preciso.",
  "- **Agregado**: grupo de objetos tratado como una unidad de consistencia, con una raíz de acceso.",
  "> Los bounded contexts son un buen criterio para decidir dónde cortar los microservicios."]}
 ],
 quiz:[
  {q:"¿Qué ofrece un monolito modular?", opts:["Despliegue único con fronteras internas estrictas","Un servicio por función","Ausencia total de módulos","Base de datos distinta por clase"], a:0, why:"Combina la simplicidad de un despliegue con módulos desacoplados."},
  {q:"Un coste típico de los microservicios es...", opts:["Imposibilidad de escalar","Mayor complejidad operativa y de comunicación","Acoplamiento obligatorio entre equipos","No se pueden probar"], a:1, why:"Aportan autonomía a cambio de red, observabilidad y consistencia distribuida."},
  {q:"En arquitectura hexagonal, un «puerto» es...", opts:["Una base de datos","Una interfaz que define cómo interactúa el núcleo con el exterior","Un balanceador de carga","Una librería de UI"], a:1, why:"Los puertos son contratos del dominio; los adaptadores los implementan."},
  {q:"La regla de dependencia de Clean Architecture dice que...", opts:["Las dependencias apuntan hacia fuera","Las dependencias apuntan hacia el dominio (hacia dentro)","Todo depende de la base de datos","No puede haber dependencias"], a:1, why:"El dominio no depende de frameworks ni de infraestructura."},
  {q:"Un bounded context es...", opts:["Un tipo de base de datos","Una frontera donde un modelo y su lenguaje tienen significado preciso","Un patrón de diseño creacional","Un servidor de aplicaciones"], a:1, why:"Delimita el modelo de dominio y evita ambigüedades de términos."}
 ],
 cards:[
  ["Arquitectura en capas","Organiza el sistema en capas (presentación, negocio, datos) donde cada capa depende solo de la inferior."],
  ["Monolito modular","Un solo despliegue con módulos de fronteras estrictas y bajo acoplamiento."],
  ["Ventaja y coste de los microservicios","Ventaja: autonomía y escalado selectivo. Coste: complejidad operativa y de consistencia distribuida."],
  ["Evento vs. comando","Un evento describe algo que ya ocurrió; un comando pide que ocurra algo."],
  ["Arquitectura hexagonal","Núcleo de negocio aislado que se comunica por puertos (interfaces) implementados por adaptadores."],
  ["Bounded context (DDD)","Frontera dentro de la cual un modelo de dominio y su lenguaje tienen un significado único."]
 ]},

{id:"m4", emoji:"🧩", title:"Patrones de diseño", summary:"Los patrones clásicos creacionales, estructurales y de comportamiento, y patrones de aplicación habituales.",
 practice:"Busca en tu código un bloque de `if/else` o `switch` que elija un algoritmo. Reescríbelo con el patrón Strategy y compara la facilidad de añadir un caso nuevo.",
 lessons:[
 {title:"Patrones creacionales y estructurales", body:[
  "Los **patrones de diseño** son soluciones probadas a problemas recurrentes. Son un vocabulario común, no recetas que haya que aplicar siempre.",
  "## Creacionales: cómo se crean los objetos",
  "- **Factory Method / Abstract Factory**: delegan la creación para no depender de clases concretas.",
  "- **Builder**: construye objetos complejos paso a paso.",
  "- **Singleton**: una única instancia global. Úsalo con cuidado: dificulta las pruebas y oculta dependencias.",
  "## Estructurales: cómo se componen los objetos",
  "- **Adapter**: adapta una interfaz a otra que el cliente espera.",
  "- **Decorator**: añade comportamiento a un objeto dinámicamente envolviéndolo.",
  "- **Facade**: ofrece una interfaz simple sobre un subsistema complejo.",
  "- **Proxy**: sustituye a otro objeto para controlar su acceso (caché, permisos, carga diferida)."]},
 {title:"Patrones de comportamiento y de aplicación", body:[
  "## Comportamiento: cómo colaboran los objetos",
  "- **Strategy**: intercambia algoritmos en tiempo de ejecución.",
  "- **Observer**: los observadores se suscriben y reciben avisos cuando cambia un sujeto.",
  "- **Command**: encapsula una petición como objeto (deshacer, colas de tareas).",
  "- **State**: el comportamiento cambia según el estado interno.",
  "- **Template Method**: define el esqueleto de un algoritmo y deja pasos a las subclases.",
  "## Patrones de aplicación",
  "- **Repository**: abstrae el acceso a datos como si fuera una colección de objetos del dominio.",
  "- **Unit of Work**: agrupa cambios en una sola transacción.",
  "- **Inyección de dependencias**: los objetos reciben sus colaboradores en lugar de crearlos.",
  "@code\nclass Carrito {\n  constructor(private descuento: EstrategiaDescuento) {}\n  total(items: Item[]) {\n    return this.descuento.aplicar(sumar(items));\n  }\n}\n// EstrategiaDescuento: SinDescuento, Navidad, Cliente VIP..."]}
 ],
 quiz:[
  {q:"¿Qué patrón añade comportamiento a un objeto envolviéndolo?", opts:["Adapter","Decorator","Singleton","Observer"], a:1, why:"Decorator envuelve al objeto original y suma funcionalidad sin modificarlo."},
  {q:"¿Qué patrón conviene para cambiar entre distintos algoritmos de cálculo?", opts:["Strategy","Facade","Builder","Proxy"], a:0, why:"Strategy encapsula cada algoritmo tras una interfaz común e intercambiable."},
  {q:"¿Cuál es una crítica habitual al Singleton?", opts:["Consume demasiada red","Dificulta las pruebas y oculta dependencias","Solo funciona en Java","No permite ningún estado"], a:1, why:"El estado global compartido complica las pruebas y el razonamiento sobre el código."},
  {q:"El patrón Observer sirve para...", opts:["Crear objetos paso a paso","Notificar automáticamente a los suscriptores cuando cambia algo","Ocultar un subsistema complejo","Adaptar interfaces"], a:1, why:"Define una relación uno-a-muchos entre un sujeto y sus observadores."},
  {q:"Repository es un patrón que...", opts:["Gestiona despliegues","Abstrae el acceso a datos como una colección del dominio","Cifra contraseñas","Equilibra la carga"], a:1, why:"Aísla el dominio de los detalles de persistencia."}
 ],
 cards:[
  ["Strategy","Patrón que encapsula algoritmos intercambiables detrás de una interfaz común."],
  ["Observer","Los observadores se suscriben a un sujeto y reciben notificación cuando cambia su estado."],
  ["Decorator","Añade responsabilidades a un objeto dinámicamente envolviéndolo con otro."],
  ["Adapter vs. Facade","Adapter convierte una interfaz en otra; Facade simplifica el uso de un subsistema."],
  ["Factory Method","Delega la creación de objetos en un método para no depender de clases concretas."],
  ["Inyección de dependencias","Técnica donde un objeto recibe sus colaboradores desde fuera en lugar de crearlos."]
 ]}
];
