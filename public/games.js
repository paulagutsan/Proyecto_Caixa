"use strict";
/* Horizonte · Juegos
   Cuatro juegos con datos reales aproximados y dinero ficticio, pensados para competir con amigos:
   - Noticia al vuelo (diario): un titular real, siete segundos, ¿la bolsa acabó ese año arriba o abajo?
   - Silueta (diario): adivina qué inversión es por la forma de su gráfica, contrarreloj.
   - Más o menos (semanal, sin fin): ¿cuál rindió más? Cada vez con menos tiempo.
   - Draft Night (con amigos): elegid cartas por turnos y jugad una década secreta; online con código de sala.
   El reloj, los combos y la liga de amigos están en arcade.js. Se carga antes que app.js: las utilidades de app.js ($, S, save, fmtR, today…) solo se usan dentro de funciones. */

/* =========================================================
   Datos: rentabilidades anuales aproximadas 2000-2024 (%, moneda local, ilustrativas)
========================================================= */
const G_FROM = 2000, G_SPAN = 10;
const G_CARDS = [
    { k: "world", e: "🌍", code: "MUN", name: "El mundo entero", sub: "MSCI World", color: "#007eae",
      bio: "Unas 1.500 grandes empresas de 23 países en una sola carta. Lo más parecido a apostar por la economía mundial.",
      r: [-13.2, -16.8, -19.9, 33.1, 14.7, 9.5, 20.1, 9.0, -40.7, 30.0, 11.8, -5.5, 15.8, 26.7, 4.9, -0.9, 7.5, 22.4, -8.7, 27.7, 15.9, 21.8, -18.1, 23.8, 18.7] },
    { k: "usa", e: "🗽", code: "USA", name: "Gigantes de EE. UU.", sub: "S&P 500", color: "#2f6fd6",
      bio: "Las 500 mayores empresas de Estados Unidos: Apple, Microsoft, Amazon, Coca-Cola…",
      r: [-9.1, -11.9, -22.1, 28.7, 10.9, 4.9, 15.8, 5.5, -37.0, 26.5, 15.1, 2.1, 16.0, 32.4, 13.7, 1.4, 12.0, 21.8, -4.4, 31.5, 18.4, 28.7, -18.1, 26.3, 25.0] },
    { k: "tech", e: "💻", code: "TEC", name: "Tecnológicas", sub: "Nasdaq-100", color: "#8b5cf6",
      bio: "Las 100 grandes tecnológicas del Nasdaq. Subidas brutales… y caídas brutales.",
      r: [-36.8, -32.6, -37.6, 49.1, 10.4, 1.5, 6.8, 18.7, -41.9, 53.5, 19.2, 2.7, 16.8, 35.0, 17.9, 8.4, 5.9, 31.5, -1.0, 38.0, 47.6, 26.6, -33.0, 53.8, 24.9] },
    { k: "esp", e: "🥘", code: "ESP", name: "España", sub: "IBEX 35", color: "#e0453a",
      bio: "Las 35 mayores empresas españolas: bancos, Inditex, Iberdrola, Telefónica…",
      r: [-21.7, -7.8, -28.1, 28.2, 17.4, 18.2, 31.8, 7.3, -39.4, 29.8, -17.4, -13.1, -4.7, 21.4, 3.7, -7.2, -2.0, 7.4, -15.0, 11.8, -15.5, 7.9, -5.6, 22.8, 14.8] },
    { k: "eur", e: "🥐", code: "EUR", name: "Europa", sub: "Euro Stoxx 50", color: "#3b82c4",
      bio: "Las 50 mayores empresas de la zona euro: LVMH, SAP, Siemens…",
      r: [-2.7, -20.3, -37.3, 15.7, 6.9, 21.3, 15.1, 6.8, -44.4, 21.1, -5.8, -17.1, 13.8, 17.9, 1.2, 3.8, 0.7, 6.5, -14.3, 24.8, -5.1, 21.0, -11.7, 19.2, 8.3] },
    { k: "jpn", e: "🗾", code: "JPN", name: "Japón", sub: "Nikkei 225", color: "#d94f8c",
      bio: "Las 225 grandes de Japón: Toyota, Sony, Nintendo… Pasó años sin levantar cabeza.",
      r: [-27.2, -23.5, -18.6, 24.5, 7.6, 40.2, 6.9, -11.1, -42.1, 19.0, -3.0, -17.3, 22.9, 56.7, 7.1, 9.1, 0.4, 19.1, -12.1, 18.2, 16.0, 4.9, -9.4, 28.2, 19.2] },
    { k: "emg", e: "🐉", code: "EMG", name: "Emergentes", sub: "MSCI Emerging Markets", color: "#ff8300",
      bio: "Empresas de China, India, Brasil, Taiwán… Mucho crecimiento y muchos sustos.",
      r: [-30.6, -2.4, -6.0, 56.3, 25.9, 34.5, 32.6, 39.8, -53.2, 79.0, 19.2, -18.2, 18.6, -2.3, -1.8, -14.6, 11.6, 37.8, -14.2, 18.9, 18.7, -2.5, -20.0, 10.3, 7.5] },
    { k: "bon", e: "🛡️", code: "BON", name: "Bonos", sub: "Bloomberg US Aggregate", color: "#7fb8d4",
      bio: "Préstamos a gobiernos y empresas que pagan intereses. Aburridos, pero amortiguan los golpes.",
      r: [11.6, 8.4, 10.3, 4.1, 4.3, 2.4, 4.3, 7.0, 5.2, 5.9, 6.5, 7.8, 4.2, -2.0, 6.0, 0.5, 2.6, 3.5, 0.0, 8.7, 7.5, -1.5, -13.0, 5.5, 1.3] },
    { k: "oro", e: "🪙", code: "ORO", name: "Oro", sub: "Precio del oro", color: "#c9a227",
      bio: "El refugio clásico: suele brillar cuando todo lo demás se hunde.",
      r: [-5.4, 0.8, 24.8, 19.1, 5.2, 18.2, 22.8, 31.4, 5.5, 24.0, 29.5, 10.1, 7.0, -28.0, -1.5, -10.4, 8.6, 13.1, -1.6, 18.3, 25.1, -3.6, -0.3, 13.1, 27.2] },
    { k: "liq", e: "💤", code: "LIQ", name: "Colchón", sub: "Letras del Tesoro (liquidez)", color: "#8497a3",
      bio: "Dinero aparcado casi sin riesgo. No pierde, pero tampoco gana mucho.",
      r: [5.8, 3.8, 1.6, 1.0, 1.4, 3.2, 4.8, 4.7, 1.5, 0.1, 0.1, 0.0, 0.1, 0.0, 0.0, 0.0, 0.3, 0.9, 1.9, 2.3, 0.6, 0.0, 1.5, 5.0, 5.2] }
];
const G_FAMILY = { world: "amplia", usa: "amplia", eur: "amplia", esp: "pais", jpn: "pais", tech: "tech", emg: "emg", bon: "defensa", liq: "defensa", oro: "oro" };
const G_TIPS = {
    world: "Mucho reparto: cae con las crisis, pero sin los extremos de una sola región.",
    usa: "Suele recuperarse rápido de los batacazos. En los años 2010 fue imparable.",
    tech: "Si ves una montaña rusa con caídas enormes, piensa en las tecnológicas: −78 % entre 2000 y 2002.",
    esp: "Muy ligada a bancos y a la crisis del euro: lo pasó mal entre 2010 y 2012.",
    eur: "Se parece al mundo, pero sufrió más con la crisis de deuda europea.",
    jpn: "Década perdida tras su burbuja… y de repente un +57 % en 2013.",
    emg: "Picos y valles enormes: cayó un 53 % en 2008 y subió un 79 % en 2009.",
    bon: "Línea tranquila que sube poco a poco. Su peor año fue 2022, cuando subieron los tipos.",
    oro: "Brilla en las crisis: subió casi todos los años entre 2001 y 2012.",
    liq: "Casi una línea recta. No da sustos, pero con inflación pierde poder de compra."
};
const G_NEWS = [
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
const G_LAST = G_CARDS[0].r.length - G_SPAN; // último inicio de década posible (índice)

/* =========================================================
   Utilidades comunes
========================================================= */
const gCard = k => G_CARDS.find(c => c.k === k);
const gIco = (c, cls = "") => `<i class="ico ${cls}" style="--c:${c.color}" aria-hidden="true">${c.code}</i>`;
const gRand = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gShuffle = (a, rnd = Math.random) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const gNum = (n, d = 1) => n.toLocaleString("es-ES", { maximumFractionDigits: d });
const gSigned = n => `${n > 0 ? "+" : n < 0 ? "−" : ""}${gNum(Math.abs(Math.round(n * 10) / 10))} %`;
const gTone = n => n > 0.05 ? "pos" : n < -0.05 ? "neg" : "";
const gGrowth = (k, from, years) => gCard(k).r.slice(from, from + years).reduce((p, x) => p * (1 + x / 100), 1);
const gYears = (from, years = G_SPAN) => years === 1 ? `${G_FROM + from}` : `${G_FROM + from}–${G_FROM + from + years - 1}`;
function gStats(c) {
    const m = c.r.reduce((s, x) => s + x, 0) / c.r.length;
    return { mean: (Math.pow(c.r.reduce((p, x) => p * (1 + x / 100), 1), 1 / c.r.length) - 1) * 100,
        vol: Math.sqrt(c.r.reduce((s, x) => s + (x - m) ** 2, 0) / c.r.length), worst: Math.min(...c.r) };
}
const G_STATS = Object.fromEntries(G_CARDS.map(c => [c.k, gStats(c)]));
const gClamp = n => Math.max(1, Math.min(5, Math.round(n)));
const gRate = k => ({ atk: gClamp(G_STATS[k].mean / 2), risk: gClamp(G_STATS[k].vol / 6) });
const gDots = (n, cls = "") => `<span class="g-dots ${cls}" aria-label="${n} de 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
const G_SQ = { "🟢": "in", "🟡": "half", "⚪": "out", "🟩": "ok", "🟥": "ko" };
const gGrid = str => `<span class="g-grid-sq" aria-hidden="true">${[...str].filter(ch => G_SQ[ch]).map(ch => `<i class="${G_SQ[ch]}"></i>`).join("")}</span>`;
const gDayNo = () => today() - 20700; // número del reto diario

function gState() {
    if (!S.games || typeof S.games !== "object") S.games = {};
    const g = S.games;
    g.days ||= []; g.noticia ||= {}; g.silueta ||= {}; g.mm ||= { best: 0, played: 0 }; g.draft ||= { played: 0 };
    return g;
}
function gMarkDay() { const g = gState(), t = today(); if (!g.days.includes(t)) g.days = [...g.days, t].slice(-120); }
function gStreak() {
    const days = new Set(gState().days);
    let d = today(), n = 0;
    if (!days.has(d)) d--;
    while (days.has(d)) { n++; d--; }
    return n;
}
async function gShare(text) {
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(text); toast("Resultado copiado. Pégalo en tu grupo."); } catch { toast(text, 8000); }
}
// Gráfica sencilla en SVG a partir de una serie de valores
function gSpark(vals, { cls = "", base = vals[0], h = 100 } = {}) {
    const max = Math.max(...vals, base), min = Math.min(...vals, base), pad = (max - min) * .08 || 1;
    const X = i => (i / (vals.length - 1)) * 300, Y = v => h - 4 - ((v - min + pad) / (max - min + 2 * pad)) * (h - 8);
    return `<svg class="g-spark ${cls}" viewBox="0 0 300 ${h}" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" x2="300" y1="${Y(base)}" y2="${Y(base)}" class="g-base"/>
        <polyline points="${vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")}" class="g-path"/>
    </svg>`;
}
function gShell(id, title, meta = "") {
    return `<div class="game g-${id}"><div class="g-scroll">
        <header class="g-top"><a href="#/juegos" class="p-close" aria-label="Volver a Juegos">×</a><b>${title}</b><span id="gMeta">${meta}</span><span class="brand imm-brand" aria-label="Horizonte"><img class="brand-star" src="brand/horizonte-icono.svg" alt="" width="23" height="19"><span class="brand-word" aria-hidden="true">Horizonte</span></span></header>
        <div class="g-in" id="gRoot"></div></div></div>`;
}
const gRoot = () => $("#gRoot");

/* =========================================================
   Portada de la pestaña Juegos
========================================================= */
function viewJuegos() {
    const g = gState(), t = today();
    const nwd = g.noticia.day === t ? g.noticia : null, si = g.silueta.day === t ? g.silueta : null;
    const G_ART = {
        noticia: '<rect x="8" y="8" width="54" height="36" rx="3" /><path d="M16 18h30M16 26h38M16 34h22" />',
        silueta: '<path d="M4 48 L4 34 L16 28 L26 36 L38 16 L50 24 L66 10 L66 48 Z" />',
        masomenos: '<path d="M14 30 L26 10 L38 30 Z" /><path d="M34 22 L46 42 L58 22 Z" />',
        draft: '<rect x="8" y="12" width="26" height="36" rx="2" transform="rotate(-10 21 30)" /><rect x="24" y="8" width="26" height="36" rx="2" /><rect x="40" y="12" width="26" height="36" rx="2" transform="rotate(10 53 30)" />'
    };
    const tiles = [
        { id: "noticia", badge: `Diario · #${gDayNo()}`, name: "Noticia al vuelo",
          tag: "Un titular real y siete segundos: ¿la bolsa acabó ese año arriba o abajo? Combos, puntos y mucha tensión.",
          status: nwd ? `Hoy: <b>${gPts(nwd.pts)}</b> · ${nwd.hits}/10` : "Reto de hoy sin jugar" },
        { id: "silueta", badge: `Diario · #${gDayNo()}`, name: "Silueta",
          tag: "¿Quién es esta inversión? Adivínala por la forma de su gráfica. Cinco rondas de 15 segundos.",
          status: si ? `Hoy: <b>${si.score}/5</b> · ${gPts(si.pts || 0)}` : "Reto de hoy sin jugar" },
        { id: "masomenos", badge: "Semanal · sin fin", name: "Más o menos",
          tag: "Dos inversiones, una pregunta y cada vez menos tiempo. Encadena aciertos hasta que falles.",
          status: g.mm.best ? `Récord: <b>${g.mm.best}</b> · ${gPts(g.mm.bestPts || 0)}` : "Aún sin récord" },
        { id: "draft", badge: "Con amigos", name: "Draft Night",
          tag: "Elegid por turnos vuestras cartas de inversión y descubrid quién gana en una década secreta. También online.",
          status: g.draft.played ? `${g.draft.played} partida${g.draft.played === 1 ? "" : "s"} jugada${g.draft.played === 1 ? "" : "s"}` : "De 2 a 5 jugadores" }
    ];
    return `<section class="section"><div class="sec-head"><div><p class="kicker">Juegos</p><h2>Dos minutos al día. Pica a tus amigos.</h2>
        <p>Datos reales de mercado y dinero de mentira. Los retos diarios son los mismos para todo el mundo: juega, suma puntos y compáralos con tu liga.</p></div>
        <div class="g-streak" title="Días seguidos con algún reto diario jugado"><b>${gStreak()}</b><span>día${gStreak() === 1 ? "" : "s"} de racha</span></div></div>
        <div class="g-grid">${tiles.map((o, i) => `<a class="g-tile t-${o.id}" href="#/${o.id}">
            <span class="g-badge">${o.badge}</span><span class="g-num" aria-hidden="true">0${i + 1}</span><svg class="g-art" viewBox="0 0 70 52" aria-hidden="true">${G_ART[o.id]}</svg>
            <h3>${o.name}</h3><p>${o.tag}</p><span class="g-status">${o.status}</span><span class="g-play">Jugar →</span></a>`).join("")}</div>
        ${nwd || si ? `<div class="g-sharebar"><div><b>Tus resultados de hoy están listos.</b><p class="muted">Compártelos en el grupo y mira quién lo ha hecho mejor.</p></div><button class="btn" data-act="gShareDay">Compartir resultados de hoy</button></div>` : ""}
        <p class="disclaim">Rentabilidades anuales aproximadas de índices entre 2000 y 2024, en moneda local, sin comisiones ni impuestos. Juegos educativos: rentabilidades pasadas no garantizan rentabilidades futuras.</p>
    </section>
    <section class="section liga" id="liga"><div id="ligaBox"></div></section>`;
}
function gShareDayText() {
    const g = gState(), t = today(), lines = [`Horizonte · Juegos #${gDayNo()}`];
    if (g.noticia.day === t) lines.push(`📰 Noticia al vuelo ${g.noticia.grid} ${g.noticia.hits}/10 · ${gPts(g.noticia.pts)}`);
    if (g.silueta.day === t) lines.push(`🔍 Silueta ${g.silueta.grid} ${g.silueta.score}/5 · ${gPts(g.silueta.pts || 0)}`);
    if (g.mm.best) lines.push(`⚖️ Más o menos: récord ${g.mm.best}`);
    return lines.join("\n");
}

