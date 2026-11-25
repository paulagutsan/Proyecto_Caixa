"use strict";
/* Horizonte · Tus millas: tu casa y catálogo, y en qué está invertida la cartera base
   Categorías y marcas del catálogo: caixabank.es/particular/facilitea y caixabank.es/particular/myhome (nov. 2026).
   Los precios y los descuentos son de ejemplo: la propuesta del equipo, no una oferta de esas empresas.
   Se carga antes que app.js: sus utilidades solo se usan dentro de funciones. */

/* ---------------------------------------------------------------- supuestos de la estimación de vivienda */
const HOUSE = {
    inflation: 2,        // objetivo del BCE a medio plazo (% anual)
    growth: 3.5,         // subida de la vivienda: más de un 40 % en diez años ≈ 3,5 % anual
    maxAge: 55, costs: 10,
};
const grow = (v, g, months) => v * Math.pow(1 + g / 100, months / 12);

/* ---------------------------------------------------------------- catálogo */
const CAT_TIERS = [[250, 2], [500, 4], [1000, 6], [2000, 8], [4000, 10]];       // millas → % de descuento
const CAT_CAP = 100;                                                            // máximo por canje, en euros
const CATALOG = [
    { id: "tv", g: "Tecnología", ic: "tv", t: "Televisor OLED", b: "Samsung, Sony, TCL · Facilitea", p: 900 },
    { id: "movil", g: "Tecnología", ic: "phone", t: "Móvil o tableta", b: "Apple, Samsung, Xiaomi · Facilitea", p: 600 },
    { id: "consola", g: "Tecnología", ic: "pad", t: "Consola y juegos", b: "Sony, Nintendo · Facilitea", p: 450 },
    { id: "reloj", g: "Tecnología", ic: "watch", t: "Reloj deportivo", b: "Garmin · Facilitea", p: 300 },
    { id: "dyson", g: "Hogar", ic: "spark", t: "Aspirador y limpieza", b: "Dyson, Philips · Facilitea", p: 400 },
    { id: "mueble", g: "Hogar", ic: "casa", t: "Muebles", b: "Kave Home · Facilitea", p: 500 },
    { id: "manitas", g: "Hogar", ic: "settings", t: "Seguro de hogar con arreglos", b: "MyBox Hogar, con Servicio Manitas Plus", p: 250 },
    { id: "alarma", g: "Hogar", ic: "shield", t: "Alarma para casa", b: "MyBox Alarma PreSense · Securitas Direct", p: 400 },
    { id: "limpieza", g: "Hogar", ic: "spark", t: "Limpieza a domicilio", b: "Propuesta: empresa por acordar", p: 60 },
    { id: "salud", g: "Salud y mascotas", ic: "salud", t: "Seguro de salud", b: "MyBox Salud · SegurCaixa Adeslas", p: 600 },
    { id: "mascota", g: "Salud y mascotas", ic: "paw", t: "Seguro de mascotas", b: "MyBox Mascotas · SegurCaixa Adeslas", p: 200 },
    { id: "auto", g: "Movilidad y viajes", ic: "coche", t: "Seguro de coche", b: "MyBox Auto · SegurCaixa Adeslas", p: 450 },
    { id: "scooter", g: "Movilidad y viajes", ic: "coche", t: "Scooter", b: "Yamaha · Facilitea", p: 2500 },
    { id: "cargador", g: "Movilidad y viajes", ic: "spark", t: "Cargador de coche eléctrico", b: "Repsol · Facilitea", p: 900 },
    { id: "viaje", g: "Movilidad y viajes", ic: "plane", t: "Viajes", b: "Facilitea Viajes", p: 500 },
];
let catGroup = "Todo";
const milesSpent = () => (S.redeem || []).reduce((a, r) => a + r.n, 0);
const catSave = (p, pc) => Math.min(CAT_CAP, p * pc / 100);
const milesReview = `Sujeto a revisión según la situación económica, los tipos de interés y las condiciones que ofrezca CaixaBank en cada momento. No es una oferta.`;

