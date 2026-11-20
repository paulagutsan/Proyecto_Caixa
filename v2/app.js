"use strict";
/* Horizonte · Del primer euro a la primera casa
   Aplicación web sin servidor: el estado se guarda en este navegador (localStorage).
   Un ciclo: aprende → invierte → entiende → gana millas → tu casa.
   Dos áreas: la del joven (inicio, aprende, dinero, Antídoto, casa, familia) y la familiar (resumen, regalos y permisos). */

const KEY = "hz2_v2";
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
const T = d => new Date(String(d).length === 10 ? d + "T12:00:00" : d);
const addMonths = (d, n) => { const x = T(d); x.setMonth(x.getMonth() + n); return x; };
const fmtD = d => T(d).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
const yearsSince = d => Math.max(0, (Date.now() - T(d).getTime()) / (365.25 * 864e5));
const makeId = () => "HZ-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Date.now().toString(36).slice(-4).toUpperCase();

/* ------------------------------------------------------------------ iconos */
const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8" cy="11" r="2.1"/><path d="M5 16.2c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4M14 10h4.5M14 13.5h3"/>',
    chart: '<path d="M4 17l5-5 4 3 7-8"/><path d="M15 7h5v5"/>',
    shield: '<path d="M12 3l7.5 3v6c0 4.6-3.2 8-7.5 9.3C7.7 20 4.5 16.6 4.5 12V6z"/><path d="M9 12.2l2.1 2.1L15.3 10"/>',
    house: '<path d="M3 11 12 4l9 7"/><path d="M5 9.8V20h14V9.8"/><path d="M10 20v-5.5h4V20"/>',
    family: '<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M3 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M14.4 15c2.6-.6 5.4.8 6.1 4.2"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20M12 8.5C10.8 5.5 7.5 4.6 7 6.5S10 8.5 12 8.5zM12 8.5c1.2-3 4.5-3.9 5-2s-3 2-5 2z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2.5 2.5M14 9l2 2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    spark: '<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    switch: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5z"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    flame: '<path d="M12 21c4 0 6.5-2.6 6.5-6.2 0-3.9-3.2-6.2-4.1-9.8-1.8 1.6-2.4 3.6-2.4 5.3-1.3-.8-2-2.1-2.2-3.4C7.8 8.6 5.5 11 5.5 14.8 5.5 18.4 8 21 12 21z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>',
    news: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M7 8.5h10M7 12h10M7 15.5h6"/>',
};
const ic = (name, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ICONS[name] || ""}</svg>`;

/* ------------------------------------------------------------------ estado */
const blank = () => ({ v: 2, role: null, teen: null, family: null, familyAuth: false, paga: 0, weekly: 0, roundup: false,
    lessons: {}, exam: null, diploma: null, itv: [], money: [], schedules: [], fears: [], antidoteApproved: false,
    geminiOk: false, voted: false, chat: [], goal: { ...GOAL_DEFAULT }, games: {}, metas: [] });
let S;
try { S = { ...blank(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch (e) { S = blank(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sin almacenamiento */ } };

/* ------------------------------------------------------------------ cálculos */
function ageOf(birth = S.teen?.birth) {
    if (!birth) return 0;
    const b = T(birth), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
}
const isAdult = () => ageOf() >= RULES.adultAge;
const isOwn = c => SOURCES[c.src]?.own;
const isOwnReal = c => isOwn(c) && c.src !== "premio";
const isGift = c => c.src === "regalo" || c.src === "mensual";
const teenName = () => S.teen?.name || "";

function allocation() {
    const fears = S.fears.slice(0, RULES.maxFears).map(id => FEARS.find(f => f.id === id)).filter(Boolean);
    const active = fears.length > 0 && (S.antidoteApproved || isAdult());
    const planned = fears.length ? [{ fund: "global", w: RULES.base }, ...fears.map(f => ({ fund: f.fund, w: RULES.antidote / fears.length, fear: f }))] : [{ fund: "global", w: 1 }];
    const parts = active ? planned : [{ fund: "global", w: 1 }];
    return { active, pending: fears.length > 0 && !active, fears, parts, planned };
}
function money() {
    const al = allocation();
    const r = al.parts.reduce((a, p) => a + p.w * FUNDS[p.fund].r / 100, 0);
    const invested = S.money.reduce((a, c) => a + c.amount, 0);
    const value = S.money.reduce((a, c) => a + c.amount * (1 + r * yearsSince(c.date)), 0);
    const own = S.money.filter(isOwn).reduce((a, c) => a + c.amount, 0);
    const gifts = S.money.filter(isGift).reduce((a, c) => a + c.amount, 0);
    const prizes = S.money.filter(c => c.src === "premio").reduce((a, c) => a + c.amount, 0);
    const firstOwn = S.money.filter(isOwnReal).sort((a, b) => a.date.localeCompare(b.date))[0] || null;
    const ownAll = S.money.filter(isOwn).sort((a, b) => a.date.localeCompare(b.date));
    let protect = null;
    if (ownAll.length) {
        const start = ownAll[0].date, end = iso(addMonths(start, RULES.protectMonths));
        let base = 0;
        ownAll.forEach(c => { if (c.date <= end) base = Math.min(RULES.protectCap, base + c.amount); });
        const daysLeft = Math.ceil((T(end) - Date.now()) / 864e5);
        protect = { start, end, base, room: daysLeft > 0 ? RULES.protectCap - base : 0, daysLeft, active: daysLeft > 0 };
    }
    const monthly = S.weekly * 52 / 12 + S.schedules.reduce((a, x) => a + x.amount, 0);
    const parts = al.parts.map(p => ({ ...p, amount: value * p.w }));
    return { al, r, invested, value, own, gifts, prizes, ownReal: own - prizes, firstOwn, protect, monthly, parts };
}
const cutOf = m => Math.min(MILES.maxCut, m / MILES.perPoint);
const mortgageAmount = () => S.goal.price * (1 - DOWN_PCT);
function payment(P0, ratePct, years) { const r = ratePct / 100 / 12, n = years * 12; return r === 0 ? P0 / n : P0 * r / (1 - Math.pow(1 + r, -n)); }
const mortgageSaving = cut => (payment(mortgageAmount(), MORTGAGE_RATE, MORTGAGE_YEARS) - payment(mortgageAmount(), MORTGAGE_RATE - cut, MORTGAGE_YEARS)) * MORTGAGE_YEARS * 12;
function fv(monthly, years, start = 0, rate = 0.05) { const r = rate / 12; let v = start; for (let i = 0; i < years * 12; i++) v = v * (1 + r) + monthly; return v; }

function miles() {
    const items = [];
    const title = id => LESSONS.find(l => l.id === id)?.title || id;
    Object.entries(S.lessons).forEach(([id, d]) => items.push({ n: MILES.lesson, date: d, label: `Tema «${title(id)}»` }));
    if (S.exam?.passed) items.push({ n: MILES.theory, date: S.exam.date, label: "Fundamentos superados" });
    const own = S.money.filter(isOwnReal).sort((a, b) => a.date.localeCompare(b.date));
    if (own.length) items.push({ n: MILES.firstOwn, date: own[0].date, label: "Tu primer euro propio" });
    const last = (list, ym) => list.filter(c => c.date.startsWith(ym)).map(c => c.date).sort().pop();
    const monthName = ym => T(ym + "-15").toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    [...new Set(own.map(c => c.date.slice(0, 7)))].forEach(ym => items.push({ n: MILES.monthOwn, date: last(own, ym), label: `Aportación propia · ${monthName(ym)}` }));
    S.itv.forEach(d => items.push({ n: MILES.itv, date: d, label: "Revisión anual" }));
    Object.entries(S.games).forEach(([d, g]) => items.push({ n: MILES.game, date: d, label: `Juego «${GAMES.find(x => x.id === g.id)?.t || ""}»` }));
    streak().bonus.forEach(b => items.push(b));
    const gifts = S.money.filter(isGift), byM = {};
    gifts.forEach(c => { const ym = c.date.slice(0, 7); byM[ym] = (byM[ym] || 0) + c.amount; });
    Object.entries(byM).forEach(([ym, sum]) => {
        const n = Math.min(MILES.giftMonthCap, Math.floor(sum / 5) * MILES.giftPer5);
        if (n) items.push({ n, date: last(gifts, ym), label: `Regalos de tu familia · ${monthName(ym)}` });
    });
    items.sort((a, b) => b.date.localeCompare(a.date));
    const total = items.reduce((a, i) => a + i.n, 0);
    return { items, total, cut: cutOf(total) };
}
function milesPerYear() {
    const giftM = Math.min(MILES.giftMonthCap, Math.floor(S.schedules.reduce((a, x) => a + x.amount, 0) / 5));
    return ((S.weekly > 0 || S.roundup) ? MILES.monthOwn * 12 + 13 * MILES.streak4 : 0) + giftM * 12 + (S.diploma ? MILES.itv : 0);
}
/* Racha: semanas seguidas con algo hecho (un tema, un juego, una aportación tuya o la revisión anual) */
const weekOf = d => { const x = T(d); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return iso(x); };
const shiftDays = (d, n) => { const x = T(d); x.setDate(x.getDate() + n); return iso(x); };
function streak() {
    const days = [...Object.values(S.lessons), ...S.money.filter(isOwnReal).map(c => c.date), ...Object.keys(S.games), ...S.itv];
    const weeks = new Set(days.map(weekOf)), sorted = [...weeks].sort(), bonus = [];
    let run = 0, prev = null;
    sorted.forEach(w => {
        run = prev && shiftDays(prev, 7) === w ? run + 1 : 1; prev = w;
        if (run % 4 === 0) bonus.push({ n: MILES.streak4, date: shiftDays(w, 6) > iso(new Date()) ? iso(new Date()) : shiftDays(w, 6), label: `Racha de ${run} semanas` });
    });
    let w = weekOf(new Date()); const thisWeek = weeks.has(w);
    if (!thisWeek) w = shiftDays(w, -7);
    let current = 0; while (weeks.has(w)) { current++; w = shiftDays(w, -7); }
    return { current, thisWeek, bonus };
}
/* Etapas del Certificado Horizonte */
const STAGES = ["Fundamentos", "Primer año acompañado", "Inversor certificado"];
const stageOf = () => !S.exam?.passed ? 0 : ageOf() >= RULES.adultAge ? 2 : 1;
const lastItv = () => S.itv.length ? S.itv[S.itv.length - 1] : S.diploma?.date;

function geminiContext() {
    const m = money(), mi = miles(), age = ageOf();
    const yrs = Math.max(1, S.goal.age - age), atGoal = mi.total + milesPerYear() * yrs;
    return {
        age, value: m.value, monthly: m.monthly, goalPrice: S.goal.price, goalAge: S.goal.age, down: S.goal.price * DOWN_PCT,
        miles: mi.total, cutTxt: pts(mi.cut), milesYear: milesPerYear(), milesAtGoal: Math.round(atGoal), cutAtGoalTxt: pts(cutOf(atGoal)), savingAtGoal: mortgageSaving(cutOf(atGoal)),
        fears: m.al.planned.filter(p => p.fear).map(p => ({ label: p.fear.label, why: p.fear.why, fundName: FUNDS[p.fund].name, amount: m.value * p.w })),
        antidoteActive: m.al.active, baseAmount: m.value * (m.al.fears.length ? RULES.base : 1), antidoteAmount: m.al.fears.length ? m.value * RULES.antidote : 0,
        protectBase: m.protect?.base || 0, protectEnd: m.protect ? fmtD(m.protect.end) : "", protectRoom: m.protect?.room ?? RULES.protectCap, protectCap: RULES.protectCap,
        paga: S.paga, weekly: S.weekly, diploma: S.diploma ? fmtD(S.diploma.date) : null, itvDue: S.diploma ? fmtD(iso(addMonths(lastItv(), 12))) : null,
        lessonsDone: Object.keys(S.lessons).length, lessonsTotal: LESSONS.length, prize: RULES.prize, streak: streak().current,
    };
}

/* ------------------------------------------------------------------ avisos, hojas y acciones */
function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.innerHTML = msg;
    const box = $("#toasts"); while (box.children.length >= 2) box.firstElementChild.remove();
    box.appendChild(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 350); }, 2800);
}
function sheet(title, body) {
    const el = $("#sheet");
    el.innerHTML = `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet-card" role="dialog" aria-modal="true" aria-labelledby="sheetT">
      <div class="sheet-h"><h2 id="sheetT">${title}</h2><button class="icon-btn" data-act="closeSheet" aria-label="Cerrar">${ic("close")}</button></div>${body}</div>`;
    el.classList.add("open");
    setTimeout(() => $("input", el)?.focus(), 60);
}
const closeSheet = () => { const el = $("#sheet"); el.classList.remove("open"); el.innerHTML = ""; };
function addMoney(c) {
    const before = miles().total, wasFirst = !money().firstOwn;
    S.money.push({ date: iso(new Date()), ...c });
    S.money.sort((a, b) => a.date.localeCompare(b.date));
    save();
    const gained = miles().total - before, amt = eur(c.amount, c.amount % 1 !== 0);
    if (wasFirst && isOwnReal(c)) toast(`<b>Tu primer euro propio.</b> Ya eres inversor. +${gained} millas de casa`);
    else toast(`${amt} invertidos${gained > 0 ? ` · +${gained} millas de casa` : ""}`);
}

/* ------------------------------------------------------------------ piezas */
const btn = (label, act, cls = "", data = "") => `<button class="btn ${cls}" data-act="${act}" ${data}>${label}</button>`;
const lnk = (label, href, cls = "") => `<a class="btn ${cls}" href="${href}">${label}</a>`;
const bar = (v, max, cls = "") => `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, max ? v / max * 100 : 0)).toFixed(1)}%"></i></div>`;
const badge = (t, cls = "") => `<span class="badge ${cls}">${t}</span>`;
const card = (inner, cls = "") => `<section class="card ${cls}">${inner}</section>`;
const cardH = (title, sub = "", action = "") => `<div class="card-h"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div>${action}</div>`;
const stat = (label, value, foot = "", cls = "") => `<div class="stat ${cls}"><span>${label}</span><b>${value}</b>${foot ? `<small>${foot}</small>` : ""}</div>`;
const pageH = (title, sub = "", action = "") => `<header class="page-h"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div>${action}</header>`;
const empty = (icon, t, p, action = "") => `<div class="empty"><span class="empty-ic">${ic(icon)}</span><b>${t}</b><p>${p}</p>${action}</div>`;
const stack = parts => `<div class="stack">${parts.map(p => `<i class="f-${p.fund}" style="width:${(p.w * 100).toFixed(2)}%"></i>`).join("")}</div>`;
const sw = fund => `<span class="sw f-${fund}"></span>`;
const toggle = (act, on, label) => `<label class="switch"><input type="checkbox" data-act="${act}" ${on ? "checked" : ""} aria-label="${esc(label)}"><i></i></label>`;
const legal = () => `<footer class="legal">${ic("info")}<p>${LEGAL}</p></footer>`;
const brand = (href, h = 38) => `<a class="brand" href="${href}" aria-label="Horizonte"><img class="brand-star" src="brand/horizonte-icono.svg" alt="" width="${Math.round(h * 1.21)}" height="${h}"><span class="brand-word">Horizonte</span></a>`;

