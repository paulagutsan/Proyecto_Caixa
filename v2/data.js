"use strict";
/* Horizonte · contenido y reglas
   Del primer euro a la primera casa: aprende, invierte, entiende, gana millas y compra tu casa.
   Las rentabilidades de los fondos son estimaciones para calcular valores orientativos; las reglas
   (primera inversión, primer año acompañado, millas) son la propuesta del equipo para CaixaBank AM. */

const RULES = {
    prize: 20,                 // € invertidos a su nombre al superar Fundamentos
    protectCap: 500,           // € protegidos durante el primer año
    protectMonths: 12,
    base: 0.75,                // reparto Base + Antídoto
    antidote: 0.25,
    maxFears: 2,
    examSize: 10,
    examMaxErrors: 2,          // prueba final: se puede fallar poco
    linkedinAge: 16,           // LinkedIn pide 16 años (a comprobar)
    adultAge: 18,
    houseAge: 27,
};

/* Millas de casa: se convierten en una rebaja del diferencial de una hipoteca con CaixaBank */
const MILES = {
    lesson: 10,          // cada tema de Fundamentos
    theory: 100,         // superar la prueba final
    firstOwn: 50,        // tu primer euro propio
    monthOwn: 10,        // cada mes en el que aportas tú
    itv: 50,             // revisión anual
    game: 5,             // un juego al día con datos reales
    streak4: 20,         // cada 4 semanas seguidas con actividad
    giftPer5: 1,         // 1 milla por cada 5 € que te regalan…
    giftMonthCap: 20,    // …con un tope de 20 millas al mes, para que no se pueda «comprar» la rebaja
    perPoint: 25000,     // 25.000 millas = 1 punto porcentual menos de diferencial (250 millas = 0,01)
    maxCut: 0.2,         // rebaja máxima: 0,20 puntos (≈ 16 €/mes en una hipoteca de 160.000 €), como en el modelo económico
};

/* Coste orientativo de los fondos (comisión de gestión de CaixaBank AM, % anual). Se muestra siempre en euros. */
const COST = { fee: 0.9 };
const feeTxt = String(COST.fee).replace(".", ",");

/* Una pregunta cada semana para hablar de dinero en familia (PISA: hablar de dinero en casa con frecuencia mejora la competencia financiera) */
const TALKS = [
    "Pregúntale qué le preocupa de su futuro y si su Antídoto sigue teniendo sentido.",
    "Mirad juntos lo que ha pasado esta semana con su dinero. ¿Qué haría si bajara un 20 %?",
    "Hablad de una meta cercana, como el carné o un viaje, y de cuánto apartar cada semana.",
    "Preguntadle qué es la comisión de un fondo y cuánto paga cada año, en euros.",
    "Contadle cómo fue vuestra primera vez ahorrando para algo grande.",
    "Repasad sus millas de casa: cuántas lleva y qué le falta para el siguiente paso.",
];

/* Valores: los tres de CaixaBank (calidad, confianza y compromiso social, según su web corporativa)
   unidos a los de Horizonte. El último es solo nuestro. */
const VALUES = [
    { cb: "Calidad", hz: "Claridad", t: "Calidad que se entiende",
      p: "Una selección cerrada de fondos de CaixaBank Asset Management, la mayor gestora de fondos de España, explicada sin jerga y con 25 años de datos reales." },
    { cb: "Confianza", hz: "Cercanía", t: "Confianza que se comparte",
      p: `Tu familia aprueba las decisiones importantes hasta los ${RULES.adultAge}, tus datos solo se usan con permiso y tus primeros ${RULES.protectCap} € no pueden perder valor en ${RULES.protectMonths} meses, si no vendes antes.` },
    { cb: "Compromiso social", hz: "Constancia", t: "Un futuro que no depende de tu cartera",
      p: "Aprender a invertir con las mismas reglas para todos: las millas premian tu constancia, nunca cuánto dinero tengas." },
    { cb: "", hz: "Futuro", t: "Mirar lejos",
      p: "Cada paso de hoy suma para tu primera casa. Pensamos a diez años, no a la semana que viene." },
];

