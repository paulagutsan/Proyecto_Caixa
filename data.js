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
    streak4: 20,         // cada 4 semanas seguidas aprendiendo o aportando (los juegos dan insignias, nunca millas)
    giftPer5: 1,         // 1 milla por cada 5 € que te regalan…
    giftMonthCap: 20,    // …con un tope de 20 millas al mes, para que no se pueda «comprar» la rebaja
    perPoint: 25000,     // 25.000 millas = 1 punto porcentual menos de diferencial (250 millas = 0,01)
    maxCut: 0.2,         // rebaja máxima: 0,20 puntos (≈ 16 €/mes en una hipoteca de 160.000 €), como en el modelo económico
};

/* Coste orientativo de los fondos (comisión de gestión de CaixaBank AM, % anual). Se muestra siempre en euros. */
const COST = { fee: 0.9 };
const feeTxt = String(COST.fee).replace(".", ",");
/* Proyecciones: tres escenarios (nunca una sola cifra). Las comisiones no se modifican en esta versión. */
const EST = { gross: 5, scenarios: [[3, "Prudente"], [5, "Medio"], [8, "Optimista"]] };
const RATE = g => g / 100;
/* Programa de protección: dotación publicada y limitada */
const PROMO = { budgetTxt: "la que fijen las bases de la promoción" };

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
      p: `Tu familia aprueba las decisiones importantes hasta los ${RULES.adultAge}, tus datos solo se usan con permiso y el programa de protección cubre la diferencia si tus primeros ${RULES.protectCap} € valen menos a los ${RULES.protectMonths} meses, hasta ese máximo.` },
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
    { id: "aprende", t: "Aprende", p: "Cinco temas cortos y una prueba final, sin jerga. Al superarla, recibes un certificado que puedes comprobar y compartir.", ic: "book" },
    { id: "invierte", t: "Invierte", p: `Desde 1 €, con tu familia detrás. Tus primeros ${RULES.protectCap} € tienen protección promocional durante el primer año<sup>*</sup>.`, ic: "chart" },
    { id: "entiende", t: "Anticípate", p: "Cada semana, qué ha pasado con tu dinero y por qué. Y tu Antídoto: invierte en lo que te preocupa.", ic: "spark" },
    { id: "millas", t: "Gana millas", p: "Aprender, aportar con constancia y revisar tu plan cada año suma millas. Nunca por tener más dinero que nadie, ni por jugar.", ic: "star" },
    { id: "casa", t: "Tu casa", p: "Si un día pides tu primera hipoteca con CaixaBank, tus millas pueden convertirse en una bonificación, según las condiciones de ese momento.", ic: "house" },
];
const FAQ = [
    { q: "¿Hay una edad para empezar?", a: "Aprender no tiene edad: puedes hacer los temas y los juegos sin crear cuenta. Para abrir una cuenta e invertir, una persona menor de edad necesita que su madre, padre o tutor legal la abra y la autorice con su propia identidad. Hasta los 18, esa persona es la titular legal y tú eres la persona usuaria; a los 18, la cuenta pasa a tu nombre cuando confirmas tu identidad." },
    { q: "¿Puedo perder dinero?", a: `Sí. Invertir siempre tiene riesgo y el valor puede bajar. Como promoción, durante tu primer año CaixaBank repone la diferencia si tus primeros ${RULES.protectCap} € aportados (tuyos o de tu familia) valen menos a los ${RULES.protectMonths} meses, siempre que no hayas vendido antes. Tiene tope de ${RULES.protectCap} € por persona, dotación limitada (${PROMO.budgetTxt}) y no cubre nada más.` },
    { q: "¿Qué es el Certificado Horizonte?", a: `Una acreditación de CaixaBank Asset Management que demuestra que sabes lo esencial antes de invertir: interés compuesto, riesgo y plazo, diversificación y cómo evitar estafas. Al superar Fundamentos, CaixaBank invierte ${RULES.prize} € a tu nombre (uno por persona, una vez verificada tu identidad) y recibes un certificado con un código que cualquiera puede comprobar en nuestra página de verificación. Puedes añadirlo a LinkedIn a partir de los 16.` },
    { q: "¿Qué es el Antídoto?", a: `En lugar de preguntarte cuánto riesgo quieres, te preguntamos qué te preocupa de tu futuro. El ${Math.round(RULES.base * 100)} % de tu dinero va a un fondo global diversificado y el ${Math.round(RULES.antidote * 100)} % a los temas que eliges, dentro de una selección cerrada de fondos de CaixaBank Asset Management. Reduce el golpe si lo que temes ocurre; no es una garantía.` },
    { q: "¿Cómo funcionan las millas de casa?", a: "Las ganas al aprender, al aportar cada mes, al mantener tu constancia semanal, con la revisión anual y con los regalos de tu familia (con un tope mensual). Los juegos dan insignias, no millas. Si un día pides tu primera hipoteca con CaixaBank, las millas pueden convertirse en una bonificación sobre las condiciones de ese momento, según las condiciones de vinculación voluntaria que se ofrezcan. No obligan a contratar nada, no caducan y, si nunca compras casa, no pierdes nada." },
    { q: "¿Qué hace Gemini con mis datos?", a: "Sin permiso, Gemini responde solo con información general y sin ningún dato tuyo. Con el permiso de tu familia (y a partir de los 18, el tuyo), usa la información de tu cuenta, sin tu nombre, para explicarte tu dinero con tus propios números. Nunca se usa para publicidad y puedes retirar el permiso cuando quieras." },
    { q: "¿Cómo puede ayudar mi familia?", a: "Desde el área familiar pueden hacer regalos puntuales o aportaciones mensuales con un mensaje, aprobar tu Antídoto y tus retiradas, decidir los permisos y ver tu progreso. También pueden pedir que un gestor de CaixaBank les llame." },
    { q: "¿Puedo sacar mi dinero?", a: "Sí. Si eres mayor de edad, pides la retirada y listo. Si eres menor, la solicitud llega a tu familia para que la apruebe. Si retiras antes de los 12 meses, pierdes la protección promocional del primer año. Mientras no vendas, una caída es solo un número en pantalla." },
    { q: "¿Esto es un juego de apuestas?", a: "No. Los juegos usan datos históricos de hace años, no predicen el futuro y no dan dinero ni millas: solo insignias. En Horizonte no hay predicciones semanales ni cuenta atrás." },
    { q: "¿Cuánto cuesta Horizonte?", a: `Horizonte no cobra comisión de apertura, pero invertir tiene un coste. Los fondos de CaixaBank Asset Management cobran una comisión de gestión; como referencia, en torno al ${feeTxt} % al año, es decir, unos ${feeTxt} € por cada 100 € invertidos. Te la mostramos siempre en euros, y el documento de datos fundamentales de cada fondo detalla su coste exacto.` },
];
const LEGAL = "Horizonte es un servicio de CaixaBank Asset Management, propuesto en el reto CaixaBank AM × Google. Invertir conlleva riesgos, incluida la pérdida del capital invertido. Los valores que se muestran son estimaciones con fines informativos y no garantizan rentabilidades futuras. La protección del primer año es una promoción sujeta a condiciones: tope de 500 € por persona, 12 meses, solo si no se vende antes y hasta agotar la dotación publicada. Las millas de casa son una bonificación posible sobre las condiciones vigentes en el momento de la firma de una hipoteca, según las condiciones de vinculación voluntaria que entonces se ofrezcan, y no obligan a contratar ningún producto (Ley 5/2019). Antes de invertir, consulta el documento de datos fundamentales (DFI) de cada fondo.";

