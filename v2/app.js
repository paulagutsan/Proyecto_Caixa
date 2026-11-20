"use strict";
/* Horizonte v2 · Del primer euro a la primera casa
   Prototipo en HTML, CSS y JavaScript, sin servidor: el estado se guarda en el navegador (localStorage).
   Cinco ideas: carnet de joven inversor con diploma, regalos de la familia, el primer año sin perder dinero,
   millas de casa y el Antídoto con Gemini. */

const KEY = "hz2_state";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const eur = (v, dec = false) => (dec
    ? v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" })
    : Math.round(v).toLocaleString("es-ES", { useGrouping: "always" })) + " €";
const num = v => Math.round(v).toLocaleString("es-ES", { useGrouping: "always" });
const pct = (v, d = 0) => v.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
const pts = v => v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const iso = d => { const x = new Date(d); return new Date(x.getTime() - x.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
const fmtD = d => new Date(d + (String(d).length === 10 ? "T12:00:00" : "")).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
const fmtShort = d => new Date(d + (String(d).length === 10 ? "T12:00:00" : "")).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
const yearsSince = d => Math.max(0, (Date.now() - new Date(d + "T12:00:00").getTime()) / (365.25 * 864e5));
const makeId = () => "HZ-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Date.now().toString(36).slice(-4).toUpperCase();
const svgIcon = (inner, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
const CHECK = '<path d="M5 12.5l4.2 4.2L19 7"/>';

/* ------------------------------------------------------------------ estado */
function fresh(name = "", birth = "2011-03-14") {
    return { v: 1, onboarded: false, profile: { name, surname: "", birth }, lessons: {}, exam: null, diploma: null, itv: [],
             money: [], schedules: [], paga: 0, roundup: false, fears: [], antidoteApproved: false, geminiOk: false, voted: false, chat: [] };
}
function demo() {
    const s = fresh("Leo", "2011-03-14");
    s.profile.surname = "García";
    s.onboarded = true;
    const m = (n, dd = 0) => { const d = addMonths(new Date(), -n); d.setDate(Math.max(1, Math.min(27, d.getDate() + dd))); return iso(Math.min(d.getTime(), Date.now())); };
    LESSONS.forEach((l, i) => s.lessons[l.id] = m(6, -3 + i));
    s.exam = { date: m(6, 2), score: 9, total: 10, passed: true };
    s.diploma = { id: makeId(), date: m(6, 2) };
    s.money.push({ date: m(6, 2), amount: RULES.prize, src: "premio" });
    s.money.push({ date: m(6, 4), amount: 5, src: "paga" });
    for (let i = 5; i >= 0; i--) s.money.push({ date: m(i, 0), amount: 20, src: "paga" });
    for (let i = 5; i >= 0; i--) s.money.push({ date: m(i, 1), amount: 3.4, src: "redondeo" });
    for (let i = 5; i >= 0; i--) s.money.push({ date: m(i, -1), amount: 30, src: "mensual", from: "Mamá" });
    s.money.push({ date: m(4, 5), amount: 50, src: "regalo", from: "Abuela Carmen", occasion: "Fin de curso", msg: "Por esas notas. Para tu casa del futuro." });
    s.money.push({ date: m(1, 3), amount: 25, src: "regalo", from: "Tío Javier", occasion: "Porque sí", msg: "Me ha dicho tu madre que ya tienes el carnet de inversor. ¡Crack!" });
    s.schedules.push({ from: "Mamá", amount: 30, since: m(5, -1) });
    s.paga = 5; s.roundup = true;
    s.fears = ["casa", "ia"]; s.antidoteApproved = true; s.geminiOk = true;
    s.money.sort((a, b) => a.date.localeCompare(b.date));
    return s;
}
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sin almacenamiento */ } };

/* ------------------------------------------------------------------ cálculos */
function ageOf(birth = S.profile.birth) {
    const b = new Date(birth + "T12:00:00"), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
}
const isOwn = c => SOURCES[c.src]?.own;
const isOwnReal = c => isOwn(c) && c.src !== "premio";   // tu primer euro propio: no cuenta el premio
const isGift = c => c.src === "regalo" || c.src === "mensual";

function allocation() {
    const age = ageOf();
    const fears = S.fears.slice(0, RULES.maxFears).map(id => FEARS.find(f => f.id === id)).filter(Boolean);
    const active = fears.length && (S.antidoteApproved || age >= RULES.adultAge);
    if (!active) return { active: false, pending: fears.length > 0, parts: [{ fund: "global", w: 1 }], fears };
    const parts = [{ fund: "global", w: RULES.base }, ...fears.map(f => ({ fund: f.fund, w: RULES.antidote / fears.length, fear: f }))];
    return { active: true, pending: false, parts, fears };
}

function money() {
    const al = allocation();
    const r = al.parts.reduce((a, p) => a + p.w * FUNDS[p.fund].r / 100, 0);
    const invested = S.money.reduce((a, c) => a + c.amount, 0);
    const value = S.money.reduce((a, c) => a + c.amount * (1 + r * yearsSince(c.date)), 0);
    const own = S.money.filter(isOwn).reduce((a, c) => a + c.amount, 0);
    const gifts = S.money.filter(isGift).reduce((a, c) => a + c.amount, 0);
    const firstOwnC = S.money.filter(isOwnReal).sort((a, b) => a.date.localeCompare(b.date))[0] || null;
    const ownAll = S.money.filter(isOwn).sort((a, b) => a.date.localeCompare(b.date));
    let protect = null;
    if (ownAll.length) {
        const start = ownAll[0].date;
        const end = iso(addMonths(start + "T12:00:00", RULES.protectMonths));
        let base = 0;
        ownAll.forEach(c => { if (c.date <= end) base = Math.min(RULES.protectCap, base + c.amount); });
        const daysLeft = Math.ceil((new Date(end + "T12:00:00") - Date.now()) / 864e5);
        protect = { start, end, base, room: daysLeft > 0 ? RULES.protectCap - base : 0, daysLeft, active: daysLeft > 0 };
    }
    const roundupMonth = BANK_DEMO.moves.reduce((a, m) => a + (Math.ceil(m.a) - m.a), 0);
    const monthly = S.paga * 52 / 12 + (S.roundup ? roundupMonth : 0) + S.schedules.reduce((a, x) => a + x.amount, 0);
    const parts = al.parts.map(p => ({ ...p, amount: value * p.w }));
    return { al, r, invested, value, own, gifts, firstOwnC, protect, roundupMonth, monthly, parts };
}

function miles() {
    const items = [];
    const lessonTitle = id => LESSONS.find(l => l.id === id)?.title || id;
    Object.entries(S.lessons).forEach(([id, d]) => items.push({ n: MILES.lesson, date: d, label: `Tema «${lessonTitle(id)}»` }));
    if (S.exam?.passed) items.push({ n: MILES.theory, date: S.exam.date, label: "Aprobaste el teórico" });
    const own = S.money.filter(isOwnReal).sort((a, b) => a.date.localeCompare(b.date));
    if (own.length) items.push({ n: MILES.firstOwn, date: own[0].date, label: "Tu primer euro propio" });
    const lastIn = (list, ym) => list.filter(c => c.date.startsWith(ym)).map(c => c.date).sort().pop();
    [...new Set(own.map(c => c.date.slice(0, 7)))].forEach(ym => items.push({ n: MILES.monthOwn, date: lastIn(own, ym), label: `Aportaste tú en ${new Date(ym + "-15T12:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" })}` }));
    S.itv.forEach(d => items.push({ n: MILES.itv, date: d, label: "ITV anual del carnet" }));
    const giftsByMonth = {};
    S.money.filter(isGift).forEach(c => { const ym = c.date.slice(0, 7); giftsByMonth[ym] = (giftsByMonth[ym] || 0) + c.amount; });
    Object.entries(giftsByMonth).forEach(([ym, sum]) => {
        const n = Math.min(MILES.giftMonthCap, Math.floor(sum / 5) * MILES.giftPer5);
        if (n) items.push({ n, date: lastIn(S.money.filter(isGift), ym), label: `Regalos de tu familia en ${new Date(ym + "-15T12:00:00").toLocaleDateString("es-ES", { month: "long" })}${Math.floor(sum / 5) > MILES.giftMonthCap ? " (tope mensual)" : ""}` });
    });
    items.sort((a, b) => b.date.localeCompare(a.date));
    const total = items.reduce((a, i) => a + i.n, 0);
    return { items, total, cut: cutOf(total) };
}
const cutOf = m => Math.min(MILES.maxCut, m / MILES.perPoint);
function payment(P, ratePct, years) { const r = ratePct / 100 / 12, n = years * 12; return r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n)); }
const mortgageSaving = cut => (payment(MORTGAGE.amount, MORTGAGE.rate, MORTGAGE.years) - payment(MORTGAGE.amount, MORTGAGE.rate - cut, MORTGAGE.years)) * MORTGAGE.years * 12;
function milesPerYear(m = money()) {
    const ownMonthly = S.paga > 0 || S.roundup;
    const giftMonth = Math.min(MILES.giftMonthCap, Math.floor(S.schedules.reduce((a, x) => a + x.amount, 0) / 5));
    return (ownMonthly ? MILES.monthOwn * 12 : 0) + giftMonth * 12 + (S.diploma ? MILES.itv : 0);
}
function fv(monthly, years, start = 0, rate = 0.05) { const r = rate / 12; let v = start; for (let i = 0; i < years * 12; i++) v = v * (1 + r) + monthly; return v; }