/* Menú cerrado de CaixaBank AM (temas, no productos concretos) y rentabilidad anual SIMULADA */
const FUNDS = {
    global:      { name: "Fondo global diversificado", sub: "Miles de empresas de todo el mundo", r: 6.0 },
    tecnologia:  { name: "Tecnología e inteligencia artificial", sub: "Empresas que crean y usan IA", r: 9.0 },
    inmobiliario:{ name: "Inmobiliario cotizado", sub: "Empresas dueñas de viviendas y edificios", r: 3.5 },
    energia:     { name: "Transición energética", sub: "Renovables, redes y almacenamiento", r: 4.0 },
    inflacion:   { name: "Activos contra la inflación", sub: "Bonos ligados a los precios y materias primas", r: 3.0 },
    salud:       { name: "Salud", sub: "Farmacéuticas, hospitales y biotecnología", r: 5.0 },
    movilidad:   { name: "Energía y movilidad", sub: "Petróleo, gas, coche eléctrico y baterías", r: 4.0 },
    infraestructuras: { name: "Infraestructuras", sub: "Carreteras, puentes, trenes y redes", r: 5.0 },
    agua:        { name: "Agua y medio ambiente", sub: "Agua, reciclaje y gestión de residuos", r: 5.0 },
};
const FUND_COLOR = { global: "#007eae", tecnologia: "#5b50d6", inmobiliario: "#d9a03a", energia: "#1f9d63", inflacion: "#d4622a", salud: "#d33f73", movilidad: "#11867c", infraestructuras: "#6d7f99", agua: "#1aa3c4" };
/* Por qué cada fondo es un antídoto: si pasa lo que temes, a estas empresas les suele ir mejor */
const FUND_WHY = {
    tecnologia: "Si la tecnología y la IA avanzan más de lo esperado, las empresas que las crean y las usan suelen ganar más, y esta parte de tu dinero con ellas.",
    inmobiliario: "Si la vivienda sigue subiendo, las empresas dueñas de pisos y edificios tienden a valer más, y tu entrada no se queda tan atrás.",
    energia: "Cuanto más se invierta en energía limpia y en frenar el cambio climático, más pueden crecer las empresas que lo hacen posible.",
    inflacion: "Estos activos se mueven con los precios: cuando todo se encarece, protegen lo que vale tu dinero.",
    salud: "El gasto en salud crece con los años; invertir en el sector es estar del lado de quien encuentra soluciones.",
    movilidad: "Si moverse en coche se encarece, a las empresas de energía y movilidad les suele ir mejor, y a esta parte de tu dinero también.",
    infraestructuras: "Cuando hay que arreglar carreteras, puentes o redes, alguien cobra por hacerlo: las empresas que construyen y mantienen infraestructuras.",
    agua: "Si el agua escasea o hay que limpiar lo que contaminamos, crecen las empresas que depuran, reciclan y gestionan residuos.",
};
/* De lo que escribes a un fondo: palabras clave (sin tildes). El orden importa: lo más concreto primero. */
const FEAR_KEYS = [
    ["infraestructuras", ["carretera", "puente", "bache", "infraestructura", "tren", "metro", "autobus", "obra", "apagon", "aeropuerto", "ferrocarril", "tunel", "autopista", "transporte publico"]],
    ["agua", ["agua", "sequia", "oceano", "mar ", "mares", "plastico", "residuo", "basura", "recicl", "rio", "medio ambiente", "contamina", "bosque", "incendio"]],
    ["inmobiliario", ["casa", "piso", "vivienda", "alquiler", "hipoteca", "independiz", "inmobili", "compartir piso"]],
    ["tecnologia", ["ia", "inteligencia artificial", "robot", "automat", "trabajo", "empleo", "paro", "maquina", "tecnolog", "ciber", "hacker", "internet", "datos", "chatgpt"]],
    ["salud", ["salud", "enfermedad", "pandemia", "virus", "hospital", "medic", "cancer", "envejec", "abuel", "mental", "ansiedad"]],
    ["movilidad", ["coche", "gasolina", "diesel", "combustible", "carnet", "conducir", "electrico", "bateria", "petroleo", "moto"]],
    ["energia", ["clima", "calentamiento", "sostenib", "renovable", "energia", "co2", "emision", "verde", "planeta", "calor", "luz", "polucion"]],
    ["inflacion", ["precio", "inflac", "caro", "carisim", "suba", "sueldo", "salario", "compra", "crisis", "dinero no", "pension", "ahorros"]],
];
/* Ideas para empezar: se pueden elegir o escribir las propias */
const FEAR_IDEAS = [
    "Que la IA haga el trabajo que quiero", "No poder pagarme nunca una casa", "El cambio climático", "Que las carreteras estén cada vez peor",
    "Que falte agua", "Que todo suba de precio", "Los plásticos en el mar", "La salud de mi familia", "No poder pagar el coche y la gasolina",
];
const FUND_ICON = { tecnologia: "ia", inmobiliario: "casa", energia: "clima", inflacion: "precios", salud: "salud", movilidad: "coche", infraestructuras: "road", agua: "drop", global: "precios" };

