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
const makeId = () => { const a = new Uint32Array(2); crypto.getRandomValues(a); const t = n => n.toString(36).toUpperCase().padStart(5, "0").slice(-5); return "HZ-" + t(a[0]) + "-" + t(a[1]); };
const birthFromAge = a => { const d = new Date(); d.setFullYear(d.getFullYear() - a); return iso(d); };
const shuffle = a => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
/* Las respuestas se barajan en cada intento: la correcta nunca está siempre en el mismo sitio */
const shuffleQ = q => { const idx = shuffle(q.o.map((_, i) => i)); return { ...q, o: idx.map(i => q.o[i]), a: idx.indexOf(q.a) }; };
const homeLearn = () => S.role ? "#/aprende" : "#/probar";

/* ------------------------------------------------------------------ iconos */
const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8" cy="11" r="2.1"/><path d="M5 16.2c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4M14 10h4.5M14 13.5h3"/>',
    chart: '<path d="M4 17l5-5 4 3 7-8"/><path d="M15 7h5v5"/>',
    shield: '<path d="M12 3l7.5 3v6c0 4.6-3.2 8-7.5 9.3C7.7 20 4.5 16.6 4.5 12V6z"/><path d="M9 12.2l2.1 2.1L15.3 10"/>',
    house: '<path d="M3 11 12 4l9 7"/><path d="M5 9.8V20h14V9.8"/><path d="M10 20v-5.5h4V20"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
    up: '<path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/>',
    down: '<path d="M12 5v14M5.5 12.5 12 19l6.5-6.5"/>',
    updown: '<path d="M8 4v14M4.5 7.5 8 4l3.5 3.5M16 20V6M12.5 16.5 16 20l3.5-3.5"/>',
    voice: '<path d="M4 10v4h3l6 4V6L7 10H4z"/><path d="M16.5 9.5a3.5 3.5 0 0 1 0 5M19 7a7 7 0 0 1 0 10"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2v.2h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    chevl: '<path d="m14 6-6 6 6 6"/>',
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
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
};
const ic = (name, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ICONS[name] || ""}</svg>`;

/* ------------------------------------------------------------------ modo día y noche */
const isDark = () => document.documentElement.dataset.theme === "dark";
function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("hz2_theme", t); } catch (e) { /* sin almacenamiento */ }
    $('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#0b1218" : "#ffffff");
    rerender();
}
const themeIcon = () => ic(isDark() ? "sun" : "moon");
const themeLabel = () => isDark() ? "Cambiar a modo día" : "Cambiar a modo noche";
const themeBtn = (cls = "") => `<button class="icon-btn theme-btn ${cls}" data-act="theme" aria-label="${themeLabel()}" title="${themeLabel()}">${themeIcon()}</button>`;

/* ------------------------------------------------------------------ instalar como app (PWA) */
let installEvt = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (location.hash.startsWith("#/ajustes")) rerender(); });
addEventListener("appinstalled", () => { installEvt = null; toast("Horizonte ya está en tu pantalla de inicio"); });
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
function installCard() {
    const body = isStandalone() ? `<p class="note">Ya estás usando Horizonte como app. ${ic("check")}</p>`
        : installEvt ? `<p class="inst-p">Ábrela desde tu pantalla de inicio, a pantalla completa y también sin conexión.</p>${btn(`${ic("download")}Instalar Horizonte`, "installApp", "primary")}`
        : isIOS() ? `<ol class="inst-steps"><li>Abre esta página en <b>Safari</b>.</li><li>Pulsa <b>Compartir</b> (el cuadrado con la flecha hacia arriba).</li><li>Elige <b>Añadir a pantalla de inicio</b>.</li></ol>`
        : `<p class="inst-p">En el móvil, abre esta página con Chrome y pulsa <b>Instalar app</b> en el menú ⋮. En el ordenador, usa el icono de instalar de la barra de direcciones.</p>`;
    return card(`${cardH("Horizonte en tu móvil", "Instálala como una app más, con su icono.")}${body}`, "c-12");
}

/* ------------------------------------------------------------------ estado */
const blank = () => ({ v: 2, role: null, teen: null, family: null, familyAuth: false, paga: 0, weekly: 0, roundup: false,
    lessons: {}, exam: null, diploma: null, itv: [], money: [], schedules: [], fears: [], antidoteApproved: false,
    geminiOk: false, friendsOk: false, friends: null, voted: false, chat: [], goal: { ...GOAL_DEFAULT }, games: {}, metas: [], suit: null, pending: [], callReq: null });
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

/* Lo que preocupa: ideas propuestas o texto libre, traducido a un fondo */
const RANK_IDS = { tecnologia: "ia", inmobiliario: "casa", energia: "clima", inflacion: "precios", salud: "salud", movilidad: "coche" };
const plainTxt = t => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
function classifyFear(text) {
    const t = ` ${plainTxt(text)} `;
    for (const [fund, keys] of FEAR_KEYS) if (keys.some(k => k.trim().length <= 3 ? new RegExp(`(^|\\s)${k.trim()}(\\s|$)`).test(t) : t.includes(" " + k.trim()))) return fund;
    return null;
}
function normFear(x) {
    if (x && typeof x === "object") return x.label ? x : null;
    const f = FEARS.find(y => y.id === x);
    return f ? { id: f.id, label: f.label, fund: f.fund } : null;
}
const fearOf = x => { const f = normFear(x); return f ? { ...f, why: f.fund ? FUND_WHY[f.fund] : "" } : null; };
S.fears = (S.fears || []).map(normFear).filter(Boolean);
function addFear(text) {
    let t = String(text || "").trim().replace(/\s+/g, " ").slice(0, 80);
    if (!S.suit?.ok) return toast("Primero haz el test de seis preguntas");
    if (t.length < 3) return toast("Escribe un poco más");
    if (/(cancer|enfermedad|ansiedad|depres|suicid|diagnost|tumor|\bvih\b|mental|adiccion|droga|embaraz)/.test(plainTxt(t)) && !FEARS.some(f => plainTxt(f.label) === plainTxt(t))) { t = "La salud de mi familia"; toast("Para proteger tu privacidad guardamos solo el tema: «La salud de mi familia»"); }
    if (S.fears.length >= RULES.maxFears) return toast(`Puedes tener ${RULES.maxFears}. Quita una para añadir otra.`);
    if (S.fears.some(f => plainTxt(f.label) === plainTxt(t))) return toast("Ya lo tienes");
    const pre = FEARS.find(f => plainTxt(f.label) === plainTxt(t)), fund = pre?.fund || classifyFear(t);
    S.fears.push({ id: pre?.id || "c" + Date.now().toString(36), label: t, fund });
    if (!isAdult()) S.antidoteApproved = false;
    save();
    if (S.fears.length === RULES.maxFears) vote(S.fears.map(f => RANK_IDS[f.fund]).filter(Boolean));
    toast(fund ? `Añadido · ${FUNDS[fund].name}` : "Añadido. Elige a qué fondo asociarlo.");
    rerender();
}

/* El Antídoto solo se activa si el test de situación lo permite y, si eres menor, tu familia lo aprueba */
function allocation() {
    const fears = S.fears.slice(0, RULES.maxFears).map(fearOf).filter(f => f && f.fund);
    const suitOk = !!S.suit?.ok;
    const active = fears.length > 0 && suitOk && (S.antidoteApproved || isAdult());
    const planned = fears.length ? [{ fund: "global", w: RULES.base }, ...fears.map(f => ({ fund: f.fund, w: RULES.antidote / fears.length, fear: f }))] : [{ fund: "global", w: 1 }];
    const parts = active ? planned : [{ fund: "global", w: 1 }];
    return { active, pending: fears.length > 0 && !active, needSuit: fears.length > 0 && !suitOk, fears, parts, planned };
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
    /* La protección cubre las primeras aportaciones a tu nombre (tuyas o de tu familia), hasta el tope; no los rendimientos */
    const ownAll = S.money.filter(c => c.amount > 0).sort((a, b) => a.date.localeCompare(b.date));
    let protect = null;
    if (ownAll.length) {
        const start = ownAll[0].date, end = iso(addMonths(start, RULES.protectMonths));
        let base = 0;
        ownAll.forEach(c => { if (c.date <= end) base = Math.min(RULES.protectCap, base + c.amount); });
        const daysLeft = Math.ceil((T(end) - Date.now()) / 864e5), lost = S.money.some(c => c.src === "retiro" && c.date <= end);
        protect = { start, end, base, lost, room: daysLeft > 0 && !lost ? RULES.protectCap - base : 0, daysLeft, active: daysLeft > 0 && !lost };
    }
    const monthly = S.weekly * 52 / 12 + S.schedules.reduce((a, x) => a + x.amount, 0);
    const parts = al.parts.map(p => ({ ...p, amount: value * p.w }));
    return { al, r, invested, value, own, gifts, prizes, ownReal: own - prizes, firstOwn, protect, monthly, parts };
}
const cutOf = m => Math.min(MILES.maxCut, m / MILES.perPoint);
const mortgageAmount = () => S.goal.price * (1 - DOWN_PCT);
function payment(P0, ratePct, years) { const r = ratePct / 100 / 12, n = years * 12; return r === 0 ? P0 / n : P0 * r / (1 - Math.pow(1 + r, -n)); }
const mortgageSaving = cut => (payment(mortgageAmount(), MORTGAGE_RATE, MORTGAGE_YEARS) - payment(mortgageAmount(), MORTGAGE_RATE - cut, MORTGAGE_YEARS)) * MORTGAGE_YEARS * 12;
function fv(monthly, years, start = 0, rate = RATE(EST.gross)) { const r = rate / 12; let v = start; for (let i = 0; i < years * 12; i++) v = v * (1 + r) + monthly; return v; }

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
/* Racha: semanas seguidas con algo hecho (un tema, una aportación tuya o la revisión anual). Los juegos no cuentan: no se premia jugar con mercados. */
const weekOf = d => { const x = T(d); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return iso(x); };
const shiftDays = (d, n) => { const x = T(d); x.setDate(x.getDate() + n); return iso(x); };
function streak() {
    const days = [...Object.values(S.lessons), ...S.money.filter(isOwnReal).map(c => c.date), ...S.itv];
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
const STAGES = ["Fundamentos", "Fundamentos superados", "Inversor certificado"];
/* Los dos hitos del certificado: superar Fundamentos y, a los 18, ser inversor certificado */
function milestones() {
    const passed = S.exam?.passed, adult = ageOf() >= RULES.adultAge, done = Object.keys(S.lessons).length;
    return [
        { t: "Fundamentos", sub: passed ? `Superado con ${S.exam.score}/${S.exam.total} el ${fmtD(S.exam.date)}` : `${done} de ${LESSONS.length} temas`, st: passed ? "done" : "on" },
        { t: "Inversor certificado", sub: adult ? "La cuenta es solo tuya" : `A los ${RULES.adultAge} años`, st: passed && adult ? "done" : passed ? "on" : "" },
    ];
}
const msList = (cls) => `<ol class="${cls}">${milestones().map((x, i) => `<li class="${x.st}"><span>${x.st === "done" ? ic("check") : i + 1}</span><div><b>${x.t}</b><small>${x.sub}</small></div></li>`).join("")}</ol>`;
const stageOf = () => !S.exam?.passed ? 0 : ageOf() >= RULES.adultAge ? 2 : 1;
const lastItv = () => S.itv.length ? S.itv[S.itv.length - 1] : S.diploma?.date;

/* Sin permiso de la familia, el asistente responde con información general: ni datos de la cuenta, ni nombre */
function genericContext() {
    return { generic: true, age: 16, value: 0, monthly: 0, goalPrice: GOAL_DEFAULT.price, goalAge: GOAL_DEFAULT.age, down: GOAL_DEFAULT.price * DOWN_PCT,
        miles: 0, cutTxt: pts(0), milesYear: 0, milesAtGoal: 0, cutAtGoalTxt: pts(0), savingAtGoal: 0, fears: [], antidoteActive: false, baseAmount: 0, antidoteAmount: 0,
        protectBase: 0, protectEnd: "", protectRoom: RULES.protectCap, protectCap: RULES.protectCap, paga: 0, weekly: 0, diploma: null, itvDue: null,
        lessonsDone: 0, lessonsTotal: LESSONS.length, prize: RULES.prize, streak: 0, name: "", hasOwn: false, roundup: false, gifts: 0 };
}
const geminiAllowed = () => !!S.geminiOk || isAdult();
const assistantCtx = () => geminiAllowed() ? geminiContext() : genericContext();
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
        name: S.teen?.name || "", hasOwn: !!m.firstOwn, roundup: !!S.roundup, gifts: m.gifts,
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
const legal = () => `<footer class="legal">${ic("info")}<p>${LEGAL} <a href="#/legal">Condiciones y avisos legales</a></p></footer>`;
const brand = (href, h = 38) => `<a class="brand" href="${href}" aria-label="Horizonte"><img class="brand-star" src="brand/horizonte-logo.png" alt="" width="${Math.round(h * 1.46)}" height="${h}"><span class="brand-text"><span class="brand-word">Horizonte</span><small class="brand-sub">CaixaBank Asset Management</small></span></a>`;

function credVisual(big = false, sample = false) {
    const st = sample ? 1 : stageOf();
    const name = sample ? "Tu nombre" : `${S.teen?.name || ""} ${S.teen?.surname || ""}`.trim();
    const code = !sample && S.diploma ? esc(S.diploma.id) : "HZ-····-····";
    return `<div class="cred ${big ? "big" : ""} st${st}">
      <div class="cred-top"><span>CaixaBank Asset Management</span>${sample ? `<img src="brand/horizonte-icono.svg" alt="" width="34" height="28">` : `<em class="cred-st">${S.exam?.passed ? "Obtenido" : "En curso"}</em>`}</div>
      <div class="cred-mid"><small>Certificado</small><b>Horizonte</b></div>
      <div class="cred-name">${esc(name)}</div>
      <div class="cred-stages" aria-label="Etapa: ${STAGES[st]}">${STAGES.map((x, i) => `<i class="${i < st ? "done" : i === st ? "on" : ""}"></i>`).join("")}</div>
      <div class="cred-bottom"><div><small>Etapa</small><b>${STAGES[st]}</b></div><div><small>Código</small><b>${code}</b></div></div>
    </div>`;
}

/* ------------------------------------------------------------------ página de bienvenida */
const HERO_YEARS = 12;
const totalMin = () => Math.round(LESSONS.reduce((a, l) => a + l.min, 0) / 5) * 5;
const trustBar = () => `<p class="hz-sello">${ic("shield")}<span>CaixaBank Asset Management · Gestora de fondos supervisada por la CNMV · Documento de datos fundamentales (DFI) de cada fondo antes de invertir</span></p>`;
function vLanding() {
    const lpYear = 8, lpNews = MKT_NEWS[lpYear];
    return `<div class="lp">
    <header class="lp-nav"><div class="lp-in">${brand("#/")}
      <nav class="lp-links" aria-label="Secciones"><a href="#ciclo">Cómo funciona</a><a href="#aprende">Aprende</a><a href="#antidoto">Antídoto</a><a href="#casa">Tu casa</a><a href="#voz">Tu voz</a><a href="#proyecto">Tu proyecto</a><a href="#familias">Familias</a><a href="#preguntas">Preguntas</a></nav>
      <div class="lp-right">${themeBtn()}${lnk("Crear cuenta", "#/alta/joven", "primary sm")}</div></div></header>

    <section class="hz-hero"><div class="lp-in hz-hero-in">
      <div class="hz-copy">
        <h1>Hoy, tu primer euro.<br>Mañana, <em>tu casa</em>.</h1>
        <p class="hz-lead">Aprende a invertir desde 1 €, con tu familia a tu lado.</p>
        <div class="lp-cta">${lnk(`Soy joven${ic("arrow")}`, "#/alta/joven", "primary lg")}${lnk("Soy madre, padre o tutor", "#/familias", "lg")}</div>
        <p class="hz-try"><a href="#/probar">Prueba un tema y un juego sin crear cuenta</a></p>
        <ul class="hz-trust"><li>${ic("check")}Sin cuotas ni comisión de apertura</li><li>${ic("family")}Con el apoyo de tu familia</li><li>${ic("shield")}Protección promocional el primer año (con condiciones)</li></ul>
        ${trustBar()}
      </div>
      <div class="hz-visual">
        <div class="hz-chart" data-hero>
          <div class="hch-ask"><span>Si apartas al mes</span><div class="hch-chips" role="group" aria-label="Cuánto apartas al mes">${[10, 25, 50, 100].map(v => `<button type="button" class="${v === 25 ? "on" : ""}" data-hero-amt="${v}">${v} €</button>`).join("")}</div></div>
          <div class="hch-scn" role="group" aria-label="Escenario de mercado">${EST.scenarios.map(([r, l]) => `<button type="button" class="${r === EST.gross ? "on" : ""}" data-hero-rate="${r}">${l} · ${r} %</button>`).join("")}</div>
          <div class="hch-big"><b data-o="v"></b><span data-o="sub"></span></div>
          <div class="hch-plot" data-o="plot"></div>
          <div class="hch-key"><span><i class="l1"></i>Lo que pones tú</span><span><i class="l2"></i>Lo que gana tu dinero</span></div>
          <p class="hch-gap" data-o="gap"></p>
          <p class="note">Estimación según el escenario elegido. En un mal escenario tu dinero puede valer menos de lo que has puesto. No es una promesa de rentabilidad.</p>
        </div>
      </div>
    </div></section>

    <section class="lp-sec" id="ciclo"><div class="lp-in">
      <p class="kicker">Cómo funciona</p><h2 class="serif">Un solo ciclo. Cada paso alimenta el siguiente.</h2>
      <ol class="cycle">${CYCLE.map((c, i) => `<li class="${c.id}"><span class="cy-n">${String(i + 1).padStart(2, "0")}</span><span class="cy-ic">${ic(c.ic)}</span><h3>${c.t}</h3><p>${c.p}</p></li>`).join("")}</ol>
      <p class="cycle-foot">${ic("switch")}Cada año, una revisión: lo aprendido y tu plan, al día. Y el ciclo vuelve a empezar.</p>
    </div></section>

    <section class="lp-sec why" id="por-que"><div class="lp-in">
      <div class="why-head"><div><p class="kicker">Por qué Horizonte</p><h2 class="serif">Empezar a invertir con información y con calma.</h2></div>
        <p class="lp-lead">Detrás está CaixaBank Asset Management, la mayor gestora de fondos de España. Y unas ventajas pensadas para quien da sus primeros pasos.</p></div>
      <dl class="why-stats">
        <div><dt>${RULES.prize} €</dt><dd><b>Tu primera inversión</b>Los invertimos a tu nombre cuando superas Fundamentos (uno por persona).</dd></div>
        <div><dt>${RULES.protectCap} €</dt><dd><b>Protección promocional del primer año</b>Si a los ${RULES.protectMonths} meses tus primeras aportaciones valen menos y no has vendido, CaixaBank repone la diferencia hasta ${RULES.protectCap} €. Con tope, dotación limitada y condiciones. <a href="#/legal">Ver condiciones</a></dd></div>
        <div><dt>hasta −${pts(MILES.maxCut)}</dt><dd><b>Puntos en tu primera hipoteca</b>Bonificación posible según las condiciones del día en que la firmes. No es una oferta. <a href="#/legal">Ver condiciones</a></dd></div>
      </dl>
    </div></section>

    <section class="lp-sec alt" id="aprende"><div class="lp-in lp-split">
      <div><p class="kicker">Aprende</p><h2 class="serif">Nadie conduce sin aprender antes. Con el dinero, casi nadie te enseña.</h2>
        <p class="lp-lead"><b>Fundamentos</b>: cinco temas cortos (unos ${totalMin()} minutos en total, de uno en uno), una prueba final y juegos con 25 años de datos reales. Al superarla, CaixaBank invierte ${RULES.prize} € a tu nombre y recibes el <b>Certificado Horizonte</b>, con un código que cualquiera puede comprobar y listo para LinkedIn.</p>
        <p class="hz-try"><a href="#/probar">Probar el primer tema sin crear cuenta</a></p></div>
      <div class="lp-game" data-lpgame data-y="${lpYear}">
        <div class="lg-top"><span>${ic("news")}El titular</span><small>Juego con datos de un año pasado</small></div>
        <blockquote>«${esc(lpNews)}»</blockquote>
        <p>¿La bolsa mundial acabó ese año arriba o abajo?</p>
        <div class="lg-opts"><button class="btn" data-act="lpGame" data-v="1">Arriba</button><button class="btn" data-act="lpGame" data-v="0">Abajo</button></div>
        <div class="lg-out" data-o="lg" hidden></div>
      </div>
    </div></section>

    <section class="hz-dark" id="antidoto"><div class="lp-in anti-grid">
      <div class="anti-l">
        <p class="kicker gold">El Antídoto · opcional</p><h2 class="serif">Una parte pequeña, en lo que te importa.</h2>
        <p class="lp-lead">Si quieres, el ${Math.round(RULES.antidote * 100)} % de tu cartera puede ir a un tema que te preocupa, como la IA o la vivienda. Es una apuesta temática: puede ganar, puede perder y a veces irá en dirección contraria a tu cartera. Por eso es pequeña y solo se activa tras un test breve.</p>
        <ol class="anti-steps">
          <li><span>1</span><div><b>Haces un test de seis preguntas</b><p>Para ver si encaja con tu situación: plazo, experiencia y cómo reaccionas a una caída.</p></div></li>
          <li><span>2</span><div><b>Eliges un tema</b><p>Por ejemplo, la IA o la vivienda. Ves qué riesgo tiene antes de decidir.</p></div></li>
          <li><span>3</span><div><b>El ${Math.round(RULES.antidote * 100)} % va ahí</b><p>El ${Math.round(RULES.base * 100)} % restante va a un fondo global diversificado. Y, si eres menor, tu familia lo aprueba.</p></div></li>
        </ol>
      </div>
      <div class="anti-r">
        <p class="anti-q">¿Qué te preocupa a ti?</p>
        <div class="lp-fears">${FEARS.map((f, i) => `<button class="lf ${i === 0 ? "on" : ""}" data-act="lpFear" data-id="${f.id}"><span>${ic(f.id)}</span>${f.label}</button>`).join("")}</div>
        <div class="lf-out" data-o="lf"><b>${FUNDS[FEARS[0].fund].name}</b><p>${FEARS[0].why}</p></div>
        <p class="hz-small">No es un seguro ni una cobertura: tu dinero puede bajar, incluso cuando lo que temes ocurre. Siempre dentro de una selección cerrada de fondos de CaixaBank AM; consulta el DFI de cada uno.</p>
      </div>
    </div></section>

    <section class="lp-sec" id="casa"><div class="lp-in lp-split">
      <div><p class="kicker gold-ink">Millas de casa</p><h2 class="serif">Tu constancia puede contar el día de tu hipoteca.</h2>
        <p class="lp-lead">Aprender, aportar con constancia y revisar tu plan cada año suma millas. Nunca por tener más dinero que nadie, y los juegos no suman. Si un día pides tu primera hipoteca con CaixaBank, tus millas pueden convertirse en una bonificación de hasta ${pts(MILES.maxCut)} puntos, según las condiciones de ese momento.</p>
        ${lnk("Ver las condiciones", "#/legal", "lg")}</div>
      <ul class="lp-checks"><li><span>${ic("book")}</span><div><b>Se ganan con hábitos</b><small>Temas, aportaciones mensuales, constancia semanal y revisión anual.</small></div></li>
        <li><span>${ic("info")}</span><div><b>No es una oferta ni un precio cerrado</b><small>Depende de las condiciones vigentes el día de la firma. No obliga a contratar nada.</small></div></li>
        <li><span>${ic("house")}</span><div><b>Si no compras casa, no pierdes nada</b><small>Las millas no caducan y tu dinero sigue siendo tuyo.</small></div></li></ul>
    </div></section>

    <section class="lp-sec alt" id="voz"><div class="lp-in lp-split">
      <div><p class="kicker">Tu voz</p><h2 class="serif">Tu dinero también opina.</h2>
        <p class="lp-lead">Cuando inviertes en un fondo, la gestora vota en las juntas de accionistas de las empresas. En Horizonte le dices qué preferirías tú: sueldos de directivos, clima, igualdad, privacidad. Tu opinión se suma a la de otras personas jóvenes.</p>
        ${lnk(`Dar mi opinión${ic("arrow")}`, "#/alta/joven", "primary lg")}</div>
      <div class="lp-vz"><p class="vz-co">${VOZ[0].co} · Junta de accionistas</p><h3>${VOZ[0].t}</h3><p>${VOZ[0].d}</p>
        <div class="vz-btns"><a class="btn vz-c" href="#/alta/joven">${ic("chevl")}En contra</a><a class="btn ghost" href="#/alta/joven">No lo tengo claro</a><a class="btn vz-a" href="#/alta/joven">A favor${ic("chev")}</a></div>
        <small>Propuesta de ejemplo. La opinión es consultiva.</small></div>
    </div></section>

    <section class="lp-sec" id="proyecto"><div class="lp-in lp-split">
      <div><p class="kicker">Tu proyecto</p><h2 class="serif">¿Tienes una idea? Encuentra quién la impulse.</h2>
        <p class="lp-lead">Una app, una marca de ropa, un huerto urbano, un podcast… Cuéntalo en privado y te enseñamos qué empresas asociadas podrían apoyarlo con financiación, mentoría o primeros clientes.</p>
        ${lnk(`Contar mi proyecto${ic("arrow")}`, "#/alta/joven", "primary lg")}</div>
      <ul class="lp-checks"><li><span>${ic("lock")}</span><div><b>Privado por defecto</b><small>Solo lo ves tú hasta que decides contactar con alguien.</small></div></li>
        <li><span>${ic("bulb")}</span><div><b>Encajes a tu medida</b><small>Según el sector, la fase en la que está y lo que necesitas.</small></div></li>
        <li><span>${ic("send")}</span><div><b>Tú decides</b><small>La empresa solo ve el resumen: nunca tu nombre ni tu dinero.</small></div></li></ul>
    </div></section>

    <section class="lp-sec alt" id="familias"><div class="lp-in lp-split">
      <div><p class="kicker">Para familias</p><h2 class="serif">Tú abres la cuenta. Tú tienes el control.</h2>
        <p class="lp-lead">Hasta los 18, la persona titular de la cuenta eres tú: apruebas el Antídoto, las retiradas y los permisos, haces regalos con un mensaje y ves su progreso en euros.</p>
        ${lnk("Soy madre, padre o tutor", "#/familias", "primary lg")}</div>
      <ul class="lp-checks"><li><span>${ic("key")}</span><div><b>Tú decides</b><small>Retiradas, Antídoto, Gemini y amigos necesitan tu aprobación.</small></div></li>
        <li><span>${ic("gift")}</span><div><b>Regalos con mensaje</b><small>Cumpleaños, Navidad o cada mes. También suman millas de casa, con un tope.</small></div></li>
        <li><span>${ic("chart")}</span><div><b>Todo en euros</b><small>Lo que vale su cuenta y lo que cuesta, cada semana.</small></div></li></ul>
    </div></section>

    <section class="lp-sec alt" id="preguntas"><div class="lp-in lp-narrow">
      <p class="kicker">Preguntas frecuentes</p><h2 class="serif">Lo que más nos preguntan.</h2>
      <div class="faq">${FAQ.map(f => `<details><summary>${f.q}${ic("plus")}</summary><p>${f.a}</p></details>`).join("")}</div>
    </div></section>

    <section class="hz-final"><div class="lp-in"><h2 class="serif">Da el primer paso hoy.</h2><p class="hz-lead">Crea tu cuenta en dos minutos. Si eres menor, tu familia la autoriza en otros dos.</p><div class="lp-cta center">${lnk(`Soy joven${ic("arrow")}`, "#/alta/joven", "white lg")}${lnk("Soy madre, padre o tutor", "#/familias", "lg light")}</div></div></section>
    <div class="lp-in lp-foot">${brand("#/", 30)}${legal()}</div>
    </div>`;
}
/* Portada: lo que pones tú y lo que gana tu dinero (neto de comisiones), hasta tu casa */
function heroPlot(m, N, rate) {
    const W = 520, H = 230, ml = 4, mr = 46, mt = 18, mb = 26, S = 4;
    const val = t => fv(m, t, 0, rate / 100), put = t => m * 12 * t, yMax = val(N) * 1.04;
    const X = t => ml + (W - ml - mr) * t / N, Y = v => H - mb - (H - mt - mb) * v / yMax;
    const P = f => Array.from({ length: N * S + 1 }, (_, k) => [X(k / S), Y(f(k / S))]);
    const L = a => a.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const tot = P(val), con = P(put), y0 = Y(0), xs = X(0), xe = X(N), ye = Y(val(N));
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="En ${N} años, lo que pones tú y lo que gana tu dinero">
      <defs><linearGradient id="hgi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7b500"/><stop offset="1" stop-color="#ee7b1f" stop-opacity=".85"/></linearGradient>
        <linearGradient id="hgc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#007eae" stop-opacity=".28"/><stop offset="1" stop-color="#007eae" stop-opacity=".06"/></linearGradient></defs>
      <line x1="${ml}" x2="${xe}" y1="${y0}" y2="${y0}" style="stroke:var(--line-2)" stroke-width="1.2"/>
      <polygon points="${L(con)} ${xe.toFixed(1)},${y0.toFixed(1)} ${xs.toFixed(1)},${y0.toFixed(1)}" fill="url(#hgc)"/>
      <polygon points="${L(tot)} ${L([...con].reverse())}" fill="url(#hgi)"/>
      <polyline points="${L(tot)}" fill="none" stroke="#007eae" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${xs}" cy="${y0}" r="4.5" style="fill:var(--surface)" stroke="#007eae" stroke-width="2"/>
      <circle cx="${xe}" cy="${ye.toFixed(1)}" r="6" fill="#007eae" style="stroke:var(--surface)" stroke-width="2.5"/>
      <text x="${xs}" y="${H - 6}" font-size="13" style="fill:var(--ink-3)">Hoy</text>
      <text x="${xe}" y="${H - 6}" text-anchor="end" font-size="13" style="fill:var(--ink-3)">Dentro de ${N} años</text></svg>`;
}
function bindLanding() {
    const hero = $("[data-hero]");
    if (hero) {
        const yrs = HERO_YEARS, need = GOAL_DEFAULT.price * DOWN_PCT;
        let amt = 25, rate = EST.gross;
        const show = () => {
            const total = fv(amt, yrs, 0, RATE(rate)), perMonth = Math.ceil(need / fv(1, yrs, 0, RATE(rate)) / 5) * 5, label = EST.scenarios.find(x => x[0] === rate)[1].toLowerCase();
            $('[data-o="plot"]', hero).innerHTML = heroPlot(amt, yrs, RATE(rate) * 100);
            $('[data-o="v"]', hero).textContent = eur(total);
            $('[data-o="sub"]', hero).textContent = `en ${yrs} años, en un escenario ${label} (${rate} % anual)`;
            $('[data-o="gap"]', hero).innerHTML = `Una entrada de <b>${eur(need)}</b> en ${yrs} años necesitaría unos <b>${eur(perMonth)} al mes</b>. Con ${eur(amt)} cubrirías el ${pct(total / need * 100)}; el resto puede venir de tu familia, de otros ahorros o de ayudas como el aval del ICO.`;
            $$("[data-hero-amt]", hero).forEach(b => b.classList.toggle("on", +b.dataset.heroAmt === amt));
            $$("[data-hero-rate]", hero).forEach(b => b.classList.toggle("on", +b.dataset.heroRate === rate));
        };
        $$("[data-hero-amt]", hero).forEach(b => b.addEventListener("click", () => { amt = +b.dataset.heroAmt; show(); }));
        $$("[data-hero-rate]", hero).forEach(b => b.addEventListener("click", () => { rate = +b.dataset.heroRate; show(); }));
        show();
    }
}