function credVisual(big = false, sample = false) {
    const st = sample ? 1 : stageOf();
    const name = sample ? "Tu nombre" : `${S.teen?.name || ""} ${S.teen?.surname || ""}`.trim();
    const code = !sample && S.diploma ? esc(S.diploma.id) : "HZ-····-····";
    return `<div class="cred ${big ? "big" : ""} st${st}">
      <div class="cred-top"><span>CaixaBank Asset Management</span><img src="brand/horizonte-icono.svg" alt="" width="34" height="28"></div>
      <div class="cred-mid"><small>Certificado</small><b>Horizonte</b></div>
      <div class="cred-name">${esc(name)}</div>
      <div class="cred-stages" aria-label="Etapa: ${STAGES[st]}">${STAGES.map((x, i) => `<i class="${i < st ? "done" : i === st ? "on" : ""}"></i>`).join("")}</div>
      <div class="cred-bottom"><div><small>Etapa</small><b>${STAGES[st]}</b></div><div><small>Código</small><b>${code}</b></div></div>
    </div>`;
}

/* ------------------------------------------------------------------ página de bienvenida */
function vLanding() {
    const lpYear = 8, lpNews = MKT_NEWS[lpYear];
    return `<div class="lp">
    <header class="lp-nav"><div class="lp-in">${brand("#/")}
      <nav class="lp-links" aria-label="Secciones"><a href="#ciclo">Cómo funciona</a><a href="#antidoto">Antídoto</a><a href="#casa">Tu casa</a><a href="#familias">Familias</a><a href="#preguntas">Preguntas</a></nav>
      ${lnk("Crear cuenta", "#/alta/joven", "primary sm")}</div></header>

    <section class="hz-hero"><div class="lp-in hz-hero-in">
      <div class="hz-copy">
        <p class="hz-kicker"><span></span>CaixaBank Asset Management</p>
        <h1>Del primer euro<br>a tu <em>primera casa</em>.</h1>
        <p class="hz-lead">Aprende lo esencial, invierte desde los 15 sin miedo a perder el primer año y convierte cada paso en una hipoteca más barata. Con tu familia detrás.</p>
        <div class="lp-cta">${lnk(`Empieza ahora${ic("arrow")}`, "#/alta/joven", "gold lg")}${lnk("Soy madre, padre o familiar", "#/alta/familia", "lg light")}</div>
        <dl class="hz-proof"><div><dt>${RULES.prize} €</dt><dd>invertidos a tu nombre al superar Fundamentos</dd></div><div><dt>${RULES.protectCap} €</dt><dd>que no pueden perder durante tu primer año</dd></div><div><dt>−${pts(MILES.maxCut)}</dt><dd>puntos de interés en tu primera hipoteca</dd></div></dl>
      </div>
      <div class="hz-visual">
        ${credVisual(true, true)}
        <div class="hz-chip c1"><span>${ic("spark")}</span><div><b>Tu dinero hoy</b><small>Qué ha pasado esta semana, explicado con tus números</small></div></div>
        <div class="hz-chip c2"><span>${ic("house")}</span><div><b>Millas de casa</b><small>Cada paso abarata tu hipoteca</small></div></div>
      </div>
    </div><div class="hz-horizon" aria-hidden="true"></div></section>

    <section class="lp-sec" id="ciclo"><div class="lp-in">
      <p class="kicker">Cómo funciona</p><h2 class="serif">Un solo ciclo. Cada paso alimenta el siguiente.</h2>
      <ol class="cycle">${CYCLE.map((c, i) => `<li class="${c.id}"><span class="cy-n">${String(i + 1).padStart(2, "0")}</span><span class="cy-ic">${ic(c.ic)}</span><h3>${c.t}</h3><p>${c.p}</p></li>`).join("")}</ol>
      <p class="cycle-foot">${ic("switch")}Cada año, una revisión: lo aprendido, tus preocupaciones y tu Antídoto, al día. Y el ciclo vuelve a empezar.</p>
    </div></section>

    <section class="lp-sec alt" id="aprende"><div class="lp-in lp-split">
      <div><p class="kicker">Aprende</p><h2 class="serif">Nadie conduce sin aprender antes. Con el dinero, a los 15, nadie te enseña.</h2>
        <p class="lp-lead"><b>Fundamentos</b>: cinco temas de tres minutos, juegos con 25 años de datos reales de mercado y una prueba final. Al superarla, CaixaBank invierte ${RULES.prize} € a tu nombre y recibes el <b>Certificado Horizonte</b>, verificable y listo para LinkedIn.</p></div>
      <div class="lp-game" data-lpgame data-y="${lpYear}">
        <div class="lg-top"><span>${ic("news")}El titular</span><small>Juego con datos reales</small></div>
        <blockquote>«${esc(lpNews)}»</blockquote>
        <p>¿La bolsa mundial acabó ese año arriba o abajo?</p>
        <div class="lg-opts"><button class="btn" data-act="lpGame" data-v="1">Arriba</button><button class="btn" data-act="lpGame" data-v="0">Abajo</button></div>
        <div class="lg-out" data-o="lg" hidden></div>
      </div>
    </div></section>

    <section class="lp-sec" id="primer-ano"><div class="lp-in lp-split">
      <div class="big-num"><span>${RULES.protectCap} €</span><p>Tu primer año, los primeros ${RULES.protectCap} € que inviertes no pueden perder valor. Si a los ${RULES.protectMonths} meses valen menos de lo que pusiste, CaixaBank pone la diferencia.</p></div>
      <div class="lp-sim" data-lpsim>
        <label>Si la bolsa cayera en tu primer año <output data-o="d"></output><input type="range" min="-40" max="20" step="5" value="-20" data-i="d"></label>
        <div class="ls-row"><span>Tus ${RULES.protectCap} € valdrían</span><b data-o="val"></b></div>
        <div class="ls-row hi"><span>CaixaBank pondría</span><b data-o="pay"></b></div>
        <div class="ls-row"><span>Tú recuperas</span><b data-o="you"></b></div>
        <p class="note">Bonificación promocional con tope de ${RULES.protectCap} € y ${RULES.protectMonths} meses, si no vendes antes.</p>
      </div>
    </div></section>

    <section class="hz-dark" id="antidoto"><div class="lp-in">
      <p class="kicker gold">El Antídoto</p><h2 class="serif">Invierte en lo que te preocupa.</h2>
      <p class="lp-lead">No te preguntamos cuánto riesgo quieres. Te preguntamos qué te quita el sueño de tu futuro. Una parte de tu dinero invierte justo ahí: si ocurre, esa parte gana.</p>
      <div class="lp-fears">${FEARS.map((f, i) => `<button class="lf ${i === 0 ? "on" : ""}" data-act="lpFear" data-id="${f.id}"><span>${ic(f.id)}</span>${f.label}</button>`).join("")}</div>
      <div class="lf-out" data-o="lf"><b>${FUNDS[FEARS[0].fund].name}</b><p>${FEARS[0].why}</p></div>
      <p class="hz-small">${Math.round(RULES.base * 100)} % en un fondo global diversificado y ${Math.round(RULES.antidote * 100)} % en tu Antídoto, dentro de una selección cerrada de fondos de CaixaBank AM. Reduce el golpe; no es una garantía. Gemini te lo explica con tus propios números.</p>
    </div></section>

    <section class="lp-sec" id="casa"><div class="lp-in lp-split">
      <div><p class="kicker gold-ink">Millas de casa</p><h2 class="serif">Tu constancia vale una casa.</h2>
        <p class="lp-lead">Aprender, jugar, aportar cada mes y mantener tu racha suma millas. Nunca por tener más dinero que nadie. Se canjean como rebaja del interés de tu primera hipoteca con CaixaBank y no caducan.</p></div>
      <div class="lp-sim gold" data-lpmiles>
        <label>Años de constancia hasta tu hipoteca <output data-o="y"></output><input type="range" min="2" max="15" step="1" value="10" data-i="y"></label>
        <div class="ls-row"><span>Millas de casa</span><b data-o="mi"></b></div>
        <div class="ls-row hi"><span>Rebaja del diferencial</span><b data-o="cut"></b></div>
        <div class="ls-row"><span>Intereses que te ahorras</span><b data-o="save"></b></div>
        <p class="note">Estimación con una hipoteca de ${eur(GOAL_DEFAULT.price * (1 - DOWN_PCT))} a ${MORTGAGE_YEARS} años, aportando cada mes y con la revisión anual. Rebaja máxima: ${pts(MILES.maxCut)} puntos.</p>
      </div>
    </div></section>

    <section class="lp-sec alt" id="familias"><div class="lp-in lp-split">
      <div><p class="kicker">Para familias</p><h2 class="serif">Regala futuro, no solo dinero.</h2>
        <p class="lp-lead">Regalos con un mensaje o una aportación cada mes, sus decisiones aprobadas por ti hasta los 18 y su progreso, siempre a la vista.</p>
        ${lnk("Crear cuenta familiar", "#/alta/familia", "primary lg")}</div>
      <ul class="lp-checks"><li><span>${ic("gift")}</span><div><b>Regalos con mensaje</b><small>Cumpleaños, Navidad o cuando quieras. También cada mes.</small></div></li>
        <li><span>${ic("key")}</span><div><b>Tú apruebas</b><small>El Antídoto y el uso de sus datos necesitan tu permiso hasta los 18.</small></div></li>
        <li><span>${ic("house")}</span><div><b>Suman a su casa</b><small>Tus regalos generan millas de casa, con un tope mensual.</small></div></li></ul>
    </div></section>

    <section class="lp-sec" id="seguridad"><div class="lp-in">
      <p class="kicker">Seguridad</p><h2 class="serif">Confianza desde el primer día.</h2>
      <div class="lp-grid">
        <div><span>${ic("chart")}</span><h3>Gestión profesional</h3><p>Una selección cerrada de fondos de CaixaBank Asset Management, la mayor gestora de fondos de España.</p></div>
        <div><span>${ic("shield")}</span><h3>Primer año acompañado</h3><p>Los primeros ${RULES.protectCap} € que inviertes no pueden perder valor en ${RULES.protectMonths} meses, si no vendes antes.</p></div>
        <div><span>${ic("lock")}</span><h3>Tus datos, con permiso</h3><p>Gemini solo usa tu información con la autorización de tu familia, y nunca para publicidad.</p></div>
        <div><span>${ic("family")}</span><h3>A tu nombre</h3><p>La cuenta es tuya desde el principio. Hasta los 18, tu familia aprueba las decisiones importantes.</p></div>
      </div>
    </div></section>

    <section class="lp-sec alt" id="preguntas"><div class="lp-in lp-narrow">
      <p class="kicker">Preguntas frecuentes</p><h2 class="serif">Lo que más nos preguntan.</h2>
      <div class="faq">${FAQ.map(f => `<details><summary>${f.q}${ic("plus")}</summary><p>${f.a}</p></details>`).join("")}</div>
    </div></section>

    <section class="hz-final"><div class="lp-in"><h2 class="serif">Tu primer euro empieza hoy.</h2><p class="hz-lead">Crea tu cuenta en dos minutos. Tu familia, en otros dos.</p><div class="lp-cta center">${lnk(`Empieza ahora${ic("arrow")}`, "#/alta/joven", "gold lg")}${lnk("Soy familia", "#/alta/familia", "lg light")}</div></div><div class="hz-horizon" aria-hidden="true"></div></section>
    <div class="lp-in lp-foot">${brand("#/", 30)}${legal()}</div>
    </div>`;
}
function bindLanding() {
    const sim = $("[data-lpsim]");
    if (sim) {
        const upd = () => {
            const d = +$('[data-i="d"]', sim).value, val = RULES.protectCap * (1 + d / 100), pay = Math.max(0, RULES.protectCap - val);
            $('[data-o="d"]', sim).textContent = `${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d)} %`;
            $('[data-o="val"]', sim).textContent = eur(val); $('[data-o="pay"]', sim).textContent = eur(pay); $('[data-o="you"]', sim).textContent = eur(val + pay);
        };
        $('[data-i="d"]', sim).addEventListener("input", upd); upd();
    }
    const mi = $("[data-lpmiles]");
    if (mi) {
        const P0 = GOAL_DEFAULT.price * (1 - DOWN_PCT);
        const upd = () => {
            const y = +$('[data-i="y"]', mi).value;
            const m = MILES.lesson * LESSONS.length + MILES.theory + MILES.firstOwn + y * (MILES.monthOwn * 12 + MILES.itv + 13 * MILES.streak4), c = cutOf(m);
            const sv = (payment(P0, MORTGAGE_RATE, MORTGAGE_YEARS) - payment(P0, MORTGAGE_RATE - c, MORTGAGE_YEARS)) * MORTGAGE_YEARS * 12;
            $('[data-o="y"]', mi).textContent = `${y} años`; $('[data-o="mi"]', mi).textContent = num(m);
            $('[data-o="cut"]', mi).textContent = `−${pts(c)} puntos`; $('[data-o="save"]', mi).textContent = eur(sv);
        };
        $('[data-i="y"]', mi).addEventListener("input", upd); upd();
    }
}