function geminiContext() {
    const m = money(), mi = miles(), age = ageOf();
    const yrs = Math.max(1, RULES.houseAge - age);
    const atHouse = mi.total + milesPerYear(m) * yrs;
    return {
        name: S.profile.name, age, houseAge: RULES.houseAge, value: m.value, monthly: m.monthly, houseDown: BANK_DEMO.houseDown,
        miles: mi.total, cutTxt: pts(mi.cut), milesYear: milesPerYear(m), milesAtHouse: Math.round(atHouse), cutAtHouseTxt: pts(cutOf(atHouse)),
        savingAtHouse: mortgageSaving(cutOf(atHouse)), mortgage: MORTGAGE,
        fears: m.parts.filter(p => p.fear).map(p => ({ id: p.fear.id, label: p.fear.label, why: p.fear.why, fundName: FUNDS[p.fund].name, amount: p.amount })),
        baseAmount: m.parts.find(p => p.fund === "global")?.amount || 0, antidoteAmount: m.parts.filter(p => p.fear).reduce((a, p) => a + p.amount, 0),
        protectBase: m.protect?.base || 0, protectEnd: m.protect ? fmtD(m.protect.end) : "", protectRoom: m.protect?.room ?? RULES.protectCap, protectCap: RULES.protectCap,
        moves: BANK_DEMO.moves, movesTotal: BANK_DEMO.moves.reduce((a, x) => a + x.a, 0), roundup: m.roundupMonth, paga: S.paga ? BANK_DEMO.paga : BANK_DEMO.paga,
        savingsAccount: BANK_DEMO.savingsAccount, ownFirst: !!m.firstOwnC,
        diploma: S.diploma ? fmtD(S.diploma.date) : null, itvDue: S.diploma ? fmtD(iso(addMonths(lastItv() + "T12:00:00", 12))) : null,
        lessonsDone: Object.keys(S.lessons).length, lessonsTotal: LESSONS.length, prize: RULES.prize,
    };
}
const lastItv = () => S.itv.length ? S.itv[S.itv.length - 1] : S.diploma?.date;

/* ------------------------------------------------------------------ acciones */
function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = msg;
    $("#toasts").appendChild(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 400); }, 3200);
}
function addMoney(c) {
    const before = miles().total;
    const wasFirst = !money().firstOwnC;
    S.money.push({ date: iso(new Date()), ...c });
    S.money.sort((a, b) => a.date.localeCompare(b.date));
    save();
    const gained = miles().total - before;
    if (wasFirst && isOwnReal(c)) toast(`<b>¡Tu primer euro propio!</b> Es la métrica que más nos importa. +${gained} millas de casa`);
    else if (gained > 0) toast(`+${gained} millas de casa`);
    else if (isGift(c) && gained === 0) toast("Regalo recibido. Este mes ya se ha llegado al tope de millas por regalos");
}

/* ------------------------------------------------------------------ piezas de interfaz */
const sec = (cls, inner) => `<section class="sec ${cls}">${inner}</section>`;
const head = (eyebrow, title, lead = "") => `<header class="sh">${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ""}<h2>${title}</h2>${lead ? `<p class="lead">${lead}</p>` : ""}</header>`;
const bar = (v, max, cls = "") => `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, v / max * 100)).toFixed(1)}%"></i></div>`;
const kpi = (n, l, cls = "") => `<div class="kpi ${cls}"><b>${n}</b><span>${l}</span></div>`;
const btn = (label, act, cls = "", data = "") => `<button class="btn ${cls}" data-act="${act}" ${data}>${label}</button>`;
const link = (label, href, cls = "") => `<a class="btn ${cls}" href="${href}">${label}</a>`;
const fearIcon = id => svgIcon(ICONS[id] || ICONS.casa, "fear-ic");

/* ------------------------------------------------------------------ vistas */
function vOnboarding() {
    return `<div class="onb">
      <img class="onb-star" src="brand/horizonte-icono.svg" alt="" width="92" height="76">
      <p class="eyebrow">Horizonte · CaixaBank Asset Management × Google</p>
      <h1>A los 15 te sacas el carnet de inversor. Inviertes en lo que te da miedo. A los 27, las llaves de tu casa.</h1>
      <p class="lead">Un recorrido que empieza a los 15 años, con tu familia detrás, y termina en tu primera hipoteca.</p>
      <div class="onb-actions">
        ${btn("Ver el ejemplo de Leo, 15 años", "demo", "primary lg")}
        ${btn("Empezar de cero", "startFresh", "ghost lg")}
      </div>
      <form class="onb-form" data-form="start" hidden>
        <label>Tu nombre<input name="name" required maxlength="30" autocomplete="given-name" placeholder="Por ejemplo, Lucía"></label>
        <label>Fecha de nacimiento<input name="birth" type="date" required value="2011-03-14"></label>
        <button class="btn primary">Empezar</button>
      </form>
      <p class="fine">Prototipo para el reto de CaixaBank AM × Google. Datos de ejemplo y rentabilidades simuladas; nada de esto es asesoramiento. <a href="../v1/">Ver la versión 1</a></p>
    </div>`;
}

function stageText(m, age) {
    if (!S.exam?.passed) return `Empieza por el teórico: apruébalo y gana ${RULES.prize} € invertidos a tu nombre.`;
    if (!m.firstOwnC) return "Ya tienes tu carnet en prácticas. Ahora falta lo más importante: tu primer euro propio.";
    if (age >= RULES.adultAge) return "Ya tienes tu carnet completo: la cuenta es tuya.";
    if (m.protect?.active) return `Estás en prácticas con la L. Quedan ${m.protect.daysLeft} días de tu primer año sin perder.`;
    return "Has terminado tus prácticas. Sigue sumando millas hasta tu carnet completo a los 18.";
}