/* =========================================================
   2 · SILUETA
   Cinco gráficas sin nombre: adivina qué inversión es.
========================================================= */
const SI_SECONDS = 15;
let si = null;
function siRounds(seed) {
    const rnd = gRand(seed), keys = gShuffle(G_CARDS.map(c => c.k), rnd).slice(0, 5);
    return keys.map(k => {
        const start = Math.floor(rnd() * (G_LAST + 1)), fams = new Set([G_FAMILY[k]]), opts = [k];
        for (const o of gShuffle(G_CARDS.map(c => c.k), rnd)) {
            if (opts.length === 4) break;
            if (!fams.has(G_FAMILY[o])) { opts.push(o); fams.add(G_FAMILY[o]); }
        }
        return { k, start, opts: gShuffle(opts, rnd) };
    });
}
function siNew(practice = false) {
    const official = !practice && gState().silueta.day !== today();
    si = { practice, official, day: today(), rounds: siRounds(practice ? Math.floor(Math.random() * 1e9) : today() * 7919 + 101), i: 0, res: [], answered: false, last: null, pick: null, pts: 0, streak: 0, gain: 0 };
}
function siMount() {
    if (!si || (!si.practice && si.day !== today())) siNew();
    siPaint();
}
function siPaint() {
    const root = gRoot();
    if (!root) return;
    gTimerStop();
    if (si.res.length === 5 && !si.answered) { root.innerHTML = siEndHTML(); return ligaFillBoard("silueta", gIso()); }
    const R = si.rounds[si.i], c = gCard(R.k);
    const vals = [100]; c.r.slice(R.start, R.start + G_SPAN).forEach(x => vals.push(vals.at(-1) * (1 + x / 100)));
    $("#gMeta").textContent = si.practice ? "Práctica" : `#${gDayNo()}`;
    root.innerHTML = `
        ${!si.official && !si.practice && si.i === 0 && !si.answered ? `<p class="g-note">Ya has jugado el reto de hoy. Esta partida no cuenta para la liga.</p>` : ""}
        ${si.answered ? "" : `<div class="g-timer"><i id="gBar"></i><span id="gLeft">${SI_SECONDS}</span></div>`}
        <div class="nw-top"><span>Ronda <b>${si.i + 1}</b>/5</span><span class="nw-pts">${gPts(si.pts)}</span><span class="nw-combo ${si.streak >= 2 ? "hot" : ""}">${gMultTxt(gMult(si.streak))}</span></div>
        <div class="si-dots">${si.rounds.map((_, i) => `<i class="${si.res[i] === true ? "ok" : si.res[i] === false ? "ko" : i === si.i ? "now" : ""}"></i>`).join("")}</div>
        <p class="g-lbl">De ${G_FROM + R.start} a ${G_FROM + R.start + G_SPAN - 1}</p>
        <h2 class="g-h2">¿Quién es esta inversión?</h2>
        <div class="si-chart">${gSpark(vals, { h: 160, cls: si.answered ? (si.last ? "ok" : "ko") : "" })}
            <div class="si-axis"><span>100 €</span><span>${si.answered ? `${fmtR(vals.at(-1))}` : "?"}</span></div></div>
        <div class="si-opts">${R.opts.map(k => { const o = gCard(k);
            const cls = si.answered ? (k === R.k ? "right" : k === si.pick ? "wrong" : "") : "";
            return `<button class="si-opt ${cls}" data-act="siPick" data-k="${k}" ${si.answered ? "disabled" : ""}>${gIco(o)}<b>${o.name}</b></button>`; }).join("")}</div>
        ${si.answered ? `<div class="g-lesson"><p class="g-lbl">${si.last ? `¡Bien visto! +${gPts(si.gain)}` : si.pick === null ? "Se acabó el tiempo" : `Era ${c.name}`}</p>
            <p>100 € se convirtieron en <b>${fmtR(vals.at(-1))}</b> en esos diez años. ${G_TIPS[R.k]}</p></div>
            <button class="p-opt p-go" data-act="siNext">${si.res.length === 5 ? "Ver resultado" : "Siguiente ronda →"}</button>` : ""}`;
    if (!si.answered) gTimerStart(SI_SECONDS, () => siPick(null));
}
function siPick(k) {
    if (si.answered) return;
    const R = si.rounds[si.i], ok = k === R.k, frac = gFrac();
    gTimerStop();
    const gain = ok ? Math.round((150 + Math.round(150 * frac)) * gMult(si.streak)) : 0;
    si.answered = true; si.last = ok; si.pick = k; si.res.push(ok); si.streak = ok ? si.streak + 1 : 0; si.pts += gain; si.gain = gain;
    if (si.res.length === 5 && si.official) {
        const g = gState(), score = si.res.filter(Boolean).length;
        g.silueta = { day: today(), score, grid: si.res.map(v => v ? "🟩" : "🟥").join(""), pts: si.pts }; gMarkDay(); save();
        gScore("silueta", gIso(), si.pts, { score });
    }
    siPaint();
}
function siEndHTML() {
    const score = si.res.filter(Boolean).length, grid = si.res.map(v => v ? "🟩" : "🟥").join("");
    const msg = ["¿Primera vez viendo gráficas? Juega mañana: se aprende rápido.", "Empiezas a reconocerlas. La clave: cuánto se mueve y cuándo cae.", "Nada mal. Ya distingues a las tranquilas de las montañas rusas.",
        "Muy bien. Tienes buen ojo para el riesgo.", "Casi perfecto. Estás listo para un Draft Night.", "Pleno. Conoces las cartas mejor que nadie: reta a tus amigos."][score];
    return `<div class="g-end">
        <p class="g-lbl">${si.practice ? "Práctica" : `Silueta #${gDayNo()}`}</p>
        <h1 class="g-big">${Math.round(si.pts).toLocaleString("es-ES", { useGrouping: "always" })}</h1><p class="g-muted">puntos · ${score}/5 aciertos</p><p class="g-emo">${gGrid(grid)}</p>
        ${!si.official && !si.practice ? `<p class="g-note">Esta partida no cuenta: ya jugaste el reto de hoy.</p>` : ""}
        <div class="g-lesson"><p>${msg}</p></div>
        <div class="g-board" id="gBoard"></div>
        <div class="g-row"><button class="p-opt p-go" data-act="siShare">Compartir resultado</button><button class="p-opt" data-act="siAgain">Practicar con otras</button></div>
    </div>`;
}

/* =========================================================
   3 · MÁS O MENOS
   Cada carta acaba en un importe. ¿La nueva acaba con más o con menos que la anterior?
========================================================= */
const MM_CONCEPTS = [
    { code: "INF", t: "1.000 € en un cajón", s: "10 años con un 3 % de inflación (en poder de compra de hoy)", v: 1000 / Math.pow(1.03, 10) },
    { code: "INF", t: "1.000 € en un cajón", s: "20 años con un 2 % de inflación (en poder de compra de hoy)", v: 1000 / Math.pow(1.02, 20) },
    { code: "INT", t: "1.000 € al 5 % anual", s: "durante 30 años, sin tocarlos", v: 1000 * Math.pow(1.05, 30) },
    { code: "INT", t: "1.000 € al 7 % anual", s: "durante 10 años, sin tocarlos", v: 1000 * Math.pow(1.07, 10) },
    { code: "INT", t: "1.000 € al 3 % anual", s: "durante 20 años, sin tocarlos", v: 1000 * Math.pow(1.03, 20) },
    { code: "COM", t: "1.000 € al 5 % con un 2 % de comisiones", s: "durante 20 años", v: 1000 * Math.pow(1.03, 20) },
    { code: "APU", t: "1.000 € en apuestas deportivas", s: "apostándolo todo 20 veces seguidas (la casa se queda de media un 5 %)", v: 1000 * Math.pow(.95, 20) }
];
let mm = null;
function mmItem(prev) {
    for (let tries = 0; tries < 50; tries++) {
        let it;
        if (Math.random() < .2) { const c = MM_CONCEPTS[Math.floor(Math.random() * MM_CONCEPTS.length)]; it = { ...c }; }
        else {
            const c = G_CARDS[Math.floor(Math.random() * G_CARDS.length)], len = [1, 3, 5, 10][Math.floor(Math.random() * 4)];
            const from = Math.floor(Math.random() * (c.r.length - len + 1));
            it = { ico: gIco(c, "lg"), t: `1.000 € en ${c.name}`, s: len === 1 ? `durante ${G_FROM + from}` : `de ${G_FROM + from} a ${G_FROM + from + len - 1}`, v: 1000 * gGrowth(c.k, from, len) };
        }
        if (!prev || (Math.abs(it.v / prev.v - 1) > .04 && it.t + it.s !== prev.t + prev.s)) return it;
    }
}
const mmSeconds = () => Math.max(4, 9 - Math.floor(mm.streak / 3)); // cada tres aciertos, un segundo menos
function mmNew() { const a = mmItem(); mm = { a, b: mmItem(a), streak: 0, pts: 0, phase: "play", busy: false, timeout: false }; }
function mmMount() { if (!mm || mm.phase === "over") mmNew(); mmPaint(); }
function mmCard(it, hidden, id) {
    return `<div class="mm-card" id="${id}"><span class="mm-e">${it.ico || `<i class="ico lg" style="--c:#8a96a3" aria-hidden="true">${it.code}</i>`}</span><div><b>${it.t}</b><small>${it.s}</small></div>
        <output class="mm-v">${hidden ? "¿?" : fmtR(it.v)}</output></div>`;
}
function mmPaint() {
    const root = gRoot();
    if (!root) return;
    gTimerStop();
    const g = gState();
    $("#gMeta").innerHTML = `${gPts(mm.pts)} · Récord ${g.mm.best}`;
    if (mm.phase === "over") { root.innerHTML = mmOverHTML(); return ligaFillBoard("masomenos", gWeek()); }
    root.innerHTML = `
        <div class="g-timer"><i id="gBar"></i><span id="gLeft">${mmSeconds()}</span></div>
        <div class="nw-top"><span>Racha <b>${mm.streak}</b></span><span class="nw-pts">${gPts(mm.pts)}</span><span class="nw-combo ${mm.streak >= 3 ? "hot" : ""}">${mmSeconds()} s por pregunta</span></div>
        ${mmCard(mm.a, false, "mmA")}
        <p class="mm-q">¿Esta acaba con <b>más</b> o con <b>menos</b>?</p>
        ${mmCard(mm.b, true, "mmB")}
        <div class="mm-btns"><button class="p-opt mm-up" data-act="mmGuess" data-v="up">▲ Más</button><button class="p-opt mm-down" data-act="mmGuess" data-v="down">▼ Menos</button></div><div id="gPop" class="g-pop"></div>
        <p class="small g-muted">Rentabilidades aproximadas en moneda local, sin comisiones. Las de interés fijo son hipotéticas.</p>`;
    gTimerStart(mmSeconds(), () => { if (!mm.busy && mm.phase === "play") { mm.timeout = true; mm.busy = true; mmReveal(false); } });
}
function mmGuess(dir) {
    if (mm.busy || mm.phase !== "play") return;
    mm.busy = true;
    const frac = gFrac();
    gTimerStop();
    const ok = dir === "up" ? mm.b.v > mm.a.v : mm.b.v < mm.a.v;
    if (ok) { const gain = 100 + Math.round(60 * frac) + Math.min(50, mm.streak * 5); mm.pts += gain; gPop(`+${gain}`, "pos"); }
    mmReveal(ok);
}
function mmReveal(ok) {
    const out = $("#mmB .mm-v"), to = mm.b.v, t0 = performance.now();
    let fin = false;
    $$(".mm-btns button").forEach(b => (b.disabled = true));
    const finish = () => {
        if (fin) return; fin = true;
        if (out) out.textContent = fmtR(to);
        $("#mmB")?.classList.add(ok ? "ok" : "ko");
        setTimeout(() => {
            mm.busy = false;
            const g = gState();
            if (ok) { mm.streak++; mm.a = mm.b; mm.b = mmItem(mm.a); if (mm.streak > g.mm.best) g.mm.best = mm.streak; if (mm.pts > (g.mm.bestPts || 0)) g.mm.bestPts = mm.pts; save(); mmPaint(); }
            else {
                mm.phase = "over"; g.mm.played = (g.mm.played || 0) + 1; if (mm.pts > (g.mm.bestPts || 0)) g.mm.bestPts = mm.pts; save();
                if (mm.pts > 0) gScore("masomenos", gWeek(), mm.pts, { streak: mm.streak });
                mmPaint();
            }
        }, ok ? 550 : 900);
    };
    const step = t => {
        const k = Math.min(1, (t - t0) / 650), e = 1 - (1 - k) ** 3;
        if (out) out.textContent = fmtR(to * e);
        if (k < 1) return requestAnimationFrame(step);
        finish();
    };
    requestAnimationFrame(step);
    setTimeout(finish, 900); // por si la pestaña no pinta fotogramas
}
function mmOverHTML() {
    const g = gState(), rec = mm.streak > 0 && mm.streak >= g.mm.best;
    return `<div class="g-end">
        <p class="g-lbl">${mm.timeout ? "Se acabó el tiempo" : "Fin de la racha"}</p><h1 class="g-big">${mm.streak}</h1>
        <p class="g-muted">${gPts(mm.pts)} · ${rec ? "¡nuevo récord personal!" : `tu récord: ${g.mm.best}`}</p>
        <div class="g-lesson"><p class="g-lbl">La que falló</p>
            <p>${mm.a.t} (${mm.a.s}): <b>${fmtR(mm.a.v)}</b><br>${mm.b.t} (${mm.b.s}): <b>${fmtR(mm.b.v)}</b></p></div>
        <div class="g-board" id="gBoard"></div>
        <div class="g-row"><button class="p-opt p-go" data-act="mmAgain">Otra vez</button><button class="p-opt" data-act="mmShare">Retar a mi grupo</button></div>
    </div>`;
}

/* =========================================================
   4 · DRAFT NIGHT
   2-5 jugadores eligen cartas por turnos (orden en serpiente). Después se juega
   una década secreta año a año. Modo «en este móvil» y modo online con código de sala.
========================================================= */
const DR_KEYS = G_CARDS.map(c => c.k), DR_START = 10000;
let dr = null;
const drPer = n => n <= 3 ? 3 : 2;
const drTurn = (t, n) => { const round = Math.floor(t / n), pos = t % n; return round % 2 === 0 ? pos : n - 1 - pos; };
const drTaken = () => Object.fromEntries(dr.picks.flatMap((ks, p) => ks.map(k => [k, p])));
function drValue(p, years) { const ks = dr.picks[p]; return ks.reduce((s, k) => s + DR_START / ks.length * gGrowth(k, dr.start, years), 0); }
function drStop() { clearInterval(dr?.poll); if (dr) dr.poll = null; }
function drMount() { if (!dr) dr = { phase: "menu", names: ["", ""] }; drPaint(); if (dr.mode === "online" && ["lobby", "draft"].includes(dr.phase)) drPoll(); }
function drPaint() {
    const root = gRoot();
    if (!root) return;
    $("#gMeta").textContent = dr.code ? `Sala ${dr.code}` : "";
    root.innerHTML = { menu: drMenu, setup: drSetup, lobby: drLobby, draft: drDraft, season: drSeason, end: drEnd }[dr.phase]();
}
function drMenu() {
    return `<div class="dr-hero"><h1 class="g-big">Draft Night</h1>
        <p class="g-muted">El fantasy de las inversiones para jugar con amigos.</p></div>
        <ol class="g-steps">
            <li><b>1</b><div><h3>Draft</h3><p>Por turnos, cada uno elige sus cartas: tecnológicas, oro, España, Japón… Si alguien coge una antes que tú, te quedas sin ella.</p></div></li>
            <li><b>2</b><div><h3>Década secreta</h3><p>Se juegan diez años reales entre 2000 y 2024, uno a uno, con la noticia de cada año.</p></div></li>
            <li><b>3</b><div><h3>Gana el que más tenga</h3><p>Cada equipo empieza con 10.000 € ficticios repartidos a partes iguales entre sus cartas.</p></div></li>
        </ol>
        <button class="p-opt p-go g-bigbtn" data-act="drLocal">Jugar en este móvil</button>
        <div class="g-online"><p class="g-lbl">Online, cada uno en su móvil</p>
            <form data-form="drJoin" class="g-join">
                <input id="drName" name="name" maxlength="14" placeholder="Tu nombre" aria-label="Tu nombre" value="${esc(user?.username || dr.myName || "")}" required>
                <div class="g-join-row"><button type="button" class="p-opt" data-act="drCreate">Crear sala</button><span>o</span>
                <input name="code" maxlength="5" placeholder="Código" aria-label="Código de sala" autocomplete="off"><button class="p-opt">Unirme</button></div>
            </form>
            <p class="small g-muted" id="drMsg">${socialOn() ? "" : "Para jugar online necesitas acceder a tu cuenta."}</p></div>`;
}
function drSetup() {
    return `<p class="g-lbl">Jugar en este móvil</p><h2 class="g-h2">¿Quién juega?</h2>
        <form data-form="drLocal" class="dr-names">
            ${dr.names.map((n, i) => `<div class="dr-name"><span>${i + 1}</span><input name="n${i}" maxlength="14" value="${esc(n)}" placeholder="Jugador ${i + 1}" aria-label="Nombre del jugador ${i + 1}">${dr.names.length > 2 ? `<button type="button" class="x" data-act="drDel" data-i="${i}" aria-label="Quitar jugador">×</button>` : ""}</div>`).join("")}
            ${dr.names.length < 5 ? `<button type="button" class="p-opt" data-act="drAdd">+ Añadir jugador</button>` : ""}
            <p class="small g-muted">${dr.names.length <= 3 ? "Con 2 o 3 jugadores, cada uno elige 3 cartas." : "Con 4 o 5 jugadores, cada uno elige 2 cartas."} Pasaos el móvil en cada turno.</p>
            <button class="p-opt p-go g-bigbtn">Empezar el draft →</button>
        </form>`;
}
function drLobby() {
    return `<p class="g-lbl">Sala online</p><h1 class="g-big dr-code">${dr.code}</h1>
        <p class="g-muted">Comparte el código: tus amigos entran en Juegos → Draft Night → Unirme.</p>
        <button class="p-opt" data-act="drInvite">Enviar invitación</button>
        <ul class="dr-list">${dr.players.map((p, i) => `<li><span>${i + 1}</span>${esc(p)}${i === dr.me ? " (tú)" : ""}${i === 0 ? " · anfitrión" : ""}</li>`).join("")}</ul>
        ${dr.host ? `<button class="p-opt p-go g-bigbtn" data-act="drStart" ${dr.players.length < 2 ? "disabled" : ""}>${dr.players.length < 2 ? "Esperando jugadores…" : "Empezar el draft →"}</button>` : `<p class="g-note">Esperando a que el anfitrión empiece…</p>`}`;
}
function drDraft() {
    const n = dr.players.length, total = n * dr.per, turn = drTurn(dr.t, n), taken = drTaken();
    const mine = dr.mode === "local" || turn === dr.me;
    return `<div class="dr-turn"><p class="g-lbl">Elección ${dr.t + 1} de ${total}</p>
            <h2 class="g-h2">${mine ? (dr.mode === "local" ? `Turno de <b>${esc(dr.players[turn])}</b>` : "¡Te toca elegir!") : `Elige <b>${esc(dr.players[turn])}</b>…`}</h2></div>
        <div class="dr-teams">${dr.players.map((p, i) => `<div class="${i === turn ? "now" : ""}"><b>${esc(p)}</b><span>${dr.picks[i].map(k => gIco(gCard(k), "sm")).join("") || "—"}</span></div>`).join("")}</div>
        <div class="dr-cards">${G_CARDS.map(c => {
            const own = taken[c.k], r = gRate(c.k);
            return `<button class="dr-card ${own !== undefined ? "taken" : ""}" style="--c:${c.color}" data-act="drPick" data-k="${c.k}" ${own !== undefined || !mine ? "disabled" : ""}>
                ${gIco(c, "lg")}<b>${c.name}</b><small>${c.sub}</small>
                <span class="dr-stat">Ganancia ${gDots(r.atk)}</span><span class="dr-stat">Sustos ${gDots(r.risk, "risk")}</span>
                <p>${c.bio}</p>${own !== undefined ? `<em>De ${esc(dr.players[own])}</em>` : ""}</button>`;
        }).join("")}</div>
        <p class="small g-muted">Ganancia = rentabilidad media de 2000 a 2024; sustos = cuánto sube y baja de un año a otro.</p>`;
}
function drSeason() {
    const y = dr.year, L = y ? y - 1 : null;
    const rows = dr.players.map((p, i) => ({ p, i, v: drValue(i, y), r: y ? (drValue(i, y) / drValue(i, y - 1) - 1) * 100 : 0 })).sort((a, b) => b.v - a.v);
    const max = Math.max(...rows.map(r => r.v), DR_START);
    return `<p class="g-lbl">${y ? `Año ${y} de 10` : "La década secreta empieza"}</p>
        <h2 class="g-h2 dr-news">${y ? `«${G_NEWS[dr.start + L]}»` : "Todos empezáis con 10.000 €."}</h2>
        <div class="dr-race">${rows.map((r, k) => `<div class="dr-lane">
            <span class="dr-pos">${k + 1}</span><div class="dr-bar"><i style="width:${Math.max(6, r.v / max * 100)}%"></i><b>${esc(r.p)} <small>${dr.picks[r.i].map(c => gIco(gCard(c), "sm")).join("")}</small></b></div>
            <span class="dr-v">${fmtR(r.v)}${y ? `<small class="${gTone(r.r)}">${gSigned(r.r)}</small>` : ""}</span></div>`).join("")}</div>
        ${y ? `<ul class="dr-yr">${[...new Set(dr.picks.flat())].map(k => { const c = gCard(k), x = c.r[dr.start + L]; return `<li>${gIco(c, "sm")} ${c.name}<b class="${gTone(x)}">${gSigned(x)}</b></li>`; }).join("")}</ul>` : ""}
        <div class="g-row"><button class="p-opt p-go" data-act="drYear">${y < 10 ? `Jugar el año ${y + 1} ▶` : "Ver el podio"}</button>${y < 10 ? `<button class="p-opt" data-act="drSkip">Ir al final ⏭</button>` : ""}</div>`;
}
function drEnd() {
    const rows = dr.players.map((p, i) => ({ p, i, v: drValue(i, G_SPAN) })).sort((a, b) => b.v - a.v);
    const fams = i => new Set(dr.picks[i].map(k => G_FAMILY[k])).size;
    const win = rows[0], world = DR_START * gGrowth("world", dr.start, G_SPAN);
    const best = G_CARDS.map(c => ({ c, v: DR_START * gGrowth(c.k, dr.start, G_SPAN) })).sort((a, b) => b.v - a.v);
    const lesson = `En esta década la mejor carta fue ${best[0].c.name} (${fmtR(best[0].v)}) y la peor, ${best.at(-1).c.name} (${fmtR(best.at(-1).v)}). `
        + (fams(win.i) >= 3 ? `${esc(win.p)} ganó repartiendo entre tipos de inversión muy distintos: así se reduce el riesgo de que una sola carta te hunda.`
            : `${esc(win.p)} ganó apostando fuerte, pero en otra década esas mismas cartas podían haber quedado últimas. Repartir reduce ese riesgo.`)
        + ` Con solo El mundo entero se habría acabado con ${fmtR(world)}.`;
    const podium = [rows[1], rows[0], rows[2]].filter(Boolean);
    return `<div class="g-end">
        <p class="g-lbl">La década secreta era</p><h1 class="g-big">${gYears(dr.start)}</h1>
        <div class="dr-podium">${podium.map(r => { const pos = rows.indexOf(r); return `<div class="p${pos + 1}"><span>${pos + 1}</span><b>${esc(r.p)}</b><small>${dr.picks[r.i].map(k => gIco(gCard(k), "sm")).join("")}</small><i>${fmtR(r.v)}</i></div>`; }).join("")}</div>
        ${rows.length > 3 ? `<ol class="dr-list" start="4">${rows.slice(3).map(r => `<li>${esc(r.p)} · ${fmtR(r.v)}</li>`).join("")}</ol>` : ""}
        <div class="g-lesson"><p class="g-lbl">Lo que enseña</p><p>${lesson}</p></div>
        <div class="g-row"><button class="p-opt p-go" data-act="drShare">Compartir el podio</button><button class="p-opt" data-act="drAgain">Revancha</button></div>
    </div>`;
}
function drBeginDraft(players, start) {
    Object.assign(dr, { phase: "draft", players, per: drPer(players.length), picks: players.map(() => []), t: 0, start, year: 0 });
}
function drAfterPick() {
    if (dr.t >= dr.players.length * dr.per) { drStop(); dr.phase = "season"; dr.year = 0; const g = gState(); g.draft.played = (g.draft.played || 0) + 1; save(); }
    drPaint();
}
function drApply(room) {
    Object.assign(dr, { players: room.players, picks: room.picks, t: room.t, per: room.per, start: room.start, me: room.me, host: room.host });
    if (room.phase === "lobby") dr.phase = "lobby";
    else if (room.phase === "draft") dr.phase = "draft";
    else if (room.phase === "done" && ["lobby", "draft"].includes(dr.phase)) return drAfterPick();
    drPaint();
}
function drPoll() {
    drStop();
    dr.poll = setInterval(async () => {
        if (!$("#gRoot") || route() !== "draft") return drStop();
        try { const sala = await salaApi.read(dr.code); if (sala.version !== dr.ver) { dr.ver = sala.version; drApply(drRoomView(sala)); } }
        catch { /* reintenta en el siguiente ciclo */ }
    }, 1500);
}
/* Online: la partida vive en una fila de Supabase (tabla «salas») con control de versión.
   Cada jugada lee la sala, la modifica y la escribe; si alguien se adelantó, se repite. */
const drMe = () => user?.id;
function drRoomView(sala) {
    const e = sala.estado;
    return { phase: e.phase, players: e.players.map(p => p.name), picks: e.picks, t: e.t, per: e.per, start: e.start, me: e.players.findIndex(p => p.id === drMe()), host: e.players[0]?.id === drMe() };
}
async function drWrite(code, mutate, tries = 6) {
    for (let k = 0; k < tries; k++) {
        const sala = await salaApi.read(code), est = JSON.parse(JSON.stringify(sala.estado));
        if (mutate(est) === false) return sala; // nada que cambiar
        try { return await salaApi.write(code, sala.version, est); }
        catch (e) { if (!/conflicto/i.test(e.message)) throw e; }
    }
    throw new Error("La sala está muy movida. Inténtalo otra vez.");
}
const drOffline = "Para jugar online necesitas acceder a tu cuenta. Mientras tanto, jugad en un solo móvil.";
function drMsg(t) { const m = $("#drMsg"); if (m) m.textContent = t; else toast(t); }

/* =========================================================
   Acciones, formularios y ciclo de vida (app.js los integra)
========================================================= */
const GAME_ROUTES = ["noticia", "silueta", "masomenos", "draft"];
const GAME_VIEWS = {
    noticia: () => gShell("noticia", "Noticia al vuelo", `#${gDayNo()}`),
    silueta: () => gShell("silueta", "Silueta", `#${gDayNo()}`),
    masomenos: () => gShell("masomenos", "Más o menos"),
    draft: () => gShell("draft", "Draft Night")
};
const GAME_TITLES = { juegos: "Juegos", noticia: "Noticia al vuelo", silueta: "Silueta", masomenos: "Más o menos", draft: "Draft Night" };
const GAME_MOUNT = { noticia: () => nwMount(), silueta: siMount, masomenos: mmMount, draft: drMount };
// al cambiar de cuenta no deben quedar partidas ni clasificaciones de la persona anterior
function gamesReset() { gTimerStop(); si = null; mm = null; dr = null; if (typeof nw !== "undefined") nw = null; if (typeof liga !== "undefined") Object.assign(liga, { rows: null, friends: null, alias: null, err: null }); }
function gameLeave() { gTimerStop(); if (typeof nw !== "undefined" && nw) clearTimeout(nw.auto); drStop(); }