const SOURCES = {
    premio: { label: "Primera inversión (Fundamentos)", own: true },
    paga: { label: "De tu paga", own: true },
    redondeo: { label: "Redondeo de compras", own: true },
    verano: { label: "Trabajo de verano", own: true },
    otro: { label: "Otro ingreso tuyo", own: true },
    regalo: { label: "Regalo", own: false },
    mensual: { label: "Aportación de la familia", own: false },
    retiro: { label: "Retirada", own: false },
};

/* ---------------------------------------------------------------- Fundamentos (5 temas) */
const LESSONS = [
    { id: "invertir", title: "Ahorrar o invertir", sub: "Por qué empezar pronto es tu mayor ventaja", min: 8,
      cards: [
        { h: "Guardar no es lo mismo que poner a trabajar", p: [
            "<b>Ahorrar</b> es apartar dinero para más adelante. Sabes cuánto tendrás, pero apenas crece.",
            "<b>Invertir</b> es comprar una parte de empresas, bonos o edificios que pueden crecer. A cambio de poder ganar más, aceptas que el valor suba y baje." ] },
        { h: "El dinero quieto pierde valor", p: [
            "Los precios suben con los años: a eso se le llama <b>inflación</b>. Si el dinero no crece al menos lo mismo, cada año compra menos cosas.",
            "Con una inflación del 3 % anual, 100 € guardados en un cajón compran dentro de diez años lo que hoy cuesta unos 74 €." ],
          ex: "Un menú que hoy cuesta 10 € costaría unos 13,40 € dentro de diez años con un 3 % de inflación." },
        { h: "El interés compuesto", p: [
            "Cuando inviertes, ganas sobre lo que pones… y también sobre lo que ya has ganado. Es una bola de nieve.",
            "Mueve los controles y mira qué pasa." ], viz: "compound" },
        { h: "El tiempo pesa más que la cantidad", p: [
            "No hace falta mucho dinero: hace falta tiempo. Cada año que tu dinero está invertido, la bola de nieve se hace más grande.",
            "Por eso Horizonte empieza ahora y no cuando tengas nómina." ],
          ex: "Ana aparta 20 € al mes desde los 16 hasta los 36. Leo aparta 40 € al mes desde los 26 hasta los 36. Los dos ponen 4.800 €, pero al 5 % anual Ana llega a unos 8.200 € y Leo a unos 6.200 €." },
        { h: "Más rentabilidad, más vaivenes", p: [
            "Rentabilidad y riesgo van juntos. Un depósito apenas se mueve, pero rinde poco. La bolsa ha rendido históricamente bastante más, a cambio de años con caídas del 20 % o más.",
            "No existe una inversión que rinda mucho y no se mueva nunca. Si alguien te la ofrece, desconfía." ] },
        { h: "Tres reglas para empezar", p: [
            "<b>1.</b> El dinero que vas a necesitar pronto no se invierte en bolsa.",
            "<b>2.</b> Invierte lo que no vas a necesitar en años, como la entrada de tu casa.",
            "<b>3.</b> Sé constante: una cantidad pequeña cada mes vale más que una grande de vez en cuando." ] },
      ],
      check: [
        { q: "¿Qué es el interés compuesto?", o: ["Un interés que solo cobran los bancos", "Ganar también sobre lo que ya has ganado", "Un tipo de cuenta de ahorro"], a: 1, why: "Las ganancias se suman a lo que tienes y también empiezan a generar ganancias." },
        { q: "Tienes 100 € en un cajón y los precios suben un 3 % al año. Dentro de 10 años…", o: ["Podrás comprar lo mismo que hoy", "Podrás comprar menos cosas", "Tendrás más dinero"], a: 1, why: "Seguirás teniendo 100 €, pero con la inflación comprarán lo que hoy cuesta unos 74 €." },
        { q: "¿Qué pesa más para que tu dinero crezca?", o: ["Empezar con mucho dinero", "Empezar pronto y ser constante", "Cambiar de inversión cada mes"], a: 1, why: "El tiempo multiplica el efecto del interés compuesto." },
        { q: "¿Qué dinero no tiene sentido invertir en bolsa?", o: ["El que no vas a necesitar en diez años", "El que necesitas para algo dentro de unos meses", "El de la entrada de tu casa futura"], a: 1, why: "Si la bolsa cae justo antes de que lo necesites, no tendrías tiempo de esperar a que se recupere." },
      ] },
    { id: "caidas", title: "Las caídas pasan", sub: "Riesgo, plazo y qué hacer cuando la bolsa baja", min: 8,
      cards: [
        { h: "Subir y bajar es normal", p: [
            "Las inversiones no suben en línea recta: hay meses buenos y meses malos. A eso se le llama <b>volatilidad</b>.",
            "Una caída solo se convierte en pérdida si vendes en ese momento." ], viz: "drops" },
        { h: "Las caídas grandes también llegan", p: [
            "En la crisis de 2008 la bolsa mundial cayó más de un 40 % y tardó años en recuperarse. En 2020, con la pandemia, cayó cerca de un tercio en pocas semanas y recuperó ese nivel en menos de un año.",
            "No se puede saber cuándo llegará la próxima. Lo que sí puedes decidir es cómo vas a reaccionar." ] },
        { h: "El plazo lo cambia todo", p: [
            "En un análisis del índice mundial MSCI World entre 1970 y 2023, el 12 % de los periodos de 5 años acabó en negativo. En periodos de 15 años, ninguno.",
            "Por eso el dinero que necesitas pronto no se invierte en bolsa, y el de tu casa sí puede." ] },
        { h: "Qué hacer cuando cae", p: [
            "Lo peor que suele hacer un inversor es vender por miedo. Lo mejor: no tocarlo y seguir aportando.",
            "Además, como promoción, tus primeros 500 € tienen protección el primer año: si valen menos al cumplir 12 meses y no has vendido, CaixaBank repone la diferencia, hasta ese máximo." ] },
        { h: "Aportar en las caídas", p: [
            "Si aportas lo mismo cada mes, cuando los precios bajan compras más participaciones con el mismo dinero. Cuando vuelven a subir, tienes más.",
            "Por eso aportar cada mes, pase lo que pase, suaviza los vaivenes." ],
          ex: "Con 20 € compras 2 participaciones si cuestan 10 €, pero 2,5 si han bajado a 8 €." },
        { h: "Conócete antes de que caiga", p: [
            "Antes de invertir, pregúntate dos cosas: ¿cuándo voy a necesitar este dinero? ¿Podría dormir tranquilo si baja un 20 %?",
            "Si la respuesta a la segunda es no, empieza con menos. Tener un plan antes de la caída es lo que evita vender por miedo." ] },
      ],
      check: [
        { q: "¿Cuándo se convierte una caída en una pérdida real?", o: ["Cuando lo ves en la app", "Cuando vendes en ese momento", "Nunca"], a: 1, why: "Mientras no vendas, el valor puede recuperarse." },
        { q: "Históricamente, tras una caída fuerte de la bolsa mundial…", o: ["Nunca se ha recuperado", "Se ha recuperado, aunque a veces ha tardado años", "Se recupera siempre al día siguiente"], a: 1, why: "La bolsa mundial se ha recuperado de todas sus grandes caídas, pero no siempre rápido. Por eso importa el plazo." },
        { q: "La bolsa cae un 10 % y no necesitas el dinero hasta dentro de 10 años. ¿Qué tiene más sentido?", o: ["Vender todo antes de que baje más", "No tocarlo y seguir aportando", "Pedir un préstamo para comprar más"], a: 1, why: "Con un plazo largo, las caídas suelen recuperarse. Vender convierte la caída en pérdida." },
        { q: "Aportas 20 € al mes. Este mes cada participación cuesta 8 € en vez de 10 €. ¿Qué pasa?", o: ["Pierdes dinero", "Compras más participaciones con el mismo dinero", "No puedes comprar"], a: 1, why: "Con 20 € compras 2,5 participaciones en lugar de 2. Cuando el precio se recupere, tendrás más." },
      ] },
    { id: "cesta", title: "No todo en la misma cesta", sub: "Diversificar y qué es un fondo", min: 7,
      cards: [
        { h: "Diversificar", p: [
            "Si todo tu dinero está en una sola empresa y le va mal, lo pierdes casi todo. Si está repartido entre miles, una mala noticia apenas se nota.",
            "Diversificar no elimina el riesgo, pero lo hace mucho más pequeño." ],
          ex: "Si tienes 100 € en una sola empresa y cae un 50 %, pierdes 50 €. Si esa empresa es una de mil en las que inviertes, pierdes unos céntimos." },
        { h: "Repartir de muchas formas", p: [
            "Se puede repartir entre <b>empresas</b>, entre <b>sectores</b> (tecnología, salud, energía…), entre <b>países</b> y entre tipos de inversión, como acciones y bonos.",
            "Y también en el <b>tiempo</b>: aportar un poco cada mes evita meterlo todo justo en el peor momento." ] },
        { h: "Qué es un fondo", p: [
            "Un fondo junta el dinero de muchas personas y lo invierte en muchas empresas a la vez. Lo gestiona un equipo profesional, como el de CaixaBank Asset Management.",
            "Con 5 € ya tienes un trocito de cientos de empresas." ] },
        { h: "Fondos indexados", p: [
            "Un fondo indexado no intenta adivinar qué empresa subirá: copia un índice entero. Por ejemplo, el MSCI World incluye unas 1.400 grandes empresas de 23 países desarrollados.",
            "Suelen tener costes bajos y te dan una diversificación enorme sin tener que elegir empresa por empresa." ] },
        { h: "Lo que no es diversificar", p: [
            "Tener cinco criptomonedas o tres empresas tecnológicas no es diversificar: suelen subir y bajar a la vez.",
            "Diversificar de verdad es tener cosas que no dependen de lo mismo." ] },
        { h: "Base + Antídoto", p: [
            "En Horizonte, la mayor parte de tu dinero (75 %) va a un <b>fondo global</b> muy diversificado.",
            "Solo una parte (25 %) va a tu <b>Antídoto</b>: los temas que te preocupan de tu futuro." ] },
      ],
      check: [
        { q: "¿Para qué sirve diversificar?", o: ["Para ganar siempre", "Para que una mala noticia no lo hunda todo", "Para pagar menos impuestos"], a: 1, why: "Repartir reduce el impacto de que a una empresa le vaya mal." },
        { q: "¿Cuál de estas carteras está más diversificada?", o: ["Tres empresas tecnológicas de EE. UU.", "Un fondo con empresas de muchos sectores y países", "Cinco criptomonedas distintas"], a: 1, why: "Las otras dos dependen de lo mismo: suelen subir y bajar a la vez." },
        { q: "¿Qué es un fondo de inversión?", o: ["Una cuenta corriente", "Dinero de muchas personas invertido en muchos activos", "Una criptomoneda"], a: 1, why: "Junta el dinero de muchos y lo reparte entre muchos activos." },
        { q: "¿Qué hace un fondo indexado?", o: ["Intenta adivinar qué acción subirá", "Copia un índice con muchas empresas", "Invierte solo en bancos"], a: 1, why: "Replica un índice entero, así que te da una diversificación muy grande con costes bajos." },
      ] },
    { id: "trampas", title: "Ni apuestas ni estafas", sub: "Cómo distinguir invertir de jugarte el dinero", min: 8,
      cards: [
        { h: "Invertir no es apostar", p: [
            "En una apuesta, la casa gana a largo plazo por diseño. Al invertir, pones dinero en empresas que crean valor con el tiempo.",
            "Si alguien te promete ganar rápido y seguro, no es inversión." ] },
        { h: "Las apuestas, en números", p: [
            "En la ruleta europea, por cada 100 € apostados la casa se queda de media con 2,70 €. Cuanto más juegas, más se acerca el resultado a esa pérdida.",
            "En las apuestas deportivas pasa lo mismo: las cuotas están calculadas para que la casa gane aunque tú aciertes a veces." ] },
        { h: "Señales de estafa", p: [
            "Rentabilidades altas «garantizadas», prisas para decidir, contacto por redes o mensajes que no pediste y empresas que no aparecen en la CNMV.",
            "Ante la duda, compruébalo en cnmv.es antes de enviar un euro." ] },
        { h: "Estafas piramidales", p: [
            "Prometen ganancias por invitar a otras personas. En realidad, pagan a los primeros con el dinero de los que entran después.",
            "Cuando deja de entrar gente nueva, se hunde, y casi todos pierden lo que pusieron." ] },
        { h: "Finfluencers, cripto y comisiones", p: [
            "Un vídeo viral no sabe nada de tu vida ni de tus metas. Las criptomonedas pueden subir y bajar muchísimo en días.",
            "Y mira siempre las comisiones: un 1 % al año parece poco, pero se acumula igual que las ganancias." ] },
        { h: "Cómo protegerte", p: [
            "Nunca des tus claves ni códigos: tu banco no te los pide nunca por SMS, llamada o redes.",
            "Desconfía de las prisas, comprueba en la CNMV y, antes de mover dinero, cuéntaselo a alguien de confianza." ] },
      ],
      check: [
        { q: "Te escriben por Instagram: «Gana un 20 % al mes, garantizado». ¿Qué haces?", o: ["Pruebo con poco dinero", "Es una señal clara de estafa: no envío nada", "Se lo paso a mis amigos"], a: 1, why: "Rentabilidad alta garantizada y contacto no pedido son dos señales de estafa." },
        { q: "En la ruleta europea, a la larga…", o: ["Ganas si tienes una buena estrategia", "La casa se queda de media con parte de lo apostado", "Ganas y pierdes lo mismo"], a: 1, why: "La casa tiene ventaja por diseño: de media se queda con 2,70 € de cada 100 € apostados." },
        { q: "Una web promete duplicar tu dinero si invitas a tres amigos. ¿Qué es probablemente?", o: ["Un fondo de inversión", "Una estafa piramidal", "Un depósito bancario"], a: 1, why: "Pagar por traer gente nueva es la señal típica de una pirámide." },
        { q: "¿Dónde compruebas si una empresa de inversión está autorizada?", o: ["En sus redes sociales", "En la CNMV", "En los comentarios de YouTube"], a: 1, why: "La CNMV tiene los registros oficiales de entidades autorizadas." },
      ] },
    { id: "horizonte", title: "Cómo funciona Horizonte", sub: "Primera inversión, primer año acompañado, millas y Antídoto", min: 7,
      cards: [
        { h: "Tu primer euro se gana", p: [
            `Al superar Fundamentos, CaixaBank ingresa <b>${RULES.prize} €</b> invertidos a tu nombre. No es un regalo: te lo has ganado.`,
            "Después, el objetivo es que pongas tu <b>primer euro propio</b>: de tu paga, del redondeo de tus compras o de un trabajo de verano." ] },
        { h: "Tu dinero, en dos partes", p: [
            "El <b>75 %</b> va a la cartera base: un fondo global con miles de empresas de todo el mundo.",
            "El <b>25 %</b> es tu Antídoto: lo inviertes en lo que te preocupa de tu futuro, para que si pasa, tu dinero gane." ] },
        { h: "Tu primer año, acompañado", p: [
            `Durante tus primeros 12 meses, los primeros <b>${RULES.protectCap} €</b> aportados (tuyos o de tu familia) tienen una protección promocional: si al cumplir el año valen menos, CaixaBank repone la diferencia.`,
            "Solo cuenta si no vendes antes de los 12 meses, tiene tope y hay una dotación limitada. No cubre nada más." ] },
        { h: "Millas de casa", p: [
            "Cada tema que completas, cada mes que aportas, tu constancia semanal y cada regalo de tu familia suman <b>millas de casa</b>. Los juegos no: dan insignias.",
            "Años después, si pides tu primera hipoteca con CaixaBank, pueden convertirse en una bonificación sobre las condiciones de ese momento. No caducan ni te obligan a nada." ] },
        { h: "Tu familia te acompaña", p: [
            "Hasta los 18, tu madre, padre o tutor es la persona titular de la cuenta: aprueba tu Antídoto, tus retiradas y los permisos de la app, y puede regalarte dinero para tu casa.",
            "A los 18, la cuenta pasa a tu nombre cuando confirmas tu identidad, y tu certificado pasa a «Inversor certificado»." ] },
        { h: "Tu revisión anual", p: [
            `Una vez al año, diez minutos para repasar tu plan: cuánto llevas, si tu Antídoto sigue teniendo sentido y si quieres cambiar tu aportación. Suma <b>${MILES.itv} millas</b>.`,
            "Así tu certificado sigue al día." ] },
      ],
      check: [
        { q: "¿Qué parte de tu dinero va a la cartera base?", o: ["El 25 %", "El 75 %", "Todo"], a: 1, why: "La base global (75 %) reparte el riesgo; el Antídoto es el otro 25 %." },
        { q: "¿Qué cubre el primer año acompañado?", o: ["Todo tu dinero para siempre", "Tus primeros 500 € durante 12 meses, si no vendes", "Solo el dinero que te regalan"], a: 1, why: "Es una promoción con tope: 500 € y 12 meses, si no vendes antes." },
        { q: "¿Para qué sirven las millas de casa?", o: ["Para viajar gratis", "Para una posible bonificación en tu futura hipoteca", "Para comprar videojuegos"], a: 1, why: "Se canjean en una hipoteca con CaixaBank como rebaja del diferencial." },
        { q: "Si tienes 16 años, ¿quién aprueba tu Antídoto?", o: ["Nadie", "Tu madre, padre o tutor", "Tus amigos"], a: 1, why: "Hasta los 18, tu familia aprueba las decisiones de la cuenta." },
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
    { q: "Tu fondo baja un 15 % en un mes y alguien te dice que vendas «por si acaso». Antes de decidir, ¿qué conviene hacer?", o: ["Vender enseguida para evitar que siga bajando más", "Mirar para qué era ese dinero y cuándo lo vas a necesitar", "Meter más dinero de golpe para aprovechar la caída"], a: 1, why: "La decisión depende de tu plazo y de tu plan, no del susto del mes. Vender convierte la caída en pérdida." },
    { q: "Un fondo cobra un 1 % al año y otro parecido un 0,2 %. Tras 30 años, ¿qué ocurre de media?", o: ["La diferencia de comisiones se come una parte notable de lo ganado", "Casi no se nota la diferencia entre los dos fondos", "El más caro rinde siempre más porque cuesta más"], a: 0, why: "Las comisiones se cobran cada año y se acumulan como el interés, pero en tu contra. Que un fondo cueste más no garantiza que rinda más." },
    { q: "Un influencer dice: «Este fondo temático subirá seguro porque la IA es el futuro». ¿Qué significa ese «seguro»?", o: ["Nada: nadie puede asegurar lo que hará un mercado", "Que el fondo cuenta con una garantía legal de rentabilidad", "Que la CNMV lo recomienda a los jóvenes de tu edad"], a: 0, why: "Ninguna inversión con riesgo puede prometer que subirá. Quien lo dice con tanta seguridad suele querer venderte algo." },
    { q: "Aportas 30 € al mes y el precio del fondo cae un tiempo. ¿Qué pasa con las participaciones que compras durante la caída?", o: ["Se anulan si no has vendido antes de los 12 meses", "Valen cero porque las compraste en mala época", "Cuestan menos, así que compras más con el mismo dinero"], a: 2, why: "Con la misma aportación, cuando el precio baja compras más participaciones. Si luego se recupera, tienes más." },
    { q: "¿En qué caso tiene más sentido tener dinero en un fondo de bolsa?", o: ["Cuando lo necesitas para pagar el alquiler del mes que viene", "Cuando te han dicho que va a subir en este trimestre", "Cuando no lo vas a necesitar en años y aguantarías una caída"], a: 2, why: "La bolsa es para el largo plazo. El dinero que necesitas pronto no debe depender de un mercado que puede estar bajo justo entonces." },
    { q: "Hasta los 18 años, ¿quién es la persona titular de la cuenta de Horizonte?", o: ["Su madre, padre o tutor legal; tú eres la persona usuaria", "Tu mejor amigo, si tiene más de 18 años", "Nadie hasta que cumplas los 18 años"], a: 0, why: "Hasta los 18 la cuenta la autoriza y la titula tu familia. A los 18 pasa a tu nombre al confirmar tu identidad." },
    { q: "Un fondo temático tiene un indicador de riesgo más alto que el global. ¿Qué significa?", o: ["Puede oscilar más, tanto hacia arriba como hacia abajo", "Tiene garantizada la rentabilidad durante varios años", "Rinde siempre más que el global cada año"], a: 0, why: "El indicador mide cuánto puede moverse el valor, no cuánto va a ganar. Más riesgo implica más vaivenes, en las dos direcciones." },
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
    { id: "titular", t: "El titular", p: "Un titular real de un año pasado. ¿La bolsa mundial acabó ese año arriba o abajo?", rounds: 5 },
    { id: "duelo", t: "¿Cuál rindió más?", p: "Dos inversiones, un año. Elige la que más subió (o la que menos cayó).", rounds: 5 },
    { id: "masomenos", t: "Más o menos", p: "¿La segunda inversión acabó con más o con menos dinero? Sin prisas: encadena aciertos con datos de años pasados.", rounds: 0, endless: true },
];
/* Más o menos: además de inversiones reales, algunas cartas con conceptos (inflación, interés, comisiones, apuestas) */
const MM_CONCEPTS = [
    { code: "INF", t: "1.000 € en un cajón", s: "10 años con un 3 % de inflación (en poder de compra de hoy)", v: 1000 / Math.pow(1.03, 10) },
    { code: "INF", t: "1.000 € en un cajón", s: "20 años con un 2 % de inflación (en poder de compra de hoy)", v: 1000 / Math.pow(1.02, 20) },
    { code: "INT", t: "1.000 € al 5 % anual", s: "durante 30 años, sin tocarlos", v: 1000 * Math.pow(1.05, 30) },
    { code: "INT", t: "1.000 € al 7 % anual", s: "durante 10 años, sin tocarlos", v: 1000 * Math.pow(1.07, 10) },
    { code: "INT", t: "1.000 € al 3 % anual", s: "durante 20 años, sin tocarlos", v: 1000 * Math.pow(1.03, 20) },
    { code: "COM", t: "1.000 € al 5 % con un 2 % de comisiones", s: "durante 20 años", v: 1000 * Math.pow(1.03, 20) },
    { code: "APU", t: "1.000 € en apuestas deportivas", s: "apostándolo todo 20 veces seguidas (la casa se queda de media un 5 %)", v: 1000 * Math.pow(.95, 20) },
];

/* Insignias de los juegos: reconocimiento, nunca millas ni dinero */
const BADGES = [
    { id: "primera", t: "Primera partida", d: "Has jugado tu primera partida con datos reales.", test: n => n.days >= 1 },
    { id: "cinco", t: "Cinco días", d: "Has jugado en cinco días distintos.", test: n => n.days >= 5 },
    { id: "veinte", t: "Veinte días", d: "Has jugado en veinte días distintos.", test: n => n.days >= 20 },
    { id: "pleno", t: "Pleno", d: "Has acertado todas las preguntas de una partida.", test: n => n.perfect },
    { id: "racha5", t: "Racha de 5", d: "Has encadenado 5 aciertos en «Más o menos».", test: n => n.mm >= 5 },
];