function vInicio() {
    const m = money(), mi = miles(), age = ageOf();
    const yrs18 = Math.max(0, RULES.adultAge - age), yrsHouse = Math.max(0, RULES.houseAge - age);
    const steps = [
        { t: "Teórico", s: S.exam?.passed ? `Aprobado el ${fmtShort(S.exam.date)} · ${RULES.prize} € ganados` : `Aprueba y gana ${RULES.prize} €`, st: S.exam?.passed ? "done" : "now", href: "#/carnet" },
        { t: "Prácticas con la L", s: m.protect ? (m.protect.active ? `Primer año sin perder: quedan ${m.protect.daysLeft} días` : "Primer año completado") : "Tus primeros 500 € no pueden perder", st: !S.exam?.passed ? "next" : (m.protect && !m.protect.active ? "done" : "now"), href: "#/dinero" },
        { t: "Carnet completo", s: age >= RULES.adultAge ? "La cuenta ya es tuya" : `A los 18 · dentro de ${yrs18} ${yrs18 === 1 ? "año" : "años"}`, st: age >= RULES.adultAge && S.exam?.passed ? "done" : "next", href: "#/carnet" },
        { t: "Tu primera casa", s: `A los ${RULES.houseAge} · con ${num(mi.total)} millas de casa por ahora`, st: "next", href: "#/casa" },
    ];
    const next = [];
    if (!S.exam?.passed) next.push(["Aprueba el teórico", `Cinco temas cortos y un examen. Premio: ${RULES.prize} € invertidos.`, "#/carnet"]);
    if (!m.firstOwnC) next.push(["Pon tu primer euro propio", "De tu paga, del redondeo de tus compras o de un trabajo de verano.", "#/dinero"]);
    if (!S.fears.length) next.push(["Elige tu Antídoto", "Dinos qué te da miedo de tu futuro y una parte de tu dinero invertirá justo en eso.", "#/antidoto"]);
    else if (!allocation().active) next.push(["Pide a tu familia que apruebe tu Antídoto", "Hasta los 18 lo aprueban tus padres.", "#/familia"]);
    if (!S.geminiOk && age < RULES.adultAge) next.push(["Activa Gemini con permiso de tu familia", "Para que te explique tu dinero con tus propios números.", "#/familia"]);
    if (!S.schedules.length) next.push(["Cuéntaselo a tu familia", "Pueden regalarte dinero para tu casa desde la app de CaixaBank.", "#/familia"]);
    const gifts = S.money.filter(c => c.src === "regalo").slice(-3).reverse();
    return `
    ${sec("hero", `<p class="eyebrow">Del primer euro a la primera casa</p><h1>Hola, ${esc(S.profile.name || "")}.</h1><p class="lead">${stageText(m, age)}</p>`)}
    ${sec("metric " + (m.firstOwnC ? "ok" : ""), m.firstOwnC
        ? `<div class="metric-ic">${svgIcon(CHECK)}</div><div><p class="eyebrow">La métrica que más importa</p><h3>Pusiste tu primer euro propio el ${fmtD(m.firstOwnC.date)}</h3><p>Desde entonces has puesto ${eur(m.own - (S.exam?.passed ? RULES.prize : 0))} de tu bolsillo. Cada mes que aportas suma ${MILES.monthOwn} millas de casa.</p></div>`
        : `<div><p class="eyebrow">La métrica que más importa</p><h3>Tu primer euro propio, antes de los 18</h3><p>Con 1 € basta. Es el paso que convierte a un ahorrador en inversor.</p></div>${link("Poner mi primer euro", "#/dinero", "primary")}`)}
    ${sec("kpis", `<a href="#/dinero">${kpi(eur(m.value), "Tu dinero invertido")}</a><a href="#/dinero">${kpi(m.protect ? `${eur(m.protect.base)} <small>de ${RULES.protectCap} €</small>` : `0 € <small>de ${RULES.protectCap} €</small>`, "Protegido el primer año")}</a><a href="#/casa">${kpi(num(mi.total), `Millas de casa · ${pts(mi.cut)} puntos menos`)}</a>`)}
    ${sec("road", `${head("Tu camino", "Del teórico a las llaves de tu casa")}<ol class="steps">${steps.map((s, i) => `<li class="${s.st}"><a href="${s.href}"><span class="dot">${s.st === "done" ? svgIcon(CHECK) : i + 1}</span><b>${s.t}</b><span>${s.s}</span></a></li>`).join("")}</ol>`)}
    ${next.length ? sec("next", `${head("Ahora", "Tus siguientes pasos")}<div class="list">${next.slice(0, 4).map(([t, d, h]) => `<a class="row" href="${h}"><div><b>${t}</b><span>${d}</span></div><span class="chev">›</span></a>`).join("")}</div>`) : ""}
    ${gifts.length ? sec("gifts", `${head("Tu familia", "Últimos regalos")}<div class="list">${gifts.map(g => `<div class="row gift"><div><b>${esc(g.from)} · ${eur(g.amount)}</b><span>${g.msg ? "«" + esc(g.msg) + "»" : esc(g.occasion || "Regalo")}</span></div><span class="muted">${fmtShort(g.date)}</span></div>`).join("")}</div>`) : ""}
    `;
}

/* ---------------- Carnet */
function diplomaData() {
    const p = S.profile;
    return { n: `${p.name} ${p.surname}`.trim(), i: S.diploma.id, f: S.diploma.date, s: `${S.exam.score}/${S.exam.total}`, v: iso(addMonths(lastItv() + "T12:00:00", 12)) };
}
const verifyUrl = d => `${location.origin}${location.pathname}#/verificar?d=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(d)))))}`;
function diplomaSVG(d) {
    const t = s => esc(s);
    return `<svg class="diploma" viewBox="0 0 1200 840" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diploma del carnet de joven inversor de ${t(d.n)}">
      <rect width="1200" height="840" fill="#ffffff"/>
      <rect x="28" y="28" width="1144" height="784" rx="18" fill="none" stroke="#007eae" stroke-width="3"/>
      <rect x="44" y="44" width="1112" height="752" rx="12" fill="none" stroke="#cfe6f0" stroke-width="1.5"/>
      <text x="96" y="132" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#007eae" letter-spacing="3">CAIXABANK ASSET MANAGEMENT · HORIZONTE</text>
      <text x="96" y="236" font-family="'Source Serif 4', Georgia, serif" font-size="68" fill="#1d1d1f">Carnet de joven inversor</text>
      <text x="96" y="290" font-family="Inter, Arial, sans-serif" font-size="24" fill="#6e6e73">Teórico aprobado · Nivel 1</text>
      <text x="96" y="384" font-family="Inter, Arial, sans-serif" font-size="24" fill="#6e6e73">Se certifica que</text>
      <text x="96" y="458" font-family="'Source Serif 4', Georgia, serif" font-size="58" font-weight="600" fill="#1d1d1f">${t(d.n)}</text>
      <text x="96" y="526" font-family="Inter, Arial, sans-serif" font-size="23" fill="#3a3a3c">ha superado el teórico del carnet de joven inversor: interés compuesto, riesgo y plazo,</text>
      <text x="96" y="562" font-family="Inter, Arial, sans-serif" font-size="23" fill="#3a3a3c">diversificación, estafas y apuestas, con un resultado de ${t(d.s)}.</text>
      <line x1="96" y1="660" x2="420" y2="660" stroke="#1d1d1f" stroke-width="1.5"/>
      <text x="96" y="694" font-family="Inter, Arial, sans-serif" font-size="19" fill="#6e6e73">Fecha de emisión: ${t(fmtD(d.f))}</text>
      <text x="96" y="724" font-family="Inter, Arial, sans-serif" font-size="19" fill="#6e6e73">Válido hasta la ITV: ${t(fmtD(d.v))}</text>
      <line x1="640" y1="660" x2="1104" y2="660" stroke="#1d1d1f" stroke-width="1.5"/>
      <text x="640" y="694" font-family="Inter, Arial, sans-serif" font-size="19" fill="#6e6e73">CaixaBank Asset Management</text>
      <text x="640" y="724" font-family="Inter, Arial, sans-serif" font-size="19" fill="#6e6e73">Código de verificación: ${t(d.i)}</text>
      <circle cx="1040" cy="190" r="74" fill="#007eae"/><circle cx="1040" cy="190" r="62" fill="none" stroke="#ffffff" stroke-width="2"/>
      <text x="1040" y="182" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="700" fill="#ffffff" letter-spacing="1">CARNET</text>
      <text x="1040" y="208" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="700" fill="#ffffff" letter-spacing="1">INVERSOR</text>
      <text x="1104" y="790" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="15" fill="#8e8e93">Prototipo del reto CaixaBank AM × Google · sin validez oficial</text>
    </svg>`;
}
function linkedinUrl(d) {
    const f = new Date(d.f + "T12:00:00"), v = new Date(d.v + "T12:00:00");
    const q = new URLSearchParams({ startTask: "CERTIFICATION_NAME", name: "Carnet de joven inversor", organizationName: "CaixaBank Asset Management",
        issueYear: f.getFullYear(), issueMonth: f.getMonth() + 1, expirationYear: v.getFullYear(), expirationMonth: v.getMonth() + 1, certUrl: verifyUrl(d), certId: d.i });
    return "https://www.linkedin.com/profile/add?" + q.toString();
}

