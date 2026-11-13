"use strict";
/* Horizonte · Conecta: tu dinero, en el mundo real
   - Tu voz: desliza sobre propuestas de junta de accionistas y dile a la gestora qué prefieres (consultivo).
   - Tu calle: caza con la cámara las empresas cotizadas que tienes cerca (mapa de OpenStreetMap), gana puntos y descubre cómo podrías ser dueño de un trocito.
   - Tu proyecto: cuenta tu proyecto en privado y encuentra empresas asociadas que podrían apoyarlo.
   Se carga antes que app.js: sus utilidades solo se usan dentro de funciones. */

/* ---------- Tu voz ---------- */
const VOZ = [
    { id: "bonus-clima", e: "⚡", co: "Una energética europea", t: "Que el bonus del consejero delegado dependa de reducir emisiones",
      d: "Una parte del sueldo variable del CEO solo se cobraría si la empresa recorta sus emisiones un 30 % antes de 2030.",
      why: "Ata lo que cobra quien dirige a un objetivo de largo plazo. Quien está en contra dice que puede frenar decisiones de negocio." },
    { id: "sueldo-ceo", e: "💻", co: "Una gran tecnológica de EE. UU.", t: "Subir un 40 % el sueldo del consejero delegado",
      d: "El consejo propone la subida tras un año de beneficios récord. La votación sobre sueldos de directivos es consultiva en muchas juntas.",
      why: "Pagar bien puede retener talento, pero sueldos muy altos restan beneficio que podría ir a los accionistas o a la plantilla." },
    { id: "recompra", e: "🏦", co: "Un banco español", t: "Recomprar acciones en vez de subir el dividendo",
      d: "La empresa usaría 1.000 millones en comprar sus propias acciones en lugar de repartir más dividendo.",
      why: "Recomprar reduce el número de acciones y puede subir su precio; el dividendo te da dinero en mano ahora." },
    { id: "consejo", e: "👕", co: "Una cadena de moda", t: "Que la mitad del consejo sean consejeros independientes",
      d: "Hoy la mayoría del consejo está ligada a los accionistas fundadores.",
      why: "Los independientes vigilan que se decida pensando en todos los accionistas, no solo en los grandes." },
    { id: "ia-datos", e: "📱", co: "Una red social", t: "Publicar cada año cómo usa la IA con los datos de sus usuarios",
      d: "Un grupo de accionistas pide un informe anual sobre inteligencia artificial, privacidad y riesgos.",
      why: "La transparencia reduce el riesgo de multas y escándalos. La empresa dice que ya cumple la ley." },
    { id: "brecha", e: "🛒", co: "Una cadena de supermercados", t: "Publicar la brecha salarial entre hombres y mujeres",
      d: "La propuesta pide datos por categoría profesional y un plan para cerrarla.",
      why: "Medirla es el primer paso para corregirla; el consejo argumenta que ya publica datos agregados." },
    { id: "proveedores", e: "🔋", co: "Un fabricante de móviles", t: "Auditar las condiciones laborales de sus proveedores",
      d: "Auditorías independientes en las fábricas que montan sus productos, con resultados públicos.",
      why: "Problemas en la cadena de suministro pueden acabar en boicots y caídas en bolsa." },
    { id: "id-dividendo", e: "💊", co: "Una farmacéutica", t: "Dedicar más beneficio a investigación y menos a dividendos",
      d: "El dividendo bajaría un 20 % durante tres años para financiar nuevos medicamentos.",
      why: "Menos dinero hoy a cambio de posibles productos que hagan crecer la empresa mañana." }
];
const VOZ_LABEL = { a: "A favor", c: "En contra", s: "No lo tengo claro" };