/* ------------------------------------------------------------------ alta */
let alta = null;
function vAlta(role) {
    if (!alta || alta.role !== role) alta = { role, step: 0, data: {} };
    const a = alta, d = a.data, adult = d.birth && ageOf(d.birth) >= RULES.adultAge;
    let steps, idx, body;
    if (role === "joven") {
        steps = adult ? ["Tus datos", "Tu paga"] : ["Tus datos", "Autorización", "Tu paga"];
        idx = adult && a.step === 2 ? 1 : a.step;
        if (a.step === 0) body = `<h1>Crea tu cuenta</h1><p class="sub">Empecemos por lo básico.</p>
          <form data-form="alta0" class="form">
            <label class="field"><span>Nombre</span><input name="name" required maxlength="30" autocomplete="given-name" value="${esc(d.name || "")}"></label>
            <label class="field"><span>Apellidos</span><input name="surname" maxlength="60" autocomplete="family-name" value="${esc(d.surname || "")}"></label>
            <label class="field"><span>Fecha de nacimiento</span><input name="birth" type="date" required value="${esc(d.birth || "")}"></label>
            <button class="btn primary lg block">Continuar</button></form>`;
        else if (a.step === 1) body = `<h1>Autorización familiar</h1><p class="sub">Como eres menor de edad, tu madre, padre o tutor legal tiene que autorizar la cuenta. Completad este paso juntos.</p>
          <form data-form="alta1" class="form">
            <label class="field"><span>Nombre de la persona que autoriza</span><input name="fname" required maxlength="40" value="${esc(d.fname || "")}"></label>
            <label class="field"><span>Relación</span><select name="relation">${["Madre", "Padre", "Tutor o tutora legal"].map(r => `<option ${d.relation === r ? "selected" : ""}>${r}</option>`).join("")}</select></label>
            <label class="check"><input type="checkbox" name="ok" required><span>Soy su madre, padre o tutor legal, autorizo la apertura de la cuenta y entiendo que invertir conlleva riesgos.</span></label>
            <button class="btn primary lg block">Autorizar y continuar</button></form>`;
        else body = `<h1>¿Recibes paga?</h1><p class="sub">Es opcional. Nos ayuda a proponerte cuánto apartar cada semana sin que lo notes.</p>
          <form data-form="alta2" class="form">
            <label class="field"><span>Paga semanal (€)</span><input name="paga" type="number" min="0" max="500" step="1" inputmode="numeric" value="${esc(d.paga ?? "")}"></label>
            <button class="btn primary lg block">Entrar en Horizonte</button>${btn("Ahora no", "altaSkip", "ghost block")}</form>`;
    } else {
        steps = ["Tus datos", "Su cuenta", "Autorización"];
        idx = a.step;
        if (a.step === 0) body = `<h1>Crea tu cuenta familiar</h1><p class="sub">Podrás hacer regalos, aprobar decisiones y ver su progreso.</p>
          <form data-form="altaF0" class="form">
            <label class="field"><span>Tu nombre</span><input name="fname" required maxlength="40" autocomplete="given-name" value="${esc(d.fname || "")}"></label>
            <label class="field"><span>Relación</span><select name="relation">${["Madre", "Padre", "Tutor o tutora legal", "Abuela", "Abuelo", "Tía", "Tío"].map(r => `<option ${d.relation === r ? "selected" : ""}>${r}</option>`).join("")}</select></label>
            <button class="btn primary lg block">Continuar</button></form>`;
        else if (a.step === 1) body = `<h1>¿Para quién es la cuenta?</h1><p class="sub">Estará a su nombre desde el primer día.</p>
          <form data-form="altaF1" class="form">
            <label class="field"><span>Nombre</span><input name="name" required maxlength="30" value="${esc(d.name || "")}"></label>
            <label class="field"><span>Apellidos</span><input name="surname" maxlength="60" value="${esc(d.surname || "")}"></label>
            <label class="field"><span>Fecha de nacimiento</span><input name="birth" type="date" required value="${esc(d.birth || "")}"></label>
            <button class="btn primary lg block">Continuar</button></form>`;
        else body = `<h1>Autorización</h1><p class="sub">Hasta los 18, la madre, el padre o el tutor legal aprueba las decisiones importantes de la cuenta.</p>
          <form data-form="altaF2" class="form">
            <label class="check"><input type="checkbox" name="ok" required><span>${/Madre|Padre|Tutor/.test(d.relation || "") ? "Soy su madre, padre o tutor legal y autorizo la apertura de su cuenta." : "Su madre, padre o tutor legal ha autorizado la apertura de su cuenta."} Entiendo que invertir conlleva riesgos.</span></label>
            <button class="btn primary lg block">Crear cuenta</button></form>`;
    }
    return `<div class="auth">
      <header class="auth-top">${brand("#/", 32)}${a.step ? btn(`${ic("back")}Atrás`, "altaBack", "ghost sm") : lnk("Cancelar", "#/", "ghost sm")}</header>
      <main class="auth-card">
        <ol class="auth-steps">${steps.map((s, i) => `<li class="${i < idx ? "done" : i === idx ? "on" : ""}"><span>${i < idx ? ic("check") : i + 1}</span>${s}</li>`).join("")}</ol>
        ${body}
        <p class="auth-foot">${ic("lock")}Tus datos solo se usan para gestionar tu cuenta.</p>
      </main></div>`;
}

/* ------------------------------------------------------------------ área del joven */
function moveRow(c) {
    const label = SOURCES[c.src].label + (c.from ? ` · ${esc(c.from)}` : "");
    return `<div class="row"><span class="mv-ic ${isGift(c) ? "gift" : "own"}">${ic(isGift(c) ? "gift" : c.src === "premio" ? "card" : "plus")}</span><div><b>${label}</b><span>${fmtD(c.date)}${c.msg ? ` · «${esc(c.msg)}»` : ""}</span></div><b class="amt">+${eur(c.amount, c.amount % 1 !== 0)}</b></div>`;
}
/* Tu dinero hoy: resumen de la semana. En esta demo, los movimientos de los fondos se simulan
   de forma reproducible para cada semana; en producción vendrían de CaixaBank AM. */
const VOL = { global: 15, tecnologia: 25, inmobiliario: 18, energia: 22, inflacion: 7, salud: 14, movilidad: 20 };
function weekMoves(wk = weekOf(new Date())) {
    let h = 0; for (const ch of wk) h = (h * 31 + ch.charCodeAt(0)) | 0;
    const rnd = () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const market = Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
    const out = {};
    Object.keys(FUNDS).forEach(k => {
        const own = Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
        out[k] = FUNDS[k].r / 52 + VOL[k] / Math.sqrt(52) * (0.6 * market + 0.8 * own) / 1.0;
    });
    return out;
}
function weekSummary() {
    const m = money(), mv = weekMoves(), parts = m.parts.map(p => ({ ...p, ret: mv[p.fund], chg: p.amount * mv[p.fund] / 100 }));
    const chg = parts.reduce((a, p) => a + p.chg, 0), retPct = m.value ? chg / m.value * 100 : mv.global;
    const top = [...parts].sort((a, b) => Math.abs(b.ret) - Math.abs(a.ret))[0];
    const sgn = v => `${v >= 0 ? "+" : "−"}${pct(Math.abs(v), 1)}`;
    const lines = [];
    if (m.value > 0) {
        lines.push(`Esta semana tu dinero ${chg >= 0 ? "ha subido" : "ha bajado"} <b>${eur(Math.abs(chg), true)}</b> (${sgn(retPct)}).`);
        if (parts.length > 1) lines.push(`Lo que más se ha movido: <b>${FUNDS[top.fund].name.toLowerCase()}</b> (${sgn(top.ret)})${top.fear ? `, tu Antídoto para «${esc(top.fear.label.toLowerCase())}»` : ""}.`);
    } else lines.push(`El fondo global de Horizonte ${mv.global >= 0 ? "ha subido" : "ha bajado"} un ${pct(Math.abs(mv.global), 1)} esta semana. Cuando inviertas, verás aquí qué ha pasado con tu dinero y por qué.`);
    lines.push(Math.abs(retPct) >= 1.5
        ? (retPct < 0 ? "Una semana mala no dice nada de un plazo de diez años. Vender ahora convertiría la caída en pérdida." : "Una semana buena tampoco cambia el plan: lo que cuenta es la constancia.")
        : "Una semana tranquila. Lo que cuenta es el plazo y la constancia.");
    if (m.protect?.active && retPct < 0) lines.push(`Además, tus ${eur(m.protect.base)} siguen protegidos ${m.protect.daysLeft} días más.`);
    return { lines, parts, mv, chg, retPct };
}
function weekCard(cls = "c-12") {
    const w = weekSummary(), can = S.geminiOk || isAdult();
    return card(`${cardH(`<span class="gem">${ic("spark")}Tu dinero hoy</span>`, `Semana del ${fmtD(weekOf(new Date()))}`, can ? btn("Pregúntale a Gemini", "goAsk", "sm") : "")}
      <div class="week">${w.lines.map(l => `<p>${l}</p>`).join("")}</div>
      <div class="week-funds">${(w.parts.length ? w.parts : [{ fund: "global" }]).map(p => `<div>${sw(p.fund)}<span>${FUNDS[p.fund].name}</span><b class="${w.mv[p.fund] >= 0 ? "up" : "down"}">${w.mv[p.fund] >= 0 ? "+" : "−"}${pct(Math.abs(w.mv[p.fund]), 1)}</b></div>`).join("")}</div>
      <p class="note">Movimientos simulados en esta versión de demostración.</p>`, cls);
}

function vInicio() {
    const m = money(), mi = miles(), age = ageOf(), st = streak(), stage = stageOf();
    const steps = [
        ["aprende", "Aprende", S.exam?.passed, S.exam?.passed ? "Certificado" : `${Object.keys(S.lessons).length} de ${LESSONS.length} temas`, "#/aprende"],
        ["invierte", "Invierte", !!m.firstOwn, m.firstOwn ? eur(m.value, true) : "Tu primer euro", "#/dinero"],
        ["entiende", "Entiende", S.fears.length > 0, S.fears.length ? (m.al.active ? "Antídoto activo" : "Antídoto pendiente") : "Elige tu Antídoto", "#/antidoto"],
        ["millas", "Gana millas", st.current >= 4, `${num(mi.total)} millas`, "#/casa"],
        ["casa", "Tu casa", false, `−${pts(mi.cut)} puntos`, "#/casa"],
    ];
    const cur = steps.findIndex(x => !x[2]);
    const tasks = [
        [!!S.exam?.passed, "Supera Fundamentos", `Cinco temas y una prueba. Primera inversión: ${RULES.prize} € a tu nombre.`, "#/aprende"],
        [!!m.firstOwn, "Pon tu primer euro", "Con 1 € basta. Es el paso que te convierte en inversor.", "#/dinero"],
        [S.fears.length > 0, "Elige tu Antídoto", "Dinos qué te preocupa de tu futuro.", "#/antidoto"],
        [S.weekly > 0 || S.roundup, "Automatiza tu ahorro", "Una cantidad semanal o el redondeo de tus compras.", "#/dinero"],
        [!!S.family || m.gifts > 0, "Invita a tu familia", "Pueden regalarte dinero para tu casa.", "#/familia"],
    ];
    const done = tasks.filter(t => t[0]).length;
    const headline = !S.exam?.passed ? "Empieza por Fundamentos y gana tu primera inversión."
        : !m.firstOwn ? "Fundamentos superados. Ahora, tu primer euro propio."
        : age >= RULES.adultAge ? "Eres inversor certificado. La cuenta es tuya."
        : m.protect?.active ? `Primer año acompañado: tu protección termina en ${m.protect.daysLeft} días.`
        : "Sigue sumando millas: cada semana cuenta.";
    const recent = [...S.money].reverse().slice(0, 5);
    return `${pageH(`Hola, ${esc(teenName())}`, headline)}
    <div class="grid">
      ${card(`<ol class="loop">${steps.map(([id, t, ok, sub, h], i) => `<li class="${ok ? "done" : i === cur ? "on" : ""} ${id}"><a href="${h}"><span class="lp-dot">${ok ? ic("check") : i + 1}</span><b>${t}</b><small>${sub}</small></a></li>`).join("")}</ol>`, "c-12 loop-card")}
      ${card(`<div class="hero-cred">${credVisual()}<div class="hc-copy">
          <span class="kicker">Certificado Horizonte</span><h2>${STAGES[stage]}</h2>
          <p>${S.exam?.passed ? `Superado el ${fmtD(S.exam.date)}. ${age >= RULES.adultAge ? "Tienes el control total de tu cuenta." : `Inversor certificado a los ${RULES.adultAge}.`}` : `${Object.keys(S.lessons).length} de ${LESSONS.length} temas completados.`}</p>
          ${lnk(S.exam?.passed ? "Ver mi certificado" : Object.keys(S.lessons).length ? "Continuar" : "Empezar Fundamentos", "#/aprende", "primary")}</div></div>`, "c-7")}
      ${weekCard("c-5")}
      ${card(`${stat("Valor estimado", eur(m.value, true), m.invested ? `${eur(m.invested, true)} aportados` : "Aún no has invertido")}${btn(`${ic("plus")}Aportar`, "openContribute", "block")}`, "c-3 stat-card")}
      ${card(`${stat("Protegido el primer año", eur(m.protect?.base || 0), `de ${RULES.protectCap} € · ${m.protect?.active ? `${m.protect.daysLeft} días restantes` : m.protect ? "periodo terminado" : "empieza con tu primera aportación"}`)}${bar(m.protect?.base || 0, RULES.protectCap, "blue")}`, "c-3")}
      ${card(`${stat("Millas de casa", num(mi.total), `${pts(mi.cut)} puntos menos de diferencial`)}${bar(mi.cut, MILES.maxCut, "gold")}`, "c-3")}
      ${card(`${stat("Racha", `${st.current} ${st.current === 1 ? "semana" : "semanas"}`, st.thisWeek ? "Esta semana ya cuenta" : "Haz algo esta semana para no perderla")}<div class="streak">${Array.from({ length: 4 }, (_, i) => `<i class="${i < st.current % 4 || (st.current && st.current % 4 === 0) ? "on" : ""}"></i>`).join("")}<small>+${MILES.streak4} millas cada 4</small></div>`, "c-3")}
      ${done < tasks.length ? card(`${cardH("Primeros pasos", `${done} de ${tasks.length} completados`)}${bar(done, tasks.length, "blue")}
        <div class="rows">${tasks.map(([ok, t, d, h]) => `<a class="row ${ok ? "ok" : ""}" href="${h}"><span class="tick">${ok ? ic("check") : ""}</span><div><b>${t}</b><span>${d}</span></div>${ic("chev", "chev")}</a>`).join("")}</div>`, "c-6") : ""}
      ${card(`${cardH("Actividad reciente", "", recent.length ? lnk("Ver todo", "#/dinero", "ghost sm") : "")}
        ${recent.length ? `<div class="rows">${recent.map(moveRow).join("")}</div>` : empty("chart", "Sin movimientos todavía", "Tus aportaciones y los regalos de tu familia aparecerán aquí.")}`, done < tasks.length ? "c-6" : "c-12")}
    </div>`;
}