const ICONS = {
    road: '<path d="M8 3 5 21M16 3l3 18M12 4v3M12 10.5v3M12 17v3"/>',
    drop: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
    ia: '<path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2"/><rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9.5 15l1.6-6h1.8l1.6 6M10.1 13h3.8"/>',
    casa: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    clima: '<path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M17 7l1.4-1.4M19 12h2"/><circle cx="12" cy="12" r="3.5"/><path d="M7 19c1.2-1 2.4-1 3.6 0s2.4 1 3.6 0 2.4-1 3.6 0"/>',
    precios: '<path d="M4 17l5-5 4 3 7-8"/><path d="M15 7h5v5"/>',
    salud: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M9 11h6M12 8v6"/>',
    coche: '<path d="M4 15l1.5-5A2 2 0 0 1 7.4 8.5h9.2a2 2 0 0 1 1.9 1.5L20 15"/><rect x="3" y="15" width="18" height="4" rx="1.5"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/>',
};

/* El Antídoto: en vez de preguntar cuánto riesgo quieres, preguntamos qué te da miedo */
const FEARS = [
    { id: "ia", label: "Que la IA haga el trabajo que quiero", fund: "tecnologia",
      why: "Si la IA avanza más de lo esperado, las empresas que la crean y la usan suelen ganar más, y esta parte de tu dinero con ellas." },
    { id: "casa", label: "No poder pagarme nunca una casa", fund: "inmobiliario",
      why: "Si los pisos siguen subiendo, las empresas dueñas de viviendas tienden a valer más, y tu entrada no se queda tan atrás." },
    { id: "clima", label: "El cambio climático", fund: "energia",
      why: "Cuanto más se invierta en energía limpia para frenar el clima, más pueden crecer las empresas que la producen." },
    { id: "precios", label: "Que todo suba de precio", fund: "inflacion",
      why: "Estos activos están pensados para moverse con los precios, así que protegen tu dinero cuando todo se encarece." },
    { id: "salud", label: "La salud de mi familia", fund: "salud",
      why: "El gasto en salud crece con los años; invertir en el sector es una forma de estar del lado de quien encuentra soluciones." },
    { id: "coche", label: "No poder pagar el coche y la gasolina", fund: "movilidad",
      why: "Si la energía y el coche se encarecen cuando lo necesites, esta parte de tu dinero tiende a subir con ellos." },
];

/* Objetivo de vivienda por defecto (el joven lo ajusta en Casa) */
const GOAL_DEFAULT = { price: 150000, age: 27 };
const DOWN_PCT = 0.2;          // entrada habitual: 20 % del precio
const MORTGAGE_YEARS = 25;
const MORTGAGE_RATE = 3.0;     // tipo de referencia para calcular la rebaja
const RANK_MIN = 100;          // el mapa de miedos se publica a partir de 100 respuestas