function vCarnet() {
    const done = Object.keys(S.lessons).length, age = ageOf(), m = money();
    const allDone = done === LESSONS.length;
    let dip = "";
    if (S.diploma && S.exam?.passed) {
        const d = diplomaData();
        const itvDue = d.v, itvOpen = (new Date(itvDue + "T12:00:00") - Date.now()) / 864e5 < 31;
        dip = sec("dip", `${head("Tu diploma", "Carnet de joven inversor", "Guárdalo en el móvil, compártelo y, a partir de los 16, añádelo a LinkedIn. Se renueva cada año, como la ITV.")}
          <div class="dip-wrap">${diplomaSVG(d)}</div>
          <div class="actions">
            ${btn("Descargar imagen", "dlDiploma", "primary")}
            ${age >= RULES.linkedinAge ? `<a class="btn" href="${esc(linkedinUrl(d))}" target="_blank" rel="noopener">Añadir a LinkedIn</a>` : `<button class="btn" disabled title="LinkedIn pide 16 años">Añadir a LinkedIn a los 16</button>`}
            ${btn("Copiar enlace de verificación", "copyVerify")}
          </div>
          <div class="itv"><div><b>ITV anual</b><span>${S.itv.length ? `Última revisión: ${fmtD(lastItv())}. ` : ""}Próxima antes del ${fmtD(itvDue)}: un repaso de 5 preguntas sobre lo que ha cambiado en tu vida y tu Antídoto. Suma ${MILES.itv} millas.</span></div>
          ${btn(itvOpen ? "Pasar la ITV" : "Pasar la ITV (demostración)", "itv", itvOpen ? "primary" : "ghost")}</div>`);
    }
    return `
    ${sec("hero sm", `<p class="eyebrow">Idea 1 · Carnet de joven inversor</p><h1>Como el de conducir, pero para tu dinero.</h1>
      <p class="lead">Teórico, prácticas con la L y carnet completo a los 18. Aprobar el teórico te da tu primer euro invertido: <b>${RULES.prize} €</b>. No se regala, se gana.</p>`)}
    ${sec("phases-sec", `<div class="phases">
        <div class="${S.exam?.passed ? "done" : "now"}"><span>1</span><b>Teórico</b><p>${S.exam?.passed ? `Aprobado con ${S.exam.score}/${S.exam.total}` : `${done} de ${LESSONS.length} temas`}</p></div>
        <div class="${S.exam?.passed ? (m.protect && !m.protect.active ? "done" : "now") : ""}"><span class="l">L</span><b>Prácticas</b><p>Tu primer año sin perder dinero</p></div>
        <div class="${age >= RULES.adultAge && S.exam?.passed ? "done" : ""}"><span>18</span><b>Carnet completo</b><p>${age >= RULES.adultAge ? "La cuenta es tuya" : `Dentro de ${RULES.adultAge - age} ${RULES.adultAge - age === 1 ? "año" : "años"}`}</p></div>
      </div>`)}
    ${dip}
    ${sec("theory", `${head("El teórico", "Cinco temas de tres minutos", `Cada tema aprobado suma ${MILES.lesson} millas de casa. Al final, un examen de ${RULES.examSize} preguntas: como en la autoescuela, puedes fallar ${RULES.examMaxErrors}.`)}
      <div class="list">${LESSONS.map((l, i) => `<a class="row lesson ${S.lessons[l.id] ? "done" : ""}" href="#/tema/${l.id}/0"><span class="num">${S.lessons[l.id] ? svgIcon(CHECK) : i + 1}</span><div><b>${l.title}</b><span>${l.sub} · ${l.min} min</span></div><span class="chev">›</span></a>`).join("")}</div>
      <div class="exam-cta">
        <div><b>Examen final</b><span>${S.exam?.passed ? `Aprobado el ${fmtD(S.exam.date)}. Puedes repetirlo para practicar.` : allDone ? `Todo listo. Premio: ${RULES.prize} € invertidos y tu diploma.` : `Se desbloquea al terminar los ${LESSONS.length} temas (${done}/${LESSONS.length}).`}</span></div>
        ${allDone || S.exam?.passed ? link(S.exam?.passed ? "Repetir el examen" : "Hacer el examen", "#/examen", S.exam?.passed ? "" : "primary") : `<button class="btn" disabled>Hacer el examen</button>`}
      </div>`)}
    `;
}

let lessonState = null;
function vTema(id, step) {
    const l = LESSONS.find(x => x.id === id);
    if (!l) return vCarnet();
    const total = l.cards.length + l.check.length;
    step = Math.max(0, Math.min(total - 1, +step || 0));
    if (!lessonState || lessonState.id !== id) lessonState = { id, answers: {} };
    const prog = `<div class="lprog"><a class="back" href="#/carnet" aria-label="Volver al carnet">‹</a>${bar(step + 1, total)}<span>${step + 1}/${total}</span></div>`;
    let body;
    if (step < l.cards.length) {
        const c = l.cards[step];
        body = `<p class="eyebrow">${esc(l.title)}</p><h1>${c.h}</h1>${c.p.map(p => `<p class="lead">${p}</p>`).join("")}${c.viz ? viz(c.viz) : ""}
          <div class="lnav">${step ? link("Anterior", `#/tema/${id}/${step - 1}`, "ghost") : "<span></span>"}${link("Siguiente", `#/tema/${id}/${step + 1}`, "primary")}</div>`;
    } else {
        const qi = step - l.cards.length, q = l.check[qi], ans = lessonState.answers[qi];
        const last = step === total - 1;
        body = `<p class="eyebrow">Comprueba lo que sabes · ${qi + 1} de ${l.check.length}</p><h1>${q.q}</h1>
          <div class="opts">${q.o.map((o, i) => `<button class="opt ${ans !== undefined ? (i === q.a ? "right" : i === ans ? "wrong" : "") : ""}" data-act="lessonAns" data-q="${qi}" data-i="${i}" ${ans !== undefined ? "disabled" : ""}>${o}</button>`).join("")}</div>
          ${ans !== undefined ? `<p class="why ${ans === q.a ? "ok" : "ko"}"><b>${ans === q.a ? "¡Bien!" : "Casi."}</b> ${q.why}</p>` : ""}
          <div class="lnav">${link("Anterior", `#/tema/${id}/${step - 1}`, "ghost")}${ans !== undefined ? (last ? btn("Terminar el tema", "lessonDone", "primary", `data-id="${id}"`) : link("Siguiente", `#/tema/${id}/${step + 1}`, "primary")) : ""}</div>`;
    }
    return `<div class="lesson-view">${prog}<article class="lcard">${body}</article></div>`;
}

function viz(kind) {
    if (kind === "compound") return `<div class="viz" data-viz="compound">
        <label>Pones cada mes <output data-o="m">20 €</output><input type="range" min="5" max="100" step="5" value="20" data-i="m"></label>
        <label>Durante <output data-o="y">12 años</output><input type="range" min="3" max="40" step="1" value="12" data-i="y"></label>
        <div class="vbars"><div><span>Lo que pones</span><b data-o="put"></b><div class="bar"><i data-b="put"></i></div></div>
        <div><span>Lo que podrías tener (5 % anual, hipotético)</span><b data-o="got"></b><div class="bar up"><i data-b="got"></i></div></div></div>
        <p class="fine">Simulación con una rentabilidad hipotética del 5 % anual. No es una previsión.</p></div>`;
    if (kind === "drops") {
        const pts = [100, 112, 104, 121, 96, 108, 131, 118, 142, 127, 151, 166, 149, 172, 188];
        const W = 600, H = 200, max = 200, min = 80;
        const xy = pts.map((v, i) => [i * W / (pts.length - 1), H - (v - min) / (max - min) * H]);
        const d = xy.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
        return `<figure class="viz"><svg viewBox="0 0 600 220" class="line"><path d="${d}" fill="none" stroke="#007eae" stroke-width="3" stroke-linejoin="round"/>
          ${[4, 9, 12].map(i => `<circle cx="${xy[i][0]}" cy="${xy[i][1]}" r="6" fill="#d93025"/>`).join("")}</svg>
          <figcaption>Ejemplo ilustrativo: las caídas (en rojo) se recuperan si das tiempo. No son datos reales.</figcaption></figure>`;
    }
    return "";
}
function bindViz() {
    $$('[data-viz="compound"]').forEach(v => {
        const upd = () => {
            const mm = +$('[data-i="m"]', v).value, y = +$('[data-i="y"]', v).value;
            const put = mm * 12 * y, got = fv(mm, y);
            $('[data-o="m"]', v).textContent = mm + " €";
            $('[data-o="y"]', v).textContent = y + " años";
            $('[data-o="put"]', v).textContent = eur(put);
            $('[data-o="got"]', v).textContent = eur(got);
            $('[data-b="put"]', v).style.width = (put / got * 100).toFixed(1) + "%";
            $('[data-b="got"]', v).style.width = "100%";
        };
        $$("input", v).forEach(i => i.addEventListener("input", upd));
        upd();
    });
}

let examState = null;
function vExamen() {
    if (!examState) {
        const pool = [...EXAM].sort(() => Math.random() - 0.5).slice(0, RULES.examSize);
        examState = { qs: pool, i: 0, errors: 0, ans: null, over: false };
    }
    const e = examState;
    if (e.over) {
        const passed = e.errors <= RULES.examMaxErrors;
        return `<div class="lesson-view"><article class="lcard center">
          <p class="eyebrow">Examen final</p>
          <h1>${passed ? "¡Aprobado!" : "Esta vez no"}</h1>
          <p class="lead">${passed ? `${RULES.examSize - e.errors} de ${RULES.examSize}. Ya tienes tu carnet de joven inversor en prácticas, ${RULES.prize} € invertidos a tu nombre y ${MILES.theory} millas de casa.` : `Has fallado ${e.errors}: el máximo es ${RULES.examMaxErrors}. Repasa los temas y vuelve a intentarlo.`}</p>
          <div class="lnav center">${passed ? link("Ver mi diploma", "#/carnet", "primary") : btn("Repetir el examen", "examRetry", "primary")}</div></article></div>`;
    }
    const q = e.qs[e.i];
    return `<div class="lesson-view"><div class="lprog"><a class="back" href="#/carnet" aria-label="Salir del examen">‹</a>${bar(e.i + 1, RULES.examSize)}<span>${e.i + 1}/${RULES.examSize}</span></div>
      <article class="lcard"><p class="eyebrow">Examen final · fallos: ${e.errors} de ${RULES.examMaxErrors} permitidos</p><h1>${q.q}</h1>
      <div class="opts">${q.o.map((o, i) => `<button class="opt ${e.ans !== null ? (i === q.a ? "right" : i === e.ans ? "wrong" : "") : ""}" data-act="examAns" data-i="${i}" ${e.ans !== null ? "disabled" : ""}>${o}</button>`).join("")}</div>
      ${e.ans !== null ? `<p class="why ${e.ans === q.a ? "ok" : "ko"}"><b>${e.ans === q.a ? "Correcto." : "Fallo."}</b> ${q.why}</p><div class="lnav"><span></span>${btn(e.i === RULES.examSize - 1 || e.errors > RULES.examMaxErrors ? "Ver resultado" : "Siguiente", "examNext", "primary")}</div>` : ""}
      </article></div>`;
}