/* ---------------- Aprende: Fundamentos, juegos y Certificado Horizonte */
function diplomaData() {
    return { n: `${S.teen.name} ${S.teen.surname || ""}`.trim(), i: S.diploma.id, f: S.diploma.date, s: `${S.exam.score}/${S.exam.total}`, v: iso(addMonths(lastItv(), 12)) };
}
const verifyUrl = d => `${location.origin}${location.pathname}#/verificar?d=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(d)))))}`;
function diplomaSVG(d) {
    const t = s => esc(s);
    return `<svg class="diploma" viewBox="0 0 1200 840" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Certificado Horizonte de ${t(d.n)}">
      <rect width="1200" height="840" fill="#ffffff"/><rect width="1200" height="840" fill="none" stroke="#0b1d29" stroke-width="28"/><rect x="34" y="34" width="1132" height="772" fill="none" stroke="#c99a2e" stroke-width="1.5"/>
      <text x="96" y="132" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#007eae" letter-spacing="3.5">CAIXABANK ASSET MANAGEMENT</text>
      <text x="96" y="232" font-family="'Source Serif 4', Georgia, serif" font-size="70" fill="#0b1d29">Certificado Horizonte</text>
      <text x="96" y="282" font-family="Inter, Arial, sans-serif" font-size="22" fill="#5f6b7a">Fundamentos de inversión</text>
      <text x="96" y="386" font-family="Inter, Arial, sans-serif" font-size="21" fill="#5f6b7a">Otorgado a</text>
      <text x="96" y="458" font-family="'Source Serif 4', Georgia, serif" font-size="58" font-weight="600" fill="#0b1d29">${t(d.n)}</text>
      <text x="96" y="526" font-family="Inter, Arial, sans-serif" font-size="21" fill="#2b313a">por superar Fundamentos de inversión (interés compuesto, riesgo y plazo, diversificación,</text>
      <text x="96" y="560" font-family="Inter, Arial, sans-serif" font-size="21" fill="#2b313a">fraudes y apuestas) con un resultado de ${t(d.s)}.</text>
      <line x1="96" y1="664" x2="1104" y2="664" stroke="#e3e7ec" stroke-width="2"/>
      <text x="96" y="710" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700" fill="#8a94a3" letter-spacing="1.5">EMISIÓN</text>
      <text x="96" y="742" font-family="Inter, Arial, sans-serif" font-size="21" fill="#111418">${t(fmtD(d.f))}</text>
      <text x="420" y="710" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700" fill="#8a94a3" letter-spacing="1.5">PRÓXIMA REVISIÓN</text>
      <text x="420" y="742" font-family="Inter, Arial, sans-serif" font-size="21" fill="#111418">${t(fmtD(d.v))}</text>
      <text x="744" y="710" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700" fill="#8a94a3" letter-spacing="1.5">CÓDIGO DE VERIFICACIÓN</text>
      <text x="744" y="742" font-family="Inter, Arial, sans-serif" font-size="21" fill="#111418">${t(d.i)}</text>
      <circle cx="1030" cy="186" r="74" fill="#0b1d29"/><circle cx="1030" cy="186" r="62" fill="none" stroke="#c99a2e" stroke-width="1.5"/>
      <text x="1030" y="182" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700" fill="#ffffff" letter-spacing="2">HORIZONTE</text>
      <text x="1030" y="206" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" fill="#e8c77a" letter-spacing="1">${t(String(T(d.f).getFullYear()))}</text>
    </svg>`;
}
function linkedinUrl(d) {
    const f = T(d.f), v = T(d.v);
    return "https://www.linkedin.com/profile/add?" + new URLSearchParams({ startTask: "CERTIFICATION_NAME", name: "Certificado Horizonte · Fundamentos de inversión", organizationName: "CaixaBank Asset Management",
        issueYear: f.getFullYear(), issueMonth: f.getMonth() + 1, expirationYear: v.getFullYear(), expirationMonth: v.getMonth() + 1, certUrl: verifyUrl(d), certId: d.i }).toString();
}
function vAprende() {
    const done = Object.keys(S.lessons).length, all = done === LESSONS.length, age = ageOf(), m = money(), passed = S.exam?.passed, st = stageOf();
    const stages = [
        [STAGES[0], passed ? `Superado con ${S.exam.score}/${S.exam.total}` : `${done} de ${LESSONS.length} temas`],
        [STAGES[1], passed ? (m.protect?.active ? `${m.protect.daysLeft} días de protección` : m.protect ? "Primer año completado" : "Empieza con tu primera aportación") : `Tus primeros ${RULES.protectCap} € protegidos`],
        [STAGES[2], age >= RULES.adultAge ? "La cuenta es solo tuya" : `A los ${RULES.adultAge} años`],
    ];
    const today = iso(new Date()), played = S.games[today];
    let dip = "";
    if (passed && S.diploma) {
        const d = diplomaData(), revOpen = (T(d.v) - Date.now()) / 864e5 < 31;
        dip = card(`${cardH("Tu certificado", "Descárgalo, compártelo o añádelo a tu perfil profesional.")}
          <div class="dip-wrap">${diplomaSVG(d)}</div>
          <div class="actions">${btn(`${ic("download")}Descargar`, "dlDiploma", "primary")}
            ${age >= RULES.linkedinAge ? `<a class="btn" href="${esc(linkedinUrl(d))}" target="_blank" rel="noopener">Añadir a LinkedIn</a>` : `<button class="btn" disabled>LinkedIn a partir de los ${RULES.linkedinAge}</button>`}
            ${btn(`${ic("link")}Copiar enlace de verificación`, "copyVerify")}</div>`, "c-8")
          + card(`${cardH("Revisión anual", `Cada año repasas lo esencial y pones al día tus preocupaciones y tu Antídoto. Próxima antes del ${fmtD(d.v)}.`)}
            <p class="note">${S.itv.length ? `Última revisión: ${fmtD(lastItv())}. ` : ""}Cada revisión suma ${MILES.itv} millas de casa.</p><div class="actions">${btn("Hacer la revisión", "itv", revOpen ? "primary" : "")}</div>`, "c-4");
    }
    return `${pageH("Aprende", "Lo esencial para invertir con criterio. Cada paso suma millas de casa.")}
    <div class="grid">
      ${card(`<div class="cred-hero">${credVisual(true)}<ol class="stages">${stages.map(([t, sub], i) => `<li class="${i < st ? "done" : i === st ? "on" : ""}"><span>${i < st ? ic("check") : i + 1}</span><div><b>${t}</b><small>${sub}</small></div></li>`).join("")}</ol></div>`, "c-12")}
      ${card(`${cardH("Fundamentos", `Cinco temas de unos tres minutos. Cada tema suma ${MILES.lesson} millas de casa.`, `<span class="count">${done}/${LESSONS.length}</span>`)}
        <div class="rows">${LESSONS.map((l, i) => `<a class="row ${S.lessons[l.id] ? "ok" : ""}" href="#/tema/${l.id}/0"><span class="tick num">${S.lessons[l.id] ? ic("check") : i + 1}</span><div><b>${l.title}</b><span>${l.sub} · ${l.min} min</span></div>${ic("chev", "chev")}</a>`).join("")}</div>
        <div class="exam"><span class="mv-ic own">${ic("star")}</span><div><b>Prueba final</b><span>${passed ? `Superada el ${fmtD(S.exam.date)}.` : all ? `${RULES.examSize} preguntas; puedes fallar ${RULES.examMaxErrors}. Al superarla, CaixaBank invierte ${RULES.prize} € a tu nombre.` : `Disponible al completar los ${LESSONS.length} temas.`}</span></div>
          ${all || passed ? lnk(passed ? "Repetir" : "Empezar", "#/prueba", passed ? "" : "primary") : `<button class="btn" disabled>Empezar</button>`}</div>`, "c-7")}
      ${card(`${cardH("Juegos con datos reales", `25 años de mercados, en partidas de un minuto. Una al día suma ${MILES.game} millas.`, played ? badge(`${ic("check")}Hoy: ${played.score}/${GAMES.find(g => g.id === played.id)?.rounds}`, "ok") : "")}
        <div class="games">${GAMES.map(g => `<a class="game ${g.id}" href="#/juego/${g.id}"><span>${ic(g.id === "titular" ? "news" : "chart")}</span><div><b>${g.t}</b><small>${g.p}</small></div>${ic("play", "play")}</a>`).join("")}</div>
        <p class="note">Datos anuales aproximados entre ${MKT_FROM} y ${MKT_FROM + MKT[0].r.length - 1}. Rentabilidades pasadas no garantizan las futuras.</p>`, "c-5")}
      ${dip}
    </div>`;
}

/* ---------------- Juegos */
let gameState = null;
function newGame(id) {
    const ys = [...Array(MKT[0].r.length).keys()].sort(() => Math.random() - 0.5).slice(0, 5), world = MKT.find(x => x.k === "world");
    const sg = v => `${v >= 0 ? "+" : "−"}${pct(Math.abs(v), 1)}`;
    const qs = ys.map(y => {
        const year = MKT_FROM + y;
        if (id === "titular") {
            const up = world.r[y] >= 0;
            return { kick: "El titular", q: `«${MKT_NEWS[y]}»`, sub: "¿La bolsa mundial acabó ese año arriba o abajo?", o: ["Arriba", "Abajo"], a: up ? 0 : 1,
                why: `Fue ${year}. El índice mundial MSCI World acabó el año en ${sg(world.r[y])}.` };
        }
        const pool = [...MKT].sort(() => Math.random() - 0.5), a = pool[0], b = pool.find(x => x.k !== a.k && Math.abs(x.r[y] - a.r[y]) > 2) || pool[1];
        return { kick: `¿Cuál rindió más? · ${year}`, q: `En ${year}, ¿qué fue mejor?`, sub: "", o: [`${a.name} (${a.sub})`, `${b.name} (${b.sub})`], a: a.r[y] >= b.r[y] ? 0 : 1,
            why: `${a.name}: ${sg(a.r[y])}. ${b.name}: ${sg(b.r[y])}. Aquel año: ${MKT_NEWS[y].charAt(0).toLowerCase() + MKT_NEWS[y].slice(1)}` };
    });
    gameState = { id, qs, i: 0, score: 0, ans: null, over: false };
}
function vJuego(id) {
    const g = GAMES.find(x => x.id === id); if (!g) return null;
    if (!gameState || gameState.id !== id) newGame(id);
    const e = gameState;
    if (e.over) {
        return focus("#/aprende", 0, 0, `<div class="center"><div class="result ok">${ic("star")}</div>
          <h1>${e.score} de ${e.qs.length}</h1>
          <p>${e.score >= 4 ? "Tienes buen olfato. Pero recuerda: nadie acierta siempre, por eso se diversifica." : e.score >= 2 ? "Ni tan mal. Acertar el mercado año a año es casi imposible, por eso cuenta el plazo." : "Si cuesta acertar con el resultado delante, imagina sin él. Por eso se invierte a largo plazo."}${e.miles ? ` <b>+${e.miles} millas de casa.</b>` : ""}</p>
          <div class="focus-nav center">${btn("Otra partida", "gameAgain", "primary lg", `data-id="${id}"`)}${lnk("Volver", "#/aprende", "lg")}</div></div>`);
    }
    const q = e.qs[e.i];
    return focus("#/aprende", e.i + 1, e.qs.length, `<span class="kicker">${q.kick} · ${e.score} aciertos</span><h1 class="${id === "titular" ? "serif-q" : ""}">${esc(q.q)}</h1>${q.sub ? `<p class="lead-q">${q.sub}</p>` : ""}${opts(q, e.ans, "gameAns")}
      ${e.ans !== null ? `${why(e.ans === q.a, q.why)}<div class="focus-nav"><span></span>${btn(e.i === e.qs.length - 1 ? "Ver resultado" : `Siguiente${ic("arrow")}`, "gameNext", "primary")}</div>` : ""}`);
}