/* ------------------------------------------------------------------ páginas públicas: probar sin cuenta, familias y condiciones */
const pubTop = (right = lnk("Crear cuenta", "#/alta/joven", "primary sm")) => `<header class="lp-nav"><div class="lp-in">${brand("#/")}<div class="lp-right">${themeBtn()}${right}</div></div></header>`;
const pubBack = () => lnk("Volver", S.role ? "#/ajustes" : "#/", "ghost sm");
function vProbar() {
    const done = Object.keys(S.lessons).length;
    return `<div class="lp">${pubTop()}
    <section class="lp-sec"><div class="lp-in lp-narrow">
      <p class="kicker">Sin cuenta, sin datos</p><h1 class="serif pub-h1">Prueba Horizonte antes de decidir.</h1>
      <p class="lp-lead">Los temas y los juegos funcionan sin registro. Si luego creas tu cuenta, tu progreso se mantiene y cuenta para tus millas.</p>
      <div class="card pub-card">${cardH("Fundamentos", `Cinco temas cortos (unos ${totalMin()} minutos en total). ${done} de ${LESSONS.length} hechos.`)}
        <div class="rows">${LESSONS.map((l, i) => `<a class="row ${S.lessons[l.id] ? "ok" : ""}" href="#/tema/${l.id}/0"><span class="tick num">${S.lessons[l.id] ? ic("check") : i + 1}</span><div><b>${l.title}</b><span>${l.sub} · ${l.min} min</span></div>${ic("chev", "chev")}</a>`).join("")}</div>
        <p class="note">La prueba final, el certificado y tu primera inversión de ${RULES.prize} € necesitan cuenta.</p></div>
      <div class="card pub-card">${cardH("Juegos con datos de años pasados", "Partidas de un minuto. Dan insignias, no dinero ni millas.")}
        <div class="games">${GAMES.map(g => `<a class="game ${g.id}" href="#/juego/${g.id}"><span>${ic(g.id === "titular" ? "news" : g.id === "masomenos" ? "updown" : "chart")}</span><div><b>${g.t}</b><small>${g.p}</small></div>${ic("play", "play")}</a>`).join("")}</div></div>
      <div class="lp-cta">${lnk(`Crear mi cuenta${ic("arrow")}`, "#/alta/joven", "primary lg")}${lnk("Soy madre, padre o tutor", "#/familias", "lg")}</div>
      ${legal()}</div></section></div>`;
}
function vFamilias() {
    const obj = [
        ["¿Y si pierde mi dinero?", `Puede bajar: invertir tiene riesgo. Por eso el curso enseña qué hacer en una caída y la cartera base es un fondo global diversificado. Además, como promoción, CaixaBank repone la diferencia de los primeros ${RULES.protectCap} € aportados si a los ${RULES.protectMonths} meses valen menos y no se ha vendido (con tope y condiciones). Veréis el valor en euros cada semana.`],
        ["¿Quién tiene el control?", "Vosotros. Hasta los 18, la persona titular legal sois vosotros: aprobáis el Antídoto, las retiradas y los permisos (Gemini y amigos) y veis su progreso. Si hay otro progenitor con patria potestad, se le pide también su conformidad."],
        ["¿Qué sacáis vosotros?", `Sin cuotas ni comisión de apertura. Los fondos cobran una comisión de gestión; como referencia, en torno al ${feeTxt} % al año, y el documento de datos fundamentales (DFI) de cada fondo detalla su coste exacto.`],
        ["¿Con 14 años puede invertir?", "La cuenta la abre y la titula su madre, padre o tutor; la persona menor la usa con vuestra autorización. A los 18, pasa a su nombre cuando confirma su identidad."],
        ["¿Se puede sacar el dinero?", "Sí. La persona menor pide la retirada y os llega para aprobarla. Si se retira antes de los 12 meses, se pierde la protección promocional del primer año."],
        ["¿Esto es un casino con adornos?", "No. Los juegos usan datos de años pasados, no dan dinero ni millas (solo insignias) y no hay predicciones semanales ni cuenta atrás. Lo que suma millas es aprender y aportar con constancia."],
        ["¿Y lo de la hipoteca?", `Es una bonificación posible de hasta ${pts(MILES.maxCut)} puntos, sujeta a las condiciones de ese momento, y no os obliga a nada. <a href="#/legal">Ver condiciones</a>.`],
    ];
    return `<div class="lp">${pubTop(lnk("Crear cuenta familiar", "#/alta/familia", "primary sm"))}
    <section class="hz-hero"><div class="lp-in lp-narrow">
      <p class="kicker">Para madres, padres y tutores</p>
      <h1 class="serif pub-h1">Vuestro hijo o hija aprende a invertir, con vosotros al mando.</h1>
      <p class="hz-lead">Y, si un día pide su primera hipoteca con CaixaBank, lo aprendido y su constancia pueden contar.</p>
      <div class="lp-cta">${lnk(`Crear cuenta familiar${ic("arrow")}`, "#/alta/familia", "primary lg")}${lnk("Probar sin cuenta", "#/probar", "lg")}</div>
      ${trustBar()}</div></section>
    <section class="lp-sec alt"><div class="lp-in">
      <p class="kicker">Cómo funciona para vosotros</p><h2 class="serif">Tres pasos y siempre a la vista.</h2>
      <ol class="cycle">
        <li class="aprende"><span class="cy-n">01</span><span class="cy-ic">${ic("family")}</span><h3>Abrís la cuenta</h3><p>Tres pasos: vuestros datos, los de la persona menor y la autorización.</p></li>
        <li class="invierte"><span class="cy-n">02</span><span class="cy-ic">${ic("key")}</span><h3>Decidís</h3><p>Antídoto, retiradas, Gemini y amigos necesitan vuestra aprobación.</p></li>
        <li class="entiende"><span class="cy-n">03</span><span class="cy-ic">${ic("chart")}</span><h3>Lo veis todo</h3><p>Cuánto vale la cuenta, qué ha pasado esta semana y una pregunta para hablarlo en casa.</p></li>
      </ol></div></section>
    <section class="lp-sec"><div class="lp-in lp-narrow">
      <p class="kicker">Las dudas de siempre</p><h2 class="serif">Respuestas claras.</h2>
      <div class="faq">${obj.map(([q, a]) => `<details><summary>${q}${ic("plus")}</summary><p>${a}</p></details>`).join("")}</div>
      <div class="lp-cta">${lnk(`Crear cuenta familiar${ic("arrow")}`, "#/alta/familia", "primary lg")}</div>
    </div></section>
    <div class="lp-in lp-foot">${brand("#/", 30)}${legal()}</div></div>`;
}
function vLegal() {
    const sec = (t, body) => `<section class="lg-sec"><h2>${t}</h2>${body}</section>`;
    return `<div class="lp">${pubTop(pubBack())}
    <section class="lp-sec"><div class="lp-in lp-narrow legal-page">
      <p class="kicker">Condiciones y avisos legales</p><h1 class="serif pub-h1">Lo importante, sin letra pequeña.</h1>
      <p class="lp-lead">Aquí está, en lenguaje claro, lo que conviene saber antes de empezar. Texto de ejemplo del prototipo: los textos definitivos los fijan Cumplimiento y Asesoría Jurídica de CaixaBank AM.</p>
      ${sec("Invertir tiene riesgos", `<p>Puedes recuperar menos de lo que aportas. Las proyecciones que ves son estimaciones en tres escenarios (3, 5 y 8 % anual) y no garantizan nada. En esta versión de demostración, el dinero, las aportaciones y los movimientos de mercado son simulados.</p>`)}
      ${sec("Lo que cuesta", `<p>Horizonte no cobra cuotas ni comisión de apertura. El coste de cada fondo figura en su documento de datos fundamentales (DFI), disponible antes de invertir.</p>`)}
      ${sec("Protección promocional del primer año", `<ul><li>Es una promoción de CaixaBank, no un fondo garantizado ni un seguro.</li><li>Cubre la diferencia si, a los ${RULES.protectMonths} meses de la primera aportación, las primeras aportaciones (tuyas o de tu familia, hasta ${RULES.protectCap} €) valen menos de lo aportado.</li><li>Tope de ${RULES.protectCap} € por persona. No cubre rendimientos ni aportaciones posteriores al tope.</li><li>Solo si no has vendido o retirado antes de los ${RULES.protectMonths} meses.</li><li>Dotación limitada (${PROMO.budgetTxt}): puede agotarse y se publicará su estado.</li></ul>`)}
      ${sec("Millas de casa y bonificación hipotecaria", `<ul><li>Suman: temas de Fundamentos, la prueba final, aportaciones propias cada mes, la constancia semanal, la revisión anual y los regalos de tu familia (con tope mensual).</li><li>No suman: los juegos (dan insignias) ni tener más dinero que nadie.</li><li>Si pides tu primera hipoteca con CaixaBank, las millas pueden convertirse en una bonificación sobre el diferencial de hasta ${pts(MILES.maxCut)} puntos, sobre las condiciones vigentes el día de la firma y según las condiciones de vinculación voluntaria que entonces se ofrezcan.</li><li>No obliga a contratar ningún producto y se rige por la Ley 5/2019. Las cifras de «Tu casa» son ilustraciones, no una oferta.</li><li>Las millas no caducan. Si nunca compras casa, no pierdes nada.</li></ul>`)}
      ${sec("El Antídoto", `<ul><li>Es opcional y pequeño: como máximo el ${Math.round(RULES.antidote * 100)} % de la cartera; el ${Math.round(RULES.base * 100)} % va a un fondo global diversificado.</li><li>Solo se activa tras un test de seis preguntas sobre tu situación y, si eres menor, con la aprobación de tu familia.</li><li>No es un seguro ni una cobertura: los fondos temáticos suelen tener más riesgo y pueden ir en dirección contraria a lo que esperas.</li></ul>`)}
      ${sec("Menores de edad", `<ul><li>Hasta los 18, la persona titular legal es la madre, padre o tutor, que aprueba el Antídoto, las retiradas y los permisos.</li><li>En la versión real, la persona adulta se identifica con su DNI o banca digital y, si hay otro progenitor con patria potestad, también da su conformidad.</li><li>A los 18, la cuenta pasa a tu nombre cuando confirmas tu identidad.</li></ul>`)}
      ${sec("Tus datos, en claro", `<ul><li><b>Qué guardamos:</b> tu nombre o alias, tu edad, tu progreso y tus movimientos. En esta demostración se guardan solo en tu dispositivo.</li><li><b>Qué sale de tu dispositivo:</b> si eliges un Antídoto, solo el tema (nunca texto libre) y un tramo de edad, de forma anónima, para el mapa de preocupaciones. Si activas amigos, tu nombre con la inicial del apellido y tus resultados.</li><li><b>Gemini:</b> sin permiso responde con información general. Con permiso usa los datos de tu cuenta, sin tu nombre. Nunca se usa para publicidad.</li><li>Puedes descargar tus datos o borrarlos en Ajustes cuando quieras.</li></ul><p><b>En una frase para una persona de 14 años:</b> solo usamos lo imprescindible para que la app funcione, no vendemos nada y puedes pedir que lo borremos.</p>`)}
      ${sec("El certificado", `<p>El Certificado Horizonte lleva un código. Quien lo reciba puede comprobarlo en la página de verificación, que consulta nuestro registro y muestra el nombre con la inicial del apellido, la fecha y el resultado. Si el código no existe en el registro, la página no lo da por bueno.</p>`)}
    </div></section><div class="lp-in lp-foot">${brand("#/", 30)}</div></div>`;
}

