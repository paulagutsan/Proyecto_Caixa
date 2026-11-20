"use strict";
/* Horizonte v2 · contenido y reglas
   Del primer euro a la primera casa. Todo lo que aquí aparece es un prototipo: cifras de ejemplo,
   rentabilidades simuladas y reglas que habría que validar con CaixaBank AM. No es asesoramiento. */

const RULES = {
    prize: 20,                 // € que se ganan al aprobar el teórico
    protectCap: 500,           // € protegidos durante el primer año
    protectMonths: 12,
    base: 0.75,                // reparto Base + Antídoto
    antidote: 0.25,
    maxFears: 2,
    examSize: 10,
    examMaxErrors: 2,          // como en el examen de conducir: se puede fallar poco
    linkedinAge: 16,           // LinkedIn pide 16 años (a comprobar)
    adultAge: 18,
    houseAge: 27,
};

/* Millas de casa: se convierten en una rebaja del diferencial de una hipoteca con CaixaBank */
const MILES = {
    lesson: 10,          // cada tema del teórico
    theory: 100,         // aprobar el teórico
    firstOwn: 50,        // tu primer euro propio
    monthOwn: 10,        // cada mes en el que aportas tú
    itv: 50,             // revisión anual del carnet
    giftPer5: 1,         // 1 milla por cada 5 € que te regalan…
    giftMonthCap: 20,    // …con un tope de 20 millas al mes, para que no se pueda «comprar» la rebaja
    perPoint: 10000,     // 10.000 millas = 1 punto porcentual menos de diferencial (100 millas = 0,01)
    maxCut: 0.5,         // rebaja máxima: 0,50 puntos
};
const MORTGAGE = { amount: 150000, years: 25, rate: 3.0 };   // hipoteca de ejemplo

/* Menú cerrado de CaixaBank AM (temas, no productos concretos) y rentabilidad anual SIMULADA */
const FUNDS = {
    global:      { name: "Fondo global diversificado", sub: "Miles de empresas de todo el mundo", r: 6.0 },
    tecnologia:  { name: "Tecnología e inteligencia artificial", sub: "Empresas que crean y usan IA", r: 9.0 },
    inmobiliario:{ name: "Inmobiliario cotizado", sub: "Empresas dueñas de viviendas y edificios", r: 3.5 },
    energia:     { name: "Transición energética", sub: "Renovables, redes y almacenamiento", r: 4.0 },
    inflacion:   { name: "Activos contra la inflación", sub: "Bonos ligados a los precios y materias primas", r: 3.0 },
    salud:       { name: "Salud", sub: "Farmacéuticas, hospitales y biotecnología", r: 5.0 },
    movilidad:   { name: "Energía y movilidad", sub: "Petróleo, gas, coche eléctrico y baterías", r: 4.0 },
};

const ICONS = {
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
      why: "Si la energía y el coche se encarecen cuando te saques el carnet de conducir, esta parte de tu dinero tiende a subir con ellos." },
];

/* Ranking de ejemplo del «mapa de miedos de tu generación» (se sustituye por el real si existe en Supabase) */
const FEAR_DEMO = { casa: 412, ia: 268, precios: 131, clima: 109, salud: 52, coche: 28 };

/* Datos de ejemplo que CaixaBank ya tiene del joven (con permiso de sus padres) */
const BANK_DEMO = {
    paga: 20,                       // € a la semana
    savingsAccount: 160,            // € parados en imaginTeens, al 0 %
    houseDown: 30000,               // entrada de ejemplo: 20 % de un piso de 150.000 €
    moves: [
        { d: "Bocadillo en el insti", a: 2.4, cat: "Comida" },
        { d: "Cine con amigos", a: 7.5, cat: "Ocio" },
        { d: "Bizum a Álvaro", a: 5, cat: "Amigos" },
        { d: "Camiseta", a: 19.95, cat: "Ropa" },
        { d: "Refresco y patatas", a: 3.2, cat: "Comida" },
        { d: "Recarga del bus", a: 10, cat: "Transporte" },
        { d: "Videojuego (oferta)", a: 4.99, cat: "Ocio" },
        { d: "Bocadillo en el insti", a: 2.4, cat: "Comida" },
    ],
};

const SOURCES = {
    premio: { label: "Premio del teórico", own: true },
    paga: { label: "De tu paga", own: true },
    redondeo: { label: "Redondeo de compras", own: true },
    verano: { label: "Trabajo de verano", own: true },
    otro: { label: "Otro ingreso tuyo", own: true },
    regalo: { label: "Regalo", own: false },
    mensual: { label: "Aportación de la familia", own: false },
};