function vVerificar(params) {
    let d = null;
    try { d = JSON.parse(decodeURIComponent(escape(atob(params.get("d") || "")))); } catch (e) { d = null; }
    if (!d || !d.n) return sec("hero sm", `<h1>Diploma no encontrado</h1><p class="lead">El enlace no es válido.</p>`);
    return `${sec("hero sm", `<p class="eyebrow">Verificación de diploma · demostración</p><h1>${esc(d.n)} tiene el carnet de joven inversor.</h1>
      <p class="lead">Emitido el ${fmtD(d.f)} · válido hasta el ${fmtD(d.v)} · código ${esc(d.i)}. En la versión real, CaixaBank lo comprobaría en sus sistemas.</p>`)}
      ${sec("dip", `<div class="dip-wrap">${diplomaSVG(d)}</div>`)}
      ${sec("", `<p class="fine">Prototipo de Horizonte. ${S.onboarded ? '<a href="#/inicio">Volver a mi Horizonte</a>' : '<a href="#/">Conocer Horizonte</a>'}</p>`)}`;
}

/* ---------------- Mi dinero */
function vDinero() {
    const m = money(), age = ageOf();
    const gain = m.value - m.invested;
    const p = m.protect;
    const lastMoves = [...S.money].reverse().slice(0, 8);
    return `
    ${sec("hero sm", `<p class="eyebrow">Mi dinero</p><h1>${eur(m.value)}</h1>
      <p class="lead">Has puesto ${eur(m.invested)}: ${eur(m.own)} tuyos y ${eur(m.gifts)} de tu familia. <span class="${gain >= 0 ? "up" : "down"}">${gain >= 0 ? "+" : ""}${eur(gain, true)}</span> desde el principio (rentabilidad simulada).</p>`)}
    ${sec("alloc", `${head("", "Cómo está repartido", m.al.active ? `Base ${pct(RULES.base * 100)} + Antídoto ${pct(RULES.antidote * 100)}.` : m.al.pending ? "Tu Antídoto está esperando la aprobación de tu familia. Mientras, todo va al fondo global." : "Todo en el fondo global. Elige tu Antídoto para invertir una parte en lo que te preocupa.")}
      <div class="stack">${m.parts.map(pp => `<i class="f-${pp.fund}" style="width:${(pp.w * 100).toFixed(1)}%"></i>`).join("")}</div>
      <div class="list">${m.parts.map(pp => `<div class="row"><span class="sw f-${pp.fund}"></span><div><b>${FUNDS[pp.fund].name}</b><span>${pp.fear ? "Antídoto · " + esc(pp.fear.label) : FUNDS[pp.fund].sub}</span></div><b>${eur(pp.amount)}</b></div>`).join("")}</div>
      ${!m.al.active ? link(S.fears.length ? "Ver mi Antídoto" : "Elegir mi Antídoto", "#/antidoto", "ghost") : ""}`)}
    ${sec("protect", `${head("Idea 3 · El primer año sin perder dinero", "Las prácticas, con doble pedal", `Los primeros ${RULES.protectCap} € que inviertes tú no pueden perder en ${RULES.protectMonths} meses. Si al cumplirse el año valen menos de lo que pusiste, CaixaBank paga la diferencia. Funciona aunque tu familia no haya añadido nada.`)}
      <div class="pmeter"><div class="pm-top"><b>${eur(p?.base || 0)}</b><span>protegidos de ${RULES.protectCap} €</span></div>${bar(p?.base || 0, RULES.protectCap, "blue")}
      <p class="muted">${p ? (p.active ? `Del ${fmtD(p.start)} al ${fmtD(p.end)} · quedan ${p.daysLeft} días · margen libre: ${eur(p.room)}` : `Tu año protegido terminó el ${fmtD(p.end)}.`) : "Empieza cuando pongas tu primer euro (o ganes el premio del teórico)."}</p></div>
      <div class="sim" data-sim>
        <label>¿Y si la bolsa cayera? <output data-o="d">−20 %</output><input type="range" min="-40" max="10" step="5" value="-20" data-i="d"></label>
        <p class="sim-out" data-o="out"></p>
      </div>
      <ul class="rules"><li>Tope de ${RULES.protectCap} € por persona y un máximo por campaña.</li><li>Solo carteras moderadas: la base global y tu Antídoto.</li><li>Solo cubre si no vendes antes de los ${RULES.protectMonths} meses.</li><li>Es una bonificación promocional de CaixaBank, no un fondo garantizado.</li></ul>`)}
    ${sec("own", `${head("Tu dinero propio", m.firstOwnC ? "Sigue poniendo, aunque sea poco" : "Pon tu primer euro", "Con tu paga, el redondeo de tus compras o un trabajo de verano.")}
      <div class="quick">${[1, 5, 10, 20].map(v => btn(`${v} €`, "addOwn", v === 5 ? "primary" : "", `data-v="${v}"`)).join("")}</div>
      <form class="inline" data-form="own"><select name="src" aria-label="De dónde sale"><option value="paga">De mi paga</option><option value="verano">Trabajo de verano</option><option value="otro">Otro ingreso</option></select>
        <input name="amount" type="number" min="1" max="2000" step="1" placeholder="Otra cantidad" aria-label="Cantidad en euros" required><button class="btn">Poner</button></form>
      <div class="list settings">
        <div class="row"><div><b>Apartar de mi paga cada semana</b><span>Tu paga de ejemplo: ${BANK_DEMO.paga} € a la semana</span></div>
          <select data-act="paga" aria-label="Euros a la semana">${[0, 1, 2, 5, 10].map(v => `<option value="${v}" ${S.paga === v ? "selected" : ""}>${v ? v + " €/semana" : "Nada"}</option>`).join("")}</select></div>
        <div class="row"><div><b>Redondeo de compras</b><span>Este mes habría apartado ${eur(m.roundupMonth, true)} sin que lo notes</span></div>
          <label class="switch"><input type="checkbox" data-act="roundup" ${S.roundup ? "checked" : ""}><i></i></label></div>
      </div>`)}
    ${sec("moves", `${head("", "Movimientos")}${lastMoves.length ? `<div class="list">${lastMoves.map(c => `<div class="row"><div><b>${SOURCES[c.src].label}${c.from ? " · " + esc(c.from) : ""}</b><span>${fmtD(c.date)}${c.msg ? " · «" + esc(c.msg) + "»" : ""}</span></div><b class="${isOwn(c) ? "" : "muted"}">+${eur(c.amount, true)}</b></div>`).join("")}</div>` : `<p class="muted">Todavía no hay movimientos.</p>`}`)}
    `;
}
function bindSim() {
    const v = $("[data-sim]"); if (!v) return;
    const upd = () => {
        const d = +$('[data-i="d"]', v).value, base = money().protect?.base || 0;
        $('[data-o="d"]', v).textContent = (d > 0 ? "+" : d < 0 ? "−" : "") + Math.abs(d) + " %";
        const val = base * (1 + d / 100), pay = Math.max(0, base - val);
        $('[data-o="out"]', v).innerHTML = base
            ? (pay > 0 ? `Tus ${eur(base)} protegidos valdrían ${eur(val)}. Al cumplir el año, <b>CaixaBank te pondría ${eur(pay)}</b> y recuperarías lo que pusiste.` : `Tus ${eur(base)} protegidos valdrían ${eur(val)}. No haría falta la protección.`)
            : `Cuando tengas dinero propio, aquí verás cuánto te cubriría CaixaBank.`;
    };
    $('[data-i="d"]', v).addEventListener("input", upd);
    upd();
}