/* ------------------------------------------------------------------ alta */
let alta = null;
function vAlta(role) {
    if (!alta || alta.role !== role) alta = { role, step: 0, data: {} };
    const a = alta, d = a.data;
    let steps, idx = a.step, body;
    const terms = `<p class="note">Al continuar aceptas las <a href="#/legal" target="_blank" rel="noopener">condiciones y avisos legales</a>.</p>`;
    if (role === "joven") {
        steps = ["Tus datos", "Tu familia"];
        if (a.step === 0) body = `<h1>Crea tu cuenta</h1><p class="sub">Solo dos datos. Nada más por ahora.</p>
          <form data-form="alta0" class="form">
            <label class="field"><span>¿Cómo quieres que te llamemos?</span><input name="name" required maxlength="30" autocomplete="given-name" value="${esc(d.name || "")}"></label>
            <label class="field"><span>¿Cuántos años tienes?</span><input name="age" type="number" inputmode="numeric" min="5" max="40" required value="${esc(d.age ?? "")}"></label>
            <button class="btn primary lg block">Continuar</button>${terms}
            <p class="note">Si tienes menos de 18, en el siguiente paso tu madre, padre o tutor completa la autorización.</p></form>`;
        else body = `<h1>Autorización de tu familia</h1><p class="sub">Como eres menor de edad, tu madre, padre o tutor legal tiene que abrir y autorizar la cuenta. Pasadle el móvil: son dos minutos.</p>
          <form data-form="alta1" class="form">
            <label class="field"><span>Nombre de la persona que autoriza</span><input name="fname" required maxlength="40" autocomplete="name" value="${esc(d.fname || "")}"></label>
            <label class="field"><span>Su correo electrónico</span><input name="femail" type="email" required maxlength="80" autocomplete="email" value="${esc(d.femail || "")}"></label>
            <label class="field"><span>Relación</span><select name="relation">${["Madre", "Padre", "Tutor o tutora legal"].map(r => `<option ${d.relation === r ? "selected" : ""}>${r}</option>`).join("")}</select></label>
            <label class="field"><span>Fecha de nacimiento de ${esc(d.name || "la persona menor")}</span><input name="birth" type="date" required value="${esc(d.birth || "")}"></label>
            <label class="check"><input type="checkbox" name="ok" required><span>Soy su madre, padre o tutor legal, autorizo la apertura de la cuenta y entiendo que invertir conlleva riesgos, incluida la pérdida de parte del dinero.</span></label>
            <button class="btn primary lg block">Autorizar y entrar en Horizonte</button>
            <p class="note">En la versión real, recibirás un correo y confirmarás tu identidad (DNI o banca digital). Si hay otro progenitor con patria potestad, también se le pedirá su conformidad. Esto es una demostración.</p></form>`;
    } else {
        steps = ["Tus datos", "Su cuenta", "Autorización"];
        if (a.step === 0) body = `<h1>Crea tu cuenta familiar</h1><p class="sub">Podrás hacer regalos, aprobar decisiones y ver su progreso.</p>
          <form data-form="altaF0" class="form">
            <label class="field"><span>Tu nombre</span><input name="fname" required maxlength="40" autocomplete="given-name" value="${esc(d.fname || "")}"></label>
            <label class="field"><span>Tu correo electrónico</span><input name="femail" type="email" required maxlength="80" autocomplete="email" value="${esc(d.femail || "")}"></label>
            <label class="field"><span>Relación</span><select name="relation">${["Madre", "Padre", "Tutor o tutora legal", "Abuela", "Abuelo", "Tía", "Tío"].map(r => `<option ${d.relation === r ? "selected" : ""}>${r}</option>`).join("")}</select></label>
            <button class="btn primary lg block">Continuar</button>${terms}</form>`;
        else if (a.step === 1) body = `<h1>¿Para quién es la cuenta?</h1><p class="sub">La persona menor podrá cambiar su alias cuando entre.</p>
          <form data-form="altaF1" class="form">
            <label class="field"><span>Nombre o alias</span><input name="name" required maxlength="30" value="${esc(d.name || "")}"></label>
            <label class="field"><span>Fecha de nacimiento</span><input name="birth" type="date" required value="${esc(d.birth || "")}"></label>
            <button class="btn primary lg block">Continuar</button></form>`;
        else body = `<h1>Autorización</h1><p class="sub">Hasta los 18, la madre, el padre o el tutor legal es la persona titular y aprueba las decisiones importantes de la cuenta.</p>
          <form data-form="altaF2" class="form">
            <label class="check"><input type="checkbox" name="ok" required><span>${/Madre|Padre|Tutor/.test(d.relation || "") ? "Soy su madre, padre o tutor legal y autorizo la apertura de su cuenta." : "Su madre, padre o tutor legal ha autorizado la apertura de su cuenta."} Entiendo que invertir conlleva riesgos, incluida la pérdida de parte del dinero.</span></label>
            <button class="btn primary lg block">Crear cuenta</button>
            <p class="note">En la versión real, confirmarás tu identidad (DNI o banca digital). Esto es una demostración.</p></form>`;
    }
    return `<div class="auth">
      <header class="auth-top">${brand("#/", 32)}${a.step ? btn(`${ic("back")}Atrás`, "altaBack", "ghost sm") : lnk("Cancelar", "#/", "ghost sm")}</header>
      <main class="auth-card">
        <ol class="auth-steps">${steps.map((s, i) => `<li class="${i < idx ? "done" : i === idx ? "on" : ""}"><span>${i < idx ? ic("check") : i + 1}</span>${s}</li>`).join("")}</ol>
        ${body}
        <p class="auth-foot">${ic("lock")}Tus datos solo se usan para gestionar tu cuenta. <a href="#/legal" target="_blank" rel="noopener">Cómo los tratamos</a></p>
      </main></div>`;
}

/* ------------------------------------------------------------------ área del joven */
function moveRow(c) {
    const label = SOURCES[c.src].label + (c.from ? ` · ${esc(c.from)}` : "");
    return `<div class="row"><span class="mv-ic ${isGift(c) ? "gift" : "own"}">${ic(isGift(c) ? "gift" : c.src === "premio" ? "card" : c.src === "retiro" ? "back" : "plus")}</span><div><b>${label}</b><span>${fmtD(c.date)}${c.msg ? ` · «${esc(c.msg)}»` : ""}</span></div><b class="amt">${c.amount < 0 ? "−" : "+"}${eur(Math.abs(c.amount), c.amount % 1 !== 0)}</b></div>`;
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
        ? (retPct < 0 ? "Una semana mala es normal y no dice nada de un plazo de diez años. Una caída solo se convierte en pérdida si vendes; decidid con calma, no por una semana." : "Una semana buena tampoco cambia el plan: lo que cuenta es la constancia.")
        : "Una semana tranquila. Lo que cuenta es el plazo y la constancia.");
    if (m.protect?.active && retPct < 0) lines.push(`Además, tus ${eur(m.protect.base)} siguen con protección promocional ${m.protect.daysLeft} días más (con condiciones).`);
    return { lines, parts, mv, chg, retPct };
}
function weekCard(cls = "c-12") {
    const w = weekSummary(), can = geminiAllowed();
    return card(`${cardH(`<span class="gem">${ic("spark")}Tu dinero hoy</span> ${badge("Simulación", "warn")}`, `Semana del ${fmtD(weekOf(new Date()))}`, btn(can ? "Pregúntale a Gemini" : "Pregunta al asistente", "goAsk", "sm"))}
      <div class="week">${w.lines.map(l => `<p>${l}</p>`).join("")}</div>
      <div class="week-funds">${(w.parts.length ? w.parts : [{ fund: "global" }]).map(p => `<div>${sw(p.fund)}<span>${FUNDS[p.fund].name}</span><b class="${w.mv[p.fund] >= 0 ? "up" : "down"}">${w.mv[p.fund] >= 0 ? "+" : "−"}${pct(Math.abs(w.mv[p.fund]), 1)}</b></div>`).join("")}</div>
      <p class="note">Movimientos inventados para esta demostración: no son datos reales de ningún fondo.</p>`, cls);
}

/* ------------------------------------------------------------------ inicio */
/* Una frase corta que cambia según el momento en el que está la persona */
function greeting() {
    const m = money(), done = Object.keys(S.lessons).length, st = streak(), h = new Date().getHours();
    const hi = h < 6 ? "Buenas noches" : h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
    const sub = !done ? "Te damos la bienvenida. Empieza aprendiendo para conseguir tu certificado."
        : !S.exam?.passed && done < LESSONS.length ? `Llevas ${done} de ${LESSONS.length} temas. Tu certificado está cerca.`
        : !S.exam?.passed ? "Solo te queda la prueba final."
        : !m.firstOwn ? "Ya tienes tu certificado. Ahora, tu primer euro."
        : !S.suit ? "Siguiente paso: haz el test de seis preguntas y, si quieres, elige un Antídoto."
        : !(S.weekly > 0 || S.roundup) ? "Automatiza tu ahorro y olvídate."
        : !st.thisWeek ? "Haz algo esta semana para no perder tu racha."
        : st.current >= 2 ? `${st.current} semanas seguidas. Así se llega a casa.`
        : "Todo en marcha. Sigue así.";
    return { hi, sub };
}
function credChip() {
    const st = stageOf();
    return `<button class="cred-chip st${st}" data-act="openCred" aria-label="Tu Certificado Horizonte: ${STAGES[st]}${S.exam?.passed ? ", obtenido" : ", en curso"}">
      <span class="cc-top"><img src="brand/horizonte-icono.svg" alt="" width="18" height="15"><small>${S.exam?.passed ? "Obtenido" : "En curso"}</small></span>
      <b>Certificado</b><span class="cc-st">${STAGES[st]}</span>
      <span class="cc-bars">${STAGES.map((x, i) => `<i class="${i < st ? "done" : i === st ? "on" : ""}"></i>`).join("")}</span></button>`;
}
/* Ficha del certificado, al estilo de los certificados de cursos en línea: el diploma y, al lado, quién, cuándo, qué y cómo verificarlo */
function credSheet() {
    const st = stageOf(), passed = S.exam?.passed && S.diploma, done = Object.keys(S.lessons).length, age = ageOf(), m = money();
    const name = `${S.teen?.name || ""} ${S.teen?.surname || ""}`.trim();
    const d = passed ? diplomaData() : { n: name, i: "HZ-····-····", f: iso(new Date()), s: "—", v: iso(addMonths(new Date(), 12)) };
    const el = $("#sheet");
    el.innerHTML = `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet-card cert-sheet" role="dialog" aria-modal="true" aria-labelledby="sheetT">
      <button class="icon-btn cs-close" data-act="closeSheet" aria-label="Cerrar">${ic("close")}</button>
      <div class="cs-grid">
        <div class="cs-dip ${passed ? "" : "pending"}">${diplomaSVG(d)}${passed ? "" : `<span class="cs-stamp">En curso</span>`}</div>
        <div class="cs-info">
          ${badge(passed ? `${ic("check")}Certificado obtenido` : "En curso", passed ? "ok" : "")}
          <h2 id="sheetT">Certificado Horizonte</h2><p class="cs-sub">Fundamentos de inversión · CaixaBank Asset Management</p>
          <dl class="cs-facts">
            <div><dt>${passed ? "Completado por" : "A nombre de"}</dt><dd>${esc(name)}</dd></div>
            ${passed ? `<div><dt>Fecha</dt><dd>${fmtD(d.f)}</dd></div><div><dt>Resultado</dt><dd>${esc(d.s)}</dd></div><div><dt>Código</dt><dd>${esc(d.i)}</dd></div><div><dt>Próxima revisión</dt><dd>${fmtD(d.v)}</dd></div>`
              : `<div><dt>Progreso</dt><dd>${done} de ${LESSONS.length} temas</dd></div><div><dt>Duración</dt><dd>Unos ${LESSONS.reduce((a, l) => a + l.min, 0)} minutos</dd></div>`}
          </dl>
          ${passed ? `<p class="note">${S.diploma.reg ? "Registrado: cualquiera puede comprobar tu código en la página de verificación." : "Pendiente de registrar para su verificación (necesita conexión). Se reintenta solo."}${S.teen?.surname ? "" : ` Si quieres que aparezcan tus apellidos, añádelos en <a href="#/ajustes">Ajustes</a>.`}</p>` : bar(done, LESSONS.length + 1, "blue")}
          <h3 class="cs-h">Etapas</h3>
          ${msList("cs-stages")}
          <h3 class="cs-h">${passed ? `Has superado · prueba final ${esc(d.s)}` : "Lo que aprenderás"}</h3>
          <div class="cs-skills">${LESSONS.map(l => `<span class="${S.lessons[l.id] ? "ok" : ""}">${S.lessons[l.id] ? ic("check") : ""}${l.title}</span>`).join("")}</div>
          <div class="cs-acts">${passed
            ? `${age >= RULES.linkedinAge ? `<a class="btn primary sm" href="${esc(linkedinUrl(d))}" target="_blank" rel="noopener">${ic("plus")}Añadir a LinkedIn</a>` : `<button class="btn sm" disabled>LinkedIn a partir de los ${RULES.linkedinAge}</button>`}${btn(`${ic("send")}Compartir`, "shareCert", "sm")}${btn(`${ic("download")}Descargar`, "dlDiploma", "sm")}${btn(`${ic("link")}Copiar enlace`, "copyVerify", "sm ghost")}`
            : lnk(done >= LESSONS.length ? "Hacer la prueba final" : done ? "Continuar Fundamentos" : "Empezar Fundamentos", done >= LESSONS.length ? "#/prueba" : "#/aprende", "primary")}</div>
        </div>
      </div></div>`;
    el.classList.add("open");
}
function vInicio() {
    const m = money(), mi = miles(), st = streak(), g = greeting();
    const steps = [
        ["aprende", "Aprende", S.exam?.passed, S.exam?.passed ? "Certificado" : `${Object.keys(S.lessons).length} de ${LESSONS.length} temas`, "#/aprende"],
        ["invierte", "Invierte", !!m.firstOwn, m.firstOwn ? eur(m.value, true) : "Tu primer euro", "#/dinero"],
        ["entiende", "Anticípate", !!S.suit, S.fears.length ? (m.al.active ? "Antídoto activo" : "Antídoto pendiente") : S.suit ? "Test hecho" : "Test y Antídoto", "#/antidoto"],
        ["millas", "Gana millas", st.current >= 4, `${num(mi.total)} millas`, "#/casa"],
        ["casa", "Tu casa", false, `−${pts(mi.cut)} puntos`, "#/casa"],
    ];
    const cur = steps.findIndex(x => !x[2]);
    const tasks = [
        [!!S.exam?.passed, "Supera Fundamentos", `Cinco temas y una prueba. Primera inversión: ${RULES.prize} € a tu nombre.`, "#/aprende"],
        [!!m.firstOwn, "Pon tu primer euro", "Con 1 € basta. Es el paso que te convierte en inversor.", "#/dinero"],
        [!!S.suit, "Haz el test y, si quieres, elige un Antídoto", "Seis preguntas sobre tu situación. El Antídoto es opcional y pequeño.", "#/antidoto"],
        [S.weekly > 0 || S.roundup, "Automatiza tu ahorro", "Una cantidad fija cada semana, sin acordarte.", "#/dinero"],
        [!!S.family || m.gifts > 0, "Invita a tu familia", "Pueden regalarte dinero para tu casa.", "#/familia"],
    ];
    const done = tasks.filter(t => t[0]).length, recent = [...S.money].reverse().slice(0, 4), has = S.money.length > 0;
    const w = weekSummary(), can = geminiAllowed(), sg = v => `${v >= 0 ? "+" : "−"}${pct(Math.abs(v), 1)}`;
    const next = tasks.find(t => !t[0]);
    return `<header class="page-h home-h"><div><h1>${g.hi}, ${esc(teenName())}</h1><p>${g.sub}</p></div>${credChip()}</header>
    <div class="home">
      <ol class="hsteps">${steps.map(([id, t, ok, sub, h], i) => `<li class="${ok ? "done" : i === cur ? "on" : ""}"><a href="${h}"><span class="hs-dot">${ok ? ic("check") : ""}</span><b>${t}</b><small>${sub}</small></a></li>`).join("")}</ol>

      <section class="h-hero">
        <div class="h-money"><div class="vhead sm" data-vhead><div class="vh-main"><span class="vh-k">Tu dinero</span><b class="vh-v" data-o="val">${eur(m.value, true)}</b>
            ${has ? `<p class="vh-chg"><span data-o="chg"></span> <small data-o="when"></small></p>` : `<p class="vh-chg"><small>Aún no has invertido</small></p>`}</div></div>
          ${has ? `<a href="#/dinero" class="vchart mini" data-vchart data-range="1M" aria-label="Ver tu dinero"></a>` : `<div class="mini-empty"></div>`}
          <div class="h-acts">${btn(`${ic("plus")}Aportar`, "openContribute", "primary sm")}${lnk(`Ver detalle${ic("arrow")}`, "#/dinero", "ghost sm")}</div></div>
        <div class="h-week"><span class="h-k">${ic("spark")}Tu dinero hoy · semana del ${fmtD(weekOf(new Date()))} ${badge("Simulación", "warn")}</span>
          ${w.lines.map(l => `<p>${l}</p>`).join("")}
          <p class="h-funds">${(w.parts.length ? w.parts : [{ fund: "global" }]).map(p => `<span>${sw(p.fund)}${FUNDS[p.fund].name} <b class="${w.mv[p.fund] >= 0 ? "up" : "down"}">${sg(w.mv[p.fund])}</b></span>`).join("")}</p>
          <button class="h-link" data-act="goAsk">${can ? "Pregúntale a Gemini" : "Pregunta al asistente"}${ic("arrow")}</button></div>
      </section>

      <dl class="h-stats">
        <div><dt>Millas de casa</dt><dd>${num(mi.total)}</dd><small>${pts(mi.cut)} puntos de bonificación posible</small></div>
        <div><dt>Racha</dt><dd>${st.current} <span>${st.current === 1 ? "semana" : "semanas"}</span></dd><small>${st.thisWeek ? "Esta semana ya cuenta" : "Haz algo esta semana"}</small></div>
        <div><dt>Con protección el primer año</dt><dd>${eur(m.protect?.active ? m.protect.base : 0)} <span>de ${RULES.protectCap} €</span></dd><small>${m.protect?.active ? `${m.protect.daysLeft} días restantes` : m.protect?.lost ? "Retiraste antes de los 12 meses" : m.protect ? "Periodo terminado" : "Empieza con tu primera aportación"}</small></div>
      </dl>

      <section class="h-cols">
        ${done < tasks.length ? `<div><h2 class="h-h">Primeros pasos <small>${done} de ${tasks.length}</small></h2>
          <div class="h-list">${tasks.map(([ok, t, d, h]) => `<a class="h-item ${ok ? "ok" : ""} ${t === next?.[1] ? "next" : ""}" href="${h}"><span class="h-tick">${ok ? ic("check") : ""}</span><div><b>${t}</b><span>${d}</span></div>${ic("chev", "chev")}</a>`).join("")}</div></div>` : ""}
        <div><h2 class="h-h">Actividad reciente ${recent.length ? `<a href="#/dinero">Ver todo</a>` : ""}</h2>
          ${recent.length ? `<div class="h-list">${recent.map(c => `<div class="h-item"><span class="h-tick ${isGift(c) ? "gift" : "own"}">${ic(isGift(c) ? "gift" : c.src === "premio" ? "card" : c.src === "retiro" ? "back" : "plus")}</span><div><b>${SOURCES[c.src].label}${c.from ? ` · ${esc(c.from)}` : ""}</b><span>${fmtD(c.date)}</span></div><b class="amt">${c.amount < 0 ? "−" : "+"}${eur(Math.abs(c.amount), c.amount % 1 !== 0)}</b></div>`).join("")}</div>`
            : `<p class="h-none">Tus aportaciones y los regalos de tu familia aparecerán aquí.</p>`}</div>
      </section>
    </div>`;
}