/* ---------------------------------------------------------------- El teórico (5 temas) */
const LESSONS = [
    { id: "invertir", title: "Ahorrar o invertir", sub: "Por qué empezar a los 15 es tu mayor ventaja", min: 3,
      cards: [
        { h: "Guardar no es lo mismo que poner a trabajar", p: [
            "<b>Ahorrar</b> es apartar dinero para más adelante. Sabes cuánto tendrás, pero apenas crece.",
            "<b>Invertir</b> es comprar una parte de empresas, bonos o edificios que pueden crecer. A cambio de poder ganar más, aceptas que el valor suba y baje." ] },
        { h: "El interés compuesto", p: [
            "Cuando inviertes, ganas sobre lo que pones… y también sobre lo que ya has ganado. Es una bola de nieve.",
            "Mueve los controles y mira qué pasa." ], viz: "compound" },
        { h: "El tiempo pesa más que la cantidad", p: [
            "Quien empieza a los 15 con 20 € al mes puede acabar con más que quien empieza a los 25 con el doble. No hace falta mucho dinero: hace falta tiempo.",
            "Por eso tu carnet empieza ahora y no cuando tengas nómina." ] },
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
    { id: "carnet", title: "Cómo funciona tu carnet", sub: "Premio, año sin perder, millas de casa y Antídoto", min: 2,
      cards: [
        { h: "Tu primer euro se gana", p: [
            `Al aprobar este teórico, CaixaBank ingresa <b>${RULES.prize} €</b> invertidos a tu nombre. No es un regalo: te lo has ganado.`,
            "Después, el objetivo es que pongas tu <b>primer euro propio</b>: de tu paga, del redondeo de tus compras o de un trabajo de verano." ] },
        { h: "Las prácticas, con doble pedal", p: [
            `Durante tus primeros 12 meses, los primeros <b>${RULES.protectCap} €</b> que inviertes tú no pueden perder. Si al cumplir el año valen menos, CaixaBank pone la diferencia.`,
            "Solo cuenta si no vendes antes de los 12 meses." ] },
        { h: "Millas de casa", p: [
            "Cada tema que apruebas, cada mes que aportas y cada regalo de tu familia suman <b>millas de casa</b>.",
            "Años después se convierten en una rebaja del interés de tu primera hipoteca con CaixaBank. No caducan." ] },
      ],
      check: [
        { q: "¿Qué protege el primer año sin perder?", o: ["Todo tu dinero para siempre", "Tus primeros 500 € durante 12 meses, si no vendes", "Solo el dinero que te regalan"], a: 1, why: "Es una protección con tope: 500 € y 12 meses, si no vendes antes." },
        { q: "¿Para qué sirven las millas de casa?", o: ["Para viajar gratis", "Para rebajar el interés de tu futura hipoteca", "Para comprar videojuegos"], a: 1, why: "Se canjean en una hipoteca con CaixaBank como rebaja del diferencial." },
      ] },
];

/* Banco de preguntas del examen final */
const EXAM = [
    ...LESSONS.flatMap(l => l.check),
    { q: "Necesitas el dinero para el viaje de fin de curso dentro de 6 meses. ¿Dónde tiene más sentido?", o: ["En bolsa, para que crezca más", "En un sitio estable y disponible", "En criptomonedas"], a: 1, why: "A corto plazo una caída podría coincidir justo con el momento en que lo necesitas." },
    { q: "Con 20 € al mes desde los 15 o 40 € al mes desde los 25, ¿quién suele llegar más lejos a los 50?", o: ["Siempre el de 40 €", "El que empieza a los 15 puede llegar a más", "Los dos igual"], a: 1, why: "Diez años más de interés compuesto pueden compensar aportar la mitad." },
    { q: "¿Qué parte de tu dinero va al Antídoto?", o: ["Todo", "Una parte, por ejemplo el 25 %", "Nada, es solo un juego"], a: 1, why: "La base global (75 %) reparte el riesgo; el Antídoto es una parte." },
    { q: "El Antídoto invierte en lo que te da miedo. ¿Qué garantiza?", o: ["Que nunca pierdas", "Nada: reduce el golpe, no es una garantía", "Que ganes el doble"], a: 1, why: "Si lo que temes pasa, esa parte tiende a subir, pero no hay garantías." },
    { q: "Las comisiones de un fondo…", o: ["No importan", "Se cobran cada año y se acumulan con el tiempo", "Solo se pagan al principio"], a: 1, why: "Un punto al año de diferencia puede suponer bastante menos dinero tras muchos años." },
];