/* ---------- Tu calle: caza de empresas cotizadas ---------- */
// m = cómo suelen llamarse sus locales en OpenStreetMap (se busca en name y en brand).
// pts: 10 muy común · 20 menos común · 30 rara. no:true = famosa pero NO cotiza (lección sorpresa).
const CAZA = [
    { id: "inditex", n: "Inditex", tk: "ITX", sec: "Moda", reg: "es", mk: "la Bolsa de Madrid", idx: "IBEX 35 y Euro Stoxx 50", pts: 10, m: "Zara|Pull ?& ?Bear|Bershka|Massimo Dutti|Stradivarius|Oysho|Lefties",
      where: "una tienda Zara, Bershka o Pull&Bear", fact: "Es la dueña de Zara, Bershka, Pull&Bear o Massimo Dutti. Renueva las tiendas casi cada semana y fabrica buena parte de la ropa cerca de España para reaccionar rápido a lo que se vende." },
    { id: "santander", n: "Santander", tk: "SAN", sec: "Banca", reg: "es", mk: "la Bolsa de Madrid", idx: "IBEX 35 y Euro Stoxx 50", pts: 10, m: "Banco Santander|Santander",
      where: "una oficina del Banco Santander", fact: "Es un banco español, pero gran parte de lo que gana llega de fuera: Reino Unido, Brasil, México, EE. UU. Que una empresa sea de aquí no significa que dependa solo de aquí." },
    { id: "bbva", n: "BBVA", tk: "BBVA", sec: "Banca", reg: "es", mk: "la Bolsa de Madrid", idx: "IBEX 35 y Euro Stoxx 50", pts: 10, m: "BBVA",
      where: "una oficina de BBVA", fact: "Una parte enorme de su beneficio viene de México. Cuando una empresa depende tanto de otro país, ese país también te afecta a ti como accionista." },
    { id: "caixabank", n: "CaixaBank", tk: "CABK", sec: "Banca", reg: "es", mk: "la Bolsa de Madrid", idx: "IBEX 35", pts: 10, m: "CaixaBank|la Caixa",
      where: "una oficina de CaixaBank", fact: "Es el banco con más clientes de España. Su accionista principal, la Fundación «la Caixa», destina parte del dividendo que cobra a programas sociales." },
    { id: "sabadell", n: "Sabadell", tk: "SAB", sec: "Banca", reg: "es", mk: "la Bolsa de Madrid", idx: "IBEX 35", pts: 10, m: "Banco Sabadell|Sabadell",
      where: "una oficina del Banco Sabadell", fact: "Un fallo informático en el banco británico que compró le costó cientos de millones en 2018. Los riesgos operativos también cuentan, aunque no salgan en una gráfica." },
    { id: "bankinter", n: "Bankinter", tk: "BKT", sec: "Banca", reg: "es", mk: "la Bolsa de Madrid", idx: "IBEX 35", pts: 20, m: "Bankinter",
      where: "una oficina de Bankinter", fact: "Es un banco mediano con pocas oficinas y mucha tecnología: consigue unos beneficios altos para su tamaño. Ser grande no es lo único que importa." },
    { id: "mapfre", n: "Mapfre", tk: "MAP", sec: "Seguros", reg: "es", mk: "la Bolsa de Madrid", idx: "IBEX 35", pts: 20, m: "Mapfre",
      where: "una oficina de seguros de Mapfre", fact: "Las aseguradoras cobran las primas hoy y pagan los siniestros mañana. Mientras tanto invierten ese dinero, y parte de su beneficio sale de ahí." },
    { id: "movistar", n: "Movistar", co: "Telefónica", tk: "TEF", sec: "Telefonía", reg: "es", mk: "la Bolsa de Madrid", idx: "IBEX 35", pts: 10, m: "Movistar|Telefónica|Telefonica",
      where: "una tienda Movistar", fact: "Sus ingresos son cuotas mensuales de móvil, fibra y televisión: muy estables. A cambio, tiene que invertir sin parar en redes de fibra y 5G." },
    { id: "repsol", n: "Repsol", tk: "REP", sec: "Energía", reg: "es", mk: "la Bolsa de Madrid", idx: "IBEX 35", pts: 10, m: "Repsol",
      where: "una gasolinera Repsol", fact: "Gana mucho cuando sube el petróleo y sufre cuando baja. Por eso su dividendo y su cotización suben y bajan con el precio del crudo." },
    { id: "endesa", n: "Endesa", tk: "ELE", sec: "Energía", reg: "es", mk: "la Bolsa de Madrid", idx: "IBEX 35", pts: 20, m: "Endesa",
      where: "una tienda o punto de atención de Endesa", fact: "Cerca del 70 % de Endesa es de la italiana Enel, que también cotiza. Una empresa cotizada puede ser dueña de otra cotizada." },
    { id: "iberdrola", n: "Iberdrola", tk: "IBE", sec: "Energía", reg: "es", mk: "la Bolsa de Madrid", idx: "IBEX 35 y Euro Stoxx 50", pts: 20, m: "Iberdrola",
      where: "una oficina de Iberdrola", fact: "Es una eléctrica española, pero buena parte de sus beneficios vienen de fuera: Reino Unido, EE. UU. y Brasil. Y apuesta fuerte por redes y renovables." },
    { id: "melia", n: "Meliá", tk: "MEL", sec: "Viajes", reg: "es", mk: "la Bolsa de Madrid", idx: "", pts: 20, m: "Meliá|Melia|ME by Meliá|ME by Melia",
      where: "un hotel Meliá", fact: "Cada vez gestiona más hoteles que no son suyos y cobra una comisión: crece sin tener que comprar edificios. El turismo le va bien o mal según el mundo viaje más o menos." },
    { id: "dia", n: "Dia", tk: "DIA", sec: "Supermercados", reg: "es", mk: "la Bolsa de Madrid", idx: "", pts: 10, m: "Dia",
      where: "un supermercado Dia", fact: "Un supermercado gana unos pocos céntimos por cada euro que vende, así que vive de que entre mucha gente cada día. Con márgenes tan pequeños, cualquier error de gestión se nota." },
    { id: "carrefour", n: "Carrefour", tk: "CA", sec: "Supermercados", reg: "eu", mk: "Euronext París", idx: "CAC 40", pts: 10, m: "Carrefour",
      where: "un Carrefour", fact: "Se sigue comprando comida en las crisis, así que los supermercados se consideran empresas defensivas: sus ventas bajan poco cuando la economía va mal." },
    { id: "mcdonalds", n: "McDonald's", tk: "MCD", sec: "Comida rápida", reg: "us", mk: "la Bolsa de Nueva York", idx: "S&P 500", pts: 10, m: "McDonald.?s|Mc Donald.?s",
      where: "un McDonald's", fact: "La mayoría de sus restaurantes son de franquiciados que le pagan un porcentaje de las ventas y, muchas veces, el alquiler del local. Parte de su negocio es casi inmobiliario." },
    { id: "burgerking", n: "Burger King", co: "Restaurant Brands International", tk: "QSR", sec: "Comida rápida", reg: "us", mk: "la Bolsa de Nueva York", idx: "", pts: 10, m: "Burger King",
      where: "un Burger King", fact: "Burger King pertenece a Restaurant Brands, que también tiene Tim Hortons y Popeyes. Casi todos los locales son de franquiciados que pagan un canon por usar la marca." },
    { id: "kfc", n: "KFC", co: "Yum! Brands", tk: "YUM", sec: "Comida rápida", reg: "us", mk: "la Bolsa de Nueva York", idx: "S&P 500", pts: 20, m: "KFC|Kentucky Fried Chicken",
      where: "un KFC", fact: "KFC es de Yum! Brands, que también tiene Pizza Hut y Taco Bell. Casi el 100 % de los locales son franquicias: la empresa cobra royalties y no carga con los restaurantes." },
    { id: "dominos", n: "Domino's", tk: "DPZ", sec: "Comida rápida", reg: "us", mk: "la Bolsa de Nueva York", idx: "", pts: 20, m: "Domino.?s Pizza|Domino.?s|Dominos",
      where: "una pizzería Domino's", fact: "Presume de ser casi una empresa tecnológica: en EE. UU. la mayor parte de sus pedidos son digitales. Su ventaja no es la masa, es la logística y la app." },
    { id: "starbucks", n: "Starbucks", tk: "SBUX", sec: "Cafeterías", reg: "us", mk: "Nasdaq", idx: "S&P 500", pts: 10, m: "Starbucks",
      where: "una cafetería Starbucks", fact: "Gana mucho más con bebidas personalizadas que con el café en sí. Y su app guarda saldo prepagado de clientes por más de mil millones de dólares." },
    { id: "apple", n: "Apple", tk: "AAPL", sec: "Tecnología", reg: "us", mk: "Nasdaq", idx: "S&P 500", pts: 30, m: "Apple Store|Apple$",
      where: "una Apple Store", fact: "El iPhone es lo que ves en la tienda, pero casi una cuarta parte de sus ingresos ya son servicios: App Store, iCloud, suscripciones. Es lo que más crece y más margen deja." },
    { id: "amazon", n: "Amazon", tk: "AMZN", sec: "Tecnología", reg: "us", mk: "Nasdaq", idx: "S&P 500", pts: 20, m: "Amazon",
      where: "una taquilla Amazon Locker o una tienda Amazon", fact: "Las taquillas de paquetes son la parte visible. Gran parte de su beneficio viene de AWS, la nube que alquila a otras empresas, no de vender productos." },
    { id: "tesla", n: "Tesla", tk: "TSLA", sec: "Motor", reg: "us", mk: "Nasdaq", idx: "S&P 500", pts: 30, m: "Tesla",
      where: "una tienda o supercargador de Tesla", fact: "Ha llegado a valer en bolsa más que muchos fabricantes juntos pese a vender muchos menos coches: la bolsa paga por el futuro que espera, no por el pasado." },
    { id: "nike", n: "Nike", tk: "NKE", sec: "Deporte", reg: "us", mk: "la Bolsa de Nueva York", idx: "S&P 500", pts: 20, m: "Nike",
      where: "una tienda Nike", fact: "Diseña y vende, pero casi no fabrica: encarga la producción a fábricas de terceros, sobre todo en Asia. Su gran activo es la marca." },
    { id: "adidas", n: "Adidas", tk: "ADS", sec: "Deporte", reg: "eu", mk: "la Bolsa de Fráncfort", idx: "DAX", pts: 20, m: "adidas",
      where: "una tienda Adidas", fact: "Gasta una parte enorme en marketing y patrocinios deportivos, porque su principal activo es la marca. Cuando una marca se resiente, se nota en bolsa." },
    { id: "hm", n: "H&M", tk: "HM-B", sec: "Moda", reg: "eu", mk: "la Bolsa de Estocolmo", idx: "", pts: 10, m: "H ?& ?M",
      where: "una tienda H&M", fact: "Moda rápida: prendas baratas y mucha rotación. Su gran riesgo es quedarse con ropa sin vender, que hay que rebajar y recorta el beneficio." },
    { id: "primark", n: "Primark", co: "Associated British Foods", tk: "ABF", sec: "Moda", reg: "eu", mk: "la Bolsa de Londres", idx: "FTSE 100", pts: 20, m: "Primark",
      where: "una tienda Primark", fact: "Primark es de Associated British Foods, un grupo que también hace azúcar y alimentos. Casi no vende por internet y gasta poco en publicidad para mantener precios bajos." },
    { id: "lvmh", n: "LVMH", tk: "MC", sec: "Lujo y belleza", reg: "eu", mk: "la Bolsa de París", idx: "CAC 40 y Euro Stoxx 50", pts: 20, m: "Sephora|Louis Vuitton|Christian Dior|Dior|Loewe|Tiffany.*|Bulgari|Fendi|Celine|Givenchy|Kenzo",
      where: "una tienda Sephora, Louis Vuitton, Dior o Loewe", fact: "LVMH es dueña de Louis Vuitton, Dior, Loewe, Tiffany o Sephora. En lujo, vender menos pero más caro deja más margen, y depende mucho de turistas y clientes de Asia." },
    { id: "shell", n: "Shell", tk: "SHEL", sec: "Energía", reg: "eu", mk: "la Bolsa de Londres", idx: "FTSE 100", pts: 10, m: "Shell",
      where: "una gasolinera Shell", fact: "Las petroleras ganan mucho cuando sube el crudo y sufren cuando baja. Shell reparte buena parte del beneficio en dividendos y recompra de acciones." },
    { id: "bp", n: "BP", tk: "BP", sec: "Energía", reg: "eu", mk: "la Bolsa de Londres", idx: "FTSE 100", pts: 10, m: "BP",
      where: "una gasolinera BP", fact: "El vertido del Golfo de México en 2010 le costó decenas de miles de millones: un riesgo que no se ve en la gráfica hasta que ocurre." },
    { id: "total", n: "TotalEnergies", tk: "TTE", sec: "Energía", reg: "eu", mk: "la Bolsa de París", idx: "CAC 40 y Euro Stoxx 50", pts: 20, m: "TotalEnergies|Total Energies",
      where: "una gasolinera TotalEnergies", fact: "Es una petrolera francesa que invierte cada vez más en electricidad y renovables sin dejar el petróleo: una empresa en plena transición." },
    // Famosas que no cotizan: no se pueden comprar en bolsa
    { id: "mercadona", n: "Mercadona", tk: "—", sec: "Supermercados", no: true, pts: 5, m: "Mercadona",
      where: "un Mercadona", fact: "Es la mayor cadena de supermercados de España y no cotiza: pertenece sobre todo a la familia Roig. No hay acciones suyas que comprar en bolsa." },
    { id: "corteingles", n: "El Corte Inglés", tk: "—", sec: "Grandes almacenes", no: true, pts: 5, m: "El Corte Ingl.s",
      where: "un El Corte Inglés", fact: "Es una empresa enorme, pero no cotiza en bolsa: sus acciones no se compran ni se venden como las de Inditex." },
    { id: "lidl", n: "Lidl", tk: "—", sec: "Supermercados", no: true, pts: 5, m: "Lidl",
      where: "un Lidl", fact: "Pertenece a Schwarz, un grupo familiar alemán que no cotiza en bolsa. Vende lo mismo que Dia o Carrefour, pero tú no puedes ser accionista." },
    { id: "aldi", n: "Aldi", tk: "—", sec: "Supermercados", no: true, pts: 5, m: "Aldi",
      where: "un Aldi", fact: "Aldi es un grupo familiar alemán que tampoco cotiza. Un negocio puede ser enorme y no estar al alcance de quien invierte en bolsa." }
];
const CAZA_R = 150, CAZA_AREA = 900;
const CAZA_API = ["https://overpass.openstreetmap.fr/api/interpreter", "https://overpass-api.de/api/interpreter", "https://lz4.overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const CAZA_LV = [["Aprendiz", 0], ["Analista", 40], ["Estratega", 120], ["Referente", 250], ["Leyenda", 450]];
const CAZA_OWN = { es: "un fondo de bolsa española o europea", us: "un fondo indexado al S&amp;P 500 o de bolsa mundial", eu: "un fondo de bolsa europea o mundial" };
const CAZA_DEMO = { lat: 40.41694, lon: -3.70351, nombre: "la Puerta del Sol (Madrid)" };
const LEAFLET = "https://unpkg.com/leaflet@1.9.4/dist/leaflet";
CAZA.forEach(c => { c.re = new RegExp(`^(${c.m})([^A-Za-z].*)?$`, "i"); });

/* ---------- Tu proyecto ---------- */
const PJ_SECTORS = { sostenibilidad: "Sostenibilidad y energía", tecnologia: "Tecnología y apps", salud: "Salud y bienestar", educacion: "Educación", social: "Impacto social", moda: "Moda y consumo", comida: "Alimentación", cultura: "Cultura y ocio" };
const PJ_NEEDS = { financiacion: "Financiación", mentoria: "Mentoría", clientes: "Primeros clientes", socio: "Socio tecnológico" };
const PJ_STAGES = { idea: "Es una idea", prototipo: "Tengo un prototipo", marcha: "Ya está en marcha" };
// Empresas de ejemplo para el prototipo (ficticias)
const PJ_PARTNERS = [
    { id: "p1", n: "Vatio Lab", e: "🌱", sec: ["sostenibilidad"], needs: ["financiacion", "mentoria"], stages: ["prototipo", "marcha"], d: "Programa de aceleración de una energética para proyectos de clima y energía." },
    { id: "p2", n: "Código Abierto Ventures", e: "💻", sec: ["tecnologia", "educacion"], needs: ["financiacion", "socio"], stages: ["prototipo", "marcha"], d: "Fondo que invierte en apps y software creados por menores de 30." },
    { id: "p3", n: "Fundación Raíces", e: "🤝", sec: ["social", "educacion"], needs: ["mentoria", "financiacion"], stages: ["idea", "prototipo"], d: "Becas y mentoría para proyectos con impacto social en barrios y pueblos." },
    { id: "p4", n: "Mercado Nuevo", e: "🛍️", sec: ["moda", "comida"], needs: ["clientes"], stages: ["prototipo", "marcha"], d: "Cadena de tiendas que prueba productos de marcas jóvenes en sus estanterías." },
    { id: "p5", n: "Pulso Salud", e: "💊", sec: ["salud"], needs: ["socio", "mentoria", "clientes"], stages: ["prototipo", "marcha"], d: "Grupo sanitario que busca soluciones digitales para pacientes y hospitales." },
    { id: "p6", n: "Escena", e: "🎭", sec: ["cultura"], needs: ["financiacion", "clientes"], stages: ["idea", "prototipo", "marcha"], d: "Productora que apoya proyectos culturales, musicales y de contenido digital." },
    { id: "p7", n: "Huerta Futura", e: "🥕", sec: ["comida", "sostenibilidad"], needs: ["clientes", "mentoria"], stages: ["idea", "prototipo"], d: "Cooperativa agroalimentaria abierta a ideas de alimentación sostenible." },
    { id: "p8", n: "Aula Siguiente", e: "📚", sec: ["educacion", "tecnologia"], needs: ["clientes", "socio"], stages: ["prototipo", "marcha"], d: "Red de academias que pilota herramientas educativas en sus aulas." }
];

/* ---------- estado ---------- */
let cx = { tab: "voz", i: 0, last: null, totals: null, drag: null, pend: null, leaf: null, caza: { st: "idle", pos: null, places: [], msg: "", map: null } };
function cxState() {
    if (!S.conecta || typeof S.conecta !== "object") S.conecta = {};
    const c = S.conecta;
    c.votes ||= {}; c.project ||= null; c.requests ||= {};
    if (!c.caza || typeof c.caza !== "object") c.caza = {};
    c.caza.found ||= {}; c.caza.pts = +c.caza.pts || 0;
    return c;
}
const cxIco = (txt, cls = "") => `<i class="ico ${cls}" aria-hidden="true">${txt}</i>`;
const cxCode = n => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z ]/g, "").slice(0, 3).toUpperCase();
const pjInit = n => n.split(" ").filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join("").toUpperCase();
function voterId() { let v = lsGet("hz_voter"); if (!v) { v = uid() + uid(); lsSet("hz_voter", v); } return v; }