/* El ciclo de Horizonte: cada paso alimenta al siguiente */
const CYCLE = [
    { id: "aprende", t: "Aprende", p: "Un curso elaborado para aprender todo lo necesario sobre invertir, desde lo más básico. Al superarlo, recibes un diploma que acredita tu nivel.", ic: "book" },
    { id: "invierte", t: "Invierte", p: `Desde 1 €, con tu familia detrás. Tu primer año, los primeros ${RULES.protectCap} € no pueden perder.`, ic: "chart" },
    { id: "entiende", t: "Entiende", p: "Cada semana, qué ha pasado con tu dinero y por qué. Y tu Antídoto: invierte en lo que te preocupa.", ic: "spark" },
    { id: "millas", t: "Gana millas", p: "Aprender, aportar y ser constante suma millas. Nunca por tener más dinero que nadie.", ic: "star" },
    { id: "casa", t: "Tu casa", p: "Las millas rebajan el interés de tu primera hipoteca con CaixaBank.", ic: "house" },
];
const FAQ = [
    { q: "¿Hay una edad para empezar?", a: "Aprender no tiene edad: puedes probar los juegos y recorrer la web cuando quieras. Para abrir una cuenta e invertir, una persona menor de edad necesita la autorización de su madre, padre o tutor legal. Hasta los 18, la cuenta está a su nombre y su familia aprueba las decisiones importantes; a los 18 pasa a ser solo suya." },
    { q: "¿Puedo perder dinero?", a: `Invertir siempre tiene riesgo y el valor puede bajar. Por eso, durante tu primer año, los primeros ${RULES.protectCap} € que inviertes tú están protegidos: si al cumplir los 12 meses valen menos de lo que pusiste, CaixaBank pone la diferencia, siempre que no hayas vendido antes.` },
    { q: "¿Qué es el Certificado Horizonte?", a: `Una acreditación de CaixaBank Asset Management que demuestra que sabes lo esencial antes de invertir: interés compuesto, riesgo y plazo, diversificación y cómo evitar estafas. Al superar Fundamentos recibes ${RULES.prize} € invertidos y un certificado verificable que puedes añadir a LinkedIn a partir de los 16.` },
    { q: "¿Qué es el Antídoto?", a: `En lugar de preguntarte cuánto riesgo quieres, te preguntamos qué te preocupa de tu futuro. El ${Math.round(RULES.base * 100)} % de tu dinero va a un fondo global diversificado y el ${Math.round(RULES.antidote * 100)} % a los temas que eliges, dentro de una selección cerrada de fondos de CaixaBank Asset Management. Reduce el golpe si lo que temes ocurre; no es una garantía.` },
    { q: "¿Cómo funcionan las millas de casa?", a: "Las ganas al aprender, al jugar con datos reales, al aportar cada mes, al mantener tu racha y con los regalos de tu familia (con un tope mensual). Nunca por tener más dinero. Se canjean como rebaja del diferencial de tu primera hipoteca con CaixaBank, no caducan y, si nunca compras casa, no pierdes nada." },
    { q: "¿Qué hace Gemini con mis datos?", a: "Solo con el permiso de tu familia (y a partir de los 18, el tuyo), Gemini usa la información de tu cuenta para explicarte tu dinero con tus propios números. Nunca se usa para publicidad y puedes retirar el permiso cuando quieras." },
    { q: "¿Cómo puede ayudar mi familia?", a: "Desde el área familiar pueden hacer regalos puntuales o aportaciones mensuales con un mensaje, aprobar tu Antídoto, decidir los permisos y ver tu progreso." },
    { q: "¿Cuánto cuesta Horizonte?", a: `Horizonte no cobra cuotas ni comisión de apertura, pero invertir tiene un coste. Los fondos de CaixaBank Asset Management cobran una comisión de gestión; como referencia, en torno al ${feeTxt} % al año, es decir, unos ${feeTxt} € por cada 100 € invertidos. Te la mostramos siempre en euros, y el documento de datos fundamentales de cada fondo detalla su coste exacto.` },
];
const LEGAL = "Horizonte es un servicio de CaixaBank Asset Management, propuesto en el reto CaixaBank AM × Google. Invertir conlleva riesgos, incluida la pérdida del capital invertido. Los valores que se muestran son estimaciones con fines informativos y no garantizan rentabilidades futuras. La protección del primer año es una bonificación promocional sujeta a condiciones: tope de 500 € por persona, 12 meses y solo si no se vende antes. Las millas de casa son una rebaja sobre las condiciones vigentes en el momento de la firma y no obligan a contratar ningún producto (Ley 5/2019).";

const SOURCES = {
    premio: { label: "Primera inversión (Fundamentos)", own: true },
    paga: { label: "De tu paga", own: true },
    redondeo: { label: "Redondeo de compras", own: true },
    verano: { label: "Trabajo de verano", own: true },
    otro: { label: "Otro ingreso tuyo", own: true },
    regalo: { label: "Regalo", own: false },
    mensual: { label: "Aportación de la familia", own: false },
};