let lessonState = null;
const focus = (back, i, n, body) => `<div class="focus"><header class="focus-top"><a class="icon-btn" href="${back}" aria-label="Cerrar">${ic("close")}</a>${n ? `${bar(i, n, "blue")}<span>${i} / ${n}</span>` : ""}</header><article class="focus-body">${body}</article></div>`;
function vTema(id, step) {
    const l = LESSONS.find(x => x.id === id);
    if (!l) return null;
    const total = l.cards.length + l.check.length;
    step = Math.max(0, Math.min(total - 1, +step || 0));
    if (!lessonState || lessonState.id !== id) lessonState = { id, answers: {} };
    let body;
    if (step < l.cards.length) {
        const c = l.cards[step];
        body = `<span class="kicker">${esc(l.title)}</span><h1>${c.h}</h1>${c.p.map(p => `<p>${p}</p>`).join("")}${c.viz ? viz(c.viz) : ""}
          <div class="focus-nav">${step ? lnk("Anterior", `#/tema/${id}/${step - 1}`) : "<span></span>"}${lnk(`Siguiente${ic("arrow")}`, `#/tema/${id}/${step + 1}`, "primary")}</div>`;
    } else {
        const qi = step - l.cards.length, q = l.check[qi], ans = lessonState.answers[qi], last = step === total - 1;
        body = `<span class="kicker">Comprueba lo que sabes · ${qi + 1} de ${l.check.length}</span><h1>${q.q}</h1>${opts(q, ans, "lessonAns", `data-q="${qi}"`)}
          ${ans !== undefined ? why(ans === q.a, q.why) : ""}
          <div class="focus-nav">${lnk("Anterior", `#/tema/${id}/${step - 1}`)}${ans !== undefined ? (last ? btn("Terminar tema", "lessonDone", "primary", `data-id="${id}"`) : lnk(`Siguiente${ic("arrow")}`, `#/tema/${id}/${step + 1}`, "primary")) : ""}</div>`;
    }
    return focus("#/aprende", step + 1, total, body);
}
const opts = (q, ans, act, data = "") => `<div class="opts">${q.o.map((o, i) => `<button class="opt ${ans !== undefined && ans !== null ? (i === q.a ? "right" : i === ans ? "wrong" : "") : ""}" data-act="${act}" ${data} data-i="${i}" ${ans !== undefined && ans !== null ? "disabled" : ""}><span>${String.fromCharCode(65 + i)}</span>${o}</button>`).join("")}</div>`;
const why = (ok, txt) => `<div class="why ${ok ? "ok" : "ko"}">${ic(ok ? "check" : "info")}<div><b>${ok ? "Correcto" : "No es correcto"}</b><p>${txt}</p></div></div>`;

function viz(kind) {
    if (kind === "compound") return `<div class="viz" data-viz="compound">
        <label>Aportación mensual <output data-o="m"></output><input type="range" min="5" max="100" step="5" value="20" data-i="m"></label>
        <label>Plazo <output data-o="y"></output><input type="range" min="3" max="40" step="1" value="12" data-i="y"></label>
        <div class="vrow"><span>Lo que aportas</span><b data-o="put"></b></div><div class="bar"><i data-b="put"></i></div>
        <div class="vrow"><span>Valor estimado al 5 % anual</span><b data-o="got"></b></div><div class="bar up"><i style="width:100%"></i></div>
        <p class="note">Estimación con una rentabilidad constante del 5 % anual. No es una previsión.</p></div>`;
    if (kind === "drops") {
        const v = [100, 112, 104, 121, 96, 108, 131, 118, 142, 127, 151, 166, 149, 172, 188];
        const xy = v.map((y, i) => [i * 600 / (v.length - 1), 200 - (y - 80) / 120 * 190]);
        const d = xy.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
        return `<figure class="viz"><svg viewBox="0 0 600 210" class="line" role="img" aria-label="Evolución ilustrativa con caídas que se recuperan"><path d="${d} L600 210 L0 210 Z" fill="#007eae" fill-opacity=".08"/><path d="${d}" fill="none" stroke="#007eae" stroke-width="3" stroke-linejoin="round"/>
          ${[4, 9, 12].map(i => `<circle cx="${xy[i][0]}" cy="${xy[i][1]}" r="6" fill="#fff" stroke="#d93025" stroke-width="3"/>`).join("")}</svg>
          <figcaption>Ilustración: las caídas (en rojo) forman parte del camino.</figcaption></figure>`;
    }
    return "";
}
function bindViz() {
    $$('[data-viz="compound"]').forEach(v => {
        const upd = () => {
            const mm = +$('[data-i="m"]', v).value, y = +$('[data-i="y"]', v).value, put = mm * 12 * y, got = fv(mm, y);
            $('[data-o="m"]', v).textContent = eur(mm); $('[data-o="y"]', v).textContent = `${y} años`;
            $('[data-o="put"]', v).textContent = eur(put); $('[data-o="got"]', v).textContent = eur(got);
            $('[data-b="put"]', v).style.width = (put / got * 100).toFixed(1) + "%";
        };
        $$("input", v).forEach(i => i.addEventListener("input", upd)); upd();
    });
}

let examState = null;
function vExamen() {
    if (!examState) examState = { qs: [...EXAM].sort(() => Math.random() - 0.5).slice(0, RULES.examSize), i: 0, errors: 0, ans: null, over: false };
    const e = examState;
    if (e.over) {
        const ok = e.errors <= RULES.examMaxErrors;
        return focus("#/aprende", 0, 0, `<div class="center"><div class="result ${ok ? "ok" : "ko"}">${ic(ok ? "check" : "close")}</div>
          <h1>${ok ? "Fundamentos superados" : "Esta vez no ha sido"}</h1>
          <p>${ok ? `${RULES.examSize - e.errors} de ${RULES.examSize} respuestas correctas. Ya tienes tu Certificado Horizonte, ${RULES.prize} € invertidos a tu nombre y ${MILES.theory} millas de casa. Empieza tu primer año acompañado.` : `Has fallado ${e.errors} preguntas y el máximo es ${RULES.examMaxErrors}. Repasa los temas y vuelve a intentarlo cuando quieras.`}</p>
          <div class="focus-nav center">${ok ? lnk("Ver mi certificado", "#/aprende", "primary lg") : btn("Repetir la prueba", "examRetry", "primary lg")}</div></div>`);
    }
    const q = e.qs[e.i];
    return focus("#/aprende", e.i + 1, RULES.examSize, `<span class="kicker">Prueba final · ${e.errors} de ${RULES.examMaxErrors} fallos permitidos</span><h1>${q.q}</h1>${opts(q, e.ans, "examAns")}
      ${e.ans !== null ? `${why(e.ans === q.a, q.why)}<div class="focus-nav"><span></span>${btn(e.i === RULES.examSize - 1 || e.errors > RULES.examMaxErrors ? "Ver resultado" : `Siguiente${ic("arrow")}`, "examNext", "primary")}</div>` : ""}`);
}

function vVerificar(params) {
    let d = null;
    try { d = JSON.parse(decodeURIComponent(escape(atob(params.get("d") || "")))); } catch (e) { d = null; }
    return `<div class="auth"><header class="auth-top">${brand("#/", 32)}</header>
      <main class="verify">${d && d.n ? `${badge(`${ic("check")}Certificado verificado`, "ok")}<h1>${esc(d.n)}</h1>
        <p class="sub">Certificado Horizonte · Fundamentos de inversión · emitido el ${fmtD(d.f)} · próxima revisión antes del ${fmtD(d.v)} · código ${esc(d.i)}</p><div class="dip-wrap">${diplomaSVG(d)}</div>`
        : `<h1>Enlace no válido</h1><p class="sub">No hemos podido leer este certificado.</p>`}</main></div>`;
}

/* ---------------- Dinero */
function vDinero() {
    const m = money(), gain = m.value - m.invested, p = m.protect, moves = [...S.money].reverse();
    return `${pageH("Dinero", "Tu cuenta, tus metas y tu primer año acompañado.", btn(`${ic("plus")}Aportar`, "openContribute", "primary"))}
    <div class="grid">
      ${card(`<div class="value-head">${stat("Valor estimado", eur(m.value, true))}<div class="vh-side"><div><span>Aportado</span><b>${eur(m.invested, true)}</b></div><div><span>Rendimiento estimado</span><b class="${gain >= 0 ? "up" : "down"}">${gain >= 0 ? "+" : "−"}${eur(Math.abs(gain), true)}</b></div><div><span>Aportado por ti</span><b>${eur(m.ownReal, true)}</b></div><div><span>De tu familia</span><b>${eur(m.gifts, true)}</b></div>${m.prizes ? `<div><span>Premios</span><b>${eur(m.prizes, true)}</b></div>` : ""}</div></div>`, "c-12")}
      ${card(`${cardH("Primer año acompañado", `Los primeros ${RULES.protectCap} € que inviertes tú no pueden perder valor en ${RULES.protectMonths} meses. Si al cumplirse valen menos, CaixaBank pone la diferencia.`)}
        <div class="protect"><div class="pr-num"><b>${eur(p?.base || 0)}</b><span>de ${RULES.protectCap} € protegidos</span></div>${bar(p?.base || 0, RULES.protectCap, "blue")}
        <p class="note">${p ? (p.active ? `Del ${fmtD(p.start)} al ${fmtD(p.end)} · ${p.daysLeft} días restantes · ${eur(p.room)} de margen` : `Tu periodo de protección terminó el ${fmtD(p.end)}.`) : "Empieza con tu primera aportación o con tu primera inversión al superar Fundamentos."}</p></div>
        <div class="sim" data-sim><label>Si el mercado cayera <output data-o="d"></output><input type="range" min="-40" max="10" step="5" value="-20" data-i="d"></label><p data-o="out"></p></div>
        <details class="terms"><summary>Condiciones${ic("plus")}</summary><ul><li>Tope de ${RULES.protectCap} € por persona y límite por campaña.</li><li>Aplica a la cartera base y al Antídoto, siempre en fondos de perfil moderado.</li><li>Solo cubre si no vendes antes de los ${RULES.protectMonths} meses.</li><li>Es una bonificación promocional de CaixaBank, no un producto garantizado.</li></ul></details>`, "c-7")}
      ${card(`${cardH("Ahorro automático", "Lo que se aparta solo, sin que tengas que acordarte.")}
        <div class="rows">
          <div class="row"><span class="mv-ic own">${ic("plus")}</span><div><b>Cada semana</b><span>${S.paga ? `De tu paga de ${eur(S.paga)}` : "Indica tu paga en Ajustes y te sugerimos una cantidad"}</span></div>
            <select data-act="weekly" aria-label="Euros a la semana">${[0, 1, 2, 3, 5, 10, 15, 20].map(v => `<option value="${v}" ${S.weekly === v ? "selected" : ""}>${v ? `${v} €` : "No"}</option>`).join("")}</select></div>
          <div class="row"><span class="mv-ic own">${ic("spark")}</span><div><b>Redondeo de compras</b><span>Cada compra con tu tarjeta se redondea al euro y la diferencia se invierte.</span></div>${toggle("roundup", S.roundup, "Redondeo de compras")}</div>
        </div>${S.paga && !S.weekly ? `<p class="note">Te sugerimos apartar ${eur(Math.max(1, Math.round(S.paga * 0.15)))} a la semana: un 15 % de tu paga.</p>` : ""}`, "c-5")}
      ${metasCard()}
      ${card(`${cardH("Reparto", m.al.active ? `Cartera base ${pct(RULES.base * 100)} y Antídoto ${pct(RULES.antidote * 100)}.` : m.al.pending ? "Tu Antídoto espera la aprobación de tu familia. Mientras, todo está en la cartera base." : "Todo en la cartera base. Elige tu Antídoto para invertir una parte en lo que te preocupa.", m.al.active ? "" : lnk(S.fears.length ? "Ver Antídoto" : "Elegir Antídoto", "#/antidoto", "sm"))}
        ${stack(m.parts)}<div class="rows">${m.parts.map(pp => `<div class="row">${sw(pp.fund)}<div><b>${FUNDS[pp.fund].name}</b><span>${pp.fear ? "Antídoto · " + esc(pp.fear.label) : FUNDS[pp.fund].sub}</span></div><b class="amt">${eur(pp.amount, true)}</b></div>`).join("")}</div>`, "c-12")}
      ${card(`${cardH("Movimientos")}${moves.length ? `<div class="rows">${moves.slice(0, 20).map(moveRow).join("")}</div>` : empty("plus", "Aún no hay movimientos", "Tu primera aportación aparecerá aquí.", btn("Hacer mi primera aportación", "openContribute", "primary"))}`, "c-12")}
    </div>`;
}
function metaSaved(id) { return S.money.filter(c => c.meta === id).reduce((a, c) => a + c.amount, 0); }
function metasCard() {
    const m = money(), small = S.metas.reduce((a, x) => a + metaSaved(x.id), 0), house = Math.max(0, m.value - small), down = S.goal.price * DOWN_PCT;
    const rows = [`<div class="row tall"><span class="mv-ic gold">${ic("house")}</span><div><b>Tu casa · entrada</b><span>${eur(house, true)} de ${eur(down)}</span>${bar(house, down, "gold")}</div>${lnk("Ajustar", "#/casa", "sm")}</div>`,
        ...S.metas.map(x => { const sv = metaSaved(x.id); return `<div class="row tall"><span class="mv-ic own">${ic("target")}</span><div><b>${esc(x.name)}</b><span>${eur(sv, true)} de ${eur(x.target)}${sv >= x.target ? " · conseguida" : ""}</span>${bar(sv, x.target, "blue")}</div>${btn("Quitar", "delMeta", "sm ghost", `data-id="${x.id}"`)}</div>`; })];
    return card(`${cardH("Tus metas", "La principal es tu casa. Añade otras más cercanas y elige a cuál va cada aportación.", S.metas.length < 3 ? btn(`${ic("plus")}Nueva meta`, "openMeta", "sm") : "")}
      <div class="rows">${rows.join("")}</div>
      <p class="note">Si vas a necesitar el dinero en menos de tres años, lo prudente es no depender de la bolsa: lo verás en el tema «Las caídas pasan».</p>`, "c-12");
}
function metaSheet() {
    sheet("Nueva meta", `<form data-form="meta" class="form">
      <label class="field"><span>¿Para qué ahorras?</span><input name="name" required maxlength="40" placeholder="Por ejemplo, el carné de conducir"></label>
      <label class="field"><span>¿Cuánto necesitas? (€)</span><input name="target" type="number" min="10" max="50000" step="1" required inputmode="numeric"></label>
      <button class="btn primary lg block">Crear meta</button></form>`);
}
function contributeSheet() {
    const p = money().protect;
    sheet("Aportar", `<form data-form="contribute" class="form">
      <div class="amount-in"><input name="amount" type="number" min="1" max="3000" step="0.01" inputmode="decimal" required placeholder="0" aria-label="Importe en euros"><span>€</span></div>
      <div class="chips">${[1, 5, 10, 20, 50].map(v => `<button type="button" class="chip" data-act="setAmount" data-v="${v}">${v} €</button>`).join("")}</div>
      <div class="form two"><label class="field"><span>Origen del dinero</span><select name="src"><option value="paga">Mi paga</option><option value="verano">Un trabajo de verano</option><option value="otro">Otro ingreso</option></select></label>
      <label class="field"><span>Para</span><select name="meta"><option value="">Tu casa</option>${S.metas.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></label></div>
      <p class="note">${!p || p.active ? `Hasta ${RULES.protectCap} € de lo que aportas quedan protegidos durante tu primer año.` : "Tu periodo de protección ha terminado."}</p>
      <button class="btn primary lg block">Confirmar aportación</button></form>`);
}
function bindSim() {
    const v = $("[data-sim]"); if (!v) return;
    const upd = () => {
        const d = +$('[data-i="d"]', v).value, base = money().protect?.base || 0, val = base * (1 + d / 100), pay = Math.max(0, base - val);
        $('[data-o="d"]', v).textContent = `${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d)} %`;
        $('[data-o="out"]', v).innerHTML = !base ? "Cuando tengas dinero propio verás aquí cuánto te cubriría la protección."
            : pay > 0 ? `Tus ${eur(base)} protegidos valdrían ${eur(val)}. Al cumplirse el año, <b>CaixaBank pondría ${eur(pay)}</b>.`
            : `Tus ${eur(base)} protegidos valdrían ${eur(val)}. No haría falta la protección.`;
    };
    $('[data-i="d"]', v).addEventListener("input", upd); upd();
}