function pjMatches(p) {
    return PJ_PARTNERS.map(x => {
        const sec = x.sec.includes(p.sector), needs = p.needs.filter(n => x.needs.includes(n)), stage = x.stages.includes(p.stage);
        const score = Math.min(98, (sec ? 55 : 0) + needs.length * 15 + (stage ? 10 : 0) + (needs.length ? 5 : 0));
        const why = [sec && `trabaja en ${PJ_SECTORS[p.sector].toLowerCase()}`, needs.length && `ofrece ${needs.map(n => PJ_NEEDS[n].toLowerCase()).join(" y ")}`, stage && "apoya proyectos en tu fase"].filter(Boolean);
        return { ...x, score, why };
    }).filter(x => x.score >= 50).sort((a, b) => b.score - a.score).slice(0, 3);
}

/* =========================================================
   Vista
========================================================= */
function viewConecta() {
    const tabs = [["voz", "Tu voz"], ["calle", "Tu calle"], ["proyecto", "Tu proyecto"]];
    return `<section class="section"><div class="sec-head"><div><p class="kicker">Conecta</p><h2>Tu dinero, en el mundo real</h2>
        <p>Invertir no es mirar una gráfica: es ser dueño de un trocito de las empresas que usas, opinar sobre lo que hacen y que tus ideas encuentren quien las apoye.</p></div></div>
        <div class="opts cx-tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${cx.tab === k}" class="${cx.tab === k ? "on" : ""}" data-act="cxTab" data-v="${k}">${l}</button>`).join("")}</div>
        <div id="cxBody">${{ voz: vozHTML, calle: calleHTML, proyecto: pjHTML }[cx.tab]()}</div>
    </section>`;
}
function cxPaint() { const b = $("#cxBody"); if (b) { b.innerHTML = { voz: vozHTML, calle: calleHTML, proyecto: pjHTML }[cx.tab](); if (cx.tab === "calle") cazaMountMap(); } }
function mountConecta() { if (cx.tab === "voz" && !cx.totals) loadVoz(); if (cx.tab === "calle") cazaMountMap(); }

/* ---------- Tu voz ---------- */
// Con Supabase los votos se suman con dos funciones SQL; sin él, con el servidor local.
const vozApi = {
    totals: async () => SB ? sbFetch("/rest/v1/rpc/totales_voz", { method: "POST", body: {} }) : (await api("/voz")).totals,
    vote: async (id, v) => {
        if (!SB) return (await api(`/voz/${id}`, { method: "POST", body: { v, voter: voterId() } })).totals;
        if (!sbSess) throw new Error("Sin sesión");
        return sbRpc("votar_voz", { p_propuesta: id, p_voto: v });
    }
};
async function loadVoz() {
    try { cx.totals = await vozApi.totals(); }
    catch { cx.totals = {}; cx.offline = true; }
    if (cx.tab === "voz" && route() === "conecta") cxPaint();
}
function vozResult(id, mine) {
    const t = { a: 0, c: 0, s: 0, ...(cx.totals?.[id] || {}) };
    if (cx.offline && mine) t[mine] = Math.max(t[mine], 1);
    const n = t.a + t.c + t.s || 1;
    return `<div class="vz-res">${["a", "c", "s"].map(k => `<div class="${k === mine ? "me" : ""}"><span>${VOZ_LABEL[k]}${k === mine ? " · tú" : ""}</span><i style="width:${Math.round(t[k] / n * 100)}%"></i><b>${Math.round(t[k] / n * 100)} %</b></div>`).join("")}</div>
        <p class="small muted">${cx.offline ? (SB && !sbSess ? "Accede con tu cuenta para sumar tu voto al de los demás." : "Sin conexión con el servidor: solo cuenta tu voto.") : `${n} ${n === 1 ? "persona ha" : "personas han"} opinado en Horizonte.`}</p>`;
}
function vozHTML() {
    const st = cxState(), pending = VOZ.filter(v => !st.votes[v.id]);
    const done = VOZ.length - pending.length;
    const card = pending[0];
    const last = cx.last && VOZ.find(v => v.id === cx.last);
    return `<div class="cx-grid">
        <div>
            <p class="cx-intro">Cuando inviertes en un fondo, es la gestora quien vota en las juntas de accionistas de las empresas. Aquí le dices <b>qué preferirías tú</b>. Es una consulta: tu opinión se suma a la de los demás y la gestora la tiene en cuenta.</p>
            ${card ? `<div class="vz-stack">
                ${pending[1] ? `<div class="vz-card ghost" aria-hidden="true"></div>` : ""}
                <article class="vz-card" id="vzCard" data-id="${card.id}" tabindex="0" aria-label="Propuesta: ${esc(card.t)}">
                    <span class="vz-stamp a">A favor</span><span class="vz-stamp c">En contra</span>
                    <p class="vz-co">${card.co} · Junta de accionistas</p>
                    <h3>${card.t}</h3>
                    <p>${card.d}</p>
                    <p class="vz-why"><b>Por qué te importa:</b> ${card.why}</p>
                    <p class="vz-n">${done + 1} de ${VOZ.length}</p>
                </article>
            </div>
            <div class="vz-btns">
                <button class="btn quiet vz-c" data-act="vozVote" data-v="c">← En contra</button>
                <button class="btn quiet" data-act="vozVote" data-v="s">No lo tengo claro</button>
                <button class="btn quiet vz-a" data-act="vozVote" data-v="a">A favor →</button>
            </div>
            <p class="small muted cx-hint">Arrastra la tarjeta o usa las flechas del teclado. Propuestas de ejemplo; el voto es consultivo.</p>`
            : `<div class="panel cx-done"><h3>Has opinado sobre todas las propuestas</h3><p class="muted">Vuelve más adelante: en temporada de juntas llegarán nuevas.</p>
                <button class="btn quiet" data-act="vozReset">Volver a opinar</button></div>`}
        </div>
        ${last ? `<aside class="panel vz-side"><p class="kicker">Resultado</p><h3>${last.t}</h3>${vozResult(last.id, st.votes[last.id])}</aside>` : ""}
    </div>`;
}
async function vozVote(v) {
    const card = $("#vzCard");
    if (!card || card.dataset.busy) return;
    card.dataset.busy = "1";
    const id = card.dataset.id, st = cxState();
    card.classList.add(v === "a" ? "out-r" : v === "c" ? "out-l" : "out-d");
    st.votes[id] = v; save();
    cx.last = id;
    try { cx.totals = await vozApi.vote(id, v); cx.offline = false; }
    catch { cx.offline = true; }
    setTimeout(cxPaint, 260);
}

/* ---------- Tu calle: caza de empresas cotizadas ---------- */
const cazaDist = (a, b) => {
    const r = x => x * Math.PI / 180, R = 6371000, dl = r(b.lat - a.lat), dn = r(b.lon - a.lon);
    const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dn / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
};
const cazaFmt = m => m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`;
const cazaById = id => CAZA.find(c => c.id === id);
const cazaMatch = t => CAZA.find(c => c.re.test(t.name || "") || c.re.test(t.brand || ""));
const cazaPaint = () => { if (cx.tab === "calle" && route() === "conecta") cxPaint(); };
const cazaFotosKey = () => `hz_caza_fotos_${user ? user.id : "guest"}`;
const cazaFotos = () => lsGet(cazaFotosKey(), {});
function cazaFotoSet(id, url) { const f = cazaFotos(); f[id] = url; lsSet(cazaFotosKey(), f); }
function cazaLevel(pts) {
    let i = 0; CAZA_LV.forEach(([, from], j) => { if (pts >= from) i = j; });
    const nx = CAZA_LV[i + 1], from = CAZA_LV[i][1];
    return { i, name: CAZA_LV[i][0], next: nx ? nx[1] : null, nextName: nx ? nx[0] : "", pct: nx ? Math.round((pts - from) / (nx[1] - from) * 100) : 100 };
}