/* ---------------------------------------------------------------- Fundamentos (5 temas) */
const LESSONS = [
    { id: "invertir", title: "Ahorrar o invertir", sub: "Por qué empezar pronto es tu mayor ventaja", min: 3,
      cards: [
        { h: "Guardar no es lo mismo que poner a trabajar", p: [
            "<b>Ahorrar</b> es apartar dinero para más adelante. Sabes cuánto tendrás, pero apenas crece.",
            "<b>Invertir</b> es comprar una parte de empresas, bonos o edificios que pueden crecer. A cambio de poder ganar más, aceptas que el valor suba y baje." ] },
        { h: "El interés compuesto", p: [
            "Cuando inviertes, ganas sobre lo que pones… y también sobre lo que ya has ganado. Es una bola de nieve.",
            "Mueve los controles y mira qué pasa." ], viz: "compound" },
        { h: "El tiempo pesa más que la cantidad", p: [
            "Quien empieza pronto con 20 € al mes puede acabar con más que quien empieza diez años después con el doble. No hace falta mucho dinero: hace falta tiempo.",
            "Por eso Horizonte empieza ahora y no cuando tengas nómina." ] },
      ],
      check: [
        { q: "¿Qué es el interés compuesto?", o: ["Un interés que solo cobran los bancos", "Ganar también sobre lo que ya has ganado", "Un tipo de cuenta de ahorro"], a: 1, why: "Las ganancias se suman a lo que tienes y también empiezan a generar ganancias." },
        { q: "¿Qué pesa más para que tu dinero crezca?", o: ["Empezar con mucho dinero", "Empezar pronto y ser constante", "Cambiar de inversión cada mes"], a: 1, why: "El tiempo multiplica el efecto del interés compuesto." },
      ] },
    { id: "caidas", title: "Las caídas pasan", sub: "Riesgo, plazo y qué hacer cuando la bolsa baja", min: 3,
      cards: [
        { h: "Subir y bajar es normal", p: [
            "Las inversiones no suben en línea recta: hay meses buenos y meses malos. A eso se le llama <b>volatilidad</b>.",
            "Una caída solo se convierte en pérdida si vendes en ese momento." ], viz: "drops" },
        { h: "El plazo lo cambia todo", p: [
            "En un análisis del índice mundial MSCI World entre 1970 y 2023, el 12 % de los periodos de 5 años acabó en negativo. En periodos de 15 años, ninguno.",
            "Por eso el dinero que necesitas pronto no se invierte en bolsa, y el de tu casa sí puede." ] },
        { h: "Qué hacer cuando cae", p: [
            "Lo peor que suele hacer un inversor es vender por miedo. Lo mejor: no tocarlo y seguir aportando.",
            "Tu primer año, además, no puedes perder: CaixaBank te protege los primeros 500 €." ] },
      ],
      check: [
        { q: "La bolsa cae un 10 % y no necesitas el dinero hasta dentro de 10 años. ¿Qué tiene más sentido?", o: ["Vender todo antes de que baje más", "No tocarlo y seguir aportando", "Pedir un préstamo para comprar más"], a: 1, why: "Con un plazo largo hay tiempo para que se recupere; vender convierte la caída en pérdida." },
        { q: "¿Cuándo se convierte una caída en una pérdida real?", o: ["Cuando lo ves en la app", "Cuando vendes en ese momento", "Nunca"], a: 1, why: "Mientras no vendas, el valor puede recuperarse." },
      ] },
    { id: "cesta", title: "No todo en la misma cesta", sub: "Diversificar y qué es un fondo", min: 2,
      cards: [
        { h: "Diversificar", p: [
            "Si todo tu dinero está en una sola empresa y le va mal, lo pierdes casi todo. Si está repartido entre miles, una mala noticia apenas se nota.",
            "Diversificar no elimina el riesgo, pero lo hace mucho más pequeño." ] },
        { h: "Qué es un fondo", p: [
            "Un fondo junta el dinero de muchas personas y lo invierte en muchas empresas a la vez. Lo gestiona un equipo profesional, como el de CaixaBank Asset Management.",
            "Con 5 € ya tienes un trocito de cientos de empresas." ] },
        { h: "Base + Antídoto", p: [
            "En Horizonte, la mayor parte de tu dinero (75 %) va a un <b>fondo global</b> muy diversificado.",
            "Solo una parte (25 %) va a tu <b>Antídoto</b>: los temas que te preocupan de tu futuro." ] },
      ],
      check: [
        { q: "¿Para qué sirve diversificar?", o: ["Para ganar siempre", "Para que una mala noticia no lo hunda todo", "Para pagar menos impuestos"], a: 1, why: "Repartir reduce el impacto de que a una empresa le vaya mal." },
        { q: "¿Qué es un fondo de inversión?", o: ["Una cuenta corriente", "Dinero de muchas personas invertido en muchos activos", "Una criptomoneda"], a: 1, why: "Junta el dinero de muchos y lo reparte entre muchos activos." },
      ] },
    { id: "trampas", title: "Ni apuestas ni estafas", sub: "Cómo distinguir invertir de jugarte el dinero", min: 3,
      cards: [
        { h: "Invertir no es apostar", p: [
            "En una apuesta, la casa gana a largo plazo por diseño. Al invertir, pones dinero en empresas que crean valor con el tiempo.",
            "Si alguien te promete ganar rápido y seguro, no es inversión." ] },
        { h: "Señales de estafa", p: [
            "Rentabilidades altas «garantizadas», prisas para decidir, contacto por redes o mensajes que no pediste y empresas que no aparecen en la CNMV.",
            "Ante la duda, compruébalo en cnmv.es antes de enviar un euro." ] },
        { h: "Finfluencers, cripto y comisiones", p: [
            "Un vídeo viral no sabe nada de tu vida ni de tus metas. Las criptomonedas pueden subir y bajar muchísimo en días.",
            "Y mira siempre las comisiones: un 1 % al año parece poco, pero se acumula igual que las ganancias." ] },
      ],
      check: [
        { q: "Te escriben por Instagram: «Gana un 20 % al mes, garantizado». ¿Qué haces?", o: ["Pruebo con poco dinero", "Es una señal clara de estafa: no envío nada", "Se lo paso a mis amigos"], a: 1, why: "Rentabilidad alta garantizada y contacto no pedido son dos señales de estafa." },
        { q: "¿Dónde compruebas si una empresa de inversión está autorizada?", o: ["En sus redes sociales", "En la CNMV", "En los comentarios de YouTube"], a: 1, why: "La CNMV tiene los registros oficiales de entidades autorizadas." },
      ] },
    { id: "horizonte", title: "Cómo funciona Horizonte", sub: "Primera inversión, primer año acompañado, millas y Antídoto", min: 2,
      cards: [
        { h: "Tu primer euro se gana", p: [
            `Al superar Fundamentos, CaixaBank ingresa <b>${RULES.prize} €</b> invertidos a tu nombre. No es un regalo: te lo has ganado.`,
            "Después, el objetivo es que pongas tu <b>primer euro propio</b>: de tu paga, del redondeo de tus compras o de un trabajo de verano." ] },
        { h: "Tu primer año, acompañado", p: [
            `Durante tus primeros 12 meses, los primeros <b>${RULES.protectCap} €</b> que inviertes tú no pueden perder. Si al cumplir el año valen menos, CaixaBank pone la diferencia.`,
            "Solo cuenta si no vendes antes de los 12 meses." ] },
        { h: "Millas de casa", p: [
            "Cada tema que completas, cada juego, cada mes que aportas y cada regalo de tu familia suman <b>millas de casa</b>.",
            "Años después se convierten en una rebaja del interés de tu primera hipoteca con CaixaBank. No caducan." ] },
      ],
      check: [
        { q: "¿Qué protege el primer año sin perder?", o: ["Todo tu dinero para siempre", "Tus primeros 500 € durante 12 meses, si no vendes", "Solo el dinero que te regalan"], a: 1, why: "Es una protección con tope: 500 € y 12 meses, si no vendes antes." },
        { q: "¿Para qué sirven las millas de casa?", o: ["Para viajar gratis", "Para rebajar el interés de tu futura hipoteca", "Para comprar videojuegos"], a: 1, why: "Se canjean en una hipoteca con CaixaBank como rebaja del diferencial." },
      ] },
];