const GAME_ACTIONS = {
    gShareDay: () => gShare(gShareDayText()),
    siPick: el => siPick(el.dataset.k),
    siNext: () => { si.answered = false; if (si.res.length < 5) si.i++; siPaint(); },
    siShare: () => gShare(`🔍 Silueta${si.practice ? " (práctica)" : ` #${gDayNo()}`} · Horizonte\n${si.res.map(v => v ? "🟩" : "🟥").join("")} ${si.res.filter(Boolean).length}/5 · ${gPts(si.pts)}`),
    siAgain: () => { siNew(true); siPaint(); },
    mmGuess: el => mmGuess(el.dataset.v),
    mmAgain: () => { mmNew(); mmPaint(); },
    mmShare: () => gShare(`⚖️ Más o menos · Horizonte\nRacha de ${mm.streak} 🔥 · ${gPts(mm.pts)} (récord ${gState().mm.best})\n¿La superas?`),
    drLocal: () => { dr = { phase: "setup", mode: "local", names: dr?.names?.length ? dr.names : ["", ""] }; drPaint(); },
    drAdd: () => { drKeepNames(); if (dr.names.length < 5) dr.names.push(""); drPaint(); },
    drDel: el => { drKeepNames(); dr.names.splice(+el.dataset.i, 1); drPaint(); },
    drCreate: async () => {
        if (!socialOn()) return drMsg(drOffline);
        const name = ($("#drName")?.value || "").trim().slice(0, 14);
        if (!name) { $("#drName")?.focus(); return drMsg("Escribe tu nombre para crear la sala."); }
        try {
            const sala = await salaApi.create({ phase: "lobby", players: [{ id: drMe(), name }], picks: [], t: 0, per: 0, start: null });
            dr = { mode: "online", phase: "lobby", code: sala.codigo, ver: sala.version, myName: name }; drApply(drRoomView(sala)); drPoll();
        } catch (e) { drMsg(e.message); }
    },
    drInvite: () => gShare(`🃏 ¡Draft Night en Horizonte! Entra en Juegos → Draft Night → Unirme con el código ${dr.code}\n${location.origin}${location.pathname}#/draft`),
    drStart: async () => {
        try {
            const sala = await drWrite(dr.code, e => {
                if (e.players[0].id !== drMe()) throw new Error("Solo el anfitrión puede empezar.");
                if (e.players.length < 2) throw new Error("Hacen falta al menos 2 jugadores.");
                if (e.phase !== "lobby") return false;
                Object.assign(e, { phase: "draft", per: drPer(e.players.length), picks: e.players.map(() => []), t: 0, start: Math.floor(Math.random() * (G_LAST + 1)) });
            });
            dr.ver = sala.version; drApply(drRoomView(sala));
        } catch (e) { toast(e.message); }
    },
    drPick: async el => {
        const k = el.dataset.k;
        if (dr.mode === "local") { if (drTaken()[k] !== undefined) return; dr.picks[drTurn(dr.t, dr.players.length)].push(k); dr.t++; return drAfterPick(); }
        try {
            const sala = await drWrite(dr.code, e => {
                const n = e.players.length, me = e.players.findIndex(p => p.id === drMe());
                if (e.phase !== "draft") throw new Error("No es momento de elegir.");
                if (drTurn(e.t, n) !== me) throw new Error("Todavía no es tu turno.");
                if (e.picks.flat().includes(k)) throw new Error("Esa carta ya está cogida.");
                e.picks[me].push(k); e.t++;
                if (e.t >= n * e.per) e.phase = "done";
            });
            dr.ver = sala.version; drApply(drRoomView(sala));
        } catch (e) { toast(e.message); }
    },
    drYear: () => { if (dr.year < G_SPAN) { dr.year++; drPaint(); } else { dr.phase = "end"; drPaint(); } $(".game")?.scrollTo(0, 0); },
    drSkip: () => { dr.year = G_SPAN; dr.phase = "end"; drPaint(); $(".game")?.scrollTo(0, 0); },
    drShare: () => {
        const rows = dr.players.map((p, i) => ({ p, i, v: drValue(i, G_SPAN) })).sort((a, b) => b.v - a.v);
        gShare(`🃏 Draft Night · Horizonte\nDécada secreta: ${gYears(dr.start)}\n${rows.map((r, k) => `${["🥇", "🥈", "🥉"][k] || `${k + 1}.`} ${r.p} ${dr.picks[r.i].map(c => gIco(gCard(c), "sm")).join("")} ${fmtR(r.v)}`).join("\n")}`);
    },
    drAgain: () => {
        if (dr.mode === "online") { drStop(); dr = { phase: "menu", names: dr.players.slice(0, 5) }; return drPaint(); }
        drBeginDraft([...dr.players].reverse(), Math.floor(Math.random() * (G_LAST + 1))); drPaint();
    }
};
function drKeepNames() { $$(".dr-names input").forEach((inp, i) => { dr.names[i] = inp.value; }); }
const GAME_FORMS = {
    drLocal: form => {
        drKeepNames();
        const names = dr.names.map((n, i) => n.trim() || `Jugador ${i + 1}`);
        drBeginDraft(names, Math.floor(Math.random() * (G_LAST + 1))); drPaint();
    },
    drJoin: async form => {
        const f = new FormData(form), code = String(f.get("code") || "").trim().toUpperCase(), name = String(f.get("name") || "").trim().slice(0, 14);
        if (!socialOn()) return drMsg(drOffline);
        if (!name) return drMsg("Escribe tu nombre.");
        if (!code) return drMsg("Escribe el código de la sala o pulsa «Crear sala».");
        try {
            const sala = await drWrite(code, e => {
                if (e.players.some(p => p.id === drMe())) return false;
                if (e.phase !== "lobby") throw new Error("La partida ya ha empezado.");
                if (e.players.length >= 5) throw new Error("La sala está completa (5 jugadores).");
                e.players.push({ id: drMe(), name });
            });
            dr = { mode: "online", phase: "lobby", code, ver: sala.version, myName: name }; drApply(drRoomView(sala)); drPoll();
        } catch (e) { drMsg(e.message); }
    }
};