/* ---------------- Antídoto */
let ranking = null;
async function loadRanking() {
    const c = window.HZ2_CONFIG || {};
    ranking = { counts: {}, total: 0 };
    if (!c.supabaseUrl) return;
    try {
        const r = await fetch(`${c.supabaseUrl}/rest/v1/miedos_v2_ranking?select=miedo,votos`, { headers: { apikey: c.supabaseAnonKey, Authorization: `Bearer ${c.supabaseAnonKey}` } });
        if (r.ok) { const rows = await r.json(); ranking.counts = Object.fromEntries(rows.map(x => [x.miedo, +x.votos])); ranking.total = rows.reduce((a, x) => a + +x.votos, 0); }
    } catch (e) { /* sin conexión */ }
}
async function vote(ids) {
    if (S.voted) return;
    S.voted = true; save();
    const c = window.HZ2_CONFIG || {};
    if (!c.supabaseUrl) return;
    try {
        await fetch(`${c.supabaseUrl}/rest/v1/miedos_v2`, { method: "POST", headers: { apikey: c.supabaseAnonKey, Authorization: `Bearer ${c.supabaseAnonKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify(ids.map(id => ({ miedo: id, edad: ageOf() }))) });
    } catch (e) { /* sin conexión */ }
}
function vAntidoto() {
    const m = money(), al = m.al, can = S.geminiOk || isAdult();
    const chips = ["¿Cuánto me falta para la entrada de mi casa?", "¿Por qué este reparto?", "¿Qué pasa si la bolsa baja?", "¿Cuánto debería apartar de mi paga?", "¿Cuántas millas tengo?"];
    const r = ranking || { counts: {}, total: 0 }, showRank = r.total >= RANK_MIN;
    const rank = FEARS.map(f => ({ f, n: r.counts[f.id] || 0 })).sort((a, b) => b.n - a.n);
    const wpct = w => pct(w * 100, (w * 100) % 1 ? 1 : 0);
    return `${pageH("Antídoto", "No te preguntamos cuánto riesgo quieres, sino qué te preocupa de tu futuro. Una parte de tu dinero invierte justo en eso: si ocurre, tu dinero gana.")}
    <div class="grid">
      ${weekCard("c-12")}
      ${card(`${cardH("¿Qué te preocupa?", `Elige hasta ${RULES.maxFears}. Lo pones al día en tu revisión anual.`, `<span class="count">${S.fears.length}/${RULES.maxFears}</span>`)}
        <div class="fears">${FEARS.map(f => `<button class="fear ${S.fears.includes(f.id) ? "on" : ""}" data-act="fear" data-id="${f.id}" aria-pressed="${S.fears.includes(f.id)}"><span class="fi">${ic(f.id)}</span><b>${f.label}</b><small>${FUNDS[f.fund].name}</small><span class="fcheck">${ic("check")}</span></button>`).join("")}</div>`, "c-12")}
      ${al.fears.length ? card(`${cardH("Tu reparto", "Dentro de una selección cerrada de fondos de CaixaBank Asset Management.", badge(al.active ? "Activo" : "Pendiente de aprobación", al.active ? "ok" : "warn"))}
        ${stack(al.planned)}<div class="rows">${al.planned.map(p => `<div class="row tall">${sw(p.fund)}<div><b>${FUNDS[p.fund].name} · ${wpct(p.w)}</b><span>${p.fear ? p.fear.why : "La base reparte tu dinero entre miles de empresas para que ninguna preocupación lo decida todo."}</span></div></div>`).join("")}</div>
        ${!al.active ? `<p class="note">Hasta los ${RULES.adultAge} años, tu familia aprueba el Antídoto desde el área familiar.</p>` : ""}
        <p class="note">El Antídoto reduce el impacto si lo que temes ocurre. No es una garantía: las inversiones pueden perder valor.</p>`, "c-7") : ""}
      ${card(`${cardH(`<span class="gem">${ic("spark")}Gemini</span>`, "Te explica tu dinero con tus propios números.")}
        ${can ? `<div class="chat" id="chat">${(S.chat.length ? S.chat.slice(-8) : [{ r: "g", t: "Hola. Pregúntame por tu objetivo de casa, tu reparto, qué pasa si la bolsa baja o cuánto apartar de tu paga." }]).map(x => `<div class="msg ${x.r}"><p>${esc(x.t)}</p>${x.used?.length ? `<small>Basado en ${x.used.map(esc).join(", ")}</small>` : ""}</div>`).join("")}</div>
          <div class="chips">${chips.map(c => `<button class="chip" data-act="ask" data-q="${esc(c)}">${c}</button>`).join("")}</div>
          <form class="ask" data-form="ask"><input name="q" placeholder="Escribe tu pregunta" aria-label="Tu pregunta" autocomplete="off" required><button class="icon-btn primary" aria-label="Enviar">${ic("send")}</button></form>
          <p class="note">Gemini usa la información de tu cuenta solo con permiso. No es asesoramiento financiero.</p>`
          : empty("lock", "Necesitas el permiso de tu familia", `Hasta los ${RULES.adultAge}, tu madre, padre o tutor decide si Gemini puede usar la información de tu cuenta.`, lnk("Ver permisos", "#/familia", "primary"))}`, al.fears.length ? "c-5" : "c-12")}
      ${card(`${cardH("Mapa de preocupaciones de tu generación", "Un ranking anónimo de lo que preocupa a los jóvenes en España.")}
        ${showRank ? `<div class="rank">${rank.map((x, i) => `<div class="rk ${S.fears.includes(x.f.id) ? "mine" : ""}"><span class="rk-n">${i + 1}</span><span class="fi sm">${ic(x.f.id)}</span><div><b>${x.f.label}</b>${bar(x.n, rank[0].n, "blue")}</div><span class="rk-p">${pct(x.n / r.total * 100)}</span></div>`).join("")}</div><p class="note">${num(r.total)} respuestas anónimas.</p>`
          : empty("chart", "Se publicará con las primeras respuestas", `Mostraremos el ranking cuando haya al menos ${RANK_MIN} respuestas, para que sea representativo y nadie pueda ser identificado.${S.voted ? " Tu respuesta ya cuenta." : ""}`)}`, "c-12")}
    </div>`;
}

/* ---------------- Casa */
function vCasa() {
    const m = money(), mi = miles(), age = ageOf(), minAge = Math.max(age + 2, 20);
    const rules = [
        ["Cada tema de Fundamentos", `+${MILES.lesson}`, `${Object.keys(S.lessons).length} de ${LESSONS.length}`],
        ["Superar Fundamentos", `+${MILES.theory}`, S.exam?.passed ? "Conseguido" : ""],
        ["Un juego al día", `+${MILES.game}`, Object.keys(S.games).length ? `${Object.keys(S.games).length} días jugados` : "Datos reales de 25 años"],
        ["Cada 4 semanas de racha", `+${MILES.streak4}`, `Racha actual: ${streak().current} semanas`],
        ["Tu primer euro propio", `+${MILES.firstOwn}`, m.firstOwn ? "Conseguido" : ""],
        ["Cada mes que aportas", `+${MILES.monthOwn}`, S.weekly || S.roundup ? "Ahorro automático activo" : ""],
        ["Revisión anual", `+${MILES.itv}`, S.itv.length ? `${S.itv.length} completada${S.itv.length > 1 ? "s" : ""}` : ""],
        ["Regalos de tu familia", `+${MILES.giftPer5} cada 5 €`, `Máximo ${MILES.giftMonthCap} al mes`],
    ];
    return `${pageH("Casa", "Tus millas de casa se convierten en una rebaja del interés de tu primera hipoteca con CaixaBank.")}
    <div class="grid">
      ${card(`<div class="miles-hero"><div>${stat("Millas de casa", num(mi.total))}<p>Equivalen a <b>${pts(mi.cut)} puntos</b> menos de diferencial: unos <b>${eur(mortgageSaving(mi.cut))}</b> menos de intereses en la hipoteca de tu objetivo.</p></div>
        <div class="mh-meter"><span>Rebaja acumulada</span>${bar(mi.cut, MILES.maxCut, "gold")}<small>${pts(mi.cut)} de ${pts(MILES.maxCut)} puntos posibles</small></div></div>`, "c-12")}
      ${card(`${cardH("Tu objetivo", "Ajústalo cuando quieras. Lo usamos en tus cálculos y en Gemini.")}
        <form class="form two" data-form="goal">
          <label class="field"><span>Precio de la vivienda (€)</span><input name="price" type="number" min="30000" max="2000000" step="1000" value="${S.goal.price}" required></label>
          <label class="field"><span>Edad de compra</span><input name="age" type="number" min="${minAge}" max="45" value="${Math.max(S.goal.age, minAge)}" required></label>
          <button class="btn full">Guardar objetivo</button></form>
        <div class="split">${stat("Entrada habitual (20 %)", eur(S.goal.price * DOWN_PCT))}${stat("Hipoteca", eur(mortgageAmount()))}</div>`, "c-6")}
      ${card(`${cardH("Proyección", "Cómo llegarías a tu objetivo con tu ritmo de aportación.")}
        <div class="viz" data-proj><label>Aportación mensual total <output data-o="mon"></output><input type="range" min="0" max="400" step="5" value="${Math.round(m.monthly / 5) * 5}" data-i="mon"></label>
          <div class="split four">${stat("Para la entrada", '<span data-o="down"></span>', `de ${eur(S.goal.price * DOWN_PCT)}`)}${stat(`Millas a los ${S.goal.age}`, '<span data-o="miles"></span>')}${stat("Rebaja", '<span data-o="cut"></span>', "puntos de diferencial")}${stat("Ahorro en intereses", '<span data-o="save"></span>')}</div>
          <p class="note">Estimación con una rentabilidad del 5 % anual, hipoteca a ${MORTGAGE_YEARS} años y tipo de referencia del ${pct(MORTGAGE_RATE, 1)}. El aval del ICO para menores de 35 puede reducir la entrada necesaria.</p></div>`, "c-6")}
      ${card(`${cardH("Cómo se ganan")}<div class="rows">${rules.map(([t, n, s]) => `<div class="row"><div><b>${t}</b>${s ? `<span>${s}</span>` : ""}</div><b class="amt gold">${n}</b></div>`).join("")}</div>
        <p class="note">100 millas equivalen a 0,01 puntos menos de diferencial, hasta un máximo de ${pts(MILES.maxCut)} puntos.</p>`, "c-6")}
      ${card(`${cardH("Condiciones")}<ul class="plain"><li>Se canjean en tu primera hipoteca con CaixaBank.</li><li>No caducan. Si no compras vivienda, no pierdes nada: tu dinero sigue siendo tuyo.</li><li>Son una rebaja sobre las condiciones vigentes al firmar, nunca un precio cerrado ni una obligación de contratar otros productos (Ley 5/2019).</li><li>Los regalos tienen un tope mensual de millas.</li></ul>`, "c-6")}
      ${card(`${cardH("Historial de millas")}${mi.items.length ? `<div class="rows">${mi.items.slice(0, 15).map(i => `<div class="row"><div><b>${esc(i.label)}</b><span>${fmtD(i.date)}</span></div><b class="amt gold">+${i.n}</b></div>`).join("")}</div>` : empty("house", "Aún no tienes millas", "Empieza por Fundamentos: cada tema suma.", lnk("Ir a Aprende", "#/aprende", "primary"))}`, "c-12")}
    </div>`;
}
function bindProj() {
    const v = $("[data-proj]"); if (!v) return;
    const age = ageOf(), base = miles().total, value = money().value;
    const upd = () => {
        const mon = +$('[data-i="mon"]', v).value, yrs = Math.max(0, S.goal.age - age);
        const giftM = Math.min(MILES.giftMonthCap, Math.floor(S.schedules.reduce((a, x) => a + x.amount, 0) / 5));
        const mt = base + ((mon > 0 ? MILES.monthOwn * 12 : 0) + giftM * 12 + MILES.itv) * yrs, c = cutOf(mt);
        $('[data-o="mon"]', v).textContent = eur(mon);
        $('[data-o="down"]', v).textContent = eur(fv(mon, yrs, value));
        $('[data-o="miles"]', v).textContent = num(mt);
        $('[data-o="cut"]', v).textContent = pts(c);
        $('[data-o="save"]', v).textContent = eur(mortgageSaving(c));
    };
    $('[data-i="mon"]', v).addEventListener("input", upd); upd();
}

/* ---------------- Familia (vista del joven) */
function vFamiliaJoven() {
    const al = allocation(), gifts = S.money.filter(isGift).reverse(), ok = S.geminiOk || isAdult();
    const invite = `Estoy aprendiendo a invertir en Horizonte, de CaixaBank. Desde el área familiar puedes ayudarme con mi primera casa: ${location.origin}${location.pathname}#/alta/familia`;
    return `${pageH("Familia", "Tu familia puede regalarte dinero para tu futuro, aprobar tus decisiones y ver tu progreso.")}
    <div class="grid">
      ${card(`${cardH("Tu familia en Horizonte")}${S.family ? `<div class="rows"><div class="row"><span class="avatar">${esc(S.family.name.slice(0, 1).toUpperCase())}</span><div><b>${esc(S.family.name)}</b><span>${esc(S.family.relation)}${S.familyAuth ? " · Ha autorizado tu cuenta" : ""}</span></div></div></div>` : empty("family", "Aún no hay nadie de tu familia", "Invítales para que puedan ayudarte.")}
        <div class="actions">${btn(`${ic("send")}Invitar a un familiar`, "invite", "primary", `data-text="${esc(invite)}"`)}</div>`, "c-6")}
      ${card(`${cardH("Permisos", isAdult() ? "Ya eres mayor de edad: decides tú." : "Hasta los 18, los decide tu madre, padre o tutor.")}
        <div class="rows"><div class="row"><div><b>Antídoto</b><span>${al.fears.length ? (al.active ? "Aprobado" : "Pendiente de aprobación") : "Aún no lo has elegido"}</span></div>${badge(al.active ? "Aprobado" : al.fears.length ? "Pendiente" : "Sin elegir", al.active ? "ok" : al.fears.length ? "warn" : "")}</div>
          <div class="row"><div><b>Gemini</b><span>Usar la información de tu cuenta para explicarte tu dinero</span></div>${isAdult() ? toggle("gemOk", S.geminiOk, "Permitir Gemini") : badge(ok ? "Permitido" : "Sin permiso", ok ? "ok" : "")}</div></div>`, "c-6")}
      ${card(`${cardH("Regalos recibidos")}${gifts.length ? `<div class="rows">${gifts.map(moveRow).join("")}</div>` : empty("gift", "Todavía no has recibido regalos", "Cuando tu familia te regale dinero, lo verás aquí con su mensaje.")}`, "c-12")}
    </div>`;
}

/* ------------------------------------------------------------------ área familiar */
function vFResumen() {
    const m = money(), mi = miles(), n = esc(teenName());
    return `${pageH(`Hola, ${esc(S.family?.name || "")}`, `Así avanza ${n} en Horizonte.`, lnk(`${ic("gift")}Hacer un regalo`, "#/f/regalar", "primary"))}
    <div class="grid">
      ${card(`<div class="hero-cred">${credVisual()}<div class="hc-copy"><span class="kicker">Su Certificado Horizonte</span><h2>${STAGES[stageOf()]}</h2>
        <p>${S.exam?.passed ? `Superó Fundamentos el ${fmtD(S.exam.date)} con ${S.exam.score}/${S.exam.total}.` : `Lleva ${Object.keys(S.lessons).length} de ${LESSONS.length} temas de Fundamentos.`} ${m.firstOwn ? `Puso su primer euro propio el ${fmtD(m.firstOwn.date)}.` : "Aún no ha puesto su primer euro propio."}</p></div></div>`, "c-8")}
      ${card(stat("Valor estimado", eur(m.value, true), `${eur(m.gifts, true)} aportados por la familia`), "c-4 stat-card")}
      ${card(stat(`Aportado por ${n}`, eur(Math.max(0, m.ownReal), true), "De su paga y sus ingresos"), "c-4")}
      ${card(stat("Millas de casa", num(mi.total), `${pts(mi.cut)} puntos menos de diferencial`), "c-4")}
      ${card(stat("Protegido", eur(m.protect?.base || 0), `de ${RULES.protectCap} € en su primer año`), "c-4")}
      ${card(`${cardH("Pendiente de tu aprobación")}${pendingRows()}`, "c-12")}
    </div>`;
}
function pendingRows() {
    const al = allocation(), rows = [];
    if (al.pending) rows.push(`<a class="row" href="#/f/permisos"><span class="mv-ic warn">${ic("shield")}</span><div><b>Aprobar su Antídoto</b><span>Ha elegido: ${al.fears.map(f => esc(f.label.toLowerCase())).join(" y ")}.</span></div>${ic("chev", "chev")}</a>`);
    if (!S.geminiOk && !isAdult()) rows.push(`<a class="row" href="#/f/permisos"><span class="mv-ic warn">${ic("spark")}</span><div><b>Permiso para Gemini</b><span>Para explicarle su dinero con sus propios números.</span></div>${ic("chev", "chev")}</a>`);
    return rows.length ? `<div class="rows">${rows.join("")}</div>` : empty("check", "Todo al día", "No hay nada pendiente de aprobar.");
}
function vFRegalar() {
    const n = esc(teenName()), sent = S.money.filter(isGift).reverse();
    return `${pageH("Regalos", `Regala a ${n} dinero para su futuro, con un mensaje.`)}
    <div class="grid">
      ${card(`${cardH("Nuevo regalo", `Cada 5 € suman ${MILES.giftPer5} milla de casa, hasta ${MILES.giftMonthCap} al mes.`)}
        <form class="form two" data-form="gift">
          <label class="field"><span>Importe (€)</span><input name="amount" type="number" min="1" max="3000" step="1" required inputmode="numeric"></label>
          <label class="field"><span>Frecuencia</span><select name="type"><option value="puntual">Una vez</option><option value="mensual">Cada mes</option></select></label>
          <label class="field"><span>Ocasión</span><select name="occasion"><option>Cumpleaños</option><option>Navidad</option><option>Fin de curso</option><option>Sin ocasión</option></select></label>
          <label class="field"><span>De parte de</span><input name="from" maxlength="40" value="${esc(S.family?.name || "")}" required></label>
          <label class="field full"><span>Mensaje (opcional)</span><input name="msg" maxlength="120"></label>
          <button class="btn primary lg full">Enviar regalo</button></form>`, "c-7")}
      ${card(`${cardH("Aportaciones mensuales")}${S.schedules.length ? `<div class="rows">${S.schedules.map((s, i) => `<div class="row"><span class="mv-ic gift">${ic("gift")}</span><div><b>${eur(s.amount)} al mes</b><span>${esc(s.from)} · desde el ${fmtD(s.since)}</span></div>${btn("Cancelar", "cancelSched", "sm", `data-i="${i}"`)}</div>`).join("")}</div>` : empty("gift", "Sin aportaciones mensuales", "Una pequeña cantidad cada mes suma mucho con los años.")}`, "c-5")}
      ${card(`${cardH("Regalos enviados")}${sent.length ? `<div class="rows">${sent.map(moveRow).join("")}</div>` : empty("gift", "Aún no has hecho ningún regalo", "Tus regalos aparecerán aquí.")}`, "c-12")}
    </div>`;
}
function vFPermisos() {
    const al = allocation(), n = esc(teenName()), adult = isAdult(), wpct = w => pct(w * 100, (w * 100) % 1 ? 1 : 0);
    return `${pageH("Permisos", adult ? `${n} ya es mayor de edad y decide sobre su cuenta.` : `Hasta los ${RULES.adultAge} años, las decisiones importantes de la cuenta de ${n} necesitan tu aprobación.`)}
    <div class="grid">
      ${card(`${cardH("Antídoto", al.fears.length ? `${n} ha elegido invertir una parte en lo que le preocupa.` : `${n} aún no ha elegido su Antídoto.`, al.fears.length && !adult ? toggle("approve", S.antidoteApproved, "Aprobar Antídoto") : "")}
        ${al.fears.length ? `${stack(al.planned)}<div class="rows">${al.planned.map(p => `<div class="row">${sw(p.fund)}<div><b>${FUNDS[p.fund].name} · ${wpct(p.w)}</b><span>${p.fear ? esc(p.fear.label) : "Cartera base diversificada"}</span></div></div>`).join("")}</div>` : ""}`, "c-6")}
      ${card(`${cardH("Gemini", "Permitir que Gemini use la información de su cuenta (aportaciones, objetivos y paga) para explicarle su dinero. Nunca se usa para publicidad.", adult ? "" : toggle("gemOk", S.geminiOk, "Permitir Gemini"))}
        <p class="note">Puedes retirar el permiso en cualquier momento.</p>`, "c-6")}
      ${card(`${cardH("Autorización de la cuenta")}<div class="rows"><div class="row"><div><b>${S.familyAuth ? "Cuenta autorizada" : "Pendiente"}</b><span>${S.family ? `${esc(S.family.name)} · ${esc(S.family.relation)}` : ""}</span></div>${badge(S.familyAuth ? "Autorizada" : "Pendiente", S.familyAuth ? "ok" : "warn")}</div></div>`, "c-12")}
    </div>`;
}

/* ---------------- Ajustes */
function vAjustes() {
    const fam = S.role === "family";
    return `${pageH("Ajustes")}
    <div class="grid">
      ${card(`${cardH(fam ? `Cuenta de ${esc(teenName())}` : "Tu perfil")}
        <form class="form two" data-form="profile">
          <label class="field"><span>Nombre</span><input name="name" value="${esc(S.teen?.name || "")}" maxlength="30" required></label>
          <label class="field"><span>Apellidos</span><input name="surname" value="${esc(S.teen?.surname || "")}" maxlength="60"></label>
          <label class="field"><span>Fecha de nacimiento</span><input name="birth" type="date" value="${esc(S.teen?.birth || "")}" required></label>
          <label class="field"><span>Paga semanal (€)</span><input name="paga" type="number" min="0" max="500" value="${S.paga || ""}"></label>
          <button class="btn primary full">Guardar cambios</button></form>`, "c-7")}
      ${card(`${cardH("Cuenta")}${S.family ? `<p class="note">${fam ? "Estás en el área familiar." : "Estás en tu área personal."} En este dispositivo puedes cambiar de área.</p><div class="actions">${btn(`${ic("switch")}${fam ? `Ir al área de ${esc(teenName())}` : "Ir al área familiar"}`, "switchRole")}</div>` : ""}
        <p class="note">Los datos se guardan en este dispositivo.</p><div class="actions">${btn("Cerrar sesión y borrar datos", "reset", "danger")}</div>`, "c-5")}
    </div>${legal()}`;
}

/* ------------------------------------------------------------------ estructura y rutas */
const NAV_T = [["inicio", "Inicio", "home"], ["aprende", "Aprende", "book"], ["dinero", "Dinero", "chart"], ["antidoto", "Antídoto", "spark"], ["casa", "Casa", "house"]];
const NAV_T2 = [["familia", "Familia", "family"], ["ajustes", "Ajustes", "settings"]];
const NAV_F = [["f/resumen", "Resumen", "home"], ["f/regalar", "Regalos", "gift"], ["f/permisos", "Permisos", "key"]];
const NAV_F2 = [["ajustes", "Ajustes", "settings"]];

function shell(route, content) {
    const fam = S.role === "family", main = fam ? NAV_F : NAV_T, extra = fam ? NAV_F2 : NAV_T2;
    const item = ([id, l, i]) => `<a href="#/${id}" class="${route === id ? "on" : ""}" ${route === id ? 'aria-current="page"' : ""}>${ic(i)}<span>${l}</span></a>`;
    const who = (fam ? S.family?.name : teenName()) || "";
    const home = fam ? "#/f/resumen" : "#/inicio";
    const tabs = fam ? [...main, ...extra] : [...main.slice(0, 4), ["familia", "Familia", "family"]];
    return `<div class="shell ${fam ? "fam" : ""}">
      <aside class="side">${brand(home, 34)}${fam ? `<span class="area">Área familiar</span>` : ""}
        <nav class="side-nav" aria-label="Secciones">${main.map(item).join("")}<span class="sep"></span>${extra.map(item).join("")}</nav>
        <a class="me" href="#/ajustes"><span class="avatar">${esc(who.slice(0, 1).toUpperCase())}</span><div><b>${esc(who)}</b><small>${fam ? esc(S.family?.relation || "") : `${ageOf()} años`}</small></div></a></aside>
      <header class="topbar">${brand(home, 28)}${fam ? `<span class="area">Familia</span>` : ""}<a class="avatar" href="#/ajustes" aria-label="Ajustes">${esc(who.slice(0, 1).toUpperCase())}</a></header>
      <main class="main" id="main" tabindex="-1"><div class="page">${content}</div></main>
      <nav class="tabbar" aria-label="Secciones">${tabs.map(item).join("")}</nav>
    </div>`;
}

function render() {
    const raw = location.hash.replace(/^#\/?/, ""), [path, qs] = raw.split("?");
    const parts = path.split("/").filter(Boolean), params = new URLSearchParams(qs || "");
    const r = parts[0] || "";
    if (r !== "tema") lessonState = null;
    if (r !== "prueba") examState = null;
    if (r !== "alta") alta = null;
    if (r !== "juego") gameState = null;
    let html, view = "app";
    if (r === "verificar") { html = vVerificar(params); view = "public"; }
    else if (!S.role) { html = r === "alta" ? vAlta(parts[1] === "familia" ? "familia" : "joven") : vLanding(); view = "public"; }
    else if (r === "tema" && S.role === "teen") { html = vTema(parts[1], parts[2]); view = "focus"; if (!html) { location.hash = "#/aprende"; return; } }
    else if (r === "juego" && S.role === "teen") { html = vJuego(parts[1]); view = "focus"; if (!html) { location.hash = "#/aprende"; return; } }
    else if (r === "prueba" && S.role === "teen") { html = vExamen(); view = "focus"; }
    else {
        let route, content;
        if (S.role === "family") {
            route = r === "f" && ["resumen", "regalar", "permisos"].includes(parts[1]) ? "f/" + parts[1] : r === "ajustes" ? "ajustes" : "f/resumen";
            content = { "f/resumen": vFResumen, "f/regalar": vFRegalar, "f/permisos": vFPermisos, ajustes: vAjustes }[route]();
        } else {
            route = r === "carnet" ? "aprende" : ["inicio", "aprende", "dinero", "antidoto", "casa", "familia", "ajustes"].includes(r) ? r : "inicio";
            content = { inicio: vInicio, aprende: vAprende, dinero: vDinero, antidoto: vAntidoto, casa: vCasa, familia: vFamiliaJoven, ajustes: vAjustes }[route]();
        }
        html = shell(route, content);
    }
    document.body.dataset.view = view;
    $("#app").innerHTML = html;
    bindViz(); bindSim(); bindProj(); bindLanding();
    if (r === "antidoto" && !ranking) loadRanking().then(() => { if (location.hash.startsWith("#/antidoto")) rerender(); });
    const chat = $("#chat"); if (chat) chat.scrollTop = chat.scrollHeight;
}
function rerender() { const y = scrollY; render(); scrollTo(0, y); }

/* ------------------------------------------------------------------ eventos */
function finishTeen() {
    const d = alta.data;
    S = blank(); S.role = "teen";
    S.teen = { name: d.name.trim(), surname: (d.surname || "").trim(), birth: d.birth };
    if (d.fname) { S.family = { name: d.fname.trim(), relation: d.relation }; S.familyAuth = true; }
    S.paga = Math.max(0, Math.round(+d.paga || 0));
    save(); alta = null; location.hash = "#/inicio"; toast(`Te damos la bienvenida a Horizonte, ${esc(S.teen.name)}`);
}
document.addEventListener("click", async e => {
    const b = e.target.closest("[data-act]");
    if (!b || b.tagName === "SELECT" || (b.tagName === "INPUT" && b.type === "checkbox")) return;
    const act = b.dataset.act;
    if (act === "closeSheet") closeSheet();
    else if (act === "altaBack") { alta.step = alta.role === "joven" && alta.step === 2 && ageOf(alta.data.birth) >= RULES.adultAge ? 0 : alta.step - 1; render(); }
    else if (act === "altaSkip") finishTeen();
    else if (act === "lessonAns") { lessonState.answers[+b.dataset.q] = +b.dataset.i; rerender(); }
    else if (act === "lessonDone") { const id = b.dataset.id; if (!S.lessons[id]) { S.lessons[id] = iso(new Date()); save(); toast(`Tema completado · +${MILES.lesson} millas de casa`); } location.hash = "#/aprende"; }
    else if (act === "gameAns") { const q = gameState.qs[gameState.i], i = +b.dataset.i; gameState.ans = i; if (i === q.a) gameState.score++; rerender(); }
    else if (act === "gameNext") {
        const g = gameState;
        if (g.i === g.qs.length - 1) {
            g.over = true; const t = iso(new Date());
            if (!S.games[t]) { const before = miles().total; S.games[t] = { id: g.id, score: g.score }; save(); g.miles = miles().total - before; }
            else if (g.score > S.games[t].score) { S.games[t] = { id: g.id, score: g.score }; save(); }
        } else { g.i++; g.ans = null; }
        render(); scrollTo(0, 0);
    }
    else if (act === "gameAgain") { newGame(b.dataset.id); render(); }
    else if (act === "lpFear") { const f = FEARS.find(x => x.id === b.dataset.id); $$(".lf").forEach(x => x.classList.toggle("on", x === b)); $('[data-o="lf"]').innerHTML = `<b>${FUNDS[f.fund].name}</b><p>${f.why}</p>`; }
    else if (act === "lpGame") {
        const box = b.closest("[data-lpgame]"), y = +box.dataset.y, r = MKT.find(x => x.k === "world").r[y], ok = (+b.dataset.v === 1) === (r >= 0);
        $$(".lg-opts .btn", box).forEach(x => { x.disabled = true; x.classList.toggle("right", (+x.dataset.v === 1) === (r >= 0)); });
        const out = $('[data-o="lg"]', box); out.hidden = false;
        out.innerHTML = `<b>${ok ? "Correcto." : "No."}</b> Fue ${MKT_FROM + y}: la bolsa mundial acabó en ${r >= 0 ? "+" : "−"}${pct(Math.abs(r), 1)}. Y al año siguiente, ${MKT.find(x => x.k === "world").r[y + 1] >= 0 ? "+" : "−"}${pct(Math.abs(MKT.find(x => x.k === "world").r[y + 1]), 1)}. Por eso cuenta el plazo.`;
    }
    else if (act === "openMeta") metaSheet();
    else if (act === "delMeta") { S.metas = S.metas.filter(x => x.id !== b.dataset.id); S.money.forEach(c => { if (c.meta === b.dataset.id) delete c.meta; }); save(); rerender(); }
    else if (act === "goAsk") { location.hash = "#/antidoto"; setTimeout(() => $('.ask input')?.focus(), 80); }
    else if (act === "examAns") { const q = examState.qs[examState.i], i = +b.dataset.i; examState.ans = i; if (i !== q.a) examState.errors++; rerender(); }
    else if (act === "examNext") {
        const x = examState;
        if (x.i === RULES.examSize - 1 || x.errors > RULES.examMaxErrors) {
            x.over = true;
            if (x.errors <= RULES.examMaxErrors) {
                const first = !S.exam?.passed;
                S.exam = { date: iso(new Date()), score: RULES.examSize - x.errors, total: RULES.examSize, passed: true };
                if (first) { S.diploma = { id: makeId(), date: S.exam.date }; save(); addMoney({ amount: RULES.prize, src: "premio" }); }
                save();
            }
        } else { x.i++; x.ans = null; }
        render(); scrollTo(0, 0);
    }
    else if (act === "examRetry") { examState = null; render(); }
    else if (act === "dlDiploma") downloadDiploma();
    else if (act === "copyVerify") { const u = verifyUrl(diplomaData()); try { await navigator.clipboard.writeText(u); toast("Enlace de verificación copiado"); } catch (err) { prompt("Copia el enlace:", u); } }
    else if (act === "itv") { const t = iso(new Date()); if (S.itv.includes(t)) return toast("Ya has hecho la revisión hoy"); S.itv.push(t); save(); toast(`Revisión anual completada · +${MILES.itv} millas de casa`); location.hash = "#/antidoto"; }
    else if (act === "openContribute") contributeSheet();
    else if (act === "setAmount") { const i = $('#sheet input[name="amount"]'); i.value = b.dataset.v; i.focus(); }
    else if (act === "fear") {
        const id = b.dataset.id;
        if (S.fears.includes(id)) S.fears = S.fears.filter(x => x !== id);
        else { if (S.fears.length >= RULES.maxFears) S.fears.shift(); S.fears.push(id); }
        if (!isAdult()) S.antidoteApproved = false;
        save(); if (S.fears.length === RULES.maxFears) vote(S.fears); rerender();
    }
    else if (act === "ask") askQ(b.dataset.q);
    else if (act === "invite") { const t = b.dataset.text; if (navigator.share) { try { await navigator.share({ title: "Horizonte", text: t }); } catch (err) { /* cancelado */ } } else { try { await navigator.clipboard.writeText(t); toast("Invitación copiada. Compártela por WhatsApp o por correo."); } catch (err) { prompt("Copia la invitación:", t); } } }
    else if (act === "cancelSched") { S.schedules.splice(+b.dataset.i, 1); save(); toast("Aportación mensual cancelada"); rerender(); }
    else if (act === "switchRole") { S.role = S.role === "family" ? "teen" : "family"; save(); location.hash = S.role === "family" ? "#/f/resumen" : "#/inicio"; }
    else if (act === "reset") { if (confirm("Se borrarán todos los datos de este dispositivo. ¿Continuar?")) { S = blank(); save(); ranking = null; location.hash = "#/"; render(); } }
});
document.addEventListener("change", e => {
    const t = e.target, act = t.dataset.act;
    if (act === "weekly") { S.weekly = +t.value; save(); toast(S.weekly ? `Apartarás ${eur(S.weekly)} cada semana` : "Ahorro semanal desactivado"); }
    else if (act === "roundup") { S.roundup = t.checked; save(); toast(S.roundup ? "Redondeo activado" : "Redondeo desactivado"); }
    else if (act === "approve") { S.antidoteApproved = t.checked; save(); toast(t.checked ? "Antídoto aprobado" : "Aprobación retirada"); }
    else if (act === "gemOk") { S.geminiOk = t.checked; save(); toast(t.checked ? "Permiso concedido a Gemini" : "Permiso retirado"); }
    else return;
    rerender();
});
document.addEventListener("submit", e => {
    const f = e.target.closest("[data-form]");
    if (!f) return;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f)), k = f.dataset.form;
    if (k === "alta0" || k === "altaF1") {
        const age = ageOf(d.birth);
        if (age < 14) return toast("Horizonte está disponible a partir de los 14 años.");
        Object.assign(alta.data, d);
        alta.step = k === "altaF1" ? 2 : age >= RULES.adultAge ? 2 : 1; render();
    } else if (k === "alta1") { Object.assign(alta.data, d); alta.step = 2; render(); }
    else if (k === "alta2") { alta.data.paga = d.paga; finishTeen(); }
    else if (k === "altaF0") { Object.assign(alta.data, d); alta.step = 1; render(); }
    else if (k === "altaF2") {
        const a = alta.data;
        S = blank(); S.role = "family";
        S.family = { name: a.fname.trim(), relation: a.relation };
        S.teen = { name: a.name.trim(), surname: (a.surname || "").trim(), birth: a.birth };
        S.familyAuth = true;
        save(); alta = null; location.hash = "#/f/resumen"; toast("Cuenta familiar creada");
    } else if (k === "contribute") {
        const amount = Math.round(+d.amount * 100) / 100;
        if (!(amount > 0)) return;
        closeSheet(); addMoney({ amount, src: d.src, ...(d.meta ? { meta: d.meta } : {}) }); rerender();
    } else if (k === "meta") {
        const target = Math.round(+d.target); if (!(target > 0)) return;
        S.metas.push({ id: "m" + Date.now().toString(36), name: d.name.trim(), target }); save(); closeSheet(); toast("Meta creada"); rerender();
    } else if (k === "gift") {
        const amount = Math.round(+d.amount * 100) / 100;
        if (!(amount > 0)) return;
        if (d.type === "mensual") { S.schedules.push({ from: d.from.trim(), amount, since: iso(new Date()) }); addMoney({ amount, src: "mensual", from: d.from.trim(), msg: d.msg || "" }); }
        else addMoney({ amount, src: "regalo", from: d.from.trim(), occasion: d.occasion, msg: d.msg || "" });
        rerender();
    } else if (k === "goal") {
        S.goal = { price: Math.max(30000, +d.price), age: Math.max(ageOf() + 2, +d.age) }; save(); toast("Objetivo guardado"); rerender();
    } else if (k === "profile") {
        S.teen = { name: d.name.trim(), surname: d.surname.trim(), birth: d.birth }; S.paga = Math.max(0, Math.round(+d.paga || 0)); save(); toast("Cambios guardados"); rerender();
    } else if (k === "ask") { askQ(d.q); f.reset(); }
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#sheet.open")) closeSheet(); });
async function askQ(q) {
    if (!q || !q.trim()) return;
    S.chat.push({ r: "u", t: q.trim() });
    const res = await askGemini(q, geminiContext());
    S.chat.push({ r: "g", t: res.answer, used: res.used });
    S.chat = S.chat.slice(-16); save(); rerender();
}
function downloadDiploma() {
    const svg = diplomaSVG(diplomaData()).replace('class="diploma"', 'width="2400" height="1680"');
    const img = new Image(), url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    img.onload = () => {
        const c = document.createElement("canvas"); c.width = 2400; c.height = 1680;
        c.getContext("2d").drawImage(img, 0, 0, 2400, 1680); URL.revokeObjectURL(url);
        c.toBlob(bl => { const a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = "certificado-horizonte.png"; a.click(); });
    };
    img.src = url;
}

window.addEventListener("hashchange", () => {
    if (/^#(ciclo|aprende|primer-ano|antidoto|casa|familias|seguridad|preguntas)$/.test(location.hash)) return;
    closeSheet(); render(); scrollTo(0, 0);
});
render();