const milesTabs = cur => `<nav class="ideas-tabs" aria-label="Tus millas"><a href="#/casa" class="${cur === "casa" ? "on" : ""}">${ic("house")}Tu casa</a><a href="#/catalogo" class="${cur === "catalogo" ? "on" : ""}">${ic("gift")}Catálogo</a></nav>`;
function milesHead(cur) {
    const mi = miles(), next = CAT_TIERS.find(x => x[0] > mi.total), best = [...CAT_TIERS].reverse().find(x => x[0] <= mi.total);
    return `${pageH("Tus millas", "Gánalas con tu constancia y úsalas en lo que quieras: tu primera casa o productos y servicios de CaixaBank.")}
    <div class="mls"><div class="mls-n"><b>${num(mi.total)}</b><span>millas disponibles</span></div>
      <dl><div><dt>Si las guardas para tu casa</dt><dd>hasta −${pts(mi.cut)} puntos</dd></div><div><dt>Si las usas en el catálogo</dt><dd>${best ? `hasta un ${best[1]} % menos` : `desde ${num(CAT_TIERS[0][0])} millas`}</dd></div>${next ? `<div><dt>Siguiente escalón</dt><dd>${num(next[0] - mi.total)} millas más</dd></div>` : ""}</dl></div>
    ${milesTabs(cur)}`;
}