/* ---------------- Antídoto */
let fearRanking = null;
async function loadRanking() {
    const cfg = window.HZ2_CONFIG || {};
    if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
        try {
            const r = await fetch(`${cfg.supabaseUrl}/rest/v1/miedos_v2_ranking?select=miedo,votos`, { headers: { apikey: cfg.supabaseAnonKey, Authorization: `Bearer ${cfg.supabaseAnonKey}` } });
            if (r.ok) { const rows = await r.json(); if (rows.length) { fearRanking = { real: true, counts: Object.fromEntries(rows.map(x => [x.miedo, +x.votos])) }; return; } }
        } catch (e) { /* sin conexión: datos de ejemplo */ }
    }
    fearRanking = { real: false, counts: { ...FEAR_DEMO } };
}
async function voteFears(ids) {
    if (S.voted) return;
    S.voted = true; save();
    if (fearRanking && !fearRanking.real) ids.forEach(id => fearRanking.counts[id] = (fearRanking.counts[id] || 0) + 1);
    const cfg = window.HZ2_CONFIG || {};
    if (!cfg.supabaseUrl) return;
    try {
        await fetch(`${cfg.supabaseUrl}/rest/v1/miedos_v2`, { method: "POST", headers: { apikey: cfg.supabaseAnonKey, Authorization: `Bearer ${cfg.supabaseAnonKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify(ids.map(id => ({ miedo: id, edad: ageOf() }))) });
    } catch (e) { /* sin conexión */ }
}
function vAntidoto() {
    const m = money(), age = ageOf(), al = m.al;
    const canGemini = S.geminiOk || age >= RULES.adultAge;
    const counts = fearRanking?.counts || FEAR_DEMO, tot = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    const rank = FEARS.map(f => ({ f, n: counts[f.id] || 0 })).sort((a, b) => b.n - a.n);
    const chips = ["¿Cuánto me falta para la entrada de mi casa?", "¿Por qué este Antídoto?", "¿Qué pasa si la bolsa baja?", "¿Cómo puedo ahorrar más de mi paga?", "¿Cuántas millas tengo?"];
    return `
    ${sec("hero sm", `<p class="eyebrow">Idea 5 · El Antídoto</p><h1>¿Qué te da miedo de tu futuro?</h1>
      <p class="lead">No te preguntamos cuánto riesgo quieres. Te preguntamos qué te preocupa, y una parte de tu dinero invierte justo en eso: <b>si lo que temes pasa, tu dinero gana</b>.</p>`)}
    ${sec("fears", `${head("", "Elige hasta dos", "Puedes cambiarlo cuando quieras. Cada año lo revisamos en la ITV de tu carnet.")}
      <div class="fgrid">${FEARS.map(f => `<button class="fear ${S.fears.includes(f.id) ? "on" : ""}" data-act="fear" data-id="${f.id}" aria-pressed="${S.fears.includes(f.id)}">${fearIcon(f.id)}<b>${f.label}</b><span>${FUNDS[f.fund].name}</span></button>`).join("")}</div>`)}
    ${S.fears.length ? sec("result", `${head("Tu Antídoto", `Base ${pct(RULES.base * 100)} + Antídoto ${pct(RULES.antidote * 100)}`, "Dentro de un menú cerrado de fondos de CaixaBank Asset Management.")}
      <div class="stack">${(al.active ? al.parts : [{ fund: "global", w: RULES.base }, ...al.fears.map(f => ({ fund: f.fund, w: RULES.antidote / al.fears.length, fear: f }))]).map(pp => `<i class="f-${pp.fund}" style="width:${(pp.w * 100).toFixed(1)}%"></i>`).join("")}</div>
      <div class="list">${al.fears.map(f => `<div class="row tall"><span class="sw f-${f.fund}"></span><div><b>${FUNDS[f.fund].name} · ${pct(RULES.antidote / al.fears.length * 100, 1)}</b><span>${f.why}</span></div></div>`).join("")}
        <div class="row tall"><span class="sw f-global"></span><div><b>${FUNDS.global.name} · ${pct(RULES.base * 100)}</b><span>La base: reparte tu dinero entre miles de empresas para que ningún miedo lo decida todo.</span></div></div></div>
      <p class="status ${al.active ? "ok" : "wait"}">${al.active ? (age >= RULES.adultAge ? "Activo." : "Activo: aprobado por tu familia.") : `Pendiente: hasta los 18, tu familia tiene que aprobarlo. <a href="#/familia">Ir a la vista familia</a>`}</p>
      <p class="fine">Reduce el golpe, no es una garantía. Las inversiones pueden perder valor.</p>`) : ""}
    ${sec("gemini", `${head("Gemini conoce tu realidad", "Tu Antídoto, con tus números", "Con permiso de tus padres (y a partir de los 18, el tuyo), Gemini usa lo que CaixaBank ya sabe: tu paga, tus movimientos, lo que ahorras y tus objetivos. Un neobróker o una IA genérica no conocen tu cuenta.")}
      ${canGemini ? `<div class="chat" id="chat">${S.chat.slice(-6).map(msg => `<div class="msg ${msg.r}">${msg.r === "g" ? '<span class="gname">Gemini</span>' : ""}<p>${esc(msg.t)}</p>${msg.used?.length ? `<small>Usé: ${msg.used.map(esc).join(" · ")}</small>` : ""}</div>`).join("") || `<div class="msg g"><span class="gname">Gemini</span><p>Hola, ${esc(S.profile.name)}. Pregúntame lo que quieras sobre tu dinero: te contesto con tus propios números.</p></div>`}</div>
        <div class="chips">${chips.map(c => `<button class="chip" data-act="ask" data-q="${esc(c)}">${c}</button>`).join("")}</div>
        <form class="inline ask" data-form="ask"><input name="q" placeholder="Escribe tu pregunta" aria-label="Tu pregunta" autocomplete="off" required><button class="btn primary">Preguntar</button></form>
        <p class="fine">Demostración: las respuestas se calculan en tu navegador con datos de ejemplo. En la versión real las daría Gemini en Google Cloud, con los datos de CaixaBank y el permiso de tu familia. No es asesoramiento.</p>`
        : `<div class="locked"><p><b>Necesitas el permiso de tu familia.</b> Hasta los 18, son tus padres quienes deciden si Gemini puede usar tus datos de CaixaBank.</p>${link("Pedir permiso en la vista familia", "#/familia", "primary")}</div>`}`)}
    ${sec("map", `${head("Mapa de miedos de tu generación", "Lo que temen los chavales de España", fearRanking?.real ? "Ranking anónimo con los votos reales de Horizonte." : "Ranking anónimo. Ahora con datos de ejemplo; con Supabase activado se llena con los votos reales.")}
      <div class="rank">${rank.map((x, i) => `<div class="rk ${S.fears.includes(x.f.id) ? "mine" : ""}"><span class="rk-n">${i + 1}</span>${fearIcon(x.f.id)}<div><b>${x.f.label}</b>${bar(x.n, rank[0].n || 1, "blue")}</div><span class="rk-p">${pct(x.n / tot * 100)}</span></div>`).join("")}</div>
      <p class="fine">Para CaixaBank AM es un dato valioso: saber qué preocupa a cada generación, año a año.</p>`)}
    `;
}

/* ---------------- Casa */
function vCasa() {
    const m = money(), mi = miles(), age = ageOf();
    const perYear = milesPerYear(m);
    const rules = [
        ["Cada tema del teórico", `+${MILES.lesson}`, `${Object.keys(S.lessons).length}/${LESSONS.length}`],
        ["Aprobar el teórico", `+${MILES.theory}`, S.exam?.passed ? "Hecho" : "Pendiente"],
        ["Tu primer euro propio", `+${MILES.firstOwn}`, m.firstOwnC ? "Hecho" : "Pendiente"],
        ["Cada mes que aportas tú", `+${MILES.monthOwn}`, S.paga || S.roundup ? "Activo" : "Activa tu paga o el redondeo"],
        ["La ITV anual del carnet", `+${MILES.itv}`, S.itv.length ? `${S.itv.length} hecha${S.itv.length > 1 ? "s" : ""}` : "Cada año"],
        ["Regalos de tu familia", `+${MILES.giftPer5} por cada 5 €`, `tope de ${MILES.giftMonthCap} al mes`],
    ];
    const yrs = Math.max(1, RULES.houseAge - age);
    return `
    ${sec("hero sm", `<p class="eyebrow">Idea 4 · Millas de casa</p><h1>${num(mi.total)} millas</h1>
      <p class="lead">Hoy equivalen a <b>${pts(mi.cut)} puntos</b> menos de diferencial en tu primera hipoteca con CaixaBank: unos ${eur(mortgageSaving(mi.cut))} menos de intereses en una hipoteca de ejemplo de ${eur(MORTGAGE.amount)} a ${MORTGAGE.years} años.</p>`)}
    ${sec("earn", `${head("", "Cómo se ganan", `100 millas = 0,01 puntos menos. Tope: ${pts(MILES.maxCut)} puntos.`)}
      <div class="list">${rules.map(([t, n, st]) => `<div class="row"><div><b>${t}</b><span>${st}</span></div><b class="blue">${n}</b></div>`).join("")}</div>`)}
    ${sec("proj", `${head("Tu proyección", "¿Cuándo quieres tu casa?", "Mueve los controles: es una simulación con hipótesis, no una promesa.")}
      <div class="viz" data-proj data-base="${mi.total}" data-value="${m.value.toFixed(2)}">
        <label>Quiero comprar a los <output data-o="age">${RULES.houseAge} años</output><input type="range" min="${Math.max(age + 3, 20)}" max="40" value="${Math.max(RULES.houseAge, age + 3)}" data-i="age"></label>
        <label>Ponemos cada mes <output data-o="mon">${eur(m.monthly)}</output><input type="range" min="0" max="300" step="5" value="${Math.round(m.monthly / 5) * 5}" data-i="mon"></label>
        <div class="proj-out">
          <div class="kpi"><b data-o="miles"></b><span>millas de casa</span></div>
          <div class="kpi"><b data-o="cut"></b><span>puntos menos de diferencial</span></div>
          <div class="kpi"><b data-o="save"></b><span>menos de intereses (hipoteca de ejemplo)</span></div>
          <div class="kpi"><b data-o="down"></b><span>ahorrado para la entrada (ejemplo: ${eur(BANK_DEMO.houseDown)})</span></div>
        </div>
        <p class="fine">Hipótesis: ${num(perYear)} millas al año a tu ritmo actual, rentabilidad del 5 % anual, hipoteca de ${eur(MORTGAGE.amount)} a ${MORTGAGE.years} años al ${pct(MORTGAGE.rate, 1)}. Con el aval del ICO para menores de 35 la entrada que pide el banco puede ser menor.</p>
      </div>`)}
    ${sec("legal", `${head("", "Las reglas")}
      <ul class="rules"><li>Solo se canjean en una hipoteca con CaixaBank: solo cuestan si firmas con nosotros.</li><li>No caducan. Si nunca compras casa, no pierdes nada: tu dinero sigue siendo tuyo.</li><li>Es una rebaja sobre el precio de ese momento, nunca un precio cerrado ni una obligación de contratar nada (Ley 5/2019).</li><li>Los regalos tienen un tope mensual para que nadie pueda «comprar» la rebaja.</li></ul>`)}
    ${sec("hist", `${head("", "Tus millas")}${mi.items.length ? `<div class="list">${mi.items.slice(0, 14).map(i => `<div class="row"><div><b>${esc(i.label)}</b><span>${fmtD(i.date.slice(0, 10))}</span></div><b class="blue">+${i.n}</b></div>`).join("")}</div>` : `<p class="muted">Aún no tienes millas. Empieza por el teórico.</p>`}`)}
    `;
}
function bindProj() {
    const v = $("[data-proj]"); if (!v) return;
    const base = +v.dataset.base, value = +v.dataset.value, age = ageOf();
    const upd = () => {
        const a = +$('[data-i="age"]', v).value, mon = +$('[data-i="mon"]', v).value;
        const yrs = Math.max(0, a - age);
        const giftM = Math.min(MILES.giftMonthCap, Math.floor(S.schedules.reduce((x, s) => x + s.amount, 0) / 5));
        const perYear = (mon > 0 ? MILES.monthOwn * 12 : 0) + giftM * 12 + MILES.itv;
        const mt = base + perYear * yrs, c = cutOf(mt);
        $('[data-o="age"]', v).textContent = a + " años";
        $('[data-o="mon"]', v).textContent = eur(mon);
        $('[data-o="miles"]', v).textContent = num(mt);
        $('[data-o="cut"]', v).textContent = pts(c);
        $('[data-o="save"]', v).textContent = eur(mortgageSaving(c));
        const down = fv(mon, yrs, value);
        $('[data-o="down"]', v).textContent = eur(down);
    };
    $$("input", v).forEach(i => i.addEventListener("input", upd));
    upd();
}

/* ---------------- Familia */
function vFamilia() {
    const m = money(), mi = miles(), age = ageOf(), al = m.al, name = esc(S.profile.name || "tu hijo");
    return `
    <div class="fam-banner"><span>Así lo vería tu familia en la app de CaixaBank</span>${link("Volver a la vista de " + name, "#/inicio", "sm")}</div>
    ${sec("hero sm", `<p class="eyebrow">Idea 2 · La familia</p><h1>Regala futuro a ${name}.</h1>
      <p class="lead">Padres, abuelos o tíos pueden ingresar dinero para ${name} desde la app de CaixaBank, como un regalo con mensaje. Puntual o cada mes.</p>`)}
    ${sec("kpis", `${kpi(eur(m.value), "Invertido a su nombre")}${kpi(m.firstOwnC ? "Sí" : "Aún no", "Ha puesto su primer euro propio")}${kpi(num(mi.total), "Millas de casa")}`)}
    ${sec("gift", `${head("", "Hacer un regalo", `Cada 5 € suman ${MILES.giftPer5} milla de casa, con un tope de ${MILES.giftMonthCap} millas al mes.`)}
      <form class="gform" data-form="gift">
        <label>Quién regala<select name="from"><option>Mamá</option><option>Papá</option><option>Abuela</option><option>Abuelo</option><option>Tía</option><option>Tío</option></select></label>
        <label>Tipo<select name="type"><option value="puntual">Puntual</option><option value="mensual">Cada mes</option></select></label>
        <label>Cantidad (€)<input name="amount" type="number" min="1" max="3000" value="30" required></label>
        <label>Motivo<select name="occasion"><option>Cumpleaños</option><option>Navidad</option><option>Buenas notas</option><option>Porque sí</option></select></label>
        <label class="full">Mensaje<input name="msg" maxlength="120" placeholder="Para tu casa del futuro"></label>
        <button class="btn primary full">Enviar regalo</button>
      </form>
      ${S.schedules.length ? `<div class="list">${S.schedules.map((s, i) => `<div class="row"><div><b>${esc(s.from)} · ${eur(s.amount)} al mes</b><span>Desde el ${fmtD(s.since)}</span></div>${btn("Cancelar", "cancelSched", "sm ghost", `data-i="${i}"`)}</div>`).join("")}</div>` : ""}`)}
    ${sec("perm", `${head("", "Permisos", "Hasta los 18, las decisiones las tomáis vosotros. A partir de los 18, la cuenta es suya.")}
      <div class="list">
        <div class="row tall"><div><b>Aprobar su Antídoto</b><span>${S.fears.length ? `Ha elegido: ${al.fears.map(f => esc(f.label.toLowerCase())).join(" y ")}. Base ${pct(RULES.base * 100)} en un fondo global y ${pct(RULES.antidote * 100)} en ${al.fears.map(f => FUNDS[f.fund].name.toLowerCase()).join(" y ")}.` : "Todavía no ha elegido sus miedos."}</span></div>
          ${S.fears.length ? `<label class="switch"><input type="checkbox" data-act="approve" ${S.antidoteApproved ? "checked" : ""}><i></i></label>` : ""}</div>
        <div class="row tall"><div><b>Permitir que Gemini use sus datos de CaixaBank</b><span>Su paga y sus movimientos, lo que ahorra cada mes y sus objetivos, para explicarle su dinero con sus propios números. Nunca para publicidad.</span></div>
          <label class="switch"><input type="checkbox" data-act="gemOk" ${S.geminiOk ? "checked" : ""}><i></i></label></div>
      </div>`)}
    `;
}

/* ---------------- Ajustes */
function vAjustes() {
    return `
    ${sec("hero sm", `<p class="eyebrow">Ajustes</p><h1>Tu perfil</h1>`)}
    ${sec("", `<form class="gform" data-form="profile">
        <label>Nombre<input name="name" value="${esc(S.profile.name)}" maxlength="30" required></label>
        <label>Apellido<input name="surname" value="${esc(S.profile.surname)}" maxlength="40"></label>
        <label>Fecha de nacimiento<input name="birth" type="date" value="${esc(S.profile.birth)}" required></label>
        <button class="btn primary">Guardar</button></form>
      <p class="fine">Cambia la fecha para ver cómo cambia la app a los 16 (LinkedIn) o a los 18 (carnet completo).</p>`)}
    ${sec("", `${head("", "Demostración")}<div class="actions">${btn("Cargar el ejemplo de Leo", "demo")}${btn("Empezar de cero", "reset", "ghost")}</div>
      <p class="fine">Horizonte v2 es un prototipo para el reto de CaixaBank AM × Google. Los datos se guardan solo en este navegador. <a href="../v1/">Ver la versión 1</a></p>`)}
    `;
}

/* ------------------------------------------------------------------ router */
const NAV = [["inicio", "Inicio", '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'],
    ["carnet", "Carnet", '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4M14 10h4M14 13.5h3"/>'],
    ["dinero", "Mi dinero", '<path d="M4 17l5-5 4 3 7-8"/><path d="M15 7h5v5"/>'],
    ["antidoto", "Antídoto", '<path d="M12 3l7 3v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z"/><path d="M9 12l2 2 4-4"/>'],
    ["casa", "Casa", '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>']];

function render() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [path, qs] = raw.split("?");
    const parts = path.split("/").filter(Boolean);
    const params = new URLSearchParams(qs || "");
    let r = parts[0] || "inicio";
    const view = $("#view");
    document.body.classList.toggle("is-onb", false);
    document.body.classList.toggle("is-fam", r === "familia");
    if (r !== "verificar" && !S.onboarded) { document.body.classList.add("is-onb"); view.innerHTML = vOnboarding(); return; }
    if (r !== "tema") lessonState = null;
    if (r !== "examen") examState = null;
    const map = { inicio: vInicio, carnet: vCarnet, dinero: vDinero, antidoto: vAntidoto, casa: vCasa, familia: vFamilia, ajustes: vAjustes, examen: vExamen };
    let html;
    if (r === "tema") html = vTema(parts[1], parts[2]);
    else if (r === "verificar") html = vVerificar(params);
    else html = (map[r] || vInicio)();
    view.innerHTML = html;
    const tab = { tema: "carnet", examen: "carnet" }[r] || r;
    $$("#nav a").forEach(a => a.classList.toggle("on", a.dataset.tab === tab));
    $("#who").textContent = (S.profile.name || "?").slice(0, 1).toUpperCase();
    bindViz(); bindSim(); bindProj();
    if (r === "antidoto" && !fearRanking) loadRanking().then(() => { if (location.hash.startsWith("#/antidoto")) { const y = scrollY; render(); scrollTo(0, y); } });
    const chat = $("#chat"); if (chat) chat.scrollTop = chat.scrollHeight;
}
function rerender() { const y = scrollY; render(); scrollTo(0, y); }

/* ------------------------------------------------------------------ eventos */
document.addEventListener("click", async e => {
    const b = e.target.closest("[data-act]");
    if (!b || b.tagName === "SELECT" || (b.tagName === "INPUT" && b.type === "checkbox")) return;
    const act = b.dataset.act;
    if (act === "demo") { S = demo(); save(); fearRanking = null; location.hash = "#/inicio"; render(); toast("Ejemplo cargado: Leo, 15 años, con 6 meses en Horizonte"); }
    else if (act === "startFresh") { const f = $('[data-form="start"]'); f.hidden = false; $("input", f).focus(); }
    else if (act === "reset") { if (confirm("¿Borrar todo y empezar de cero?")) { S = fresh(); save(); location.hash = "#/"; render(); } }
    else if (act === "lessonAns") { lessonState.answers[+b.dataset.q] = +b.dataset.i; rerender(); }
    else if (act === "lessonDone") {
        const id = b.dataset.id, first = !S.lessons[id];
        if (first) { S.lessons[id] = iso(new Date()); save(); toast(`Tema aprobado · +${MILES.lesson} millas de casa`); }
        location.hash = "#/carnet";
    }
    else if (act === "examAns") {
        const q = examState.qs[examState.i], i = +b.dataset.i;
        examState.ans = i; if (i !== q.a) examState.errors++;
        rerender();
    }
    else if (act === "examNext") {
        const e2 = examState;
        if (e2.i === RULES.examSize - 1 || e2.errors > RULES.examMaxErrors) {
            e2.over = true;
            if (e2.errors <= RULES.examMaxErrors) {
                const firstPass = !S.exam?.passed;
                S.exam = { date: iso(new Date()), score: RULES.examSize - e2.errors, total: RULES.examSize, passed: true };
                if (firstPass) {
                    S.diploma = { id: makeId(), date: S.exam.date };
                    save();
                    addMoney({ amount: RULES.prize, src: "premio" });
                }
                save();
            }
        } else { e2.i++; e2.ans = null; }
        render(); scrollTo(0, 0);
    }
    else if (act === "examRetry") { examState = null; render(); }
    else if (act === "dlDiploma") downloadDiploma();
    else if (act === "copyVerify") {
        const u = verifyUrl(diplomaData());
        try { await navigator.clipboard.writeText(u); toast("Enlace copiado"); } catch (err) { prompt("Copia el enlace:", u); }
    }
    else if (act === "itv") {
        const today = iso(new Date());
        if (S.itv.includes(today)) { toast("Ya has pasado la ITV hoy"); return; }
        S.itv.push(today); save(); toast(`ITV pasada · +${MILES.itv} millas de casa`); rerender();
    }
    else if (act === "addOwn") { addMoney({ amount: +b.dataset.v, src: "paga" }); rerender(); }
    else if (act === "fear") {
        const id = b.dataset.id;
        if (S.fears.includes(id)) S.fears = S.fears.filter(x => x !== id);
        else { if (S.fears.length >= RULES.maxFears) S.fears.shift(); S.fears.push(id); }
        if (ageOf() < RULES.adultAge) S.antidoteApproved = false;
        save();
        if (S.fears.length === RULES.maxFears) voteFears(S.fears);
        rerender();
    }
    else if (act === "ask") askQ(b.dataset.q);
    else if (act === "cancelSched") { S.schedules.splice(+b.dataset.i, 1); save(); rerender(); }
});
document.addEventListener("change", e => {
    const t = e.target;
    const act = t.dataset.act;
    if (act === "paga") { S.paga = +t.value; save(); toast(S.paga ? `Apartarás ${S.paga} € de tu paga cada semana` : "Has quitado el ahorro de la paga"); }
    else if (act === "roundup") { S.roundup = t.checked; save(); toast(S.roundup ? "Redondeo activado" : "Redondeo desactivado"); }
    else if (act === "approve") { S.antidoteApproved = t.checked; save(); toast(t.checked ? "Antídoto aprobado" : "Antídoto en pausa"); }
    else if (act === "gemOk") { S.geminiOk = t.checked; save(); toast(t.checked ? "Gemini podrá usar sus datos de CaixaBank" : "Permiso retirado"); }
    else return;
    rerender();
});
document.addEventListener("submit", e => {
    const f = e.target.closest("[data-form]");
    if (!f) return;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const kind = f.dataset.form;
    if (kind === "start") {
        S = fresh(d.name.trim(), d.birth); S.onboarded = true; save(); location.hash = "#/inicio"; render();
    } else if (kind === "own") {
        addMoney({ amount: Math.round(+d.amount * 100) / 100, src: d.src }); rerender();
    } else if (kind === "gift") {
        const amount = Math.round(+d.amount * 100) / 100;
        if (d.type === "mensual") {
            S.schedules.push({ from: d.from, amount, since: iso(new Date()) });
            addMoney({ amount, src: "mensual", from: d.from, msg: d.msg || "" });
        } else addMoney({ amount, src: "regalo", from: d.from, occasion: d.occasion, msg: d.msg || "" });
        toast(`Regalo enviado a ${esc(S.profile.name)}`);
        rerender();
    } else if (kind === "profile") {
        S.profile = { name: d.name.trim(), surname: d.surname.trim(), birth: d.birth }; save(); toast("Perfil guardado"); rerender();
    } else if (kind === "ask") {
        askQ(d.q); f.reset();
    }
});
async function askQ(q) {
    if (!q || !q.trim()) return;
    S.chat.push({ r: "u", t: q.trim() });
    const res = await askGemini(q, geminiContext());
    S.chat.push({ r: "g", t: res.answer, used: res.used });
    S.chat = S.chat.slice(-12);
    save(); rerender();
    const chat = $("#chat"); if (chat) chat.scrollTop = chat.scrollHeight;
}
function downloadDiploma() {
    const svg = diplomaSVG(diplomaData()).replace('class="diploma"', 'width="2400" height="1680"');
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    img.onload = () => {
        const c = document.createElement("canvas"); c.width = 2400; c.height = 1680;
        c.getContext("2d").drawImage(img, 0, 0, 2400, 1680);
        URL.revokeObjectURL(url);
        c.toBlob(b => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "carnet-joven-inversor.png"; a.click(); });
    };
    img.src = url;
}

$("#nav").innerHTML = NAV.map(([id, l, ic]) => `<a href="#/${id}" data-tab="${id}">${svgIcon(ic)}<span>${l}</span></a>`).join("");
window.addEventListener("hashchange", () => { render(); scrollTo(0, 0); });
render();