/* búsqueda de locales cercanos con OpenStreetMap (Overpass) */
function cazaQuery(lat, lon) {
    const re = `^(${CAZA.map(c => c.m).join("|")})([^A-Za-z].*)?$`;
    const kv = `[~"^(shop|amenity|office|tourism)$"~"."]`, at = `(around:${CAZA_AREA},${lat},${lon})`;
    return `[out:json][timeout:25];(nwr${kv}["name"~"${re}",i]${at};nwr${kv}["brand"~"${re}",i]${at};);out center tags 400;`;
}
// Los servidores públicos de Overpass se saturan a menudo: se prueban por turnos y gana el primero que responde.
function cazaFetch(lat, lon) {
    const key = `${lat},${lon}`, hit = cx.cache && cx.cache.get(key);
    if (hit && Date.now() - hit.t < 600000) return Promise.resolve(hit.els);
    const body = "data=" + encodeURIComponent(cazaQuery(lat, lon)), ctl = new AbortController(), timers = [];
    return new Promise((ok, ko) => {
        let done = false, next = 0, fails = 0;
        const finish = (fn, v) => { if (done) return; done = true; timers.forEach(clearTimeout); ctl.abort(); fn(v); };
        const launch = () => {
            if (done || next >= CAZA_API.length) return;
            const url = CAZA_API[next++], tm = setTimeout(launch, 3500);
            timers.push(tm);
            fetch(url, { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: ctl.signal })
                .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
                .then(d => {
                    if (!Array.isArray(d.elements)) throw new Error("sin datos");
                    (cx.cache ||= new Map()).set(key, { t: Date.now(), els: d.elements });
                    finish(ok, d.elements);
                })
                .catch(e => { if (done) return; clearTimeout(tm); if (++fails >= CAZA_API.length) finish(ko, e); else launch(); });
        };
        timers.push(setTimeout(() => finish(ko, new Error("tiempo agotado")), 30000));
        launch();
    });
}
function cazaBuild(els, pos) {
    const out = [];
    for (const e of els) {
        const t = e.tags || {}, co = cazaMatch(t), p = e.type === "node" ? e : e.center;
        if (!co || !p || p.lat == null) continue;
        if (out.some(o => o.co === co && cazaDist(o, p) < 25)) continue;      // el mismo local como punto y como edificio
        out.push({ co, name: t.name || t.brand || co.n, lat: p.lat, lon: p.lon, d: cazaDist(pos, p) });
    }
    return out.filter(o => o.d <= CAZA_AREA + 100).sort((a, b) => a.d - b.d).slice(0, 120);
}
function cazaGroups() {
    const g = new Map();
    cx.caza.places.forEach((p, i) => { const s = g.get(p.co.id); if (s) s.n++; else g.set(p.co.id, { p, i, n: 1 }); });
    return [...g.values()];
}
function cazaLocate() {
    const z = cx.caza;
    if (!navigator.geolocation) { z.st = "error"; z.msg = "Tu navegador no permite saber dónde estás. Prueba la zona de ejemplo o caza sin ubicación."; return cazaPaint(); }
    z.st = "locating"; cazaPaint();
    navigator.geolocation.getCurrentPosition(
        g => { z.pos = { lat: g.coords.latitude, lon: g.coords.longitude, acc: g.coords.accuracy, t: Date.now() }; cazaSearch(); },
        er => { z.st = "error"; z.msg = er.code === 1 ? "No has dado permiso de ubicación. Actívalo en el navegador (el candado junto a la dirección) o prueba la zona de ejemplo." : "No hemos podido saber dónde estás. Inténtalo otra vez o usa la zona de ejemplo."; cazaPaint(); },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
}
async function cazaSearch() {
    const z = cx.caza, pos = z.pos;
    z.st = "searching"; cazaPaint();
    try {
        // al servicio de mapas solo le llega una ubicación aproximada (redondeada a ~100 m)
        const els = await cazaFetch(Math.round(pos.lat * 1000) / 1000, Math.round(pos.lon * 1000) / 1000);
        z.places = cazaBuild(els, pos); z.st = "done";
    } catch { z.st = "error"; z.msg = "No hemos podido consultar el mapa abierto ahora mismo. Inténtalo de nuevo en un minuto."; }
    cazaPaint();
}

/* mapa (Leaflet se carga solo cuando se busca por primera vez) */
function cazaLeaflet() {
    if (window.L) return Promise.resolve();
    return cx.leaf ||= new Promise((ok, ko) => {
        const css = Object.assign(document.createElement("link"), { rel: "stylesheet", href: LEAFLET + ".css", integrity: "sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H", crossOrigin: "" });
        const js = Object.assign(document.createElement("script"), { src: LEAFLET + ".js", integrity: "sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH", crossOrigin: "", onload: ok, onerror: () => { cx.leaf = null; ko(new Error("leaflet")); } });
        document.head.append(css, js);
    });
}
async function cazaMountMap() {
    const z = cx.caza, el = $("#czMap");
    if (!el || !z.pos) return;
    try { await cazaLeaflet(); } catch { if ($("#czMap") === el) el.outerHTML = `<p class="small muted">No hemos podido cargar el mapa. La lista funciona igual.</p>`; return; }
    if ($("#czMap") !== el) return;                                           // se repintó mientras cargaba
    try { z.map?.remove(); } catch { /* el contenedor anterior ya no existe */ }
    const k = cxState().caza, me = [z.pos.lat, z.pos.lon];
    const map = z.map = L.map(el, { scrollWheelZoom: false, worldCopyJump: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
    L.circle(me, { radius: CAZA_R, color: "#0a84ff", weight: 1.5, dashArray: "4 5", fillOpacity: .08 }).addTo(map);
    L.circleMarker(me, { radius: 8, color: "#fff", weight: 3, fillColor: "#0a84ff", fillOpacity: 1 }).addTo(map);
    const bounds = L.latLngBounds([me]);
    cazaGroups().forEach(({ p }) => {                                         // un pin por empresa: el local más cercano
        const cls = p.co.no ? "no" : k.found[p.co.id] ? "got" : "";
        L.marker([p.lat, p.lon], { keyboard: false, title: p.co.n, icon: L.divIcon({ className: `cz-pin ${cls}`, html: `<span>${esc(p.co.no ? "?" : p.co.tk)}</span>`, iconSize: [0, 0] }) })
            .on("click", () => cazaSheet(p)).addTo(map);
        bounds.extend([p.lat, p.lon]);
    });
    map.fitBounds(bounds.pad(.18), { maxZoom: 18 });
    setTimeout(() => map.invalidateSize(), 120);
}

/* vista */
function cazaSearchHTML() {
    const z = cx.caza, k = cxState().caza;
    const btns = `<div class="cz-btns"><button class="btn cx-cta" data-act="cazaLocate">Buscar cerca de mí</button><button class="btn quiet" data-act="cazaDemo">Probar en Madrid</button></div>
        <p class="small muted cz-alt">¿Ya has visto una? <button class="link" data-act="cazaManual">Cázala sin ubicación</button> (la foto cuenta la mitad).</p>`;
    if (z.st === "locating") return `<div class="cz-state"><span class="cz-spin"></span>Buscando tu ubicación…</div>`;
    if (z.st === "searching") return `<div class="cz-state"><span class="cz-spin"></span>Buscando empresas cerca de ti…</div>`;
    if (z.st === "error") return `<div class="cz-state err">${esc(z.msg)}</div>${btns}`;
    if (z.st !== "done") return btns;
    const groups = cazaGroups();
    const rows = groups.map(({ p, i, n }) => {
        const c = p.co, f = k.found[c.id];
        return `<button class="cz-row ${f ? "got" : ""}" data-act="cazaOpen" data-i="${i}"><span class="cz-tk ${c.no ? "no" : ""}">${c.no ? "?" : esc(c.tk)}</span>
            <span class="cz-main"><b>${esc(c.n)}</b><small>${esc(p.name !== c.n ? p.name : c.sec)}${n > 1 ? ` · ${n - 1} más por la zona` : ""}</small></span>
            <span class="cz-dist${p.d <= CAZA_R ? " near" : ""}">${cazaFmt(p.d)}</span><span class="cz-pts">${f ? "✓" : c.no ? "Ojo" : "+" + c.pts}</span></button>`;
    }).join("");
    return `<div class="row between cz-head"><b>Cerca de ${z.pos.fake ? CAZA_DEMO.nombre : "ti"}</b>
            <span class="small muted">${groups.length ? `${groups.length} empresa${groups.length === 1 ? "" : "s"} en ${cazaFmt(CAZA_AREA)}` : ""}</span>
            <button class="link" data-act="cazaLocate">${z.pos.fake ? "Usar mi ubicación" : "Actualizar"}</button></div>
        ${z.pos.fake ? `<p class="small muted">Zona de ejemplo: para sumar puntos completos tienes que estar a menos de ${CAZA_R} m del local, así que aquí la foto cuenta la mitad.</p>` : ""}
        ${groups.length ? `<div class="cz-map" id="czMap" role="img" aria-label="Mapa con las empresas cercanas"></div><div class="cz-list">${rows}</div>`
            : `<div class="cz-state">Ahora mismo no hay empresas del catálogo a menos de ${CAZA_AREA} m. Prueba en una calle comercial o en la zona de ejemplo.</div>`}
        <p class="small muted cz-alt">¿Ya has visto una? <button class="link" data-act="cazaManual">Cázala sin ubicación</button> (la foto cuenta la mitad).</p>`;
}
function calleHTML() {
    const k = cxState().caza, lv = cazaLevel(k.pts), real = CAZA.filter(c => !c.no), traps = CAZA.filter(c => c.no), fotos = cazaFotos();
    const got = real.filter(c => k.found[c.id]).length, gotT = traps.filter(c => k.found[c.id]).length;
    const card = c => { const f = k.found[c.id];
        return f ? `<button class="cl-card got" data-act="cazaAlbum" data-id="${c.id}">${fotos[c.id] ? `<img src="${fotos[c.id]}" alt="">` : `<span class="cl-e">${esc(c.tk)}</span>`}<b>${esc(c.n)}</b><small>${f.ok ? "Verificada" : "Sin verificar"}</small></button>`
            : `<button class="cl-card" data-act="cazaHint" data-id="${c.id}"><span class="cl-e">?</span><b>${esc(c.sec)}</b><small>Por descubrir</small></button>`; };
    return `<div class="cx-grid">
        <div>
            <p class="cx-intro">Las empresas de las que hablamos en Horizonte —las del IBEX 35, el S&amp;P 500…— están en tu calle. <b>Encuentra las que tienes cerca, hazles una foto</b> y gana puntos por descubrir cómo ganan dinero y cómo podrías ser dueño de un trocito.</p>
            <div class="cz-stats">
                <div class="cz-lv"><span class="cz-badge">${lv.i + 1}</span><div><b>${lv.name}</b><small>${k.pts} puntos${lv.next ? ` · ${lv.next - k.pts} para ser ${lv.nextName}` : " · nivel máximo"}</small></div></div>
                <div class="bar"><i style="width:${lv.pct}%"></i></div>
            </div>
            ${cazaSearchHTML()}
            <div class="row between" style="margin:34px 0 12px"><b>Tu álbum</b><span class="small muted">${got} de ${real.length} empresas</span></div>
            <div class="cl-album">${real.map(card).join("")}</div>
            <div class="row between" style="margin:30px 0 12px"><b>Famosas, pero no cotizan</b><span class="small muted">${gotT} de ${traps.length}</span></div>
            <div class="cl-album">${traps.map(card).join("")}</div>
        </div>
        <aside class="cz-how">
            <p class="kicker">Cómo se juega</p>
            <ol class="cx-list">
                <li><b>Busca.</b> Te enseñamos qué empresas cotizadas hay a tu alrededor.</li>
                <li><b>Acércate</b> a menos de ${CAZA_R} m y hazle una foto al local: puntos completos.</li>
                <li><b>Aprende.</b> Cada carta cuenta cómo gana dinero esa empresa y cómo podrías tener un trocito.</li>
            </ol>
            <p class="kicker" style="margin-top:22px">Puntos</p>
            <ul class="cx-list"><li>Muy común +10 · menos común +20 · rara +30.</li><li>Sin ubicación o sin verificar: la mitad.</li><li>Hay marcas famosas que no cotizan: también suman (+5) porque se aprende igual.</li></ul>
            <p class="disclaim">Locales de OpenStreetMap. Para buscar se envía una ubicación aproximada (redondeada a unos 100 m) y no la guardamos. Las fotos se quedan en tu dispositivo. Es un juego para aprender, no una recomendación de inversión.</p>
        </aside>
    </div>`;
}

/* ficha de un local: foto y puntos */
function cazaSheet(p) {
    const c = p.co, z = cx.caza, k = cxState().caza, had = k.found[c.id], pos = z.pos;
    const real = !!(pos && !pos.fake && p.d != null), stale = real && Date.now() - pos.t > 600000;
    const near = real && !stale && p.d <= CAZA_R + Math.min(pos.acc || 0, 60);
    cx.pend = { id: c.id, ok: near, place: p.name || c.n };
    const pr = had ? had.pts : 0, half = Math.ceil(c.pts / 2);
    const lab = v => Math.max(0, v - pr) ? `+${Math.max(0, v - pr)} puntos` : "sin puntos nuevos";
    const shot = (cls, txt) => `<label class="btn ${cls} cz-shot">${txt}<input type="file" accept="image/*" capture="environment" id="czPhoto" hidden></label>`;
    const dirs = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}&travelmode=walking`;
    let body;
    if (stale) body = `<p class="note">Tu ubicación es de hace un rato. Actualízala para comprobar si estás junto al local.</p><button class="btn" data-act="cazaLocate">Actualizar mi ubicación</button>`;
    else if (near) body = `<p class="note">Estás a ${cazaFmt(p.d)}: puedes cazarla con puntos completos.</p>${shot("", `Hacer una foto · ${lab(c.pts)}`)}`;
    else if (real) body = `<p class="note">Estás a ${cazaFmt(p.d)}. Acércate a menos de ${CAZA_R} m del local para sumar los puntos completos.</p>
        <div class="row"><a class="btn" href="${dirs}" target="_blank" rel="noopener">Cómo llegar</a>${shot("quiet", `Ya la vi: foto sin verificar · ${lab(half)}`)}</div>`;
    else body = `<p class="note">${pos && pos.fake ? "Estás en una zona de ejemplo" : "Sin ubicación"}: la foto cuenta la mitad de puntos.</p>${shot("", `Hacer una foto · ${lab(half)}`)}`;
    openSheet(`<p class="kicker">${esc(c.sec)} · ${c.no ? "No cotiza" : esc(c.tk)}</p><h2>${esc(c.n)}</h2>
        <p class="muted">${esc(p.name || c.n)}${p.d != null ? ` · a ${cazaFmt(p.d)} de ti` : ""}</p>
        ${had ? `<p class="small" style="margin-top:8px">Ya está en tu álbum (${had.ok ? "verificada" : "sin verificar"}, +${had.pts} puntos).</p>` : ""}
        <div style="margin-top:16px">${body}</div>
        <p class="small muted" style="margin-top:14px">La foto se queda en tu dispositivo.</p>`);
}
function cazaManualSheet() {
    cx.pend = null;
    openSheet(`<p class="kicker">Sin ubicación</p><h2>¿Qué empresa has visto?</h2>
        <p class="muted">La foto cuenta la mitad de puntos porque no podemos comprobar dónde estás.</p>
        <div class="cl-pick" style="margin-top:16px">${CAZA.map(c => `<button type="button" data-act="cazaPick" data-id="${c.id}">${esc(c.n)}</button>`).join("")}</div>`);
}
function cazaAward(c, { photo, ok, place }) {
    const k = cxState().caza, had = k.found[c.id], before = cazaLevel(k.pts);
    const earned = ok ? c.pts : Math.ceil(c.pts / 2), prev = had ? had.pts : 0, gain = Math.max(0, earned - prev);
    k.found[c.id] = { t: Date.now(), pts: Math.max(prev, earned), ok: !!(ok || (had && had.ok)), n: (had ? had.n : 0) + 1, place: String(place || "").slice(0, 40) };
    k.pts += gain;
    cazaFotoSet(c.id, photo);
    save();
    const after = cazaLevel(k.pts);
    cazaPaint();
    cazaReveal(c, { gain, first: !had, up: after.i > before.i ? after : null });
}
function cazaReveal(c, o = {}) {
    const f = cxState().caza.found[c.id], photo = cazaFotos()[c.id], meta = [c.sec, c.no ? "No cotiza" : c.tk, c.mk && c.mk.replace(/^la /, ""), c.idx].filter(Boolean).map(esc).join(" · ");
    const gain = o.gain == null ? "" : o.gain > 0 ? `+${o.gain} puntos${f.ok ? "" : " · sin verificar (la mitad)"}` : "Ya la tenías: sin puntos nuevos";
    const own = c.no
        ? `¿Puedes ser dueño de un trocito? <b>No directamente.</b> No cotiza en bolsa, así que no hay acciones que comprar. Que una marca sea famosa no significa que puedas invertir en ella.`
        : `¿Puedes ser dueño de un trocito? <b>Sí.</b> ${esc(c.co || c.n)} cotiza en ${c.mk}${c.tk && c.tk !== "—" ? ` (${esc(c.tk)})` : ""}. No hace falta comprar sus acciones sueltas: ${CAZA_OWN[c.reg]} la incluye junto a cientos de empresas más, desde pocos euros.`;
    openSheet(`<div class="cl-reveal">${photo ? `<img src="${photo}" alt="">` : `<span class="cl-e big">${esc(c.tk)}</span>`}
        <p class="kicker">${o.gain == null ? "Tu carta" : o.first ? "¡Nueva carta!" : "Otra vez por aquí"}</p><h2>${esc(c.n)}</h2>
        ${gain ? `<p class="cz-gain">${gain}</p>` : ""}${o.up ? `<p class="cz-up">Subes a nivel ${esc(o.up.name)}</p>` : ""}</div>
        <p class="small muted" style="text-align:center;margin-top:6px">${meta}</p>
        <p style="margin:14px 0">${esc(c.fact)}</p>
        <div class="note">${own}</div>
        ${f && !f.ok && !c.no ? `<p class="small muted" style="margin-top:10px">Cázala de nuevo junto al local, con tu ubicación, para sumar la otra mitad.</p>` : ""}
        <div class="row" style="margin-top:20px"><button class="btn" data-act="closeSheet">Seguir cazando</button><a class="btn ghost" href="#/aprende">Qué es un fondo</a></div>`);
}
function shrinkPhoto(file) {
    return new Promise(res => {
        const img = new Image(), url = URL.createObjectURL(file);
        img.onload = () => {
            const k = 220 / Math.max(img.width, img.height), cv = document.createElement("canvas");
            cv.width = Math.max(1, Math.round(img.width * Math.min(1, k))); cv.height = Math.max(1, Math.round(img.height * Math.min(1, k)));
            cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
            URL.revokeObjectURL(url); res(cv.toDataURL("image/jpeg", .65));
        };
        img.onerror = () => { URL.revokeObjectURL(url); res(null); };
        img.src = url;
    });
}
document.addEventListener("change", async e => {
    if (e.target.id !== "czPhoto" || !e.target.files?.[0] || !cx.pend) return;
    const pend = cx.pend, c = cazaById(pend.id), photo = await shrinkPhoto(e.target.files[0]);
    if (!photo) return toast("No hemos podido leer esa foto. Prueba con otra.");
    cx.pend = null;
    cazaAward(c, { photo, ok: pend.ok, place: pend.place });
});

/* ---------- Tu proyecto ---------- */
function pjHTML() {
    const st = cxState(), p = st.project;
    if (!p) return `<div class="cx-grid">
        <div class="panel pj-empty">
            <p class="kicker">Tu proyecto</p><h3>¿Tienes un proyecto entre manos?</h3>
            <p class="muted">Una app, una marca de ropa, un huerto urbano, un podcast… Cuéntalo en dos minutos y te enseñamos qué empresas asociadas podrían apoyarlo con financiación, mentoría o primeros clientes.</p>
            <button class="btn" data-act="pjEdit">Contar mi proyecto ${ARROW}</button>
        </div>
        <aside class="panel"><p class="kicker">Privado por defecto</p><ul class="cx-list">
            <li>Tu proyecto solo lo ves tú.</li><li>Ninguna empresa sabe nada hasta que tú decidas contactarla.</li><li>Incluso entonces, solo ve el resumen del proyecto: nunca tu nombre, tu email ni tu dinero.</li></ul></aside>
    </div>`;
    const ms = pjMatches(p);
    return `<div class="cx-grid">
        <div>
            <article class="panel pj-card"><div class="row between" style="align-items:flex-start"><div><p class="kicker">${PJ_SECTORS[p.sector]} · ${PJ_STAGES[p.stage]}</p><h3>${esc(p.title)}</h3></div><button class="link" data-act="pjEdit">Editar</button></div>
                <p class="muted" style="margin:8px 0 12px">${esc(p.desc)}</p>
                <div class="chips">${p.needs.map(n => `<li class="on">${PJ_NEEDS[n]}</li>`).join("")}</div>
                <p class="small muted" style="margin-top:12px">Privado · solo lo ves tú</p></article>
            <div class="row between" style="margin:26px 0 12px"><b>Posibles encajes</b><span class="small muted">${ms.length} empresa${ms.length === 1 ? "" : "s"}</span></div>
            ${ms.length ? ms.map(m => { const r = st.requests[m.id];
                return `<article class="panel pj-match"><span class="pj-e">${pjInit(m.n)}</span><div><div class="row between"><h3>${m.n}</h3><span class="pj-score">${m.score} % de encaje</span></div>
                    <p class="muted small">${m.d}</p><p class="small" style="margin-top:6px">Encaja porque ${m.why.join(", ")}.</p></div>
                    <div class="pj-act">${r ? `<span class="tag ok">Solicitud enviada</span>` : `<button class="btn sm" data-act="pjAsk" data-id="${m.id}">Me interesa</button>`}</div></article>`; }).join("")
            : `<div class="panel"><p class="muted">Aún no hay empresas asociadas que encajen. Prueba a añadir otra necesidad o vuelve pronto: se suman nuevas cada mes.</p></div>`}
        </div>
        <aside class="panel"><p class="kicker">Qué pasa si dices «me interesa»</p><ul class="cx-list">
            <li>Te enseñamos exactamente qué va a ver la empresa antes de enviarlo.</li><li>Si le encaja, te responde aquí, dentro de Horizonte.</li><li>Puedes retirar tu solicitud cuando quieras.</li></ul>
            <p class="disclaim">Empresas de ejemplo para el prototipo. Una conexión no es una oferta de inversión ni de financiación.</p></aside>
    </div>`;
}
function pjForm() {
    const p = cxState().project || { title: "", sector: "", stage: "idea", needs: [], desc: "" };
    openSheet(`<p class="kicker">Tu proyecto · privado</p><h2>Cuéntanos tu proyecto</h2>
        <form data-form="pj" style="margin-top:18px" novalidate>
            <div class="field"><label for="pjT">Nombre</label><input id="pjT" name="title" maxlength="50" value="${esc(p.title)}" placeholder="Ej.: Ropa hecha con redes de pesca"></div>
            <div class="field"><label for="pjS">Sector</label><select id="pjS" name="sector"><option value="">Elige uno</option>${Object.entries(PJ_SECTORS).map(([k, v]) => `<option value="${k}" ${p.sector === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
            <div class="field"><label>¿En qué punto está?</label><div class="opts">${Object.entries(PJ_STAGES).map(([k, v]) => `<label class="pj-radio"><input type="radio" name="stage" value="${k}" ${p.stage === k ? "checked" : ""}><span>${v}</span></label>`).join("")}</div></div>
            <div class="field"><label>¿Qué te vendría bien?</label><div class="pj-needs">${Object.entries(PJ_NEEDS).map(([k, v]) => `<label><input type="checkbox" name="needs" value="${k}" ${p.needs.includes(k) ? "checked" : ""}><span>${v}</span></label>`).join("")}</div></div>
            <div class="field"><label for="pjD">En dos frases</label><textarea id="pjD" name="desc" maxlength="280" rows="3" placeholder="Qué haces y para quién">${esc(p.desc)}</textarea></div>
            <p class="err" hidden></p>
            <button class="btn full">Guardar y ver encajes</button>
            <p class="small muted" style="margin-top:10px">Solo lo ves tú. Nada se comparte sin tu permiso.</p>
        </form>`);
}
function pjConsent(m) {
    const p = cxState().project;
    openSheet(`<p class="kicker">Antes de enviar</p><h2>Esto es lo que verá ${esc(m.n)}</h2>
        <div class="pj-preview"><b>${esc(p.title)}</b><p class="small muted">${PJ_SECTORS[p.sector]} · ${PJ_STAGES[p.stage]}</p><p style="margin:8px 0">${esc(p.desc)}</p><p class="small">Busca: ${p.needs.map(n => PJ_NEEDS[n].toLowerCase()).join(", ")}</p></div>
        <p class="small muted" style="margin:14px 0">No verá tu nombre, tu email, tus objetivos ni tu dinero. Si le interesa, te escribirá dentro de Horizonte y tú decides si seguir.</p>
        <div class="row"><button class="btn" data-act="pjSend" data-id="${m.id}">Enviar mi resumen</button><button class="btn quiet" data-act="closeSheet">Ahora no</button></div>`);
}

/* =========================================================
   Acciones y formularios (app.js los integra)
========================================================= */
const CX_ACTIONS = {
    cxTab: el => { cx.tab = el.dataset.v; $$(".cx-tabs button").forEach(b => { const on = b.dataset.v === cx.tab; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); }); cxPaint(); if (cx.tab === "voz" && !cx.totals) loadVoz(); },
    vozVote: el => vozVote(el.dataset.v),
    vozReset: () => { cxState().votes = {}; cx.last = null; save(); cxPaint(); },
    cazaLocate: () => { closeSheet(); cazaLocate(); },
    cazaDemo: () => { cx.caza.pos = { ...CAZA_DEMO, acc: 0, fake: true, t: Date.now() }; cazaSearch(); },
    cazaOpen: el => { const p = cx.caza.places[+el.dataset.i]; if (p) cazaSheet(p); },
    cazaManual: () => cazaManualSheet(),
    cazaPick: el => { const c = cazaById(el.dataset.id); cazaSheet({ co: c, name: c.n, d: null, lat: 0, lon: 0 }); },
    cazaAlbum: el => cazaReveal(cazaById(el.dataset.id)),
    cazaHint: el => { const c = cazaById(el.dataset.id); toast(`Pista: busca ${c.where}. Vale ${c.pts} puntos.`, 5200); },
    pjEdit: () => pjForm(),
    pjAsk: el => pjConsent(PJ_PARTNERS.find(x => x.id === el.dataset.id)),
    pjSend: el => { cxState().requests[el.dataset.id] = { t: Date.now() }; save(); closeSheet(); cxPaint(); toast("Resumen enviado. Si le encaja, te responderá aquí."); }
};
const CX_FORMS = {
    pj: form => {
        const f = new FormData(form), title = String(f.get("title") || "").trim(), sector = f.get("sector"), desc = String(f.get("desc") || "").trim();
        if (!title) return formErr(form, "Ponle un nombre a tu proyecto.");
        if (!PJ_SECTORS[sector]) return formErr(form, "Elige un sector.");
        const needs = f.getAll("needs").filter(n => PJ_NEEDS[n]);
        if (!needs.length) return formErr(form, "Marca al menos una cosa que te vendría bien.");
        cxState().project = { title, sector, stage: PJ_STAGES[f.get("stage")] ? f.get("stage") : "idea", needs, desc: desc || "Sin descripción todavía." };
        save(); closeSheet(); cxPaint();
    }
};

/* Tu voz: arrastrar la tarjeta o usar el teclado */
document.addEventListener("pointerdown", e => {
    const c = e.target.closest("#vzCard");
    if (!c || e.target.closest("button")) return;
    cx.drag = { x: e.clientX, c, id: e.pointerId };
    c.setPointerCapture?.(e.pointerId); c.classList.add("drag");
});
document.addEventListener("pointermove", e => {
    if (!cx.drag) return;
    const dx = e.clientX - cx.drag.x, c = cx.drag.c;
    c.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    c.style.setProperty("--a", Math.max(0, Math.min(1, dx / 110)));
    c.style.setProperty("--c", Math.max(0, Math.min(1, -dx / 110)));
});
["pointerup", "pointercancel"].forEach(ev => document.addEventListener(ev, e => {
    if (!cx.drag) return;
    const dx = e.clientX - cx.drag.x, c = cx.drag.c;
    cx.drag = null; c.classList.remove("drag");
    if (Math.abs(dx) > 100) { c.style.transform = ""; vozVote(dx > 0 ? "a" : "c"); }
    else { c.style.transform = ""; c.style.setProperty("--a", 0); c.style.setProperty("--c", 0); }
}));
document.addEventListener("keydown", e => {
    if (route() !== "conecta" || cx.tab !== "voz" || $(".sheet") || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === "ArrowRight") { e.preventDefault(); vozVote("a"); }
    if (e.key === "ArrowLeft") { e.preventDefault(); vozVote("c"); }
});