/* ---------------------------------------------------------------- pestaña 1: tu casa */
function vCasa() {
    const m = money(), mi = miles(), P0 = mortgageAmount(), interest = payment(P0, MORTGAGE_RATE, MORTGAGE_YEARS) * MORTGAGE_YEARS * 12 - P0;
    const rules = [["Cada tema de Fundamentos", `+${MILES.lesson}`, `${Object.keys(S.lessons).length} de ${LESSONS.length}`], ["Superar Fundamentos", `+${MILES.theory}`, S.exam?.passed ? "Conseguido" : ""],
        ["Un juego al día", `+${MILES.game}`, Object.keys(S.games).length ? `${Object.keys(S.games).length} días jugados` : ""], ["Cada 4 semanas de constancia", `+${MILES.streak4}`, `Constancia actual: ${streak().current} semanas`],
        ["Tu primer euro propio", `+${MILES.firstOwn}`, m.firstOwn ? "Conseguido" : ""], ["Cada mes que aportas", `+${MILES.monthOwn}`, S.weekly || S.roundup ? "Ahorro automático activo" : ""],
        ["Revisión anual", `+${MILES.itv}`, ""], ["Regalos de tu familia", `+${MILES.giftPer5} cada 5 €`, `Máximo ${MILES.giftMonthCap} al mes`]];
    const steps = [500, 1000, 2500, 5000].map(n => { const c = cutOf(n), sv = mortgageSaving(c); return [n, c, interest > 0 ? sv / interest * 100 : 0, sv]; });
    return `${milesHead("casa")}
    <div class="grid">
      ${card(`${cardH("¿Cuándo podrías comprar?", "Con la subida de la vivienda y la inflación ya incluidas.", `<div class="seg" role="radiogroup" aria-label="En qué euros"><button role="radio" data-real="0" class="on">Euros de entonces</button><button role="radio" data-real="1">Euros de hoy</button></div>`)}
        <div class="pj2" data-proj>
          <div class="pj2-in">
            <label class="pj2-f"><span>Cada mes apartas</span><output data-o="mon"></output><input type="range" min="0" max="${MON_STEPS.length - 1}" step="1" value="${monIdx(m.monthly > 0 ? m.monthly : 100)}" data-i="mon" aria-label="Euros al mes"></label>
            <label class="pj2-f"><span>Para una casa que hoy cuesta</span><output data-o="price"></output><input type="range" min="60000" max="600000" step="5000" value="${Math.min(600000, Math.max(60000, S.goal.price))}" data-i="price" aria-label="Precio de la vivienda hoy"></label>
          </div>
          <p class="pj2-say" data-o="say"></p>
          <div class="pj2-chart" data-o="chart"></div>
          <div class="pj2-key"><span><i class="k-a"></i>Lo que tendrías</span><span><i class="k-b"></i>Lo que aportas</span><span><i class="k-c"></i>La entrada que necesitas</span></div>
          <dl class="pj-list"><div><dt>La casa costaría</dt><dd data-o="fut"></dd></div><div><dt>Tu dinero, en euros de hoy</dt><dd data-o="today"></dd></div><div><dt data-o="atk"></dt><dd data-o="miles"></dd></div></dl>
        </div>
        <div class="pj2-notes"><b>Son estimaciones, no una promesa.</b><ul>
          <li><b>Tu dinero</b> crece un ${EST.gross} % anual, aportando cada mes lo mismo y sin descontar comisiones ni impuestos. Puede ganar menos, e incluso perder. <span data-o="range"></span></li>
          <li><b>La vivienda</b> sube un ${pct(HOUSE.growth, 1)} al año: es lo que equivale a su subida de más del 40 % en los últimos diez años. Ahora sube más (12,2 % interanual, INE, 2.º trimestre de 2026), pero no es razonable suponer que siga así décadas.</li>
          <li><b>La inflación</b> es del ${HOUSE.inflation} % al año, el objetivo del Banco Central Europeo: por eso un euro de entonces compra menos que uno de hoy.</li>
          <li><b>La entrada</b> es el 20 % del precio. Aparte hay impuestos y gastos, normalmente en torno a un ${HOUSE.costs} % más. El aval del ICO para menores de 35 puede reducir la entrada.</li></ul></div>`, "c-12")}
      ${card(`${cardH("Tus millas en tu hipoteca", "Cuantas más guardes, menos interés pagarías en tu primera hipoteca con CaixaBank.")}
        <table class="mtab"><thead><tr><th>Millas</th><th>Rebaja del interés</th><th>Intereses que te ahorras</th><th></th></tr></thead><tbody>${steps.map(([n, c, pc, sv]) => `<tr class="${mi.total >= n ? "ok" : ""}"><td><b>${num(n)}</b></td><td>−${pts(c)} puntos</td><td>${pct(pc, 1)} · ${eur(sv)}</td><td>${mi.total >= n ? badge(`${ic("check")}Conseguido`, "ok") : `Faltan ${num(n - mi.total)}`}</td></tr>`).join("")}</tbody></table>
        <p class="note">Ejemplo con una hipoteca de ${eur(P0)} a ${MORTGAGE_YEARS} años al ${pct(MORTGAGE_RATE, 1)}. Máximo: ${pts(MILES.maxCut)} puntos. ${milesReview} No obliga a contratar otros productos (Ley 5/2019). <a href="#/legal">Ver condiciones</a>.</p>`, "c-12")}
      ${card(`${cardH("Cómo se ganan")}<div class="rows">${rules.map(([t, n, s]) => `<div class="row"><div><b>${t}</b>${s ? `<span>${s}</span>` : ""}</div><b class="amt gold">${n}</b></div>`).join("")}</div>`, "c-6")}
      ${milesHistory()}
    </div>`;
}
function milesHistory() {
    const mi = miles();
    return card(`${cardH("Historial de millas")}${mi.items.length ? `<div class="rows">${mi.items.slice(0, 8).map(i => `<div class="row"><div><b>${esc(i.label)}</b><span>${fmtD(i.date)}</span></div><b class="amt gold">${i.n < 0 ? "−" : "+"}${num(Math.abs(i.n))}</b></div>`).join("")}</div>` : empty("star", "Aún no tienes millas", "Empieza por Fundamentos: cada tema suma.", lnk("Ir a Aprende", "#/aprende", "primary"))}`, "c-6");
}
function bindProj() {
    const v = $("[data-proj]"); if (!v) return;
    if (v._upd) return v._upd();
    const age = ageOf(), base = miles().total, value = money().value, r = RATE(EST.gross) / 12, N = Math.max(120, (HOUSE.maxAge - age) * 12);
    let t, real = false;
    const defl = (x, k) => real ? x / Math.pow(1 + HOUSE.inflation / 100, k / 12) : x;
    const upd = () => {
        const mon = MON_STEPS[+$('[data-i="mon"]', v).value], price = +$('[data-i="price"]', v).value, need = k => grow(price * DOWN_PCT, HOUSE.growth, k);
        const path = [value]; let reach = value >= need(0) ? 0 : null;
        for (let k = 1; k <= N; k++) { path.push(path[k - 1] * (1 + r) + mon); if (reach === null && path[k] >= need(k)) reach = k; }
        const k = reach ?? Math.min(N, 180), yrs = Math.ceil(k / 12), at = age + yrs;
        S.goal = { price, age: Math.max(at, age + 1) }; clearTimeout(t); t = setTimeout(save, 400);
        const o = (key, txt) => { const e = $(`[data-o="${key}"]`, v.closest(".card")); if (e) e.innerHTML = txt; };
        const unit = real ? " de hoy" : "", E = (x, kk) => `${eur(Math.round(defl(x, kk) / 100) * 100)}${unit}`;
        o("mon", eur(mon)); o("price", eur(price));
        if (reach === 0) o("say", `Ya tendrías la entrada: <b>${eur(need(0))}</b>.`);
        else if (reach !== null) o("say", `Podrías tener la entrada <b>a los ${at} años</b>, dentro de ${yrs} ${yrs === 1 ? "año" : "años"}: unos <b>${E(need(k), k)}</b>.`);
        else {
            const kk = 144, m2 = Math.ceil(Math.max(0, need(kk) - value * (1 + r) ** kk) / (((1 + r) ** kk - 1) / r) / 5) * 5;
            o("say", `A este ritmo, la vivienda sube más deprisa que tu ahorro. Con unos <b>${eur(m2)} al mes</b> podrías tener la entrada a los ${age + 12} años; una casa más pequeña, tu familia o el aval del ICO también ayudan.`);
        }
        o("fut", `${E(grow(price, HOUSE.growth, k), k)}<small>a los ${at} años</small>`);
        o("today", `${eur(Math.round(path[k] / Math.pow(1 + HOUSE.inflation / 100, k / 12) / 100) * 100)}<small>son ${eur(Math.round(path[k] / 100) * 100)} de entonces</small>`);
        const giftM = Math.min(MILES.giftMonthCap, Math.floor(S.schedules.reduce((a, y) => a + y.amount, 0) / 5)), mt = base + ((mon > 0 ? MILES.monthOwn * 12 : 0) + giftM * 12 + MILES.itv) * yrs;
        o("atk", `Tus millas a los ${at}`); o("miles", `${num(mt)}<small>hasta −${pts(cutOf(mt))} puntos</small>`);
        const sc = g => { let x = value; for (let i = 0; i < k; i++) x = x * (1 + RATE(g) / 12) + mon; return x; };
        o("range", `Con un ${EST.scenarios[0][0]} % tendrías ${E(sc(EST.scenarios[0][0]), k)}; con un ${EST.scenarios[2][0]} %, ${E(sc(EST.scenarios[2][0]), k)}.`);
        /* gráfica: la entrada también sube, así que es una curva y no una línea fija */
        const box = $('[data-o="chart"]', v), W = Math.max(300, box.clientWidth), H = W < 560 ? 230 : 290, pr = 10, pt = 24, pb = 28, endM = Math.min(N, Math.max(reach === null ? 180 : reach + 48, 84));
        const idx = Array.from({ length: 81 }, (_, i) => Math.round(i * endM / 80)), put = q => value + mon * q;
        const top = Math.max(...[0, endM].map(q => Math.max(defl(need(q), q), defl(path[q], q)))) * 1.12, X = q => q / endM * (W - pr), Y = y => pt + (1 - y / top) * (H - pt - pb);
        const L = f => idx.map((q, i) => `${i ? "L" : "M"}${X(q).toFixed(1)},${Y(defl(f(q), q)).toFixed(1)}`).join(""), line = L(q => path[q]);
        const step = [5e3, 1e4, 2e4, 25e3, 5e4, 1e5].find(x => top / x < 5) || 2e5, yt = []; for (let y = step; y < top; y += step) yt.push(y);
        const xt = []; for (let y = 0; y <= endM / 12; y += endM > 240 ? 5 : endM > 96 ? 3 : 2) xt.push(y);
        box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Lo que tendrías frente a la entrada, que sube con el precio de la vivienda">
          <defs><linearGradient id="pjg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--blue)" stop-opacity=".24"/><stop offset="1" style="stop-color:var(--blue)" stop-opacity="0"/></linearGradient></defs>
          ${yt.map(y => `<line x1="0" x2="${W - pr}" y1="${Y(y)}" y2="${Y(y)}" style="stroke:var(--line)"/><text x="2" y="${Y(y) - 5}" class="ht-t4">${eur(y)}</text>`).join("")}
          <line x1="0" x2="${W - pr}" y1="${H - pb}" y2="${H - pb}" style="stroke:var(--line-2)"/>
          ${xt.map(y => `<text x="${X(y * 12).toFixed(1)}" y="${H - 7}" text-anchor="${!y ? "start" : X(y * 12) > W - 34 ? "end" : "middle"}" class="pj2-t">${y ? `${age + y} años` : "Hoy"}</text>`).join("")}
          <path d="${line}L${X(endM)},${H - pb}L0,${H - pb}Z" fill="url(#pjg)"/>
          <path d="${L(put)}" fill="none" style="stroke:var(--ink-3)" stroke-width="1.5" stroke-dasharray="2 4"/>
          <path d="${L(need)}" fill="none" style="stroke:var(--gold)" stroke-width="2.2" stroke-dasharray="7 5"/>
          <path d="${line}" fill="none" style="stroke:var(--blue)" stroke-width="2.8" stroke-linejoin="round"/>
          ${reach !== null ? `<circle cx="${X(reach)}" cy="${Y(defl(need(reach), reach))}" r="7" style="fill:var(--gold);stroke:var(--surface)" stroke-width="3"/><text x="${Math.min(W - 50, Math.max(40, X(reach)))}" y="${Y(defl(need(reach), reach)) - 15}" text-anchor="middle" class="pj2-reach">${at} años</text>` : ""}</svg>`;
    };
    $$("[data-real]", v.closest(".card")).forEach(b => b.addEventListener("click", () => { real = b.dataset.real === "1"; $$("[data-real]", v.closest(".card")).forEach(x => x.classList.toggle("on", x === b)); upd(); }));
    v._upd = upd; $$("input", v).forEach(i => i.addEventListener("input", upd)); upd();
}

/* ---------------------------------------------------------------- pestaña 2: catálogo */
function vCatalogo() {
    const mi = miles(), groups = ["Todo", ...new Set(CATALOG.map(c => c.g))], list = CATALOG.filter(c => catGroup === "Todo" || c.g === catGroup), best = [...CAT_TIERS].reverse().find(x => x[0] <= mi.total), used = [...(S.redeem || [])].reverse();
    return `${milesHead("catalogo")}
    <div class="grid">
      ${card(`${cardH("Elige en qué usarlas", "Productos y servicios de CaixaBank y sus marcas.")}
        <div class="chips cat-f">${groups.map(g => `<button class="chip ${g === catGroup ? "on" : ""}" data-act="mlGroup" data-g="${esc(g)}">${g}</button>`).join("")}</div>
        <div class="cat">${list.map(c => `<button class="cat-i" data-act="mlOpen" data-id="${c.id}"><span>${ic(c.ic)}</span><div><b>${c.t}</b><small>${c.b}</small></div><em>${best ? `−${best[1]} %<small>hasta ${eur(catSave(c.p, best[1]))}</small>` : `desde ${num(CAT_TIERS[0][0])}<small>millas</small>`}</em></button>`).join("")}</div>`, "c-12")}
      ${card(`${cardH("Cuánto te descuentan")}<table class="mtab"><thead><tr><th>Millas</th><th>Descuento</th><th></th></tr></thead><tbody>${CAT_TIERS.map(([n, p]) => `<tr class="${mi.total >= n ? "ok" : ""}"><td><b>${num(n)}</b></td><td>${p} %</td><td>${mi.total >= n ? badge(`${ic("check")}Disponible`, "ok") : `Faltan ${num(n - mi.total)}`}</td></tr>`).join("")}</tbody></table>
        <p class="note">Máximo ${eur(CAT_CAP)} por canje. Precios y descuentos de ejemplo. ${milesReview}</p>`, "c-6")}
      ${card(`${cardH("Tus canjes")}${used.length ? `<div class="rows">${used.map(u => `<div class="row"><div><b>${esc(u.t)} · −${u.pc} %</b><span>${fmtD(u.date)} · código ${esc(u.code)}</span></div>${btn("Devolver", "mlBack", "sm ghost", `data-c="${esc(u.code)}"`)}</div>`).join("")}</div>` : empty("gift", "Aún no has usado tus millas", "Cuando canjees, verás aquí tu código de descuento.")}`, "c-6")}
    </div>`;
}
function catSheet(id) {
    const c = CATALOG.find(x => x.id === id), mi = miles(); if (!c) return;
    sheet(c.t, `<p class="sub">${c.b}</p><form data-form="mlUse" class="form"><input type="hidden" name="id" value="${c.id}">
      <div class="cat-opts">${CAT_TIERS.map(([n, p], i) => `<label class="cat-o ${mi.total < n ? "off" : ""}"><input type="radio" name="n" value="${n}" required ${mi.total < n ? "disabled" : ""}><span><b>${num(n)} millas</b><small>${mi.total < n ? `Te faltan ${num(n - mi.total)}` : `Te quedarían ${num(mi.total - n)}`}</small></span><em>−${p} %<small>≈ ${eur(catSave(c.p, p))} en ${eur(c.p)}</small></em></label>`).join("")}</div>
      ${mi.total >= CAT_TIERS[0][0] ? `<button class="btn primary lg block">Usar mis millas</button>` : lnk("Ganar millas en Aprende", "#/aprende", "primary lg block")}
      <p class="note">Las millas que uses aquí ya no cuentan para tu casa. ${isAdult() ? "" : "La compra la hace tu madre, padre o tutor. "}Precio de ejemplo. ${milesReview}</p></form>`);
}
document.addEventListener("submit", e => {
    const f = e.target.closest('[data-form="mlUse"]'); if (!f) return;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f)), n = +d.n, tier = CAT_TIERS.find(x => x[0] === n), c = CATALOG.find(x => x.id === d.id);
    if (!tier || !c || miles().total < n) return toast("No tienes millas suficientes");
    (S.redeem ||= []).push({ id: c.id, t: c.t, n, pc: tier[1], date: iso(new Date()), code: makeId().replace("HZ-", "ML-") });
    save(); closeSheet(); toast(`Descuento del ${tier[1]} % conseguido`); rerender();
});
document.addEventListener("click", e => {
    const b = e.target.closest('[data-act^="ml"]'); if (!b) return;
    if (b.dataset.act === "mlGroup") { catGroup = b.dataset.g; rerender(); }
    else if (b.dataset.act === "mlOpen") catSheet(b.dataset.id);
    else if (b.dataset.act === "mlBack") { S.redeem = (S.redeem || []).filter(r => r.code !== b.dataset.c); save(); toast("Millas devueltas"); rerender(); }
});

/* ---------------------------------------------------------------- en qué está invertido tu dinero (reparto de ejemplo de la cartera base) */
const BASE_MIX = [["Tecnología", 25, "#5b50d6"], ["Finanzas", 16, "#007eae"], ["Salud", 11, "#d33f73"], ["Industria", 11, "#6d7f99"], ["Consumo y ocio", 10, "#e07a2f"], ["Comunicación", 8, "#1aa3c4"], ["Alimentación y básicos", 6, "#7aa33c"], ["Energía", 4, "#c9972b"], ["Materiales", 3, "#8a6a4f"], ["Electricidad y agua", 3, "#1f9d63"], ["Inmobiliario", 3, "#b56fc2"]];
const baseTop = () => BASE_MIX.slice(0, 3).map(([n, p]) => `${n.toLowerCase()} ${p} %`).join(", ");
function whereMoney(m) {
    const baseW = m.parts.find(p => p.fund === "global")?.w ?? 0, p1 = x => pct(x, x % 1 ? 1 : 0);
    const segs = [...BASE_MIX.map(([t, p, c]) => ({ t, w: baseW * p / 100, c })), ...m.parts.filter(p => p.fund !== "global").map(p => ({ t: FUNDS[p.fund].name, w: p.w, c: FUND_COLOR[p.fund], fear: p.fear?.label }))];
    const R = 80, C = 2 * Math.PI * R; let off = 0;
    const arcs = segs.map(s => { const len = Math.max(0, s.w * C - 1.6), a = `<circle r="${R}" cx="110" cy="110" fill="none" stroke="${s.c}" stroke-width="${s.fear ? 38 : 30}" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"><title>${esc(s.t)}: ${p1(Math.round(s.w * 1000) / 10)}</title></circle>`; off += s.w * C; return a; }).join("");
    const li = s => `<li><i style="background:${s.c}"></i><span>${esc(s.t)}${s.fear ? `<small>«${esc(s.fear)}»</small>` : ""}</span><b>${p1(Math.round(s.w * 1000) / 10)}</b><em>${eur(m.value * s.w, true)}</em></li>`;
    const ant = segs.filter(s => s.fear);
    return `<div class="wm"><div class="wm-d"><svg viewBox="0 0 220 220" role="img" aria-label="Reparto de tu dinero por sectores"><g transform="rotate(-90 110 110)">${arcs}</g></svg><div><small>Tu dinero</small><b>${eur(m.value, true)}</b></div></div>
      <div class="wm-l"><h3>Cartera base <span>${p1(baseW * 100)}</span></h3><ul>${segs.filter(s => !s.fear).map(li).join("")}</ul>${ant.length ? `<h3>Antídoto <span>${p1((1 - baseW) * 100)}</span></h3><ul>${ant.map(li).join("")}</ul>` : ""}</div></div>
      <p class="note">Reparto de ejemplo de un fondo global diversificado. El real figura en la ficha de cada fondo y cambia con el tiempo.</p>`;
}