/* Banco de preguntas de la prueba final */
const EXAM = [
    ...LESSONS.flatMap(l => l.check),
    { q: "Necesitas el dinero para el viaje de fin de curso dentro de 6 meses. ¿Dónde tiene más sentido?", o: ["En bolsa, para que crezca más", "En un sitio estable y disponible", "En criptomonedas"], a: 1, why: "A corto plazo una caída podría coincidir justo con el momento en que lo necesitas." },
    { q: "Una persona ahorra 20 € al mes desde hoy y otra empieza dentro de diez años con 40 € al mes. Pasado el tiempo, ¿quién suele llegar más lejos?", o: ["Siempre la que ahorra 40 €", "La que empieza antes puede llegar a más", "Las dos igual"], a: 1, why: "Diez años más de interés compuesto pueden compensar aportar la mitad." },
    { q: "¿Qué parte de tu dinero va al Antídoto?", o: ["Todo", "Una parte: el 25 %", "Nada, es solo un juego"], a: 1, why: "La base global (75 %) reparte el riesgo; el Antídoto es una parte." },
    { q: "El Antídoto invierte en lo que te preocupa. ¿Qué garantiza?", o: ["Que nunca pierdas", "Nada: reduce el golpe, no es una garantía", "Que ganes el doble"], a: 1, why: "Si lo que temes pasa, esa parte tiende a subir, pero no hay garantías." },
    { q: "Las comisiones de un fondo…", o: ["No importan", "Se cobran cada año y se acumulan con el tiempo", "Solo se pagan al principio"], a: 1, why: "Un punto al año de diferencia puede suponer bastante menos dinero tras muchos años." },
];