/* ---------------- Aprende: Fundamentos, juegos y Certificado Horizonte */
function diplomaData() {
    return { n: `${S.teen.name} ${S.teen.surname || ""}`.trim(), i: S.diploma.id, f: S.diploma.date, s: `${S.exam.score}/${S.exam.total}`, v: iso(addMonths(lastItv(), 12)) };
}
const verifyUrl = d => `${location.origin}${location.pathname}#/verificar?c=${encodeURIComponent(d.i)}`;
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
    const today = iso(new Date()), played = S.games[today];
    let dip = "";
    if (passed && S.diploma) {
        const d = diplomaData(), revOpen = (T(d.v) - Date.now()) / 864e5 < 31;
        dip = card(`${cardH("Revisión anual", `Cada año repasas lo esencial y pones al día tus preocupaciones y tu Antídoto. Próxima antes del ${fmtD(d.v)}.`)}
            <p class="note">${S.itv.length ? `Última revisión: ${fmtD(lastItv())}. ` : ""}Cada revisión suma ${MILES.itv} millas de casa.</p><div class="actions">${btn("Hacer la revisión", "itv", revOpen ? "primary" : "")}</div>`, "c-12");
    }
    return `${pageH("Aprende", "Lo esencial para invertir con criterio. Cada paso suma millas de casa.")}
    <div class="grid">
      ${card(`<div class="cred-hero"><button class="cred-btn" data-act="openCred" aria-label="Ver tu certificado">${credVisual(true)}<span class="cred-cta">${S.exam?.passed ? "Ver certificado" : "Ver progreso"}${ic("arrow")}</span></button>${msList("stages")}</div>`, "c-12")}
      ${card(`${cardH("Fundamentos", `Cinco temas cortos (unos ${totalMin()} minutos en total). Cada tema suma ${MILES.lesson} millas de casa.`, `<span class="count">${done}/${LESSONS.length}</span>`)}
        <div class="rows">${LESSONS.map((l, i) => `<a class="row ${S.lessons[l.id] ? "ok" : ""}" href="#/tema/${l.id}/0"><span class="tick num">${S.lessons[l.id] ? ic("check") : i + 1}</span><div><b>${l.title}</b><span>${l.sub} · ${l.min} min</span></div>${ic("chev", "chev")}</a>`).join("")}</div>
        <div class="exam"><span class="mv-ic own">${ic("star")}</span><div><b>Prueba final</b><span>${passed ? `Superada el ${fmtD(S.exam.date)}.` : all ? `${RULES.examSize} preguntas; puedes fallar ${RULES.examMaxErrors}. Al superarla, CaixaBank invierte ${RULES.prize} € a tu nombre.` : `Disponible al completar los ${LESSONS.length} temas.`}</span></div>
          ${all || passed ? lnk(passed ? "Repetir" : "Empezar", "#/prueba", passed ? "" : "primary") : `<button class="btn" disabled>Empezar</button>`}</div>`, "c-7")}
      ${card(`${cardH("Juegos con datos de años pasados", "Partidas de un minuto, sin prisas. Dan insignias, no millas ni dinero.", played ? badge(`${ic("check")}Hoy: ${played.score}/${GAMES.find(g => g.id === played.id)?.rounds}`, "ok") : "")}
        <div class="games">${GAMES.map(g => `<a class="game ${g.id}" href="#/juego/${g.id}"><span>${ic(g.id === "titular" ? "news" : g.id === "masomenos" ? "updown" : g.id === "liga" ? "trophy" : "chart")}</span><div><b>${g.t}</b><small>${g.p}</small></div>${ic("play", "play")}</a>`).join("")}</div>
        ${badgesRow()}
        <button class="h-link fr-jump" data-act="frJump">${ic("family")}Compara tus resultados con tus amigos${ic("arrow")}</button>
        <p class="note">Datos anuales aproximados entre ${MKT_FROM} y ${MKT_FROM + MKT[0].r.length - 1}. Rentabilidades pasadas no garantizan las futuras.</p>`, "c-5")}
      ${friendsCard()}
      ${dip}
    </div>`;
}

/* ---------------- Juegos */
function badgeStats() { const g = Object.values(S.games); return { days: g.length, perfect: g.some(x => { const gm = GAMES.find(y => y.id === x.id); return gm && gm.rounds && x.score >= gm.rounds; }), mm: S.mmBest || 0 }; }
const badgesRow = () => { const n = badgeStats(); return `<div class="badges" aria-label="Insignias">${BADGES.map(b => { const ok = b.test(n); return `<span class="bdg ${ok ? "on" : ""}" title="${esc(b.d)}">${ic(ok ? "star" : "lock")}${b.t}</span>`; }).join("")}</div>`; };
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
    if (id === "masomenos") return vMasMenos();
    if (!gameState || gameState.id !== id) newGame(id);
    const e = gameState;
    if (e.over) {
        return focus(homeLearn(), 0, 0, `<div class="center"><div class="result ok">${ic("star")}</div>
          <h1>${e.score} de ${e.qs.length}</h1>
          <p>${e.score >= 4 ? "Tienes buen olfato. Pero recuerda: nadie acierta siempre, por eso se diversifica." : e.score >= 2 ? "Ni tan mal. Acertar el mercado año a año es casi imposible, por eso cuenta el plazo." : "Si cuesta acertar con el resultado delante, imagina sin él. Por eso se invierte a largo plazo."}${e.miles ? ` <b>+${e.miles} millas de casa.</b>` : ""}</p>
          ${friendsToday(id)}<div class="focus-nav center">${btn("Otra partida", "gameAgain", "primary lg", `data-id="${id}"`)}${lnk("Volver", homeLearn(), "lg") + (S.role ? "" : lnk("Crear mi cuenta", "#/alta/joven", "primary lg"))}</div></div>`);
    }
    const q = e.qs[e.i];
    return focus(homeLearn(), e.i + 1, e.qs.length, `<span class="kicker">${q.kick} · ${e.score} aciertos</span><h1 class="${id === "titular" ? "serif-q" : ""}">${esc(q.q)}</h1>${q.sub ? `<p class="lead-q">${q.sub}</p>` : ""}${opts(q, e.ans, "gameAns")}
      ${e.ans !== null ? `${why(e.ans === q.a, q.why)}<div class="focus-nav"><span></span>${btn(e.i === e.qs.length - 1 ? "Ver resultado" : `Siguiente${ic("arrow")}`, "gameNext", "primary")}</div>` : ""}`);
}

/* ---------------- Más o menos (de la versión 1): ¿la nueva carta acaba con más o con menos que la anterior? */
let mm = null, mmTimer = null;
function mmItem(prev) {
    for (let tries = 0; tries < 60; tries++) {
        let it;
        if (Math.random() < .2) it = { ...MM_CONCEPTS[Math.floor(Math.random() * MM_CONCEPTS.length)] };
        else {
            const c = MKT[Math.floor(Math.random() * MKT.length)], len = [1, 3, 5, 10][Math.floor(Math.random() * 4)], from = Math.floor(Math.random() * (c.r.length - len + 1));
            const v = 1000 * c.r.slice(from, from + len).reduce((a, r) => a * (1 + r / 100), 1);
            it = { code: c.code, color: c.color, t: c.name, s: `1.000 € ${len === 1 ? `durante ${MKT_FROM + from}` : `de ${MKT_FROM + from} a ${MKT_FROM + from + len - 1}`} · ${c.sub}`, v };
        }
        if (!prev || (Math.abs(it.v / prev.v - 1) > .04 && it.t + it.s !== prev.t + prev.s)) return it;
    }
}
function mmNew() { clearInterval(mmTimer); const a = mmItem(); mm = { a, b: mmItem(a), streak: 0, phase: "play", busy: false, timeout: false, res: null }; }
const mmVal = v => eur(Math.round(v));
function mmCard(it, hidden, cls = "") {
    return `<div class="mm-card ${cls}"><span class="mm-code" style="--c:${it.color || "var(--ink-3)"}">${it.code}</span><div><b>${esc(it.t)}</b><small>${esc(it.s)}</small></div><output>${hidden ? "¿?" : mmVal(it.v)}</output></div>`;
}
function vMasMenos() {
    if (!mm) mmNew();
    const best = S.mmBest || 0;
    if (mm.phase === "over") {
        return focus(homeLearn(), 0, 0, `<div class="center"><span class="kicker">Fin de la racha</span><h1 class="mm-big">${mm.streak}</h1>
          <p>${mm.streak > 0 && mm.streak >= best ? "¡Nuevo récord personal!" : `Tu récord: ${best}`}</p>
          <p class="mm-learn">Lo que cuenta no es acertar cada año: es el plazo. En diez años, casi todas las inversiones diversificadas acaban por encima de un cajón.</p>
          ${friendsToday("masomenos")}<div class="focus-nav center">${btn("Otra partida", "mmAgain", "primary lg")}${lnk("Volver", homeLearn(), "lg") + (S.role ? "" : lnk("Crear mi cuenta", "#/alta/joven", "primary lg"))}</div></div>`);
    }
    const res = mm.res;
    return focus(homeLearn(), 0, 0, `<div class="mm">
        <div class="mm-top"><span>Racha <b>${mm.streak}</b></span><span>Récord ${best}</span></div>
        ${mmCard(mm.a, false)}
        <p class="mm-q">¿Esta acaba con <b>más</b> o con <b>menos</b>?</p>
        ${mmCard(mm.b, !res, res ? (res === "ok" ? "ok" : "ko") : "")}
        <div class="mm-btns">${btn(`${ic("up")}Más`, "mmGuess", "mm-up", `data-v="up" ${mm.busy ? "disabled" : ""}`)}${btn(`${ic("down")}Menos`, "mmGuess", "mm-down", `data-v="down" ${mm.busy ? "disabled" : ""}`)}</div>
        <p class="note center-note">Rentabilidades anuales aproximadas en moneda local, sin comisiones. Las de interés fijo son hipotéticas.</p></div>`);
}
function mmStart() { clearInterval(mmTimer); }                       // sin cuenta atrás: aquí se piensa, no se corre
function mmGuess(dir) {
    if (!mm || mm.busy || mm.phase !== "play") return;
    mmReveal(dir === "up" ? mm.b.v > mm.a.v : mm.b.v < mm.a.v);
}
function mmReveal(ok) {
    clearInterval(mmTimer); mm.busy = true; mm.res = ok ? "ok" : "ko"; render();
    setTimeout(() => {
        mm.busy = false; mm.res = null;
        if (ok) { mm.streak++; mm.a = mm.b; mm.b = mmItem(mm.a); if (mm.streak > (S.mmBest || 0)) { S.mmBest = mm.streak; save(); } }
        else {
            mm.phase = "over"; const t = iso(new Date());
            if (!S.games[t]) { const before = miles().total; S.games[t] = { id: "masomenos", score: mm.streak }; save(); mm.miles = miles().total - before; }
            friendsAfterGame("masomenos", mm.streak, mm.streak + 1);
        }
        render();
    }, ok ? 900 : 1400);
}

let lessonState = null;
const focus = (back, i, n, body) => `<div class="focus"><header class="focus-top"><a class="icon-btn" href="${back}" aria-label="Cerrar">${ic("close")}</a>${n ? `${bar(i, n, "blue")}<span>${i} / ${n}</span>` : ""}</header><article class="focus-body">${body}</article></div>`;
/* Las preguntas van intercaladas: dos pantallas de explicación y una pregunta */
function lessonSeq(l) {
    const seq = []; let qi = 0;
    l.cards.forEach((c, i) => { seq.push({ c }); if (i % 2 === 1 && qi < l.check.length) seq.push({ qi: qi++ }); });
    while (qi < l.check.length) seq.push({ qi: qi++ });
    return seq;
}
function vTema(id, step) {
    const l = LESSONS.find(x => x.id === id);
    if (!l) return null;
    const seq = lessonSeq(l), total = seq.length;
    step = Math.max(0, Math.min(total - 1, +step || 0));
    if (!lessonState || lessonState.id !== id) lessonState = { id, answers: {}, checks: l.check.map(shuffleQ) };
    const last = step === total - 1, it = seq[step];
    let body;
    if (it.c) {
        const c = it.c;
        body = `<span class="kicker">${esc(l.title)}</span><h1>${c.h}</h1>${c.p.map(p => `<p>${p}</p>`).join("")}${c.ex ? `<div class="ex"><b>Ejemplo</b><p>${c.ex}</p></div>` : ""}${c.viz ? viz(c.viz) : ""}
          <div class="focus-nav">${step ? lnk("Anterior", `#/tema/${id}/${step - 1}`) : "<span></span>"}${lnk(`Siguiente${ic("arrow")}`, `#/tema/${id}/${step + 1}`, "primary")}</div>`;
    } else {
        const qi = it.qi, q = lessonState.checks[qi], ans = lessonState.answers[qi];
        body = `<span class="kicker">Comprueba lo que sabes · pregunta ${qi + 1} de ${l.check.length}</span><h1>${q.q}</h1>${opts(q, ans, "lessonAns", `data-q="${qi}"`)}
          ${ans !== undefined ? why(ans === q.a, q.why) : ""}
          <div class="focus-nav">${lnk("Anterior", `#/tema/${id}/${step - 1}`)}${ans !== undefined ? (last ? btn("Terminar tema", "lessonDone", "primary", `data-id="${id}"`) : lnk(`Siguiente${ic("arrow")}`, `#/tema/${id}/${step + 1}`, "primary")) : ""}</div>`;
    }
    return focus(homeLearn(), step + 1, total, body);
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
    if (!examState) examState = { qs: shuffle(EXAM).slice(0, RULES.examSize).map(shuffleQ), i: 0, errors: 0, ans: null, over: false };
    const e = examState;
    if (e.over) {
        const ok = e.errors <= RULES.examMaxErrors;
        return focus(homeLearn(), 0, 0, `<div class="center"><div class="result ${ok ? "ok" : "ko"}">${ic(ok ? "check" : "close")}</div>
          <h1>${ok ? "Fundamentos superados" : "Esta vez no ha sido"}</h1>
          <p>${ok ? `${RULES.examSize - e.errors} de ${RULES.examSize} respuestas correctas. Ya tienes tu Certificado Horizonte, ${RULES.prize} € invertidos a tu nombre y ${MILES.theory} millas de casa.` : `Has fallado ${e.errors} preguntas y el máximo es ${RULES.examMaxErrors}. Repasa los temas y vuelve a intentarlo cuando quieras.`}</p>
          <div class="focus-nav center">${ok ? lnk("Ver mi certificado", "#/aprende", "primary lg") : btn("Repetir la prueba", "examRetry", "primary lg")}</div></div>`);
    }
    const q = e.qs[e.i];
    return focus(homeLearn(), e.i + 1, RULES.examSize, `<span class="kicker">Prueba final · ${e.errors} de ${RULES.examMaxErrors} fallos permitidos</span><h1>${q.q}</h1>${opts(q, e.ans, "examAns")}
      ${e.ans !== null ? `${why(e.ans === q.a, q.why)}<div class="focus-nav"><span></span>${btn(e.i === RULES.examSize - 1 || e.errors > RULES.examMaxErrors ? "Ver resultado" : `Siguiente${ic("arrow")}`, "examNext", "primary")}</div>` : ""}`);
}