/* ---------------------------------------------------------------- Juegos con datos reales
   Rentabilidades anuales aproximadas 2000-2024 (%, moneda local, ilustrativas) y un titular de cada año. */
const MKT_FROM = 2000;
const MKT = [
    { k: "world", code: "MUN", name: "El mundo entero", sub: "MSCI World", color: "#007eae", r: [-13.2, -16.8, -19.9, 33.1, 14.7, 9.5, 20.1, 9.0, -40.7, 30.0, 11.8, -5.5, 15.8, 26.7, 4.9, -0.9, 7.5, 22.4, -8.7, 27.7, 15.9, 21.8, -18.1, 23.8, 18.7] },
    { k: "usa", code: "USA", name: "Gigantes de EE. UU.", sub: "S&P 500", color: "#2f6fd6", r: [-9.1, -11.9, -22.1, 28.7, 10.9, 4.9, 15.8, 5.5, -37.0, 26.5, 15.1, 2.1, 16.0, 32.4, 13.7, 1.4, 12.0, 21.8, -4.4, 31.5, 18.4, 28.7, -18.1, 26.3, 25.0] },
    { k: "tech", code: "TEC", name: "Tecnológicas", sub: "Nasdaq-100", color: "#8b5cf6", r: [-36.8, -32.6, -37.6, 49.1, 10.4, 1.5, 6.8, 18.7, -41.9, 53.5, 19.2, 2.7, 16.8, 35.0, 17.9, 8.4, 5.9, 31.5, -1.0, 38.0, 47.6, 26.6, -33.0, 53.8, 24.9] },
    { k: "esp", code: "ESP", name: "España", sub: "IBEX 35", color: "#e0453a", r: [-21.7, -7.8, -28.1, 28.2, 17.4, 18.2, 31.8, 7.3, -39.4, 29.8, -17.4, -13.1, -4.7, 21.4, 3.7, -7.2, -2.0, 7.4, -15.0, 11.8, -15.5, 7.9, -5.6, 22.8, 14.8] },
    { k: "eur", code: "EUR", name: "Europa", sub: "Euro Stoxx 50", color: "#3b82c4", r: [-2.7, -20.3, -37.3, 15.7, 6.9, 21.3, 15.1, 6.8, -44.4, 21.1, -5.8, -17.1, 13.8, 17.9, 1.2, 3.8, 0.7, 6.5, -14.3, 24.8, -5.1, 21.0, -11.7, 19.2, 8.3] },
    { k: "jpn", code: "JPN", name: "Japón", sub: "Nikkei 225", color: "#d94f8c", r: [-27.2, -23.5, -18.6, 24.5, 7.6, 40.2, 6.9, -11.1, -42.1, 19.0, -3.0, -17.3, 22.9, 56.7, 7.1, 9.1, 0.4, 19.1, -12.1, 18.2, 16.0, 4.9, -9.4, 28.2, 19.2] },
    { k: "emg", code: "EMG", name: "Emergentes", sub: "MSCI Emerging Markets", color: "#ff8300", r: [-30.6, -2.4, -6.0, 56.3, 25.9, 34.5, 32.6, 39.8, -53.2, 79.0, 19.2, -18.2, 18.6, -2.3, -1.8, -14.6, 11.6, 37.8, -14.2, 18.9, 18.7, -2.5, -20.0, 10.3, 7.5] },
    { k: "bon", code: "BON", name: "Bonos", sub: "Bloomberg US Aggregate", color: "#7fb8d4", r: [11.6, 8.4, 10.3, 4.1, 4.3, 2.4, 4.3, 7.0, 5.2, 5.9, 6.5, 7.8, 4.2, -2.0, 6.0, 0.5, 2.6, 3.5, 0.0, 8.7, 7.5, -1.5, -13.0, 5.5, 1.3] },
    { k: "oro", code: "ORO", name: "Oro", sub: "Precio del oro", color: "#c9a227", r: [-5.4, 0.8, 24.8, 19.1, 5.2, 18.2, 22.8, 31.4, 5.5, 24.0, 29.5, 10.1, 7.0, -28.0, -1.5, -10.4, 8.6, 13.1, -1.6, 18.3, 25.1, -3.6, -0.3, 13.1, 27.2] },
    { k: "liq", code: "LIQ", name: "Colchón", sub: "Letras del Tesoro (liquidez)", color: "#8497a3", r: [5.8, 3.8, 1.6, 1.0, 1.4, 3.2, 4.8, 4.7, 1.5, 0.1, 0.1, 0.0, 0.1, 0.0, 0.0, 0.0, 0.3, 0.9, 1.9, 2.3, 0.6, 0.0, 1.5, 5.0, 5.2] },
];
const MKT_NEWS = [
    "Las puntocom que valían miles de millones empiezan a desplomarse.",
    "Atentados en Nueva York: la bolsa estadounidense cierra cuatro días.",
    "Escándalos contables hunden a varias grandes empresas.",
    "Los bancos centrales dejan los tipos en mínimos y vuelve el apetito por el riesgo.",
    "Crecimiento global sólido; China acelera.",
    "El precio de la vivienda marca máximos en medio mundo.",
    "Las materias primas se disparan.",
    "Primeros avisos en las hipotecas de alto riesgo en EE. UU.",
    "Quiebra Lehman Brothers, un banco con 158 años de historia.",
    "Rescates y estímulos masivos. Nadie se fía del rebote.",
    "Grecia pide un rescate y se duda del futuro del euro.",
    "Rebajan la nota de la deuda de EE. UU.; crisis de deuda en Europa.",
    "El BCE promete hacer «lo que sea necesario» para salvar el euro.",
    "La Reserva Federal anuncia que retirará estímulos.",
    "El petróleo cae a la mitad en unos meses.",
    "Devaluación sorpresa en China y un verano de sobresaltos.",
    "Reino Unido vota salir de la Unión Europea.",
    "Un año de calma inusual: la volatilidad toca mínimos.",
    "Guerra comercial, subidas de tipos y un diciembre negro.",
    "Los bancos centrales vuelven a bajar tipos.",
    "Una pandemia paraliza el planeta.",
    "Reapertura, euforia y acciones meme.",
    "La inflación se dispara: subidas de tipos más rápidas en décadas.",
    "La IA generativa entra en escena; caen varios bancos regionales.",
    "Récords en bolsa impulsados por la tecnología."
];
const GAMES = [
    { id: "titular", t: "El titular", p: "Un titular real de un año. ¿La bolsa mundial acabó ese año arriba o abajo?", rounds: 5 },
    { id: "duelo", t: "¿Cuál rindió más?", p: "Dos inversiones, un año. Elige la que más subió (o la que menos cayó).", rounds: 5 },
];