/* La página de verificación nunca da un certificado por bueno por lo que diga la URL: consulta el registro y muestra lo que el registro dice */
let verif = {}, certBusy = false;
async function loadVerif(code) {
    verif[code] = { state: "loading" };
    try {
        const r = await sb2Fetch("/rest/v1/rpc/v2_certificado_verificar", { method: "POST", body: { p_codigo: code } });
        verif[code] = r && r.nombre ? { state: r.estado === "revocado" ? "revoked" : "ok", d: r } : { state: "none" };
    } catch (e) { verif[code] = { state: "err" }; }
    if (location.hash.startsWith("#/verificar")) render();
}
async function certRegister() {
    if (!S.diploma || S.diploma.reg || certBusy) return;
    certBusy = true;
    try {
        const d = diplomaData();
        const code = await rpc2("v2_certificado_emitir", { p_codigo: d.i, p_nombre: publicName(), p_emitido: d.f, p_resultado: d.s, p_revision: d.v });
        S.diploma.reg = true; if (code && code !== S.diploma.id) S.diploma.id = code; save();
    } catch (e) { /* sin conexión o sin configurar: se reintenta en la próxima visita */ }
    certBusy = false;
}
function vVerificar(params) {
    const code = String(params.get("c") || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
    const wrap = inner => `<div class="auth"><header class="auth-top">${brand("#/", 32)}</header><main class="verify">${inner}</main></div>`;
    if (!code) return wrap(`<h1>Enlace no válido</h1><p class="sub">${params.get("d") ? "Este enlace es de una versión anterior y no se puede comprobar. Pide a quien te lo envió el enlace nuevo, desde su certificado." : "Este enlace no incluye ningún código."} Un certificado solo es válido si el registro de Horizonte lo confirma.</p>`);
    if (!verif[code]) loadVerif(code);
    const v = verif[code] || { state: "loading" }, d = v.d || {};
    if (v.state === "loading") return wrap(`${badge("Comprobando…")}<h1>${esc(code)}</h1><p class="sub">Consultando el registro de certificados.</p>`);
    if (v.state === "err") return wrap(`${badge("Sin comprobar", "warn")}<h1>${esc(code)}</h1><p class="sub">No hemos podido consultar el registro ahora mismo, así que no podemos confirmar este certificado. Inténtalo de nuevo en unos minutos.</p>`);
    if (v.state === "none") return wrap(`${badge(`${ic("close")}No encontrado`, "warn")}<h1>${esc(code)}</h1><p class="sub">Este código no existe en el registro de certificados de Horizonte. No lo des por bueno.</p>`);
    return wrap(`${badge(v.state === "ok" ? `${ic("check")}Certificado verificado` : "Certificado revocado", v.state === "ok" ? "ok" : "warn")}<h1>${esc(d.nombre)}</h1>
      <p class="sub">Certificado Horizonte · Fundamentos de inversión · CaixaBank Asset Management · emitido el ${fmtD(d.emitido)} · resultado ${esc(d.resultado)} · próxima revisión antes del ${fmtD(d.revision)} · código ${esc(code)}</p>
      <p class="note">Por privacidad, el registro solo muestra el nombre con la inicial del apellido.</p>`);
}

/* ---------------- Dinero */
/* Evolución del dinero. La tendencia es la misma que usa money() (cada aportación crece a la rentabilidad
   estimada de tu reparto) y encima va un movimiento de mercado simulado y reproducible para cada cuenta,
   que siempre termina en tu saldo de hoy. En producción vendría del valor liquidativo de CaixaBank AM. */
const DAY = 864e5, YEAR = 365.25 * DAY;
const RANGES = [["1D", "hoy", DAY], ["1S", "esta semana", 7 * DAY], ["1M", "este mes", 30 * DAY], ["1A", "este año", 365 * DAY], ["Máx", "desde el principio", Infinity]];
let vRange = "1M", allMoves = false;
function prng(seed) { let h = seed | 0; return () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hashStr = str => { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const gauss = r => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
const depT = c => new Date(c.date + "T00:00:00").getTime();
/* Puente browniano de n pasos, anclado a 0 en los dos extremos */
function bridge(n, seed) {
    const r = prng(seed), w = [0];
    for (let i = 1; i <= n; i++) w.push(w[i - 1] + gauss(r));
    return w.map((x, i) => x - i / n * w[n]);
}
function valueSeries() {
    const m = money(), now = Date.now(), deps = S.money.map(c => ({ t: Math.min(depT(c), now), g: T(c.date).getTime(), a: c.amount })).sort((x, y) => x.t - y.t);
    if (!deps.length) return null;
    const vol = m.al.parts.reduce((a, p) => a + p.w * (VOL[p.fund] || 15), 0) / 100;
    const sd = vol / Math.sqrt(252) * 0.7, sh = sd * 0.35;                     // movimiento diario y, dentro del día, más suave
    const start = deps[0].t, days = Math.max(1, Math.ceil((now - start) / DAY));
    const seed = hashStr(`${S.teen?.name}|${S.teen?.birth}|${deps[0].t}`);
    const daily = bridge(days, seed), intra = {};
    const hourly = k => intra[k] || (intra[k] = bridge(48, seed ^ (k * 2654435761)));
    const noise = t => {                                                // los días se cuentan hacia atrás desde ahora
        const back = (now - t) / DAY, k = Math.floor(back), f = back - k;
        const d0 = daily[days - k] ?? 0, d1 = daily[days - k - 1] ?? 0;
        const h = hourly(k), hi = (1 - f) * 48, j = Math.floor(hi), hf = hi - j;
        return sd * (d0 + (d1 - d0) * f) + sh * ((h[j] ?? 0) + ((h[j + 1] ?? 0) - (h[j] ?? 0)) * hf);
    };
    const n0 = noise(start), noiseAt = t => noise(t) - n0 * (now - t) / Math.max(1, now - start);   // anclado a 0 en la primera aportación y hoy
    const at = t => {
        let trend = 0, put = 0;
        for (const d of deps) if (d.t <= t) { trend += d.a * (1 + m.r * Math.max(0, t - d.g) / YEAR); put += d.a; }
        return { t, v: t >= now ? m.value : trend * Math.exp(noiseAt(t)), put };
    };
    return { at, start, now, deps, m };
}
function rangePoints(vs, key) {
    const span = RANGES.find(r => r[0] === key)[2], from = Math.max(vs.start, span === Infinity ? vs.start : vs.now - span);
    const n = 160, pts = [];
    for (let i = 0; i <= n; i++) pts.push(vs.at(from + (vs.now - from) * i / n));
    vs.deps.filter(d => d.t > from && d.t < vs.now).forEach(d => { pts.push(vs.at(d.t - 1)); pts.push(vs.at(d.t)); });   // escalón limpio en cada aportación
    return pts.sort((x, y) => x.t - y.t);
}
const signed = (v, dec = true) => `${v >= 0 ? "+" : "−"}${eur(Math.abs(v), dec)}`;
function rangeChange(pts) {
    const a = pts[0], b = pts[pts.length - 1], added = b.put - a.put, chg = b.v - a.v - added, base = a.v + added;
    return { chg, pct: base > 0 ? chg / base * 100 : 0 };
}
const fmtWhen = (t, key) => {
    const d = new Date(t);
    return key === "1D" ? d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        : key === "1S" ? d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
};
function drawValueChart(box) {
    const vs = valueSeries(); if (!vs) return;
    const key = box.dataset.range || vRange, pts = rangePoints(vs, key), { chg, pct: p } = rangeChange(pts);
    const span = RANGES.find(r => r[0] === key)[2], label = span !== Infinity && vs.start > vs.now - span ? "desde tu primera aportación" : RANGES.find(r => r[0] === key)[1];
    const mini = box.classList.contains("mini"), W = Math.max(mini ? 120 : 280, box.clientWidth), H = mini ? Math.max(70, box.clientHeight) : W < 560 ? 200 : 260, padR = box.classList.contains("mini") ? 0 : 64, padT = 12, padB = 12;
    const vals = pts.flatMap(x => [x.v, x.put]), lo0 = Math.min(...vals), hi0 = Math.max(...vals), pad = Math.max((hi0 - lo0) * .12, hi0 * .004, .5);
    const lo = Math.max(0, lo0 - pad), hi = hi0 + pad;
    const X = t => (t - pts[0].t) / Math.max(1, pts[pts.length - 1].t - pts[0].t) * (W - padR), Y = v => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
    const line = pts.map((q, i) => `${i ? "L" : "M"}${X(q.t).toFixed(1)},${Y(q.v).toFixed(1)}`).join("");
    let put = ""; pts.forEach((q, i) => { put += i ? `H${X(q.t).toFixed(1)}V${Y(q.put).toFixed(1)}` : `M${X(q.t).toFixed(1)},${Y(q.put).toFixed(1)}`; });
    const up = chg >= 0, col = up ? "var(--green)" : "var(--red)", id = "g" + Math.random().toString(36).slice(2, 7);
    const ticks = box.classList.contains("mini") ? [] : [0, 1, 2, 3].map(i => lo + (hi - lo) * (i + .5) / 4);
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Evolución de tu dinero ${RANGES.find(r => r[0] === key)[1]}">
      <defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:${col}" stop-opacity=".16"/><stop offset="1" style="stop-color:${col}" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map(v => `<line class="vc-grid" x1="0" x2="${W - padR}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="vc-lbl" x="${W - padR + 10}" y="${(Y(v) + 4).toFixed(1)}">${eur(v, hi - lo < 20)}</text>`).join("")}
      <path d="${line}L${X(pts[pts.length - 1].t).toFixed(1)},${H}L0,${H}Z" fill="url(#${id})"/>
      ${box.classList.contains("mini") ? "" : `<path class="vc-put" d="${put}"/>`}
      <path d="${line}" fill="none" style="stroke:${col}" stroke-width="${box.classList.contains("mini") ? 1.8 : 2.2}" stroke-linejoin="round" stroke-linecap="round"/>
      <g class="vc-hover" style="display:none"><line y1="0" y2="${H}"/><circle r="5" style="fill:${col}"/></g>
      <circle cx="${X(pts[pts.length - 1].t).toFixed(1)}" cy="${Y(pts[pts.length - 1].v).toFixed(1)}" r="3.5" style="fill:${col}"/>
    </svg>`;
    const head = box.closest(".card, .h-money")?.querySelector("[data-vhead]");
    const setHead = (q, live) => {
        if (!head) return;
        const c = live ? { chg, pct: p } : rangeChange(pts.filter(x => x.t <= q.t));
        $("[data-o=val]", head).textContent = eur(q.v, true);
        const o = $("[data-o=chg]", head); o.className = c.chg >= 0 ? "up" : "down";
        o.textContent = `${signed(c.chg)} (${c.pct >= 0 ? "+" : "−"}${pct(Math.abs(c.pct), 2)})`;
        $("[data-o=when]", head).textContent = live ? label : fmtWhen(q.t, key);
    };
    setHead(pts[pts.length - 1], true);
    if (box.classList.contains("mini")) return;
    const svg = $("svg", box), g = $(".vc-hover", svg);
    const move = e => {
        const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width;
        let best = pts[0]; for (const q of pts) if (Math.abs(X(q.t) - x) < Math.abs(X(best.t) - x)) best = q;
        g.style.display = ""; $("line", g).setAttribute("x1", X(best.t)); $("line", g).setAttribute("x2", X(best.t));
        $("circle", g).setAttribute("cx", X(best.t)); $("circle", g).setAttribute("cy", Y(best.v));
        setHead(best, false);
    };
    svg.addEventListener("pointermove", move); svg.addEventListener("pointerdown", move);
    svg.addEventListener("pointerleave", () => { g.style.display = "none"; setHead(pts[pts.length - 1], true); });
}
function bindValueCharts() { $$("[data-vchart]").forEach(drawValueChart); }
let vcResize; addEventListener("resize", () => { clearTimeout(vcResize); vcResize = setTimeout(() => { bindValueCharts(); bindProj(); }, 120); });

function vDinero() {
    const m = money(), moves = [...S.money].reverse(), has = S.money.length > 0;
    const added = [["Por ti", m.ownReal], ["Tu familia", m.gifts], ["Premios", m.prizes]].filter(([, v], i) => v > 0 || i < 2);
    const weeklyOpts = [0, 2, 5, 10, 20];
    const pend = S.pending || [];
    return `${pageH("Dinero", "", `<div class="h-acts">${m.value > 0 ? btn(`${ic("back")}Retirar`, "openWithdraw") : ""}${btn(`${ic("plus")}Aportar`, "openContribute", "primary")}</div>`)}
    <div class="demo-banner">${ic("info")}<p><b>Versión de demostración.</b> El dinero, las aportaciones y los movimientos de mercado son simulados: no se mueve ningún euro real.</p></div>
    <div class="grid">
      ${card(`<div class="vhead" data-vhead>
          <div class="vh-main"><span class="vh-k">Tu dinero</span><b class="vh-v" data-o="val">${eur(m.value, true)}</b>
            ${has ? `<p class="vh-chg"><span data-o="chg"></span> <small data-o="when"></small></p>` : `<p class="vh-chg"><small>Aún no has invertido</small></p>`}</div>
          <dl class="vh-added"><div class="tot"><dt>Has añadido</dt><dd>${eur(m.invested, true)}</dd></div>${added.map(([k, v]) => `<div><dt>${k}</dt><dd>${eur(v, true)}</dd></div>`).join("")}</dl>
        </div>
        ${has ? `<div class="vchart" data-vchart data-range="${vRange}"></div>
          <div class="vc-foot"><div class="vc-ranges" role="tablist" aria-label="Periodo">${RANGES.map(([k]) => `<button role="tab" class="${k === vRange ? "on" : ""}" aria-selected="${k === vRange}" data-act="vRange" data-k="${k}">${k}</button>`).join("")}</div>
          <div class="vc-key"><span><i class="k1"></i>Tu dinero</span><span><i class="k2"></i>Lo que has añadido</span></div></div>`
        : `<div class="vchart-empty">${empty("chart", "Tu curva empieza con tu primer euro", "Aquí verás cómo se mueve tu dinero cada día.", btn("Hacer mi primera aportación", "openContribute", "primary"))}</div>`}`, "c-12 money-card")}
      ${investorCardUI(m)}
      ${weekCard("c-12")}
      ${pend.length ? card(`${cardH("Retiradas pendientes", `Tu familia tiene que aprobarlas.`)}<div class="rows">${pend.map(x => `<div class="row"><span class="mv-ic warn">${ic("back")}</span><div><b>${eur(x.amount, true)}</b><span>Pedida el ${fmtD(x.date)} · pendiente de aprobación</span></div>${btn("Cancelar", "wdNo", "sm ghost", `data-id="${x.id}"`)}</div>`).join("")}</div>`, "c-12") : ""}
      ${has ? card(`${cardH("Movimientos", "", btn(`${ic("download")}Extracto`, "csv", "sm ghost"))}
        <div class="rows moves">${moves.slice(0, allMoves ? 50 : 5).map(moveRow).join("")}</div>
        ${moves.length > 5 ? `<button class="more" data-act="allMoves">${allMoves ? "Ver menos" : `Ver los ${moves.length} movimientos`}</button>` : ""}`, "c-12") : ""}
      ${card(`${cardH("Ahorro automático", "Se aparta solo, sin que tengas que acordarte.")}
        <div class="auto">
          <div class="auto-row"><div><b>Cada semana</b><span>${S.weekly ? `≈ ${eur(S.weekly * 52 / 12)} al mes` : "Elige una cantidad"}</span></div>
            <div class="seg" role="radiogroup" aria-label="Euros a la semana">${weeklyOpts.map(v => `<button role="radio" aria-checked="${S.weekly === v}" class="${S.weekly === v ? "on" : ""}" data-act="setWeekly" data-v="${v}">${v ? `${v} €` : "No"}</button>`).join("")}</div></div>
          <div class="auto-row"><div><b>Redondeo de compras</b><span>Cuando tengas tu tarjeta, cada compra se redondeará al euro siguiente y la diferencia se invertirá. Pagas 3,40 € y se invierten 0,60 €.</span></div>${badge("Próximamente")}</div>
        </div>`, "c-12")}
      ${card(`${cardH("Dónde está tu dinero", m.al.active ? `Cartera base ${pct(RULES.base * 100)} · Antídoto ${pct(RULES.antidote * 100)}` : m.al.needSuit ? "Tu Antídoto espera a que hagas el test." : m.al.pending ? "Tu Antídoto espera la aprobación de tu familia." : "Todo en la cartera base.", m.al.active ? "" : lnk(S.fears.length ? "Ver Antídoto" : "Elegir Antídoto", "#/antidoto", "sm ghost"))}
        ${stack(m.parts)}<div class="rows">${m.parts.map(pp => `<div class="row">${sw(pp.fund)}<div><b>${FUNDS[pp.fund].name}</b><span>${pp.fear ? "Antídoto · " + esc(pp.fear.label) : FUNDS[pp.fund].sub}</span></div><b class="amt">${eur(pp.amount, true)}</b></div>`).join("")}</div>`, "c-12")}
      ${card(`${cardH("Primer año acompañado", `Promoción de CaixaBank: si a los ${RULES.protectMonths} meses tus primeros ${RULES.protectCap} € aportados (tuyos o de tu familia) valen menos y no has vendido, CaixaBank repone la diferencia.`)}
        <div class="protect"><div class="pr-num"><b>${eur(m.protect?.active ? m.protect.base : 0)}</b><span>de ${RULES.protectCap} € con protección</span></div>${bar(m.protect?.active ? m.protect.base : 0, RULES.protectCap, "blue")}
        <p class="note">${m.protect ? (m.protect.lost ? `Has retirado dinero antes de los ${RULES.protectMonths} meses: la protección ya no aplica.` : m.protect.active ? `Del ${fmtD(m.protect.start)} al ${fmtD(m.protect.end)} · quedan ${m.protect.daysLeft} días` : `Tu periodo de protección terminó el ${fmtD(m.protect.end)}.`) : "Empieza con tu primera aportación."}</p></div>
        <details class="terms" open><summary>Condiciones${ic("plus")}</summary><ul><li>Es una promoción, no un fondo garantizado ni un seguro: tu dinero sigue invertido y puede bajar.</li><li>Tope de ${RULES.protectCap} € por persona y ${RULES.protectMonths} meses desde tu primera aportación.</li><li>Cubre las primeras aportaciones, no los rendimientos ni lo que aportes por encima del tope.</li><li>Solo si no vendes ni retiras antes de los ${RULES.protectMonths} meses.</li><li>Dotación limitada: puede agotarse. <a href="#/legal">Ver condiciones completas</a>.</li></ul></details>`, "c-12")}
    </div>
    <p class="note center-note">Movimientos de mercado simulados en esta versión de demostración.</p>`;
}
function applyWithdrawal(amount) { S.money.push({ date: iso(new Date()), amount: -amount, src: "retiro" }); S.money.sort((a, b) => a.date.localeCompare(b.date)); save(); }
function withdrawSheet() {
    const m = money(), max = Math.floor(m.value * 100) / 100, minor = !isAdult();
    sheet("Retirar dinero", `<form data-form="withdraw" class="form">
      <div class="amount-in"><input name="amount" type="number" min="1" max="${max}" step="0.01" inputmode="decimal" required placeholder="0" aria-label="Importe en euros"><span>€</span></div>
      <p class="note">Disponible: ${eur(m.value, true)}.</p>
      ${m.protect?.active ? `<div class="warn-box">${ic("info")}<p>Si retiras antes del ${fmtD(m.protect.end)}, <b>pierdes la protección promocional</b> del primer año.</p></div>` : ""}
      <p class="note">${minor ? "Como eres menor de edad, tu familia tiene que aprobar la retirada. Cuando lo haga, el dinero vuelve a la cuenta bancaria asociada." : "El dinero vuelve a tu cuenta bancaria."} En esta demostración no se mueve dinero real.</p>
      <button class="btn primary lg block">${minor ? "Pedir a mi familia que lo apruebe" : "Retirar"}</button></form>`);
}
function metaSaved(id) { return S.money.filter(c => c.meta === id).reduce((a, c) => a + c.amount, 0); }
function metasCard() {
    const m = money(), small = S.metas.reduce((a, x) => a + metaSaved(x.id), 0), house = Math.max(0, m.value - small), down = S.goal.price * DOWN_PCT;
    const rows = [`<div class="row tall"><span class="mv-ic gold">${ic("house")}</span><div><b>Tu casa · entrada</b><span>${eur(house, true)} de ${eur(down)}</span>${bar(house, down, "gold")}</div>${lnk("Ajustar", "#/casa", "sm ghost")}</div>`,
        ...S.metas.map(x => { const sv = metaSaved(x.id); return `<div class="row tall"><span class="mv-ic own">${ic("target")}</span><div><b>${esc(x.name)}</b><span>${eur(sv, true)} de ${eur(x.target)}${sv >= x.target ? " · conseguida" : ""}</span>${bar(sv, x.target, "blue")}</div>${btn("Quitar", "delMeta", "sm ghost", `data-id="${x.id}"`)}</div>`; })];
    return card(`${cardH("Tus metas", "Elige a cuál va cada aportación.", S.metas.length < 3 ? btn(`${ic("plus")}Nueva`, "openMeta", "sm ghost") : "")}
      <div class="rows">${rows.join("")}</div>`, "c-6");
}
/* Familia: lo que ha pasado esta semana, explicado con calma */
function weekFamilyCard() {
    const w = weekSummary(), n = esc(teenName()), m = money(), sg = `${w.retPct >= 0 ? "+" : "−"}${pct(Math.abs(w.retPct), 1)}`;
    const calm = Math.abs(w.retPct) >= 1.5
        ? (w.retPct < 0 ? "Una semana mala no dice nada de un plazo de diez años. Lo mejor es no vender y hablarlo con calma." : "Una semana buena tampoco cambia el plan: lo que cuenta es la constancia.")
        : "Una semana tranquila. Lo que cuenta es el plazo y la constancia.";
    return card(`${cardH("Esta semana", `Semana del ${fmtD(weekOf(new Date()))}`)}
      <div class="week"><p>${m.value > 0 ? `El dinero de ${n} ${w.chg >= 0 ? "ha subido" : "ha bajado"} <b>${eur(Math.abs(w.chg), true)}</b> (${sg}).` : `Cuando ${n} invierta, verás aquí qué ha pasado con su dinero.`}</p><p>${calm}</p>${m.protect?.active && w.retPct < 0 ? `<p>Sus ${eur(m.protect.base)} siguen protegidos ${m.protect.daysLeft} días más.</p>` : ""}</div>
      <p class="note">Movimientos simulados en esta versión de demostración.</p>`, "c-6");
}
function talkCard() {
    const t = TALKS[Math.floor(Date.now() / 6048e5) % TALKS.length];
    return card(`${cardH("Para hablar esta semana", "Cinco minutos en casa valen más que cualquier folleto.")}
      <p class="talk">${t}</p><p class="note">Según PISA, los alumnos que hablan de dinero con su familia con frecuencia puntúan mejor en competencia financiera.</p>`, "c-6");
}
function metaSheet() {
    sheet("Nueva meta", `<form data-form="meta" class="form">
      <label class="field"><span>¿Para qué ahorras?</span><input name="name" required maxlength="40" placeholder="Por ejemplo, el carné de conducir"></label>
      <label class="field"><span>¿Cuánto necesitas? (€)</span><input name="target" type="number" min="10" max="50000" step="1" required inputmode="numeric"></label>
      <button class="btn primary lg block">Crear meta</button></form>`);
}
function contributeSheet() {
    sheet("Aportar", `<form data-form="contribute" class="form">
      <div class="amount-in"><input name="amount" type="number" min="1" max="3000" step="0.01" inputmode="decimal" required placeholder="0" aria-label="Importe en euros"><span>€</span></div>
      <div class="chips">${[1, 5, 10, 20, 50].map(v => `<button type="button" class="chip" data-act="setAmount" data-v="${v}">${v} €</button>`).join("")}</div>
      <label class="field"><span>¿De dónde sale?</span><select name="src"><option value="paga">Mi paga</option><option value="verano">Un trabajo de verano</option><option value="otro">Otro ingreso</option></select></label>
      <p class="note demo-note">Demostración: no se mueve ningún euro. En la versión real, el cargo se haría desde una cuenta bancaria (la de tu familia, si eres menor) por transferencia, domiciliación o Bizum.</p>
      <button class="btn primary lg block">Confirmar aportación</button></form>`);
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
const ageBand = () => { const a = ageOf(); return a < 14 ? 13 : a < 16 ? 15 : a < 18 ? 17 : 20; };     // solo un tramo de edad, nunca la edad exacta
async function vote(ids) {
    if (S.voted) return;
    S.voted = true; save();
    const c = window.HZ2_CONFIG || {};
    if (!c.supabaseUrl) return;
    try {
        await fetch(`${c.supabaseUrl}/rest/v1/miedos_v2`, { method: "POST", headers: { apikey: c.supabaseAnonKey, Authorization: `Bearer ${c.supabaseAnonKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify(ids.map(id => ({ miedo: id, edad: ageBand() }))) });
    } catch (e) { /* sin conexión */ }
}
/* Asistente: mensajes con título, cifras clave y acciones, como los de los asistentes de los grandes bancos */
let typing = false;
const hhmm = t => t ? new Date(t).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "";
function assistantMsg(x) {
    const text = x.text ?? x.t ?? "", gem = x.kind === "remote" || x.used?.includes("Gemini");
    const acts = (x.actions || []).map(a => a.href ? `<a class="am-act ${a.primary ? "pri" : ""}" href="${esc(a.href)}">${esc(a.label)}${a.primary ? ic("arrow") : ""}</a>` : `<button class="am-act" data-act="ask" data-q="${esc(a.q)}">${esc(a.label)}</button>`).join("");
    return `<div class="amsg"><span class="am-av" aria-hidden="true">${ic("spark")}</span><div class="am-body">
      ${x.title ? `<b class="am-t">${esc(x.title)}</b>` : ""}<p>${esc(text)}</p>
      ${x.facts?.length ? `<div class="am-facts">${x.facts.slice(0, 3).map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}</div>` : ""}
      ${acts ? `<div class="am-acts">${acts}</div>` : ""}
      <small class="am-meta">${gem ? "Gemini · " : ""}Con los datos de tu cuenta${x.ts ? ` · ${hhmm(x.ts)}` : ""}</small></div></div>`;
}
function chatHTML() {
    const list = S.chat.length ? S.chat.slice(-8) : [{ r: "g", ...localGemini("hola", assistantCtx()), ts: 0 }];
    return list.map(x => x.r === "u" ? `<div class="umsg"><p>${esc(x.t)}</p></div>` : assistantMsg(x)).join("")
        + (typing ? `<div class="amsg"><span class="am-av" aria-hidden="true">${ic("spark")}</span><div class="am-body typing" aria-label="Preparando la respuesta"><i></i><i></i><i></i></div></div>` : "");
}
let moreIdeas = false;
function suitCard() {
    const su = S.suit, redo = btn("Repetir el test", "openSuit", "sm ghost");
    if (!su) return card(`${cardH("Antes de empezar: seis preguntas", "Dos minutos para ver si el Antídoto encaja con tu situación. Si eres menor, hacedlo juntos.")}
      <p class="note">No hay respuestas buenas ni malas: sirven para proteger tu dinero y el de tu familia.</p><div class="actions">${btn("Hacer el test", "openSuit", "primary")}</div>`, "c-12");
    const msg = { corto: ["Tu plazo es corto", "warn", "Si vas a necesitar este dinero en menos de 3 años, o es para algo en pocos meses, la bolsa no es lo más adecuado. Puedes seguir aprendiendo, pero te recomendamos no invertir este dinero. El Antídoto no está disponible."],
        revisar: ["Repasa antes de invertir", "warn", "Antes de invertir conviene tener claro que se puede recuperar menos de lo aportado. Repasa los temas de Fundamentos y repite el test. El Antídoto no está disponible."],
        base: ["Cartera base", "", "Con tus respuestas, tu cartera será solo el fondo global diversificado. El Antídoto no está disponible por ahora: necesita un plazo de al menos 5 años, algo de experiencia y poder aguantar una caída."],
        sat: ["Puedes elegir un Antídoto", "ok", `Con tus respuestas, puedes dedicar como máximo el ${Math.round(RULES.antidote * 100)} % de tu cartera a un tema que te importa. ${isAdult() ? "" : "Tu familia tiene que aprobarlo."}`] }[su.level] || ["Resultado", "", ""];
    return card(`${cardH("Tu test", `Hecho el ${fmtD(su.date)}.`, badge(msg[0], msg[1]))}<p>${msg[2]}</p><div class="actions">${redo}</div>`, "c-12");
}
function suitSheet() {
    sheet("Seis preguntas", `<form data-form="suit" class="form suit">${SUIT.map(q => `<fieldset class="suit-q"><legend>${q.q}</legend>${q.o.map(([t, v]) => `<label class="check"><input type="radio" name="${q.id}" value="${v}" required><span>${t}</span></label>`).join("")}</fieldset>`).join("")}
      <p class="note">Si eres menor, contestad juntos. Puedes repetirlo cuando quieras.</p><button class="btn primary lg block">Ver mi resultado</button></form>`);
}
function vAntidoto() {
    const m = money(), al = m.al, can = geminiAllowed();
    const r = ranking || { counts: {}, total: 0 }, showRank = r.total >= RANK_MIN;
    const rank = FEARS.map(f => ({ f, n: r.counts[f.id] || 0 })).sort((a, b) => b.n - a.n);
    const mine = S.fears.map(fearOf), full = S.fears.length >= RULES.maxFears, suitOk = !!S.suit?.ok;
    const ideas = FEAR_IDEAS.filter(t => !S.fears.some(f => f.label === t)), shown = moreIdeas ? ideas : ideas.slice(0, 4);
    return `${pageH("Antídoto", "Opcional: una parte pequeña de tu cartera en un tema que te importa.")}
    <div class="grid">
      ${card(`<div class="ad-hero">
          <div class="ad-why"><span class="kicker">Cómo funciona</span>
            <h2>Una apuesta pequeña, no un seguro.</h2>
            <p>El ${pct(RULES.base * 100)} de tu dinero va a la cartera base. Como máximo el otro ${pct(RULES.antidote * 100)} se invierte en un fondo temático ligado a lo que te preocupa.</p>
            <ul class="ad-if"><li><span class="ad-ic good">${ic("check")}</span><div><b>Si ese tema va bien</b>, esa parte puede ganar.</div></li>
              <li><span class="ad-ic bad">${ic("info")}</span><div><b>Si va mal</b>, esa parte puede perder, y a veces irá en dirección contraria a lo que esperas. Por eso es pequeña.</div></li></ul></div>
          <div class="ad-mapcol"><div class="ad-maph"><span>Tu mapa</span>${al.fears.length ? badge(al.active ? "Activo" : al.needSuit ? "Falta el test" : "Pendiente de tu familia", al.active ? "ok" : "warn") : ""}</div>${antidoteMap(m)}</div>
        </div>`, "c-12")}
      ${suitCard()}
      ${suitOk ? card(`${cardH("¿Qué te preocupa a ti?", "Escoge un tema general. Lo asociamos a un fondo temático: no es un seguro contra lo que temes.", `<span class="count">${S.fears.length}/${RULES.maxFears}</span>`)}
        ${full ? "" : `<form class="ad-add" data-form="fearAdd"><input name="t" maxlength="80" autocomplete="off" placeholder="Por ejemplo: que las carreteras estén cada vez peor" aria-label="Lo que te preocupa" required><button class="btn primary">${ic("plus")}Añadir</button></form>
          <p class="note">Escribe solo un tema general. No pongas datos personales ni de salud tuyos o de otras personas.</p>
          ${ideas.length ? `<div class="ad-ideas"><span>Ideas</span>${shown.map(t => `<button class="chip" data-act="fearIdea" data-t="${esc(t)}">${esc(t)}</button>`).join("")}${ideas.length > 4 ? `<button class="ad-more" data-act="moreIdeas">${moreIdeas ? "Menos" : `+${ideas.length - 4} ideas`}</button>` : ""}</div>` : ""}`}
        ${mine.length ? `<div class="ad-mine">${mine.map((f, i) => `<div class="ad-item">
            <span class="ad-dot" style="background:${FUND_COLOR[f.fund] || "var(--ink-4)"}">${ic(FUND_ICON[f.fund] || "spark")}</span>
            <div><b>«${esc(f.label)}»</b>
              <label class="ad-change"><span>${f.fund ? "Se invierte en" : "Elige a qué fondo asociarlo"}</span><select data-act="fearFund" data-i="${i}">${f.fund ? "" : `<option value="">Elige…</option>`}${Object.keys(FUND_WHY).map(k => `<option value="${k}" ${k === f.fund ? "selected" : ""}>${FUNDS[k].name}</option>`).join("")}</select></label>
              ${f.fund ? `<small>${FUND_WHY[f.fund]}</small>` : ""}</div>
            ${btn(ic("close"), "fearDel", "icon-btn", `data-i="${i}" aria-label="Quitar"`)}</div>`).join("")}</div>` : ""}
        <p class="note">No es un seguro ni una cobertura: el fondo temático puede perder valor aunque lo que temes ocurra. Siempre con fondos de CaixaBank Asset Management; consulta el documento de datos fundamentales (DFI) de cada uno antes de invertir.</p>`, "c-12") : ""}

      ${card(`${cardH(`<span class="gem">${ic("spark")}Asistente Horizonte</span>`, can ? "Pregunta lo que quieras sobre tu dinero. Responde con tus datos." : "Pregunta lo que quieras sobre invertir. Respuestas generales.")}
        <div class="chat" id="chat">${chatHTML()}</div>
        <div class="sugg">${G_TOPICS.map(t => `<button class="chip" data-act="ask" data-q="${esc(t.q)}">${t.label}</button>`).join("")}</div>
        <form class="ask" data-form="ask"><input name="q" placeholder="Escribe tu consulta" aria-label="Tu consulta" autocomplete="off" required><button class="icon-btn primary" aria-label="Enviar">${ic("send")}</button></form>
        ${can ? "" : `<p class="note">Estas respuestas son generales y no usan ningún dato de tu cuenta. Con el permiso de tu familia te responderé con tus propios números. ${btn("Pedir permiso", "askPerm", "sm", 'data-p="gemini"')}</p>`}
        <p class="note">Información orientativa, no es asesoramiento financiero.</p>`, "c-7")}
      ${card(`${cardH("Lo que preocupa a otras personas en Horizonte", "Respuestas anónimas de usuarios de la app. No es una encuesta representativa.")}
        ${showRank ? `<div class="rank">${rank.map((x, i) => `<div class="rk ${S.fears.some(f => f.id === x.f.id) ? "mine" : ""}"><span class="rk-n">${i + 1}</span><div><b>${x.f.label}</b>${bar(x.n, rank[0].n, "blue")}</div><span class="rk-p">${pct(x.n / r.total * 100)}</span></div>`).join("")}</div><p class="note">${num(r.total)} respuestas anónimas.</p>`
          : `<p class="ad-soon">Lo publicaremos cuando haya al menos ${RANK_MIN} respuestas, para que nadie pueda ser identificado.${S.voted ? " Tu respuesta ya cuenta." : ""}</p>`}`, "c-5")}
    </div>`;
}
/* Mapa del Antídoto: de tu dinero a cada inversión, con ramas tan gruesas como el peso de cada parte */
function antidoteMap(m) {
    const al = m.al, total = m.value;
    const nodes = al.fears.length ? al.planned.map(p => ({ fund: p.fund, w: p.w, fear: p.fear })) : [{ fund: "global", w: RULES.base }, { fund: null, w: RULES.antidote }];
    const n = nodes.length, H = Math.max(260, n * 96), cy = H / 2;
    const ys = nodes.map((_, i) => (i + .5) * H / n);
    const paths = nodes.map((x, i) => {
        const y = ys[i], sw = Math.max(3, x.w * 34), col = x.fund ? FUND_COLOR[x.fund] : "var(--line-2)";
        return `<path d="M0 ${cy} C 120 ${cy}, 140 ${y}, 260 ${y}" style="stroke:${col}" stroke-width="${sw.toFixed(1)}" fill="none" stroke-linecap="round" ${x.fund ? "" : 'stroke-dasharray="2 8"'} class="am-path"/>`;
    }).join("");
    return `<div class="amap" style="--h:${H}px">
      <div class="am-src"><span>Tu dinero</span><b>${total > 0 ? eur(total, true) : "100 %"}</b><small>${total > 0 ? "invertido hoy" : "de lo que inviertas"}</small></div>
      <svg class="am-lines" viewBox="0 0 260 ${H}" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>
      <ol class="am-nodes">${nodes.map(x => `<li class="${x.fund ? "" : "ghost"}">
        <span class="am-pct" style="color:${x.fund ? FUND_COLOR[x.fund] : "var(--ink-4)"}">${pct(x.w * 100, (x.w * 100) % 1 ? 1 : 0)}</span>
        <div>${x.fund ? `<b>${x.fear ? `«${esc(x.fear.label)}»` : "Cartera base"}</b><span>${FUNDS[x.fund].name}${total > 0 ? ` · ${eur(total * x.w, true)}` : ""}</span>`
          : `<b>Tu Antídoto</b><span>Escribe lo que te preocupa y aparecerá aquí</span>`}</div></li>`).join("")}</ol>
    </div>`;
}

/* ---------------- Casa */
function vCasa() {
    const m = money(), mi = miles(), age = ageOf(), minAge = Math.max(age + 2, 20);
    const rules = [
        ["Cada tema de Fundamentos", `+${MILES.lesson}`, `${Object.keys(S.lessons).length} de ${LESSONS.length}`],
        ["Superar Fundamentos", `+${MILES.theory}`, S.exam?.passed ? "Conseguido" : ""],
        ["Cada 4 semanas de constancia", `+${MILES.streak4}`, `Constancia actual: ${streak().current} semanas`],
        ["Tu primer euro propio", `+${MILES.firstOwn}`, m.firstOwn ? "Conseguido" : ""],
        ["Cada mes que aportas", `+${MILES.monthOwn}`, S.weekly || S.roundup ? "Ahorro automático activo" : ""],
        ["Revisión anual", `+${MILES.itv}`, S.itv.length ? `${S.itv.length} completada${S.itv.length > 1 ? "s" : ""}` : ""],
        ["Regalos de tu familia", `+${MILES.giftPer5} cada 5 €`, `Máximo ${MILES.giftMonthCap} al mes`],
    ];
    return `${pageH("Tu casa", "Tus millas de casa pueden convertirse en una bonificación de tu primera hipoteca con CaixaBank, según las condiciones de ese momento.")}
    <div class="grid">
      ${card(`${cardH("¿Cuándo podrías comprar?", "Mueve las dos cifras y mira cuándo tendrías la entrada de tu casa.")}
        <div class="pj2" data-proj>
          <div class="pj2-in">
            <label class="pj2-f"><span>Cada mes apartas</span><output data-o="mon"></output><input type="range" min="0" max="${MON_STEPS.length - 1}" step="1" value="${monIdx(m.monthly > 0 ? m.monthly : 25)}" data-i="mon" aria-label="Euros al mes"></label>
            <label class="pj2-f"><span>Para una casa de</span><output data-o="price"></output><input type="range" min="60000" max="600000" step="5000" value="${Math.min(600000, Math.max(60000, S.goal.price))}" data-i="price" aria-label="Precio de la vivienda"></label>
          </div>
          <p class="pj2-say" data-o="say"></p>
          <p class="note pj2-range" data-o="range"></p>
          <div class="pj2-chart" data-o="chart"></div>
          <dl class="pj-list"><div><dt data-o="atk"></dt><dd data-o="miles"></dd></div><div><dt>Rebaja en tu hipoteca</dt><dd data-o="cut"></dd></div><div><dt>Ahorro en intereses</dt><dd data-o="save"></dd></div></dl>
        </div>
        <p class="note">Ilustración, no una oferta. Estimación con una rentabilidad del ${EST.gross} % anual, entrada del 20 % del precio, hipoteca a ${MORTGAGE_YEARS} años y tipo de referencia del ${pct(MORTGAGE_RATE, 1)}. El aval del ICO para menores de 35 puede reducir la entrada necesaria.</p>`, "c-12")}
      ${card(`<div class="miles-hero"><div>${stat("Millas de casa", num(mi.total))}<p>Equivalen a una bonificación posible de <b>${pts(mi.cut)} puntos</b> de diferencial: unos <b>${eur(mortgageSaving(mi.cut))}</b> menos de intereses en una hipoteca de ejemplo. Es una ilustración, no una oferta.</p></div>
        <div class="mh-meter"><span>Rebaja acumulada</span>${bar(mi.cut, MILES.maxCut, "gold")}<small>${pts(mi.cut)} de ${pts(MILES.maxCut)} puntos posibles</small></div></div>`, "c-12")}
      ${card(`${cardH("Cómo se ganan")}<div class="rows">${rules.map(([t, n, s]) => `<div class="row"><div><b>${t}</b>${s ? `<span>${s}</span>` : ""}</div><b class="amt gold">${n}</b></div>`).join("")}</div>
        <p class="note">${num(MILES.perPoint / 100)} millas equivalen a 0,01 puntos de bonificación posible, hasta un máximo de ${pts(MILES.maxCut)} puntos.</p>`, "c-6")}
      ${card(`${cardH("Condiciones")}<ul class="plain"><li>Se canjean como bonificación en tu primera hipoteca con CaixaBank, según las condiciones vigentes el día de la firma.</li><li>Es una bonificación posible, no una oferta ni un precio cerrado, y no obliga a contratar otros productos (Ley 5/2019). Puede ir ligada a condiciones de vinculación voluntaria que entonces se ofrezcan.</li><li>No caducan. Si no compras vivienda, no pierdes nada: tu dinero sigue siendo tuyo.</li><li>Los juegos no suman millas. Los regalos tienen un tope mensual. <a href="#/legal">Ver condiciones completas</a>.</li></ul>`, "c-6")}
      ${card(`${cardH("Historial de millas")}${mi.items.length ? `<div class="rows">${mi.items.slice(0, 15).map(i => `<div class="row"><div><b>${esc(i.label)}</b><span>${fmtD(i.date)}</span></div><b class="amt gold">+${i.n}</b></div>`).join("")}</div>` : empty("house", "Aún no tienes millas", "Empieza por Fundamentos: cada tema suma.", lnk("Ir a Aprende", "#/aprende", "primary"))}`, "c-12")}
    </div>`;
}
/* Aportación mensual: pasos finos al principio y más grandes al final, hasta 2.000 € */
const MON_STEPS = [0, 5, ...Array.from({ length: 10 }, (_, i) => 10 * (i + 1)), ...Array.from({ length: 16 }, (_, i) => 125 + 25 * i), ...Array.from({ length: 10 }, (_, i) => 550 + 50 * i), ...Array.from({ length: 10 }, (_, i) => 1100 + 100 * i)];
const monIdx = v => MON_STEPS.reduce((best, x, i) => Math.abs(x - v) < Math.abs(MON_STEPS[best] - v) ? i : best, 0);
function bindProj() {
    const v = $("[data-proj]"); if (!v) return;
    if (v._upd) return v._upd();
    const age = ageOf(), base = miles().total, value = money().value, r = RATE(EST.gross) / 12, maxAge = 45;
    let t;
    const upd = () => {
        const mon = MON_STEPS[+$('[data-i="mon"]', v).value], price = +$('[data-i="price"]', v).value, need = price * DOWN_PCT;
        // mes a mes hasta los 45
        const path = [{ m: 0, v: value }]; let x = value, reach = null;
        for (let k = 1; k <= (maxAge - age) * 12; k++) { x = x * (1 + r) + mon; path.push({ m: k, v: x }); if (reach === null && x >= need) reach = k; }
        if (value >= need) reach = 0;
        const reachAge = reach === null ? null : age + Math.ceil(reach / 12), goalAge = reachAge ?? maxAge, yrs = goalAge - age;
        S.goal = { price, age: Math.max(goalAge, age + 1) }; clearTimeout(t); t = setTimeout(save, 300);
        const giftM = Math.min(MILES.giftMonthCap, Math.floor(S.schedules.reduce((a, y) => a + y.amount, 0) / 5));
        const mt = base + ((mon > 0 ? MILES.monthOwn * 12 : 0) + giftM * 12 + MILES.itv) * yrs, c = cutOf(mt);
        const o = (k, txt) => { $(`[data-o="${k}"]`, v).innerHTML = txt; };
        o("mon", eur(mon)); o("price", eur(price));
        if (reachAge !== null) o("say", `Tendrías la entrada de <b>${eur(need)}</b> a los <b>${reachAge} años</b>${reach ? `, dentro de ${Math.ceil(reach / 12)} ${Math.ceil(reach / 12) === 1 ? "año" : "años"}` : ""}.`);
        else {
            const target = Math.min(maxAge, age + 12), n = (target - age) * 12, needMon = Math.ceil(Math.max(0, need - value * (1 + r) ** n) / (((1 + r) ** n - 1) / r) / 5) * 5;
            o("say", `Con ${eur(mon)} al mes tendrías unos <b>${eur(path[path.length - 1].v)}</b> a los ${maxAge} años, por debajo de la entrada de <b>${eur(need)}</b>. Para tenerla a los ${target} harían falta unos <b>${eur(needMon)} al mes</b>. También ayudan una casa más pequeña, el apoyo de tu familia o el aval del ICO.`);
        }
        const hz = Math.max(1, goalAge - age) * 12, at = g => { let x = value; for (let k = 0; k < hz; k++) x = x * (1 + RATE(g) / 12) + mon; return x; };
        o("range", `Según el mercado, a los ${goalAge} años tendrías entre <b>${eur(at(EST.scenarios[0][0]))}</b> (escenario prudente, ${EST.scenarios[0][0]} %) y <b>${eur(at(EST.scenarios[2][0]))}</b> (optimista, ${EST.scenarios[2][0]} %). También podrías tener menos de lo aportado.`);
        o("atk", `Millas a los ${goalAge} años`); o("miles", num(mt)); o("cut", `−${pts(c)} puntos`); o("save", eur(mortgageSaving(c)));
        // gráfica: lo que ahorras frente a la entrada que necesitas
        const box = $('[data-o="chart"]', v), W = Math.max(300, box.clientWidth), H = W < 560 ? 200 : 240, pl = 0, pr = 8, pt = 22, pb = 26;
        const endM = Math.min(path.length - 1, Math.max(reach === null ? path.length - 1 : reach + 36, 60)), ser = path.slice(0, endM + 1);
        const top = Math.max(need * 1.18, ser[ser.length - 1].v * 1.05), X = k => pl + k / endM * (W - pl - pr), Y = y => pt + (1 - y / top) * (H - pt - pb);
        const line = ser.filter((_, i) => i % 2 === 0 || i === ser.length - 1).map((q, i) => `${i ? "L" : "M"}${X(q.m).toFixed(1)},${Y(q.v).toFixed(1)}`).join("");
        const ticks = []; for (let a = age; a <= age + endM / 12; a += endM > 180 ? 5 : endM > 84 ? 2 : 1) ticks.push(a);
        box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Lo que ahorrarías hasta la entrada">
          <defs><linearGradient id="pjg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--blue)" stop-opacity=".22"/><stop offset="1" style="stop-color:var(--blue)" stop-opacity="0"/></linearGradient></defs>
          <line x1="0" x2="${W}" y1="${H - pb}" y2="${H - pb}" style="stroke:var(--line-2)"/>
          ${ticks.map(a => `<text x="${X((a - age) * 12).toFixed(1)}" y="${H - 6}" text-anchor="${a === age ? "start" : "middle"}" class="pj2-t">${a === age ? "Hoy" : `${a} años`}</text>`).join("")}
          <path d="${line}L${X(endM).toFixed(1)},${H - pb}L${X(0)},${H - pb}Z" fill="url(#pjg)"/>
          <path d="${line}" fill="none" style="stroke:var(--blue)" stroke-width="2.4" stroke-linejoin="round"/>
          <line x1="0" x2="${W}" y1="${Y(need).toFixed(1)}" y2="${Y(need).toFixed(1)}" style="stroke:var(--gold)" stroke-width="1.6" stroke-dasharray="5 5"/>
          <text x="${W - pr}" y="${(Y(need) - 8).toFixed(1)}" text-anchor="end" class="pj2-need">Entrada · ${eur(need)}</text>
          ${reach !== null && reach <= endM ? `<line x1="${X(reach).toFixed(1)}" x2="${X(reach).toFixed(1)}" y1="${Y(need).toFixed(1)}" y2="${H - pb}" style="stroke:var(--gold)" stroke-dasharray="2 4"/>
            <circle cx="${X(reach).toFixed(1)}" cy="${Y(need).toFixed(1)}" r="7" style="fill:var(--gold);stroke:var(--surface)" stroke-width="3"/>
            <text x="${Math.min(W - 60, Math.max(40, X(reach))).toFixed(1)}" y="${(Y(need) - 14).toFixed(1)}" text-anchor="middle" class="pj2-reach">${reachAge} años</text>` : ""}
        </svg>`;
    };
    v._upd = upd; $$("input", v).forEach(i => i.addEventListener("input", upd)); upd();
}

/* ---------------- Familia (vista del joven) */
function vFamiliaJoven() {
    const al = allocation(), gifts = S.money.filter(isGift).reverse(), ok = geminiAllowed(), adult = isAdult(), pend = S.pending || [];
    const invite = `Estoy aprendiendo a invertir en Horizonte, de CaixaBank. Desde el área familiar puedes ayudarme con mi primera casa: ${location.origin}${location.pathname}#/alta/familia`;
    const ask = txt => adult ? "" : btn("Pedir", "invite", "sm", `data-text="${esc(`Hola, ¿me das permiso para ${txt} en Horizonte? Entra en el área familiar y mira «Permisos»: ${location.origin}${location.pathname}`)}"`);
    const antState = al.fears.length ? (al.active ? "Aprobado" : al.needSuit ? "Falta el test" : "Pendiente de aprobación") : S.suit ? (S.suit.ok ? "Aún no lo has elegido" : "No disponible con tus respuestas") : "Falta el test";
    return `${pageH("Familia", "Tu familia puede regalarte dinero para tu futuro, aprobar tus decisiones y ver tu progreso.")}
    <div class="grid">
      ${card(`${cardH("Tu familia en Horizonte")}${S.family ? `<div class="rows"><div class="row"><span class="avatar">${esc(S.family.name.slice(0, 1).toUpperCase())}</span><div><b>${esc(S.family.name)}</b><span>${esc(S.family.relation)}${S.familyAuth ? " · Ha autorizado tu cuenta" : ""}${adult ? "" : " · Persona titular hasta los 18"}</span></div></div></div>` : empty("family", "Aún no hay nadie de tu familia", "Invítales para que puedan ayudarte.")}
        <div class="actions">${btn(`${ic("send")}Invitar a un familiar`, "invite", "primary", `data-text="${esc(invite)}"`)}${adult ? "" : btn(`${ic("family")}${S.callReq ? "Llamada solicitada" : "Que un gestor llame a mi familia"}`, "reqCall", "", S.callReq ? "disabled" : "")}</div>`, "c-6")}
      ${card(`${cardH("Permisos", adult ? "Ya eres mayor de edad: decides tú." : "Hasta los 18, los decide tu madre, padre o tutor.")}
        <div class="rows"><div class="row"><div><b>Antídoto</b><span>${antState}</span></div>${badge(al.active ? "Aprobado" : al.fears.length ? "Pendiente" : "Sin elegir", al.active ? "ok" : al.fears.length ? "warn" : "")}</div>
          <div class="row"><div><b>Gemini</b><span>Usar la información de tu cuenta para explicarte tu dinero</span></div>${adult ? toggle("gemOk", S.geminiOk, "Permitir Gemini") : ok ? badge("Permitido", "ok") : `${badge("Sin permiso")}${ask("que el asistente use los datos de mi cuenta")}`}</div>
          <div class="row"><div><b>Amigos en los juegos</b><span>Comparar tus resultados de los juegos con tus amigos y tu familia</span></div>${adult ? badge("Permitido", "ok") : S.friendsOk ? badge("Permitido", "ok") : `${badge("Sin permiso")}${ask("jugar con mis amigos y mi familia")}`}</div></div>`, "c-6")}
      ${pend.length ? card(`${cardH("Retiradas pendientes", "Tu familia tiene que aprobarlas.")}<div class="rows">${pend.map(x => `<div class="row"><span class="mv-ic warn">${ic("back")}</span><div><b>${eur(x.amount, true)}</b><span>Pedida el ${fmtD(x.date)}</span></div>${btn("Cancelar", "wdNo", "sm ghost", `data-id="${x.id}"`)}</div>`).join("")}</div>`, "c-12") : ""}
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
      ${card(stat("Su dinero", eur(m.value, true), `${eur(m.gifts, true)} aportados por la familia`), "c-4 stat-card")}
      ${card(stat(`Aportado por ${n}`, eur(Math.max(0, m.ownReal), true), "Con su propio dinero"), "c-4")}
      ${card(stat("Millas de casa", num(mi.total), `${pts(mi.cut)} puntos de bonificación posible`), "c-4")}
      ${card(stat("Con protección", eur(m.protect?.active ? m.protect.base : 0), m.protect?.lost ? "Se retiró antes de 12 meses" : `de ${RULES.protectCap} € en su primer año`), "c-4")}
      ${weekFamilyCard()}${talkCard()}${callCard()}
      ${card(`${cardH("Pendiente de tu aprobación")}${pendingRows()}`, "c-12")}
    </div>`;
}
function callCard() {
    return card(`${cardH("¿Quieres hablar con una persona?", "Pide que un gestor de CaixaBank os llame para resolver dudas, sin compromiso.")}
      <div class="actions">${S.callReq ? badge(`Solicitada el ${fmtD(S.callReq.date)}`, "ok") : btn(`${ic("family")}Pedir una llamada`, "reqCall", "primary")}</div>
      <p class="note">Propuesta de servicio: en esta demostración la solicitud se simula.</p>`, "c-6");
}
function pendingRows() {
    const al = allocation(), rows = [], n = esc(teenName());
    (S.pending || []).forEach(x => rows.push(`<div class="row"><span class="mv-ic warn">${ic("back")}</span><div><b>Retirada de ${eur(x.amount, true)}</b><span>Pedida el ${fmtD(x.date)} por ${n}.${money().protect?.active ? " Si se aprueba antes de los 12 meses, pierde la protección del primer año." : ""}</span></div><div class="fr-btns">${btn("Rechazar", "wdNo", "sm ghost", `data-id="${x.id}"`)}${btn("Aprobar", "wdOk", "sm primary", `data-id="${x.id}"`)}</div></div>`));
    if (al.pending && !al.needSuit) rows.push(`<a class="row" href="#/f/permisos"><span class="mv-ic warn">${ic("shield")}</span><div><b>Aprobar su Antídoto</b><span>Ha elegido: ${al.fears.map(f => esc(f.label.toLowerCase())).join(" y ")}.</span></div>${ic("chev", "chev")}</a>`);
    if (al.needSuit) rows.push(`<div class="row"><span class="mv-ic warn">${ic("shield")}</span><div><b>Falta el test de ${n}</b><span>Ha elegido un Antídoto, pero necesita hacer antes las seis preguntas sobre su situación.</span></div></div>`);
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
      ${card(`${cardH("Antídoto", al.fears.length ? `${n} ha elegido invertir una parte en lo que le preocupa.` : `${n} aún no ha elegido su Antídoto.`, al.fears.length && !adult && S.suit?.ok ? toggle("approve", S.antidoteApproved, "Aprobar Antídoto") : "")}
        ${al.fears.length ? `${stack(al.planned)}<div class="rows">${al.planned.map(p => `<div class="row">${sw(p.fund)}<div><b>${FUNDS[p.fund].name} · ${wpct(p.w)}</b><span>${p.fear ? esc(p.fear.label) : "Cartera base diversificada"}</span></div></div>`).join("")}</div><p class="note">${S.suit ? `Test de situación: ${{ sat: "permite un Antídoto pequeño", base: "solo cartera base", corto: "plazo corto: no se recomienda invertir este dinero", revisar: "pendiente de repasar" }[S.suit.level] || ""}.` : `${n} aún no ha hecho el test de seis preguntas, necesario para activar un Antídoto.`} No es un seguro: ese fondo puede perder valor.</p>` : ""}`, "c-6")}
      ${card(`${cardH("Gemini", "Permitir que Gemini use la información de su cuenta (aportaciones y objetivos) para explicarle su dinero. Nunca se usa para publicidad.", adult ? "" : toggle("gemOk", S.geminiOk, "Permitir Gemini"))}
        <p class="note">Puedes retirar el permiso en cualquier momento.</p>`, "c-6")}
      ${card(`${cardH("Amigos en los juegos", `Permitir que ${n} conecte con sus amigos para comparar los resultados de los juegos. Solo se comparten su nombre con la inicial del apellido y sus aciertos; nada de su dinero.`, adult ? "" : toggle("frOk", S.friendsOk, "Permitir amigos en los juegos"))}
        <p class="note">Las conexiones se aceptan una a una y se pueden quitar cuando quiera.</p>`, "c-6")}
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
          <button class="btn primary full">Guardar cambios</button></form>`, "c-7")}
      ${card(`${cardH("Cuenta")}${S.family ? `<p class="note">${fam ? "Estás en el área familiar." : "Estás en tu área personal."} En este dispositivo puedes cambiar de área.</p><div class="actions">${btn(`${ic("switch")}${fam ? `Ir al área de ${esc(teenName())}` : "Ir al área familiar"}`, "switchRole")}</div>` : ""}
        <p class="note">Los datos se guardan en este dispositivo y puedes descargarlos cuando quieras.</p><div class="actions">${btn("Descargar mis datos", "exportData")}${btn("Cerrar sesión y borrar datos", "reset", "danger")}</div>`, "c-5")}
      ${installCard()}
    </div>${legal()}`;
}

/* ------------------------------------------------------------------ estructura y rutas */
const NAV_T = [["inicio", "Inicio", "home"], ["dinero", "Dinero", "chart"], ["aprende", "Aprende", "book"], ["antidoto", "Antídoto", "spark"], ["casa", "Tu casa", "house"]];
const NAV_T3 = [["voz", "Tu voz", "voice"], ["proyecto", "Tu proyecto", "bulb"]];
const NAV_T2 = [["familia", "Familia", "family"], ["ajustes", "Ajustes", "settings"]];
const NAV_F = [["f/resumen", "Resumen", "home"], ["f/regalar", "Regalos", "gift"], ["f/permisos", "Permisos", "key"]];
const NAV_F2 = [["ajustes", "Ajustes", "settings"]];

function shell(route, content) {
    const fam = S.role === "family", main = fam ? NAV_F : NAV_T, extra = fam ? NAV_F2 : NAV_T2;
    const item = ([id, l, i]) => `<a href="#/${id}" class="${route === id ? "on" : ""}" ${route === id ? 'aria-current="page"' : ""}>${ic(i)}<span>${l}</span></a>`;
    const who = (fam ? S.family?.name : teenName()) || "";
    const home = fam ? "#/f/resumen" : "#/inicio";
    const tabs = fam ? [...main, ...extra] : main;
    return `<div class="shell ${fam ? "fam" : ""}">
      <aside class="side">${brand(home, 34)}${fam ? `<span class="area">Área familiar</span>` : ""}
        <nav class="side-nav" aria-label="Secciones">${main.map(item).join("")}${fam ? "" : `<span class="sep"></span>${NAV_T3.map(item).join("")}`}<span class="sep"></span>${extra.map(item).join("")}</nav>
        <div class="side-foot">${themeBtn()}<span>${isDark() ? "Modo noche" : "Modo día"}</span></div>
        <a class="me" href="#/ajustes"><span class="avatar">${esc(who.slice(0, 1).toUpperCase())}</span><div><b>${esc(who)}</b><small>${fam ? esc(S.family?.relation || "") : `${ageOf()} años`}</small></div></a></aside>
      <header class="topbar">${brand(home, 28)}${fam ? `<span class="area">Familia</span>` : ""}${themeBtn()}${fam ? "" : `<button class="icon-btn" data-act="moreMenu" aria-label="Más secciones">${ic("menu")}</button>`}<a class="avatar" href="#/ajustes" aria-label="Ajustes">${esc(who.slice(0, 1).toUpperCase())}</a></header>
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
    if (!(r === "juego" && parts[1] === "masomenos")) { clearInterval(mmTimer); if (mm?.phase === "over") mm = null; }
    let html, view = "app";
    if (r === "amigos") { if (params.get("c")) setPendingInvite(params.get("c").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)); location.hash = S.role === "teen" ? "#/aprende" : "#/"; return; }
    const learner = !S.role || S.role === "teen";          // los temas y los juegos se pueden probar sin cuenta
    if (r === "verificar") { html = vVerificar(params); view = "public"; }
    else if (r === "legal") { html = vLegal(); view = "public"; }
    else if (r === "tema" && learner) { html = vTema(parts[1], parts[2]); view = "focus"; if (!html) { location.hash = homeLearn(); return; } }
    else if (r === "juego" && learner) { html = vJuego(parts[1]); view = "focus"; if (!html) { location.hash = homeLearn(); return; } }
    else if (r === "prueba" && S.role === "teen") { html = vExamen(); view = "focus"; }
    else if (!S.role) { html = r === "alta" ? vAlta(parts[1] === "familia" ? "familia" : "joven") : r === "familias" ? vFamilias() : r === "probar" ? vProbar() : vLanding(); view = "public"; }
    else {
        let route, content;
        if (S.role === "family") {
            route = r === "f" && ["resumen", "regalar", "permisos"].includes(parts[1]) ? "f/" + parts[1] : r === "ajustes" ? "ajustes" : "f/resumen";
            content = { "f/resumen": vFResumen, "f/regalar": vFRegalar, "f/permisos": vFPermisos, ajustes: vAjustes }[route]();
        } else {
            route = r === "carnet" ? "aprende" : ["inicio", "aprende", "dinero", "antidoto", "casa", "voz", "proyecto", "familia", "ajustes"].includes(r) ? r : "inicio";
            content = { inicio: vInicio, aprende: vAprende, dinero: vDinero, antidoto: vAntidoto, casa: vCasa, voz: vVoz, proyecto: vProyecto, familia: vFamiliaJoven, ajustes: vAjustes }[route]();
        }
        html = shell(route, content);
    }
    document.body.dataset.view = view;
    $("#app").innerHTML = html;
    bindViz(); bindProj(); bindLanding(); bindValueCharts();
    if (r === "juego" && parts[1] === "masomenos") mmStart();
    if (r === "antidoto" && !ranking) loadRanking().then(() => { if (location.hash.startsWith("#/antidoto")) rerender(); });
    const chat = $("#chat"); if (chat) chat.scrollTop = chat.scrollHeight;
}
function rerender() { const y = scrollY; render(); scrollTo(0, y); }

/* ------------------------------------------------------------------ eventos */
function finishTeen() {
    const d = alta.data, keep = { lessons: S.lessons || {}, games: S.games || {}, mmBest: S.mmBest };      // lo probado sin cuenta se conserva
    S = { ...blank(), ...keep }; S.role = "teen";
    S.teen = { name: d.name.trim(), surname: "", birth: d.birth };
    if (d.fname) { S.family = { name: d.fname.trim(), relation: d.relation, email: d.femail || "" }; S.familyAuth = true; }
    save(); alta = null; location.hash = "#/inicio"; toast(`Te damos la bienvenida a Horizonte, ${esc(S.teen.name)}`);
}
document.addEventListener("click", async e => {
    const b = e.target.closest("[data-act]");
    if (!b || b.tagName === "SELECT" || (b.tagName === "INPUT" && b.type === "checkbox")) return;
    const act = b.dataset.act;
    if (act === "closeSheet") closeSheet();
    else if (act === "altaBack") { alta.step = Math.max(0, alta.step - 1); render(); }
    else if (act === "lessonAns") { lessonState.answers[+b.dataset.q] = +b.dataset.i; rerender(); }
    else if (act === "lessonDone") { const id = b.dataset.id; if (!S.lessons[id]) { S.lessons[id] = iso(new Date()); save(); toast(S.role ? `Tema completado · +${MILES.lesson} millas de casa` : "Tema completado. Crea tu cuenta para guardar tu progreso y llegar al diploma."); } location.hash = homeLearn(); }
    else if (act === "gameAns") { const q = gameState.qs[gameState.i], i = +b.dataset.i; gameState.ans = i; if (i === q.a) gameState.score++; rerender(); }
    else if (act === "gameNext") {
        const g = gameState;
        if (g.i === g.qs.length - 1) {
            g.over = true; const t = iso(new Date());
            if (!S.games[t]) { const before = miles().total; S.games[t] = { id: g.id, score: g.score }; save(); g.miles = miles().total - before; }
            else if (g.score > S.games[t].score) { S.games[t] = { id: g.id, score: g.score }; save(); }
            friendsAfterGame(g.id, g.score);
        } else { g.i++; g.ans = null; }
        render(); scrollTo(0, 0);
    }
    else if (act === "gameAgain") { newGame(b.dataset.id); render(); }
    else if (act === "installApp") { if (installEvt) { installEvt.prompt(); const r = await installEvt.userChoice; installEvt = null; if (r.outcome !== "accepted") toast("Puedes instalarla cuando quieras desde aquí"); rerender(); } }
    else if (act === "mmGuess") mmGuess(b.dataset.v);
    else if (act === "mmAgain") { mmNew(); render(); }
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
                if (first) { S.diploma = { id: makeId(), date: S.exam.date }; save(); addMoney({ amount: RULES.prize, src: "premio" }); certRegister(); }
                save();
            }
        } else { x.i++; x.ans = null; }
        render(); scrollTo(0, 0);
    }
    else if (act === "openWithdraw") withdrawSheet();
    else if (act === "openSuit") suitSheet();
    else if (act === "shareInv") investorCard(true);
    else if (act === "dlInv") investorCard(false);
    else if (act === "wdOk" || act === "wdNo") {
        const i = (S.pending || []).findIndex(x => x.id === b.dataset.id); if (i < 0) return;
        const x = S.pending.splice(i, 1)[0];
        if (act === "wdOk") { applyWithdrawal(Math.min(x.amount, Math.floor(money().value * 100) / 100)); toast(`Retirada de ${eur(x.amount, true)} aprobada`); }
        else { save(); toast("Solicitud retirada"); }
        rerender();
    }
    else if (act === "reqCall") { S.callReq = { date: iso(new Date()) }; save(); toast("Solicitud enviada (aquí se simula). Un gestor de CaixaBank llamaría en un día hábil."); rerender(); }
    else if (act === "askPerm") { const t = `Hola, ¿me das permiso para que el asistente de Horizonte use los datos de mi cuenta? Entra en el área familiar y mira «Permisos»: ${location.origin}${location.pathname}`; if (navigator.share) { try { await navigator.share({ title: "Horizonte", text: t }); } catch (err) { /* cancelado */ } } else { try { await navigator.clipboard.writeText(t); toast("Mensaje copiado para tu familia"); } catch (err) { prompt("Copia el mensaje:", t); } } }
    else if (act === "examRetry") { examState = null; render(); }
    else if (act === "dlDiploma") downloadDiploma();
    else if (act === "shareCert") {
        const u = verifyUrl(diplomaData()), t = `He conseguido el Certificado Horizonte · Fundamentos de inversión, de CaixaBank Asset Management.`;
        if (navigator.share) { try { await navigator.share({ title: "Certificado Horizonte", text: t, url: u }); } catch (err) { /* cancelado */ } }
        else { try { await navigator.clipboard.writeText(`${t} ${u}`); toast("Enlace copiado para compartir"); } catch (err) { prompt("Copia el enlace:", u); } }
    }
    else if (act === "copyVerify") { const u = verifyUrl(diplomaData()); try { await navigator.clipboard.writeText(u); toast("Enlace de verificación copiado"); } catch (err) { prompt("Copia el enlace:", u); } }
    else if (act === "itv") { const t = iso(new Date()); if (S.itv.includes(t)) return toast("Ya has hecho la revisión hoy"); S.itv.push(t); if (S.diploma) S.diploma.reg = false; save(); certRegister(); toast(`Revisión anual completada · +${MILES.itv} millas de casa`); location.hash = "#/antidoto"; }
    else if (act === "openContribute") contributeSheet();
    else if (/^fr[A-Z]/.test(act)) friendsAct(act, b);
    else if (/^(voz|pj)[A-Z]/.test(act)) cxAct(act, b);
    else if (act === "moreMenu") {
        const cur = (location.hash.replace(/^#\/?/, "").split(/[/?]/)[0]) || "inicio";
        const grp = (t, items) => `<p class="more-h">${t}</p>${items.map(([id, l, i]) => `<a href="#/${id}" class="${cur === id ? "on" : ""}">${ic(i)}<span>${l}</span>${ic("chev", "chev")}</a>`).join("")}`;
        sheet("Menú", `<nav class="more-nav" aria-label="Todas las secciones">${grp("Tu camino", NAV_T)}${grp("Comunidad", NAV_T3)}${grp("Cuenta", NAV_T2)}</nav>`);
    }
    else if (act === "vRange") {
        vRange = b.dataset.k; $$(".vc-ranges button").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
        const box = $("[data-vchart]:not(.mini)"); if (box) { box.dataset.range = vRange; drawValueChart(box); }
    }
    else if (act === "allMoves") { allMoves = !allMoves; rerender(); }
    else if (act === "setWeekly") { S.weekly = +b.dataset.v; save(); toast(S.weekly ? `Apartarás ${eur(S.weekly)} cada semana` : "Ahorro semanal desactivado"); rerender(); }
    else if (act === "openCred") credSheet();
    else if (act === "theme") setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    else if (act === "setAmount") { const i = $('#sheet input[name="amount"]'); i.value = b.dataset.v; i.focus(); }
    else if (act === "fearIdea") addFear(b.dataset.t);
    else if (act === "moreIdeas") { moreIdeas = !moreIdeas; rerender(); }
    else if (act === "fearDel") { S.fears.splice(+b.dataset.i, 1); if (!isAdult()) S.antidoteApproved = false; save(); rerender(); }
    else if (act === "ask") askQ(b.dataset.q);
    else if (act === "csv") {
        const q = v => `"${String(v).replace(/"/g, '""')}"`;
        const rows = [["Fecha", "Concepto", "Importe (€)", "Mensaje"], ...[...S.money].sort((a, b) => a.date < b.date ? -1 : 1).map(c => [c.date, SOURCES[c.src]?.label || c.src, String(c.amount).replace(".", ","), c.msg || ""])];
        saveFile("extracto-horizonte.csv", "﻿" + rows.map(r => r.map(q).join(";")).join("\r\n"), "text/csv;charset=utf-8"); toast("Extracto descargado");
    }
    else if (act === "exportData") { saveFile("mis-datos-horizonte.json", JSON.stringify(S, null, 2), "application/json"); toast("Tus datos se han descargado"); }
    else if (act === "invite") { const t = b.dataset.text; if (navigator.share) { try { await navigator.share({ title: "Horizonte", text: t }); } catch (err) { /* cancelado */ } } else { try { await navigator.clipboard.writeText(t); toast("Invitación copiada. Compártela por WhatsApp o por correo."); } catch (err) { prompt("Copia la invitación:", t); } } }
    else if (act === "cancelSched") { S.schedules.splice(+b.dataset.i, 1); save(); toast("Aportación mensual cancelada"); rerender(); }
    else if (act === "switchRole") { S.role = S.role === "family" ? "teen" : "family"; save(); location.hash = S.role === "family" ? "#/f/resumen" : "#/inicio"; }
    else if (act === "reset") { if (confirm("Se borrarán todos los datos de este dispositivo. ¿Continuar?")) { S = blank(); save(); ranking = null; sb2Save(null); setPendingInvite(""); soc = { red: [], partidas: [], loaded: false, loading: false, err: "" }; location.hash = "#/"; render(); } }
});
document.addEventListener("change", e => {
    const t = e.target, act = t.dataset.act;
    if (act === "weekly") { S.weekly = +t.value; save(); toast(S.weekly ? `Apartarás ${eur(S.weekly)} cada semana` : "Ahorro semanal desactivado"); }
    else if (act === "roundup") { S.roundup = t.checked; save(); toast(S.roundup ? "Redondeo activado" : "Redondeo desactivado"); }
    else if (act === "approve") { S.antidoteApproved = t.checked; save(); toast(t.checked ? "Antídoto aprobado" : "Aprobación retirada"); }
    else if (act === "fearFund") { const f = S.fears[+t.dataset.i]; if (f && t.value) { f.fund = t.value; if (!isAdult()) S.antidoteApproved = false; save(); toast(`Cambiado a ${FUNDS[t.value].name}`); } }
    else if (act === "frOk") { S.friendsOk = t.checked; save(); toast(t.checked ? "Permiso concedido para jugar con amigos" : "Permiso retirado"); }
    else if (act === "frTag") { S.famTags ||= {}; if (t.value) S.famTags[t.dataset.c] = t.value; else delete S.famTags[t.dataset.c]; save(); toast(t.value ? `Marcado como: ${t.value}` : "Ya no se marca como familia"); }
    else if (act === "gemOk") { S.geminiOk = t.checked; save(); toast(t.checked ? "Permiso concedido a Gemini" : "Permiso retirado"); }
    else return;
    rerender();
});
document.addEventListener("submit", e => {
    const f = e.target.closest("[data-form]");
    if (!f) return;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f)), k = f.dataset.form;
    if (k === "alta0") {
        const age = Math.round(+d.age);
        if (!(age >= 5 && age <= 40)) return toast("Escribe tu edad");
        Object.assign(alta.data, { name: d.name.trim(), age });
        if (age >= RULES.adultAge) { alta.data.birth = birthFromAge(age); finishTeen(); return; }
        alta.step = 1; render();
    } else if (k === "altaF1") { Object.assign(alta.data, { name: d.name.trim(), birth: d.birth }); alta.step = 2; render(); }
    else if (k === "alta1") {
        const age = ageOf(d.birth);
        if (age >= RULES.adultAge || age < 0) return toast("Con esa fecha, la persona ya es mayor de edad. Revisa la fecha de nacimiento.");
        if (alta.data.age != null && Math.abs(age - alta.data.age) > 1) return toast("La fecha de nacimiento no coincide con la edad que indicaste.");
        Object.assign(alta.data, d); finishTeen();
    }
    else if (k === "frCode") connectCode(d.c);
    else if (k === "fearAdd") addFear(d.t);
    else if (k === "pj") pjSave(f);
    else if (k === "altaF0") { Object.assign(alta.data, d); alta.step = 1; render(); }
    else if (k === "altaF2") {
        const a = alta.data;
        S = blank(); S.role = "family";
        S.family = { name: a.fname.trim(), relation: a.relation, email: a.femail || "" };
        S.teen = { name: a.name.trim(), surname: "", birth: a.birth };
        S.familyAuth = true;
        save(); alta = null; location.hash = "#/f/resumen"; toast("Cuenta familiar creada");
    } else if (k === "withdraw") {
        const amount = Math.round(+d.amount * 100) / 100;
        if (!(amount > 0) || amount > money().value + 0.005) return toast("No puedes retirar más de lo que tienes");
        closeSheet();
        if (isAdult()) { applyWithdrawal(amount); toast(`Retirada de ${eur(amount, true)} hecha`); }
        else { (S.pending ||= []).push({ id: "w" + Date.now().toString(36), amount, date: iso(new Date()) }); save(); toast("Solicitud enviada a tu familia"); }
        rerender();
    } else if (k === "suit") {
        const ans = Object.fromEntries(SUIT.map(q => [q.id, +d[q.id]])), res = suitResult(ans);
        S.suit = { ...res, ans };
        if (!res.ok) { S.antidoteApproved = false; if (S.fears.length) S.fears = []; }
        save(); closeSheet(); toast(res.ok ? "Test hecho: puedes elegir un Antídoto" : "Test hecho: de momento, solo cartera base"); rerender();
    } else if (k === "contribute") {
        const amount = Math.round(+d.amount * 100) / 100;
        if (!(amount > 0)) return;
        closeSheet(); addMoney({ amount, src: d.src }); rerender();
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
        S.teen = { name: d.name.trim(), surname: d.surname.trim(), birth: d.birth }; save(); toast("Cambios guardados"); rerender();
    } else if (k === "ask") { askQ(d.q); f.reset(); }
});
document.addEventListener("keydown", e => {
    if (e.key === "Escape" && $("#sheet.open")) closeSheet();
    if (location.hash === "#/juego/masomenos" && mm?.phase === "play" && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); mmGuess(e.key === "ArrowUp" ? "up" : "down"); }
});
function saveFile(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type })), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function askQ(q) {
    if (!q || !q.trim() || typing) return;
    S.chat.push({ r: "u", t: q.trim(), ts: Date.now() }); save();
    typing = true; rerender();
    const t0 = Date.now(), res = await askGemini(q, assistantCtx(), S.chat.slice(0, -1));
    await new Promise(r => setTimeout(r, Math.max(0, 650 - (Date.now() - t0))));   // una pausa breve, como en un asistente real
    typing = false;
    S.chat.push({ r: "g", ...res, ts: Date.now() });
    S.chat = S.chat.slice(-16); save(); rerender();
}
function investorSVG() {
    const since = (S.money.filter(isOwnReal).sort((a, b) => a.date.localeCompare(b.date))[0] || {}).date || iso(new Date()), when = T(since).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1d29"/><stop offset="1" stop-color="#007eae"/></linearGradient></defs>
      <rect width="1080" height="1350" fill="url(#g)"/><circle cx="880" cy="250" r="260" fill="#ffffff" opacity=".05"/><circle cx="160" cy="1180" r="320" fill="#f7b500" opacity=".10"/>
      <text x="90" y="170" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#e8c77a" letter-spacing="6">HORIZONTE</text>
      <text x="90" y="640" font-family="'Source Serif 4', Georgia, serif" font-size="150" font-weight="600" fill="#ffffff">Ya soy</text>
      <text x="90" y="800" font-family="'Source Serif 4', Georgia, serif" font-size="150" font-weight="600" fill="#f7b500">inversor.</text>
      <text x="90" y="900" font-family="Inter, Arial, sans-serif" font-size="40" fill="#ffffff" opacity=".85">Desde ${esc(when)}</text>
      <text x="90" y="1230" font-family="Inter, Arial, sans-serif" font-size="30" fill="#ffffff" opacity=".8">Aprendiendo a invertir con Horizonte</text>
      <text x="90" y="1275" font-family="Inter, Arial, sans-serif" font-size="26" fill="#ffffff" opacity=".6">CaixaBank Asset Management · Invertir conlleva riesgos</text></svg>`;
}
async function investorCard(share) {
    const img = new Image(), url = URL.createObjectURL(new Blob([investorSVG()], { type: "image/svg+xml" }));
    await new Promise(r => { img.onload = r; img.src = url; });
    const c = document.createElement("canvas"); c.width = 1080; c.height = 1350; c.getContext("2d").drawImage(img, 0, 0); URL.revokeObjectURL(url);
    const blob = await new Promise(r => c.toBlob(r)), file = new File([blob], "ya-soy-inversor.png", { type: "image/png" }), text = "Ya soy inversor: estoy aprendiendo a invertir con Horizonte, de CaixaBank Asset Management.";
    if (share && navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], text }); } catch (err) { /* cancelado */ } return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "ya-soy-inversor.png"; a.click();
}
function investorCardUI(m) {
    return m.firstOwn ? card(`<div class="inv-card"><div><span class="kicker">Tu primer euro</span><h2>Ya eres inversor.</h2><p>Si quieres, crea una imagen para compartirla. No lleva importes ni rentabilidades, y no sustituye a tu Certificado Horizonte.</p></div>
      <div class="actions">${btn(`${ic("send")}Compartir`, "shareInv", "primary")}${btn(`${ic("download")}Descargar`, "dlInv", "")}</div></div>`, "c-12") : "";
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

if (S.diploma && !S.diploma.reg) setTimeout(certRegister, 1500);
window.addEventListener("hashchange", () => {
    if (/^#(ciclo|por-que|aprende|antidoto|casa|voz|proyecto|familias|preguntas)$/.test(location.hash)) return;
    closeSheet(); render(); scrollTo(0, 0);
});
render();
