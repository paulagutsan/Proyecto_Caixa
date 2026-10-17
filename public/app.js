"use strict";
/* Horizonte · SPA sin dependencias */

/* =========================================================
   Utilidades
========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const eur0 = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const fmt = n => (Number.isInteger(n) || Math.abs(n) >= 1000 ? eur0 : eur2).format(n);
const pct = n => `${Math.round(n)}%`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const isoDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const NOW = new Date();
const YEAR = NOW.getFullYear();
const lsGet = (k, d = null) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

async function api(path, opts = {}) {
    const r = await fetch(`/api${path}`, {
        method: opts.method || "GET",
        headers: opts.body ? { "Content-Type": "application/json" } : {},
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        credentials: "same-origin"
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(data.error || "Algo ha fallado."), { status: r.status });
    return data;
}

/* =========================================================
   Estado + persistencia (invitado: localStorage · cuenta: servidor)
========================================================= */
const blank = () => ({ v: 2, goals: [], xp: 0, lessons: [], quiz: null, flags: {} });
function normalize(s) {
    const b = blank();
    if (!s || typeof s !== "object") return b;
    return {
        ...b, ...s,
        goals: Array.isArray(s.goals) ? s.goals.map(g => ({ emoji: "🎯", monthly: 0, contribs: [], ...g, contribs: Array.isArray(g.contribs) ? g.contribs : [] })) : [],
        lessons: Array.isArray(s.lessons) ? s.lessons : [],
        flags: s.flags && typeof s.flags === "object" ? s.flags : {}
    };
}
let user = null;
let S = normalize(lsGet("hz_guest"));
let syncTimer = null;

function save() {
    lsSet(user ? `hz_user_${user.id}` : "hz_guest", S);
    if (!user) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
        try { await api("/state", { method: "PUT", body: { state: S } }); }
        catch (e) { if (e.status === 401) { user = null; paintChrome(); toast("Tu sesión caducó. Vuelve a entrar para sincronizar."); } }
    }, 600);
}
const hasData = s => s && (s.goals?.length || s.xp);

/* =========================================================
   Cálculos
========================================================= */
const saved = g => g.contribs.reduce((s, c) => s + c.amount, 0);
const totalSaved = () => S.goals.reduce((s, g) => s + saved(g), 0);
const totalMonthly = () => S.goals.reduce((s, g) => s + (+g.monthly || 0), 0);
const totalTarget = () => S.goals.reduce((s, g) => s + g.target, 0);
const progress = g => Math.min(100, (saved(g) / g.target) * 100);
const isDone = g => saved(g) >= g.target;
const monthlyRate = a => Math.pow(1 + a / 100, 1 / 12) - 1;

function fv(initial, monthly, years, annualPct) {
    const r = monthlyRate(annualPct);
    let b = initial;
    for (let m = 0; m < Math.round(years * 12); m++) b = b * (1 + r) + monthly;
    return b;
}
function monthsToReach(g, annualPct) {
    let bal = saved(g), m = 0;
    if (bal >= g.target) return 0;
    if (!(g.monthly > 0)) return Infinity;
    const r = monthlyRate(annualPct);
    while (bal < g.target && m < 1200) { bal = bal * (1 + r) + g.monthly; m++; }
    return m < 1200 ? m : Infinity;
}
const monthsLeft = g => (g.year - YEAR) * 12 + 11 - NOW.getMonth();
function requiredMonthly(target, initial, months, annualPct) {
    if (months <= 0) return Math.max(0, target - initial);
    const r = monthlyRate(annualPct);
    const grow = Math.pow(1 + r, months);
    const need = target - initial * grow;
    if (need <= 0) return 0;
    return r === 0 ? need / months : (need * r) / (grow - 1);
}
const roundUp5 = n => Math.ceil(n / 5) * 5;
function etaLabel(months) {
    if (!isFinite(months)) return "sin fecha (aporta algo cada mes)";
    const d = new Date(YEAR, NOW.getMonth() + months, 1);
    return d.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
}
function goalStatus(g) {
    if (isDone(g)) return { cls: "done", txt: "¡Conseguida! 🏆" };
    const ok = monthsToReach(g, 5) <= monthsLeft(g);
    return ok ? { cls: "ok", txt: "Vas en plazo ✅" } : { cls: "late", txt: "Hay que acelerar ⚡" };
}

/* ---- gamificación ---- */
const LEVELS = ["Novato", "Aprendiz", "En racha", "Constante", "Pro", "Crack", "Leyenda"];
const level = () => Math.floor(S.xp / 100) + 1;
const levelName = () => LEVELS[Math.min(level() - 1, LEVELS.length - 1)];
function mondayKey(d) {
    const x = new Date(d + "T12:00:00");
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return isoDate(x);
}
function weekStreak() {
    const weeks = new Set(S.goals.flatMap(g => g.contribs.map(c => mondayKey(c.date))));
    let cursor = new Date(mondayKey(isoDate()) + "T12:00:00");
    if (!weeks.has(isoDate(cursor))) cursor.setDate(cursor.getDate() - 7); // aún puedes aportar esta semana
    let n = 0;
    while (weeks.has(isoDate(cursor))) { n++; cursor.setDate(cursor.getDate() - 7); }
    return n;
}
const contributedThisWeek = () => S.goals.some(g => g.contribs.some(c => mondayKey(c.date) === mondayKey(isoDate())));
const BADGES = [
    { id: "meta", ico: "🎯", name: "Primera meta", on: () => S.goals.length > 0 },
    { id: "ahorro", ico: "💸", name: "Primer ahorro", on: () => totalSaved() > 0 },
    { id: "racha", ico: "🔥", name: "Racha de 3", on: () => weekStreak() >= 3 },
    { id: "mil", ico: "💎", name: "1.000 € ahorrados", on: () => totalSaved() >= 1000 },
    { id: "done", ico: "🏆", name: "Meta cumplida", on: () => S.goals.some(isDone) },
    { id: "saber", ico: "🧠", name: "3 lecciones", on: () => S.lessons.length >= 3 },
    { id: "perfil", ico: "🪪", name: "Perfil inversor", on: () => !!S.quiz },
    { id: "circulo", ico: "👯", name: "Círculo", on: () => !!S.flags.circle }
];
function addXp(n) {
    const before = level();
    S.xp += n;
    if (level() > before) { toast(`🚀 ¡Nivel ${level()}: ${levelName()}!`); confetti(); }
}

/* =========================================================
   UI: toast, sheet, confeti, tema
========================================================= */
function toast(msg, ms = 3200) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    $("#toasts").append(el);
    setTimeout(() => el.remove(), ms);
}

let sheetCleanup = null;
function openSheet(html, { wide = false, onMount } = {}) {
    closeSheet();
    const root = $("#sheetRoot");
    root.innerHTML = `<div class="overlay" data-act="closeSheetBg"><div class="sheet ${wide ? "wide" : ""}" role="dialog" aria-modal="true">
        <button class="close" data-act="closeSheet" aria-label="Cerrar">×</button>${html}</div></div>`;
    document.body.style.overflow = "hidden";
    const first = $("input:not([type=hidden]), select", root);
    if (first) setTimeout(() => first.focus(), 60);
    onMount?.(root);
}
function closeSheet() {
    $("#sheetRoot").innerHTML = "";
    document.body.style.overflow = "";
    sheetCleanup?.(); sheetCleanup = null;
}

function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = $("#confetti"), ctx = cv.getContext("2d");
    cv.width = innerWidth; cv.height = innerHeight;
    const colors = ["#22c1ff", "#8b73ff", "#ffb703", "#2dd4a0", "#ff6b70"];
    const ps = Array.from({ length: 150 }, () => ({
        x: innerWidth / 2, y: innerHeight * .4, vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 4,
        s: Math.random() * 8 + 4, c: colors[(Math.random() * colors.length) | 0], r: Math.random() * 6, vr: (Math.random() - .5) * .4
    }));
    let f = 0;
    (function tick() {
        ctx.clearRect(0, 0, cv.width, cv.height);
        ps.forEach(p => {
            p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += p.vr;
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore();
        });
        if (++f < 160) requestAnimationFrame(tick); else ctx.clearRect(0, 0, cv.width, cv.height);
    })();
}

function setTheme(t) {
    document.documentElement.dataset.theme = t;
    lsSet("hz_theme", t);
    $("#themeBtn").textContent = t === "dark" ? "☀️" : "🌙";
    document.querySelector('meta[name="theme-color"]').content = t === "dark" ? "#0b1020" : "#f3f5fb";
    if (route() === "simulador") drawSim();
}

function paintChrome() {
    $("#levelPill").textContent = `⚡ Nv ${level()} · ${S.xp} XP`;
    $("#authBtn").textContent = user ? user.username : "Entrar";
    $("#authBtn").dataset.act = user ? "profile" : "auth";
}

/* =========================================================
   Vistas
========================================================= */
const route = () => (location.hash.replace(/^#\//, "") || "inicio").split("?")[0];

const TEMPLATES = [
    { emoji: "✈️", name: "Viaje con amigos", target: 1200, years: 1, monthly: 100 },
    { emoji: "🏠", name: "Entrada de mi casa", target: 25000, years: 6, monthly: 300 },
    { emoji: "🛟", name: "Fondo de emergencia", target: 3000, years: 2, monthly: 125 },
    { emoji: "🎮", name: "Setup de mis sueños", target: 1500, years: 1, monthly: 125 },
    { emoji: "🎓", name: "Máster / formación", target: 8000, years: 3, monthly: 220 },
    { emoji: "🚗", name: "Mi primer coche", target: 9000, years: 3, monthly: 250 }
];

function futureMessage() {
    const g = S.goals.filter(x => !isDone(x)).sort((a, b) => a.year - b.year)[0];
    if (!g) {
        return S.goals.length
            ? { q: "¡Has cumplido todas tus metas! 🏆 Hora de soñar más grande: crea la siguiente.", note: "Mensaje de tu yo del futuro" }
            : { q: "Hola, soy tú dentro de unos años. Todo lo bueno que me pasa empezó el día que decidiste para qué ahorrar. Empieza hoy, aunque sea con poco.", note: "Crea tu primera meta para recibir mensajes personalizados" };
    }
    const years = Math.max(0, monthsLeft(g) / 12);
    const proj = fv(saved(g), g.monthly, years, 5);
    const need = requiredMonthly(g.target, saved(g), monthsLeft(g), 5);
    const q = proj >= g.target
        ? `Soy tú en ${g.year}. Gracias por aportar ${fmt(g.monthly)} al mes: «${g.name}» está cumplida y todo salió bien. 🎉`
        : `Soy tú en ${g.year}. Con tus ${fmt(g.monthly)}/mes voy por ${fmt(proj)} para «${g.name}». Si subes a ${fmt(roundUp5(need))}/mes, llegamos justas. 💪`;
    return { q, note: "Simulación con 5% anual hipotético · no es una previsión ni una garantía" };
}

function nextAction() {
    const g = S.goals.filter(x => !isDone(x)).sort((a, b) => a.year - b.year)[0];
    if (!g) return S.goals.length
        ? `<p><b>Todo cumplido 🎉</b><br><span class="muted">Crea una nueva meta para seguir creciendo.</span></p><button class="btn small" data-act="newGoal">Nueva meta</button>`
        : `<p><b>Paso 1: ponle nombre a tu dinero</b><br><span class="muted">Elige una meta y tarda menos de 30 segundos.</span></p><button class="btn small" data-act="newGoal">Crear mi meta</button>`;
    const streak = weekStreak();
    const msg = contributedThisWeek()
        ? `Ya aportaste esta semana. ¡Racha de ${streak} 🔥! Puedes adelantar aportaciones si quieres.`
        : streak ? `Aporta esta semana y tu racha llegará a ${streak + 1} 🔥` : `Aporta algo esta semana y empieza tu racha 🔥`;
    return `<p><b>Siguiente paso: «${esc(g.name)}»</b><br><span class="muted">${msg}</span></p>
        <button class="btn small" data-act="contribute" data-id="${g.id}">Aportar ahora</button>`;
}

function viewInicio() {
    const fm = futureMessage();
    const done = BADGES.filter(b => b.on()).length;
    const lvlPct = S.xp % 100;
    const prog = totalTarget() ? (totalSaved() / totalTarget()) * 100 : 0;
    return `
    <section class="hero">
        <div>
            <p class="eyebrow">Tu yo del futuro te está esperando</p>
            <h1>¿Qué vida estás <span class="grad-text">financiando hoy?</span></h1>
            <p class="lead">Ponle nombre a tu dinero, simula tu camino y llega a tus metas con tu gente. Sin letra pequeña ni jerga rara.</p>
            <div class="row"><button class="btn" data-act="newGoal">+ Crear una meta</button><a class="btn ghost" href="#/simulador">Probar el simulador</a></div>
        </div>
        <div class="card future">
            <div class="tag">MENSAJE DEL FUTURO</div>
            <q>${esc(fm.q)}</q>
            <small>${esc(fm.note)}</small>
        </div>
    </section>

    <div class="grid g4" style="margin-top:22px">
        <div class="card stat"><span>Ahorrado en tus metas</span><strong>${fmt(totalSaved())}</strong><small>${S.goals.length} meta${S.goals.length === 1 ? "" : "s"}</small></div>
        <div class="card stat"><span>Aportación mensual</span><strong>${fmt(totalMonthly())}</strong><small>Prevista entre todas</small></div>
        <div class="card stat"><span>Progreso global</span><strong>${pct(prog)}</strong><div class="bar" style="margin-top:6px"><i style="width:${prog}%"></i></div></div>
        <div class="card stat"><span>Racha semanal</span><strong>${weekStreak()} 🔥</strong><small>Semanas seguidas aportando</small></div>
    </div>

    <div class="grid g2" style="margin-top:16px">
        <div class="card"><p class="eyebrow">Tu siguiente paso</p><div class="row spread" style="align-items:center;gap:16px">${nextAction()}</div></div>
        <div class="card">
            <p class="eyebrow">Nivel ${level()} · ${levelName()}</p>
            <div class="bar warm"><i style="width:${lvlPct}%"></i></div>
            <p class="muted small-t" style="margin-top:8px">${100 - lvlPct} XP para el nivel ${level() + 1}. Gana XP aportando (+10), aprendiendo (+20) y cumpliendo metas.</p>
        </div>
    </div>

    <div class="sec-head"><div><p class="eyebrow">Logros</p><h2>${done}/${BADGES.length} desbloqueados</h2></div></div>
    <div class="card"><div class="badges">${BADGES.map(b => `<div class="badge ${b.on() ? "on" : ""}"><i>${b.ico}</i>${b.name}</div>`).join("")}</div></div>

    ${S.goals.length ? `<div class="sec-head"><div><p class="eyebrow">Tus metas</p><h2>Así vas</h2></div><a class="btn ghost small" href="#/metas">Ver todas</a></div>
    <div class="grid g3">${S.goals.slice(0, 3).map(goalCard).join("")}</div>` : ""}
    ${disclaimer()}`;
}

function goalCard(g) {
    const st = goalStatus(g), p = progress(g);
    const ml = monthsLeft(g);
    const need = requiredMonthly(g.target, saved(g), ml, 5);
    return `<article class="card goal">
        <div class="goal-top">
            <div class="ring" style="--p:${p}"><span>${esc(g.emoji)}</span></div>
            <div style="min-width:0"><h3>${esc(g.name)}</h3><span class="pill ${st.cls}">${st.txt}</span></div>
        </div>
        <div>
            <div class="row spread"><b>${fmt(saved(g))}</b><span class="muted">de ${fmt(g.target)} · ${pct(p)}</span></div>
            <div class="bar" style="margin-top:6px"><i style="width:${p}%"></i></div>
        </div>
        <p class="muted small-t">${isDone(g) ? "Objetivo alcanzado 🎉" : `Meta para ${g.year} · con tu ritmo llegarías en <b>${etaLabel(monthsToReach(g, 0))}</b> sin rentabilidad${need > g.monthly ? ` · para ir justo en plazo: <b>${fmt(roundUp5(need))}/mes</b> (con 5% hipotético)` : ""}.`}</p>
        <div class="row">
            <button class="btn small" data-act="contribute" data-id="${g.id}">+ Aportar</button>
            <button class="btn ghost small" data-act="goalDetail" data-id="${g.id}">Detalle</button>
            <button class="btn ghost small" data-act="simGoal" data-id="${g.id}">Simular</button>
        </div>
    </article>`;
}

function viewMetas() {
    return `<div class="sec-head" style="margin-top:0"><div><p class="eyebrow">01 · Mis metas</p><h2>Tu dinero tiene un porqué.</h2>
        <p>Registra lo que aportas de verdad. Lo real y lo simulado nunca se mezclan.</p></div>
        <button class="btn" data-act="newGoal">+ Nueva meta</button></div>
    ${S.goals.length ? `<div class="grid g3">${S.goals.map(goalCard).join("")}</div>`
        : `<div class="empty"><div class="big">🌅</div><h3>Aún no tienes metas</h3><p class="muted">Empieza con una plantilla o crea la tuya.</p>
        <div class="tpl">${TEMPLATES.map((t, i) => `<button data-act="tpl" data-i="${i}"><span>${t.emoji}</span>${esc(t.name)}<br><small>${fmt(t.target)}</small></button>`).join("")}</div></div>`}
    ${disclaimer()}`;
}

/* ---- Simulador ---- */
const SCENARIOS = [
    { id: "cero", name: "Sin invertir", rate: 0, c: "--ink2" },
    { id: "Prudente", name: "Prudente", rate: 2, c: "--good" },
    { id: "Equilibrado", name: "Equilibrado", rate: 5, c: "--a1" },
    { id: "Dinámico", name: "Dinámico", rate: 8, c: "--a2" }
];
let sim = { initial: null, monthly: 100, years: 10, inflation: 2.5, real: false, goalId: null, hover: null };

function viewSimulador() {
    if (sim.initial === null) sim.initial = Math.round(totalSaved());
    return `<div class="sec-head" style="margin-top:0"><div><p class="eyebrow">02 · Simulador</p><h2>Mira hacia dónde vas.</h2>
        <p>Mueve los controles y ve cómo cambia tu futuro. Son hipótesis, no promesas.</p></div></div>
    <div class="sim">
        <div class="card">
            ${S.goals.length ? `<div class="field"><label for="simGoal">Basar en una meta</label><select id="simGoal" data-input="simGoalSel">
                <option value="">— Libre —</option>${S.goals.map(g => `<option value="${g.id}" ${sim.goalId === g.id ? "selected" : ""}>${esc(g.emoji)} ${esc(g.name)}</option>`).join("")}</select></div>` : ""}
            ${rng("initial", "Ya tengo", sim.initial, 0, 50000, 100, v => fmt(v))}
            ${rng("monthly", "Aporto al mes", sim.monthly, 0, 1000, 5, v => fmt(v))}
            ${rng("years", "Durante", sim.years, 1, 40, 1, v => `${v} año${v == 1 ? "" : "s"}`)}
            ${rng("inflation", "Inflación hipotética", sim.inflation, 0, 8, .5, v => `${String(v).replace(".", ",")}%`)}
            <label class="row" style="cursor:pointer;margin-top:6px"><input type="checkbox" id="simReal" data-input="simReal" ${sim.real ? "checked" : ""}> <span><b>Ver valor real</b> <span class="muted small-t">(descontando inflación)</span></span></label>
        </div>
        <div class="card">
            <div class="row spread"><div><p class="eyebrow">Evolución estimada</p><h3 id="simTitle"></h3></div><span class="pill late">SIMULACIÓN</span></div>
            <div class="canvas-wrap"><canvas class="chart" id="simChart" aria-label="Gráfica de evolución del ahorro según escenarios"></canvas></div>
            <div class="legend" id="simLegend"></div>
        </div>
    </div>
    <div class="grid g4" id="simCards" style="margin-top:16px"></div>
    <div class="insight" id="simInsight" style="margin-top:16px"></div>
    ${disclaimer()}`;
}
function rng(id, label, val, min, max, step, f) {
    return `<div class="field"><div class="rv"><label for="sim_${id}">${label}</label><b id="out_${id}">${f(val)}</b></div>
        <input type="range" id="sim_${id}" data-input="simRange" data-key="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
}
const rangeFmt = { initial: v => fmt(v), monthly: v => fmt(v), years: v => `${v} año${v == 1 ? "" : "s"}`, inflation: v => `${String(v).replace(".", ",")}%` };

function simSeries(rate) {
    const r = monthlyRate(rate), out = [];
    let b = sim.initial;
    for (let y = 0; y <= sim.years; y++) {
        out.push(sim.real ? b / Math.pow(1 + sim.inflation / 100, y) : b);
        for (let m = 0; m < 12; m++) b = b * (1 + r) + sim.monthly;
    }
    return out;
}
function drawSim() {
    const cv = $("#simChart");
    if (!cv) return;
    const series = SCENARIOS.map(s => ({ ...s, data: simSeries(s.rate), color: cssVar(s.c) }));
    const contributed = sim.initial + sim.monthly * 12 * sim.years;
    const bal = series.find(s => s.rate === 5).data.at(-1);

    $("#simTitle").textContent = `En ${YEAR + sim.years}: hasta ${fmt(series.at(-1).data.at(-1))}`;
    $("#simLegend").innerHTML = series.map(s => `<span><i style="background:${s.color}"></i>${s.name} (${s.rate}%)</span>`).join("");
    const mine = S.quiz?.profile;
    $("#simCards").innerHTML = series.map(s => `<div class="card sc" style="border-left-color:${s.color}">
        <span class="muted small-t">${s.name} · ${s.rate}% hip.${mine === s.id ? " · <b>tu perfil</b>" : ""}</span>
        <strong>${fmt(s.data.at(-1))}</strong><span class="muted small-t">${s.rate ? `+${fmt(Math.max(0, s.data.at(-1) - (sim.real ? contributed / Math.pow(1 + sim.inflation / 100, sim.years) : contributed)))} de intereses` : "Solo lo que aportas"}</span></div>`).join("");

    const extra = fv(sim.initial, sim.monthly + 20, sim.years, 5) - fv(sim.initial, sim.monthly, sim.years, 5);
    let ins = `💡 <b>Efecto +20 €/mes:</b> en el escenario equilibrado supondría unos <b>${fmt(extra)}</b> más en ${sim.years} año${sim.years == 1 ? "" : "s"}. Aportas ${fmt(sim.monthly * 12 * sim.years + sim.initial)} en total; la diferencia con el resultado es el efecto del tiempo y del interés compuesto.`;
    const g = S.goals.find(x => x.id === sim.goalId);
    if (g) {
        const need = requiredMonthly(g.target, sim.initial, sim.years * 12, 5);
        ins += `<br><br>🎯 Para llegar a <b>${fmt(g.target)}</b> («${esc(g.name)}») en ${sim.years} año${sim.years == 1 ? "" : "s"} con 5% hipotético necesitarías <b>${fmt(Math.ceil(need))}/mes</b>. <button class="link" data-act="simUseNeed" data-v="${Math.ceil(need / 5) * 5}">Usar esa cantidad</button>`;
    }
    $("#simInsight").innerHTML = ins + `<br><span class="muted small-t">${sim.real ? "Valor real: poder adquisitivo de hoy." : "Valor nominal: no descuenta inflación."}</span>`;

    /* canvas */
    const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    const L = 58, R = 14, T = 14, B = 30, w = W - L - R, h = H - T - B;
    const raw = Math.max(...series.map(s => Math.max(...s.data)), 1) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const max = 4 * [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
    const X = i => L + (i / sim.years) * w, Y = v => T + h - (v / max) * h;
    ctx.font = "12px Inter, sans-serif";
    ctx.strokeStyle = cssVar("--line"); ctx.fillStyle = cssVar("--ink2"); ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const v = (max / 4) * i, y = Y(v);
        ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - R, y); ctx.stroke();
        ctx.textAlign = "right"; ctx.fillText(v >= 1000 ? `${Math.round(v / 1000)}k €` : `${Math.round(v)} €`, L - 8, y + 4);
    }
    ctx.textAlign = "center";
    const stepX = Math.max(1, Math.ceil(sim.years / 6));
    for (let i = 0; i <= sim.years; i += stepX) ctx.fillText(YEAR + i, X(i), H - 8);
    series.forEach(s => {
        ctx.beginPath(); ctx.strokeStyle = s.color; ctx.lineWidth = s.rate === 5 ? 3.5 : 2.5;
        if (!s.rate) ctx.setLineDash([6, 5]); else ctx.setLineDash([]);
        s.data.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
        ctx.stroke();
    });
    ctx.setLineDash([]);
    if (sim.hover !== null) {
        const i = sim.hover, x = X(i);
        ctx.strokeStyle = cssVar("--ink2"); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, T + h); ctx.stroke();
        series.forEach(s => { ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(x, Y(s.data[i]), 5, 0, 7); ctx.fill(); });
        const lines = [`${YEAR + i} · año ${i}`, ...series.map(s => `${s.name}: ${fmt(Math.round(s.data[i]))}`)];
        const bw = 176, bh = lines.length * 18 + 12, bx = Math.min(Math.max(x + 10, L), W - bw - 4), by = T + 6;
        ctx.fillStyle = cssVar("--ink"); ctx.globalAlpha = .93; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = cssVar("--bg"); ctx.textAlign = "left";
        lines.forEach((l, k) => { ctx.font = `${k ? 500 : 700} 12px Inter, sans-serif`; ctx.fillText(l, bx + 10, by + 20 + k * 18); });
    }
    cv._geom = { L, w };
    void bal;
}

/* ---- Círculo ---- */
let circ = { list: null, err: null, timer: null, last: "" };
function viewCirculo() {
    const head = `<div class="sec-head" style="margin-top:0"><div><p class="eyebrow">03 · Mi círculo</p><h2>Compartís la meta. <span class="grad-text">No la cartera.</span></h2>
        <p>Crea un objetivo con tus amigos, invítalos con un código y mirad el progreso juntos. Cada uno solo muestra lo que aporta al objetivo común.</p></div>
        ${user ? `<div class="row"><button class="btn ghost" data-act="joinCircle">Unirme con código</button><button class="btn" data-act="newCircle">+ Crear círculo</button></div>` : ""}</div>`;
    if (!user) return head + `<div class="empty"><div class="big">👯</div><h3>Entra para crear tu círculo</h3><p class="muted">Necesitas una cuenta para compartir objetivos con otras personas.</p><br><button class="btn" data-act="auth">Entrar o crear cuenta</button></div>`;
    if (circ.err) return head + `<div class="err">${esc(circ.err)}</div>`;
    if (!circ.list) return head + `<p class="muted">Cargando tus círculos…</p>`;
    if (!circ.list.length) return head + `<div class="empty"><div class="big">🫶</div><h3>Aún no estás en ningún círculo</h3><p class="muted">Crea uno o únete con el código de un amigo.</p></div>`;
    return head + `<div class="grid g2">${circ.list.map(circleCard).join("")}</div>
        <div class="card flat" style="margin-top:16px"><b>🔒 Tu cartera sigue siendo tuya.</b> <span class="muted">Nadie decide sobre tu dinero ni ve tus inversiones: el círculo solo comparte motivación y lo que cada persona decide aportar al objetivo.</span></div>`;
}
function circleCard(c) {
    const p = Math.min(100, (c.total / c.target) * 100);
    const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "ahora" : m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`; };
    return `<article class="card" style="display:grid;gap:16px">
        <div class="goal-top"><div class="ring" style="--p:${p}"><span>${esc(c.emoji)}</span></div>
            <div><h3>${esc(c.name)}</h3><span class="muted">${fmt(c.total)} de ${fmt(c.target)} · ${pct(p)}</span></div></div>
        <div>${c.members.map(m => `<div class="member"><div class="avatar">${esc(m.username[0].toUpperCase())}</div>
            <div><b>${esc(m.username)}${m.isMe ? " (tú)" : ""}${m.isOwner ? " 👑" : ""}</b><div class="bar" style="margin-top:4px"><i style="width:${c.total ? (m.contributed / Math.max(c.target / c.members.length, m.contributed)) * 100 : 0}%"></i></div></div>
            <b>${fmt(m.contributed)}</b></div>`).join("")}</div>
        <div class="row spread"><span class="muted small-t">Código para invitar</span><span class="code">${esc(c.code)}</span></div>
        <div class="row"><button class="btn small" data-act="circleContribute" data-code="${c.code}">+ Aportar</button>
            <button class="btn ghost small" data-act="shareCircle" data-code="${c.code}" data-name="${esc(c.name)}">Invitar</button>
            <button class="btn danger small" data-act="leaveCircle" data-code="${c.code}">Salir</button></div>
        <div class="feed">${c.feed.slice(0, 6).map(f => `<div>${esc(f.text)}<small>${ago(f.t)}</small></div>`).join("")}</div>
    </article>`;
}
async function loadCircles(force = false) {
    if (!user) return;
    try {
        const { circles } = await api("/circles");
        const sig = JSON.stringify(circles);
        circ.err = null;
        if (sig !== circ.last || force || !circ.list) { circ.list = circles; circ.last = sig; if (route() === "circulo" && !$(".sheet")) render(false); }
    } catch (e) { circ.err = e.message; if (route() === "circulo" && !circ.list) render(false); }
}
function startCirclePolling() {
    stopCirclePolling();
    if (!user) return;
    loadCircles();
    circ.timer = setInterval(() => document.hidden || loadCircles(), 7000);
}
const stopCirclePolling = () => { clearInterval(circ.timer); circ.timer = null; };

/* ---- Aprende ---- */
const LESSONS = [
    { id: "compuesto", ico: "🌱", title: "Interés compuesto", min: 2,
      body: "Es ganar intereses sobre tus intereses. Con <b>100 €/mes durante 30 años</b> y un 5% anual hipotético, aportas 36.000 € pero podrías llegar a ~82.000 €. El tiempo trabaja por ti: <b>empezar pronto pesa más que empezar fuerte</b>.",
      q: "¿Qué pesa más a largo plazo en el interés compuesto?", o: ["Empezar pronto y ser constante", "Acertar el mejor mes para entrar", "Mirar la app cada día"], a: 0, why: "Cuantos más años dejes crecer el dinero, más pesan los intereses sobre intereses." },
    { id: "inflacion", ico: "📉", title: "Inflación", min: 2,
      body: "La inflación sube los precios: con un 3% anual, lo que hoy cuesta 100 € costará ~134 € en 10 años. Si tu dinero está parado, <b>compra menos cada año</b>. Por eso el simulador te deja ver el valor «real».",
      q: "Tienes dinero parado 10 años con inflación del 3%. ¿Qué pasa?", o: ["Gana poder de compra", "Pierde poder de compra", "Nada, los euros son los mismos"], a: 1, why: "Tienes los mismos euros, pero con ellos compras menos cosas." },
    { id: "riesgo", ico: "⏳", title: "Riesgo y horizonte", min: 2,
      body: "Más rentabilidad potencial implica más riesgo de pérdida. La clave es <b>cuándo necesitas el dinero</b>: para algo en menos de 3 años suele pesar la estabilidad; a 10+ años puedes tolerar más altibajos.",
      q: "Necesitas el dinero para un viaje en 6 meses. ¿Qué priorizas?", o: ["Máxima rentabilidad", "Estabilidad y poder disponer de él", "Lo que diga TikTok"], a: 1, why: "Con plazos cortos no hay tiempo de recuperarse de una caída." },
    { id: "diversificar", ico: "🧺", title: "Diversificación", min: 2,
      body: "No pongas todos los huevos en la misma cesta. Repartir entre distintos activos, sectores y países <b>reduce el impacto de que uno solo vaya mal</b>. No elimina el riesgo, lo suaviza.",
      q: "¿Para qué sirve diversificar?", o: ["Para asegurar ganancias", "Para reducir el impacto de un solo activo", "Para pagar menos impuestos"], a: 1, why: "Diversificar no garantiza ganancias: reparte el riesgo." },
    { id: "emergencia", ico: "🛟", title: "Fondo de emergencia", min: 1,
      body: "Antes de invertir, ten un colchón de <b>3 a 6 meses de gastos básicos</b> en algo disponible y seguro. Evita vender en mal momento cuando surge un imprevisto.",
      q: "¿Cuánto suele recomendarse para un fondo de emergencia?", o: ["1 semana de gastos", "3-6 meses de gastos básicos", "5 años de sueldo"], a: 1, why: "Cubre imprevistos habituales sin obligarte a vender inversiones." },
    { id: "comisiones", ico: "🔍", title: "Comisiones", min: 2,
      body: "Un 1% más de costes al año parece poco, pero en 30 años con 100 €/mes puede suponer <b>~16% menos</b> de dinero final (5% vs 4%). Mira siempre los gastos antes de contratar.",
      q: "Una comisión pequeña pero anual, a 30 años…", o: ["No se nota", "Puede restar una parte importante", "Solo afecta al primer año"], a: 1, why: "Los costes se acumulan y además restan al interés compuesto." }
];
const PROFILE_QS = [
    { q: "Tu inversión cae un 15% en un mes. ¿Qué haces?", o: ["Vendo todo, no me aguanto", "Espero, pero con nervios", "Aprovecho para aportar más"] },
    { q: "¿Cuándo necesitarías este dinero?", o: ["En menos de 3 años", "Entre 3 y 8 años", "En más de 8 años"] },
    { q: "Para ti, ganar un 6% con calma o un 12% con sustos…", o: ["6% con calma, siempre", "Depende del día", "12% aunque haya sustos"] },
    { q: "¿Cuánto sabes de inversión?", o: ["Empiezo de cero", "Lo básico", "Sigo los mercados"] },
    { q: "Si pierdes parte de lo invertido, tu situación vital…", o: ["Se complicaría mucho", "Me afectaría pero lo asumo", "No cambiaría nada"] }
];
const PROFILES = {
    Prudente: { ico: "🛡️", d: "Priorizas la tranquilidad. Estabilidad, plazos cortos y entender bien cada paso." },
    Equilibrado: { ico: "⚖️", d: "Aceptas algo de vaivén a cambio de crecer. Mezcla de estabilidad y crecimiento a medio plazo." },
    Dinámico: { ico: "🚀", d: "Toleras fuertes altibajos si el horizonte es largo. Ojo: más potencial implica más riesgo de pérdida." }
};

function viewAprende() {
    return `<div class="sec-head" style="margin-top:0"><div><p class="eyebrow">04 · Aprende</p><h2>Finanzas en 60 segundos.</h2>
        <p>Micro-lecciones con mini-test. Cada acierto te da <b>+20 XP</b>.</p></div></div>
    <div class="grid g3">${LESSONS.map(l => `<button class="lesson ${S.lessons.includes(l.id) ? "done" : ""}" data-act="lesson" data-id="${l.id}"><span class="ic">${l.ico}</span><h3>${l.title}</h3><span class="muted small-t">${l.min} min · mini-test</span></button>`).join("")}</div>

    <div class="grid g2" style="margin-top:16px">
        <div class="card"><p class="eyebrow">Test de perfil</p><h3>¿Qué tipo de ahorrador/a eres?</h3>
            ${S.quiz ? `<p style="margin:10px 0"><b>${PROFILES[S.quiz.profile].ico} ${S.quiz.profile}</b> <span class="muted">· ${PROFILES[S.quiz.profile].d}</span></p>` : `<p class="muted" style="margin:10px 0">5 preguntas, 1 minuto. Sirve para personalizar el simulador.</p>`}
            <button class="btn small" data-act="quiz">${S.quiz ? "Repetir test" : "Hacer el test (+30 XP)"}</button></div>
        <div class="card"><p class="eyebrow">Regla 50/30/20</p><h3>Reparte tu dinero</h3>
            <div class="field" style="margin-top:12px"><label for="income">Ingresos netos al mes (€)</label><input id="income" type="number" min="0" step="10" placeholder="1200" data-input="income"></div>
            <div id="budgetOut" class="muted small-t">Escribe tus ingresos y te lo calculo.</div></div>
    </div>

    <div class="sec-head"><div><p class="eyebrow">Contexto</p><h2>Datos de referencia</h2><p>Separamos lo observado de lo simulado. Cifras del prototipo: verifica siempre la fuente oficial.</p></div></div>
    <div class="grid g4">
        ${[["Inflación zona euro", "3,3%", "Ago 2026 · Eurostat"], ["Objetivo de inflación BCE", "2,0%", "Medio plazo · BCE"], ["CaixaBank Destino 2026", "6,54%", "Rentabilidad histórica 1 año"], ["CaixaBank Selección Tendencias", "24,64%", "Rentabilidad histórica 1 año"]]
            .map(([a, b, c]) => `<div class="card stat"><span>${a}</span><strong>${b}</strong><small>${c}</small></div>`).join("")}
    </div>
    <div class="insight" style="margin-top:16px">💡 Con una inflación del 3,3%, <b>1.000 € parados valdrían ~${fmt(Math.round(1000 / Math.pow(1.033, 10)))}</b> en poder de compra dentro de 10 años.</div>
    <p class="disclaimer" style="margin-top:14px">Las rentabilidades pasadas no son un indicador fiable de rentabilidades futuras. Lo observado no se usa como promesa sobre el futuro de ninguna meta.</p>
    ${disclaimer(true)}`;
}
const disclaimer = skip => skip ? "" : `<p class="disclaimer">Horizonte es un prototipo académico con fines educativos del reto CaixaBank Asset Management × Google. Las simulaciones usan hipótesis ilustrativas, no constituyen asesoramiento financiero ni garantizan resultados. Invertir conlleva riesgo de pérdida.</p>`;

/* =========================================================
   Render + router
========================================================= */
const VIEWS = { inicio: viewInicio, metas: viewMetas, simulador: viewSimulador, circulo: viewCirculo, aprende: viewAprende };
let lastRoute = null;
function render(animate = true) {
    const r = VIEWS[route()] ? route() : "inicio";
    const el = $("#view");
    const changed = r !== lastRoute;
    el.innerHTML = VIEWS[r]();
    if (animate && changed) { el.classList.remove("view-in"); void el.offsetWidth; el.classList.add("view-in"); window.scrollTo(0, 0); }
    $$("#tabs a").forEach(a => { a.classList.toggle("on", a.dataset.tab === r); a.toggleAttribute("aria-current", a.dataset.tab === r); });
    if (changed) { stopCirclePolling(); if (r === "circulo") startCirclePolling(); document.title = `Horizonte | ${r[0].toUpperCase() + r.slice(1)}`; }
    lastRoute = r;
    if (r === "simulador") { sim.hover = null; requestAnimationFrame(drawSim); }
    paintChrome();
}
addEventListener("hashchange", () => render());
addEventListener("resize", () => route() === "simulador" && drawSim());

/* =========================================================
   Acciones
========================================================= */
const EMOJIS = ["🎯", "✈️", "🏠", "🎓", "🚗", "🎮", "💍", "🛟", "🎸", "📱", "🌴", "👟"];
const find = id => S.goals.find(g => g.id === id);

function goalForm(g = {}) {
    return `<p class="eyebrow">${g.id ? "Editar meta" : "Nueva meta"}</p><h2>${g.id ? "Ajusta tu meta" : "¿Para qué quieres ahorrar?"}</h2>
    <form data-form="goal" style="margin-top:16px" novalidate>
        <input type="hidden" name="id" value="${esc(g.id || "")}"><input type="hidden" name="emoji" value="${esc(g.emoji || "🎯")}">
        <div class="field"><label>Elige un emoji</label><div class="emoji-pick">${EMOJIS.map(e => `<button type="button" data-act="pickEmoji" data-e="${e}" class="${(g.emoji || "🎯") === e ? "on" : ""}">${e}</button>`).join("")}</div></div>
        <div class="field"><label for="gName">Nombre</label><input id="gName" name="name" maxlength="40" placeholder="Ej. Viaje a Japón" value="${esc(g.name || "")}" required></div>
        <div class="grid g2" style="gap:12px">
            <div class="field"><label for="gTarget">Objetivo (€)</label><input id="gTarget" name="target" type="number" min="1" step="0.01" placeholder="3000" value="${g.target ?? ""}" required></div>
            <div class="field"><label for="gYear">Año objetivo</label><input id="gYear" name="year" type="number" min="${YEAR}" max="${YEAR + 60}" value="${g.year ?? YEAR + 2}" required></div>
        </div>
        <div class="field"><label for="gMonthly">Aportación mensual prevista (€)</label><input id="gMonthly" name="monthly" type="number" min="0" step="0.01" placeholder="100" value="${g.monthly ?? ""}"></div>
        <p class="err" hidden id="goalErr"></p>
        <button class="btn block" type="submit">${g.id ? "Guardar cambios" : "Crear meta (+15 XP)"}</button>
    </form>`;
}

const ACTIONS = {
    closeSheet: closeSheet,
    closeSheetBg: (el, e) => { if (e.target === el) closeSheet(); },
    theme: () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"),

    newGoal: () => openSheet(goalForm()),
    tpl: el => {
        const t = TEMPLATES[+el.dataset.i];
        openSheet(goalForm({ emoji: t.emoji, name: t.name, target: t.target, year: YEAR + t.years, monthly: t.monthly }));
    },
    pickEmoji: el => {
        $("input[name=emoji]", el.closest("form")).value = el.dataset.e;
        $$(".emoji-pick button", el.closest("form")).forEach(b => b.classList.toggle("on", b === el));
    },
    editGoal: el => openSheet(goalForm(find(el.dataset.id))),
    deleteGoal: el => {
        const g = find(el.dataset.id);
        if (!confirm(`¿Eliminar «${g.name}» y todas sus aportaciones? No se puede deshacer.`)) return;
        S.goals = S.goals.filter(x => x !== g); save(); closeSheet(); render(false); toast("Meta eliminada");
    },

    contribute: el => {
        const g = find(el.dataset.id);
        const sug = [10, 25, 50, 100];
        if (g.monthly > 0 && !sug.includes(g.monthly)) sug.unshift(g.monthly);
        openSheet(`<p class="eyebrow">Nueva aportación</p><h2>${esc(g.emoji)} ${esc(g.name)}</h2>
        <p class="muted">Llevas ${fmt(saved(g))} de ${fmt(g.target)}.</p>
        <form data-form="contrib" style="margin-top:16px" novalidate><input type="hidden" name="id" value="${g.id}">
            <div class="chips" style="margin-bottom:14px">${sug.slice(0, 5).map(v => `<button type="button" class="chip" data-act="quickAmt" data-v="${v}">${fmt(v)}</button>`).join("")}</div>
            <div class="field"><label for="cAmt">Cantidad (€)</label><input id="cAmt" name="amount" type="number" min="0.01" step="0.01" required placeholder="25"></div>
            <div class="field"><label for="cNote">Nota (opcional)</label><input id="cNote" name="note" maxlength="60" placeholder="Ej. propina del finde"></div>
            <p class="err" hidden></p><button class="btn block" type="submit">Registrar (+10 XP)</button></form>`);
    },
    quickAmt: el => { const i = $("#cAmt"); i.value = el.dataset.v; i.focus(); },
    goalDetail: el => showDetail(el.dataset.id),
    delContrib: el => {
        const g = find(el.dataset.id);
        g.contribs = g.contribs.filter(c => c.id !== el.dataset.cid);
        save(); showDetail(g.id); render(false);
    },
    simGoal: el => {
        const g = find(el.dataset.id);
        sim = { ...sim, goalId: g.id, initial: Math.round(saved(g)), monthly: Math.round(g.monthly), years: Math.min(40, Math.max(1, g.year - YEAR)) };
        location.hash = "#/simulador";
    },
    simUseNeed: el => { sim.monthly = Math.min(1000, +el.dataset.v); $("#sim_monthly").value = sim.monthly; $("#out_monthly").textContent = fmt(sim.monthly); drawSim(); },

    auth: () => authSheet("login"),
    authSwitch: el => authSheet(el.dataset.mode),
    profile: () => profileSheet(),
    logout: async () => {
        try { await api("/auth/logout", { method: "POST", body: {} }); } catch { /* ignora */ }
        user = null; S = normalize(lsGet("hz_guest")); circ = { list: null, err: null, timer: null, last: "" };
        closeSheet(); lastRoute = null; render(false); toast("Sesión cerrada");
    },
    demo: () => {
        const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return isoDate(x); };
        const mk = (name, emoji, target, year, monthly, list) => ({ id: uid() + name.length, name, emoji, target, year, monthly, contribs: list.map(([n, a]) => ({ id: uid() + n, amount: a, date: d(n), note: "" })) });
        S.goals.push(
            mk("Entrada de mi casa", "🏠", 25000, YEAR + 6, 300, [[75, 1200], [50, 300], [22, 300], [15, 300], [8, 300], [1, 300]]),
            mk("Viaje a Japón", "✈️", 3000, YEAR + 1, 150, [[40, 400], [20, 150], [3, 150]]),
            mk("Fondo de emergencia", "🛟", 3000, YEAR + 2, 125, [[30, 500], [9, 125]])
        );
        addXp(60); save(); closeSheet(); render(false); toast("Datos demo cargados 🎬");
    },
    reset: () => {
        if (!confirm("¿Borrar TODOS tus datos (metas, XP, logros)? No se puede deshacer.")) return;
        S = blank(); save(); closeSheet(); render(false); toast("Datos borrados");
    },
    exportData: () => {
        const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: "application/json" })), download: "horizonte-datos.json" });
        a.click(); URL.revokeObjectURL(a.href);
    },

    newCircle: () => openSheet(`<p class="eyebrow">Nuevo círculo</p><h2>Una meta, tu gente</h2>
        <form data-form="circle" style="margin-top:16px" novalidate><input type="hidden" name="emoji" value="🎯">
            <div class="field"><label>Emoji</label><div class="emoji-pick">${EMOJIS.map((e, i) => `<button type="button" data-act="pickEmoji" data-e="${e}" class="${i ? "" : "on"}">${e}</button>`).join("")}</div></div>
            <div class="field"><label for="ccName">Nombre del objetivo común</label><input id="ccName" name="name" maxlength="40" placeholder="Ej. Interrail verano" required></div>
            <div class="field"><label for="ccT">Objetivo conjunto (€)</label><input id="ccT" name="target" type="number" min="1" step="1" placeholder="4000" required></div>
            <p class="err" hidden></p><button class="btn block" type="submit">Crear círculo</button></form>`),
    joinCircle: () => openSheet(`<p class="eyebrow">Unirme</p><h2>Introduce el código</h2>
        <form data-form="join" style="margin-top:16px" novalidate><div class="field"><label for="jc">Código de 6 caracteres</label>
        <input id="jc" name="code" maxlength="6" autocomplete="off" style="text-transform:uppercase;letter-spacing:.3em;font-size:1.3rem;text-align:center" required></div>
        <p class="err" hidden></p><button class="btn block" type="submit">Unirme</button></form>`),
    circleContribute: el => {
        const c = circ.list.find(x => x.code === el.dataset.code);
        openSheet(`<p class="eyebrow">Aportar al círculo</p><h2>${esc(c.emoji)} ${esc(c.name)}</h2>
        <form data-form="circleContrib" style="margin-top:16px" novalidate><input type="hidden" name="code" value="${c.code}">
            <div class="field"><label for="ccA">Cantidad (€)</label><input id="ccA" name="amount" type="number" min="0.01" step="0.01" required></div>
            <p class="muted small-t" style="margin-bottom:12px">Solo se comparte esta cantidad, no el resto de tu cartera.</p>
            <p class="err" hidden></p><button class="btn block" type="submit">Aportar (+10 XP)</button></form>`);
    },
    shareCircle: async el => {
        const text = `Únete a mi círculo «${el.dataset.name}» en Horizonte con el código ${el.dataset.code}`;
        try { if (navigator.share) return await navigator.share({ text }); } catch { return; }
        try { await navigator.clipboard.writeText(text); toast("Invitación copiada 📋"); } catch { prompt("Copia la invitación:", text); }
    },
    leaveCircle: async el => {
        if (!confirm("¿Salir de este círculo?")) return;
        try { await api(`/circles/${el.dataset.code}/leave`, { method: "POST", body: {} }); await loadCircles(true); toast("Has salido del círculo"); }
        catch (e) { toast(e.message); }
    },

    lesson: el => lessonSheet(LESSONS.find(l => l.id === el.dataset.id)),
    quizAnswer: el => answerLesson(el),
    quiz: () => profileQuiz(0, []),
    quizPick: el => profileQuiz(+el.dataset.step + 1, [...JSON.parse(el.dataset.acc), +el.dataset.v]),
    newGoalFromBudget: el => { closeSheet(); openSheet(goalForm({ monthly: +el.dataset.v })); },

    coach: () => coachSheet(),
    coachChip: el => sendCoach(el.dataset.q)
};

function showDetail(id) {
    const g = find(id);
    if (!g) return closeSheet();
    const hist = [...g.contribs].sort((a, b) => b.date.localeCompare(a.date));
    openSheet(`<p class="eyebrow">${esc(g.emoji)} Detalle</p><h2>${esc(g.name)}</h2>
    <div class="grid g3" style="gap:10px;margin:14px 0">
        <div class="stat"><span>Ahorrado</span><strong style="font-size:1.3rem">${fmt(saved(g))}</strong></div>
        <div class="stat"><span>Objetivo</span><strong style="font-size:1.3rem">${fmt(g.target)}</strong></div>
        <div class="stat"><span>Mensual</span><strong style="font-size:1.3rem">${fmt(g.monthly)}</strong></div></div>
    <div class="bar"><i style="width:${progress(g)}%"></i></div>
    <h3 style="margin:20px 0 10px;font-size:1.1rem">Historial (${hist.length})</h3>
    <div class="hist">${hist.length ? hist.map(c => `<div><span>${new Date(c.date + "T12:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}${c.note ? ` · <span class="muted">${esc(c.note)}</span>` : ""}</span>
        <span><b>${fmt(c.amount)}</b> <button class="x" data-act="delContrib" data-id="${g.id}" data-cid="${c.id}" aria-label="Eliminar aportación">✕</button></span></div>`).join("") : `<p class="muted">Aún no has aportado nada.</p>`}</div>
    <div class="row" style="margin-top:20px"><button class="btn small" data-act="contribute" data-id="${g.id}">+ Aportar</button>
        <button class="btn ghost small" data-act="editGoal" data-id="${g.id}">Editar</button>
        <button class="btn danger small" data-act="deleteGoal" data-id="${g.id}">Eliminar</button></div>`);
}

function authSheet(mode) {
    const reg = mode === "register";
    openSheet(`<p class="eyebrow">${reg ? "Nueva cuenta" : "Bienvenido/a de nuevo"}</p><h2>${reg ? "Crea tu cuenta" : "Entra a Horizonte"}</h2>
    <p class="muted">Tus metas se guardan y sincronizan. Tu contraseña se almacena cifrada (scrypt).</p>
    <form data-form="${reg ? "register" : "login"}" style="margin-top:16px" novalidate>
        <div class="field"><label for="aU">Usuario</label><input id="aU" name="username" autocomplete="username" maxlength="40" required></div>
        <div class="field"><label for="aP">Contraseña ${reg ? "(mín. 8)" : ""}</label><input id="aP" name="password" type="password" autocomplete="${reg ? "new-password" : "current-password"}" minlength="8" required></div>
        ${reg ? `<div class="field"><label for="aP2">Repite la contraseña</label><input id="aP2" name="password2" type="password" autocomplete="new-password" required></div>` : ""}
        <p class="err" hidden></p><button class="btn block" type="submit">${reg ? "Crear cuenta" : "Entrar"}</button></form>
    <p style="text-align:center;margin-top:16px" class="muted">${reg ? "¿Ya tienes cuenta?" : "¿Nuevo por aquí?"} <button class="link" data-act="authSwitch" data-mode="${reg ? "login" : "register"}">${reg ? "Entrar" : "Crear cuenta"}</button></p>`);
}

function profileSheet() {
    const b = BADGES.filter(x => x.on()).length;
    openSheet(`<p class="eyebrow">Mi perfil</p><h2>${user ? esc(user.username) : "Invitado/a"}</h2>
    <p class="muted">Nivel ${level()} · ${levelName()} · ${S.xp} XP · ${b}/${BADGES.length} logros</p>
    ${user ? `<p class="small-t muted" style="margin-top:8px">☁️ Datos sincronizados con tu cuenta.</p>` : `<p class="small-t muted" style="margin-top:8px">💾 Datos guardados solo en este dispositivo. <button class="link" data-act="auth">Entra</button> para sincronizarlos.</p>`}
    <div style="display:grid;gap:10px;margin-top:20px">
        ${S.goals.length ? "" : `<button class="btn ghost" data-act="demo">🎬 Cargar datos demo</button>`}
        <button class="btn ghost" data-act="exportData">⬇️ Exportar mis datos</button>
        <button class="btn danger" data-act="reset">🗑️ Borrar mis datos</button>
        ${user ? `<button class="btn" data-act="logout">Cerrar sesión</button>` : ""}
    </div>`);
}

function lessonSheet(l) {
    openSheet(`<p class="eyebrow">Micro-lección · ${l.min} min</p><h2>${l.ico} ${l.title}</h2><p style="margin:12px 0 20px;line-height:1.6">${l.body}</p>
    <h3 style="font-size:1.1rem;margin-bottom:12px">${l.q}</h3>
    ${l.o.map((o, i) => `<button class="quiz-opt" data-act="quizAnswer" data-lesson="${l.id}" data-i="${i}">${o}</button>`).join("")}
    <p id="quizMsg" class="muted" style="margin-top:8px" aria-live="polite"></p>`);
}
function answerLesson(el) {
    const l = LESSONS.find(x => x.id === el.dataset.lesson), i = +el.dataset.i, msg = $("#quizMsg");
    if (i === l.a) {
        $$(".quiz-opt").forEach(b => (b.disabled = true));
        el.classList.add("right");
        const first = !S.lessons.includes(l.id);
        if (first) { S.lessons.push(l.id); addXp(20); save(); confetti(); paintChrome(); }
        msg.innerHTML = `✅ <b>¡Correcto!</b> ${l.why}${first ? " <b>+20 XP</b>" : ""}`;
        render(false);
    } else { el.classList.add("wrong"); msg.textContent = "❌ Casi. Prueba otra vez."; }
}

function profileQuiz(step, acc) {
    if (step >= PROFILE_QS.length) {
        const score = acc.reduce((a, b) => a + b, 0) + PROFILE_QS.length; // 5..15
        const profile = score <= 8 ? "Prudente" : score <= 11 ? "Equilibrado" : "Dinámico";
        const first = !S.quiz;
        S.quiz = { profile, score };
        if (first) addXp(30);
        save(); confetti(); render(false);
        const p = PROFILES[profile];
        return openSheet(`<p class="eyebrow">Tu perfil</p><h2>${p.ico} ${profile}</h2><p style="margin:12px 0">${p.d}</p>
        <p class="muted small-t">Es un ejercicio educativo orientativo, no una evaluación de idoneidad ni asesoramiento. Resalté tu perfil en el simulador.</p>
        <a class="btn block" href="#/simulador" data-act="closeSheet" style="display:block;text-align:center;margin-top:16px">Verlo en el simulador</a>`);
    }
    const q = PROFILE_QS[step];
    openSheet(`<p class="eyebrow">Pregunta ${step + 1} de ${PROFILE_QS.length}</p><div class="bar" style="margin:6px 0 16px"><i style="width:${(step / PROFILE_QS.length) * 100}%"></i></div>
    <h2 style="font-size:1.5rem;margin-bottom:16px">${q.q}</h2>
    ${q.o.map((o, i) => `<button class="quiz-opt" data-act="quizPick" data-step="${step}" data-v="${i}" data-acc='${JSON.stringify(acc)}'>${o}</button>`).join("")}`);
}

/* ---- Coach ---- */
let chat = [{ who: "bot", text: "¡Ey! Soy Hori 👋 tu coach financiero. Pregúntame lo que quieras de ahorro, inflación o tus metas. Solo educación, nada de consejos personalizados de inversión." }];
function coachSheet() {
    const chips = ["¿Qué es el interés compuesto?", "¿Cómo voy con mis metas?", "¿Por dónde empiezo a invertir?", "Explícame la inflación"];
    openSheet(`<p class="eyebrow">Coach · IA</p><h2>✨ Hori</h2>
    <div class="chat" id="chat" aria-live="polite">${chat.map(chatMsg).join("")}</div>
    <div class="chips" style="margin-bottom:12px">${chips.map(c => `<button class="chip" data-act="coachChip" data-q="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <form class="chat-form" data-form="coach"><input name="message" maxlength="500" placeholder="Pregunta lo que quieras…" autocomplete="off" aria-label="Mensaje para Hori"><button class="btn small" type="submit">Enviar</button></form>`, { wide: true });
    const c = $("#chat"); c.scrollTop = c.scrollHeight;
}
const chatMsg = m => `<div class="msg ${m.who}">${esc(m.text)}${m.src ? `<br><small class="muted">${m.src === "gemini" ? "Gemini" : "modo local"}</small>` : ""}</div>`;
async function sendCoach(text) {
    text = text.trim();
    if (!text) return;
    chat.push({ who: "me", text });
    const box = $("#chat");
    if (!box) return coachSheet(), sendCoach2(text);
    box.insertAdjacentHTML("beforeend", chatMsg(chat.at(-1)) + `<div class="msg bot typing" id="typing"><span></span><span></span><span></span></div>`);
    box.scrollTop = box.scrollHeight;
    await sendCoach2(text, true);
}
async function sendCoach2(text, already) {
    const box = $("#chat");
    if (!already) box.insertAdjacentHTML("beforeend", `<div class="msg bot typing" id="typing"><span></span><span></span><span></span></div>`);
    let reply;
    try {
        const ctx = { goals: S.goals.map(g => ({ name: g.name, target: g.target, saved: Math.round(saved(g)), monthly: g.monthly, year: g.year })), profile: S.quiz?.profile };
        reply = await api("/coach", { method: "POST", body: { message: text, context: ctx } });
    } catch (e) { reply = { reply: "Uf, no he podido conectar ahora mismo. Inténtalo de nuevo en un momento 🙏", source: "" }; }
    chat.push({ who: "bot", text: reply.reply, src: reply.source });
    $("#typing")?.remove();
    const b = $("#chat");
    if (b) { b.insertAdjacentHTML("beforeend", chatMsg(chat.at(-1))); b.scrollTop = b.scrollHeight; }
}

/* =========================================================
   Formularios
========================================================= */
function formErr(form, msg) { const e = $(".err", form); e.textContent = msg; e.hidden = false; }
async function afterAuth(res) {
    user = res.user;
    if (res.state && (hasData(normalize(res.state)) || !hasData(S))) S = normalize(res.state);
    else if (hasData(S)) { /* servidor vacío: sube lo local */ }
    save();
    circ = { list: null, err: null, timer: null, last: "" }; lastRoute = null;
    closeSheet(); render(false);
    toast(`¡Hola, ${user.username}! 👋`);
}
const FORMS = {
    goal: form => {
        const f = new FormData(form), name = String(f.get("name")).trim(), target = +f.get("target"), year = +f.get("year"), monthly = +f.get("monthly") || 0;
        if (!name) return formErr(form, "Ponle un nombre a tu meta.");
        if (!(target > 0)) return formErr(form, "El objetivo debe ser mayor que 0.");
        if (!(year >= YEAR && year <= YEAR + 60)) return formErr(form, `El año debe estar entre ${YEAR} y ${YEAR + 60}.`);
        if (monthly < 0) return formErr(form, "La aportación no puede ser negativa.");
        const id = f.get("id"), data = { name, target, year, monthly, emoji: f.get("emoji") };
        if (id) { Object.assign(find(id), data); toast("Meta actualizada ✏️"); }
        else { S.goals.push({ id: uid(), ...data, contribs: [] }); addXp(15); toast("¡Meta creada! +15 XP 🎯"); }
        save(); closeSheet(); render(false);
    },
    contrib: form => {
        const f = new FormData(form), amount = Math.round(+f.get("amount") * 100) / 100, g = find(f.get("id"));
        if (!(amount > 0) || amount > 1e7) return formErr(form, "Introduce una cantidad válida.");
        const before = progress(g);
        g.contribs.push({ id: uid(), amount, date: isoDate(), note: String(f.get("note")).trim() });
        addXp(10); save();
        const after = progress(g), hit = [100, 75, 50, 25].find(m => before < m && after >= m);
        closeSheet(); render(false);
        if (hit === 100) { toast(`🏆 ¡Has completado «${g.name}»!`, 5000); confetti(); }
        else if (hit) { toast(`🔥 ${hit}% de «${g.name}»`); confetti(); }
        else toast(`+${fmt(amount)} guardados · +10 XP 💸`);
    },
    login: async form => {
        const f = new FormData(form);
        try { await afterAuth(await api("/auth/login", { method: "POST", body: { username: f.get("username"), password: f.get("password") } })); }
        catch (e) { formErr(form, e.message); }
    },
    register: async form => {
        const f = new FormData(form);
        if (f.get("password") !== f.get("password2")) return formErr(form, "Las contraseñas no coinciden.");
        try { await afterAuth(await api("/auth/register", { method: "POST", body: { username: f.get("username"), password: f.get("password") } })); }
        catch (e) { formErr(form, e.message); }
    },
    circle: async form => {
        const f = new FormData(form);
        try {
            await api("/circles", { method: "POST", body: { name: f.get("name"), target: f.get("target"), emoji: f.get("emoji") } });
            S.flags.circle = true; save(); closeSheet(); await loadCircles(true); toast("Círculo creado 🎉"); confetti();
        } catch (e) { formErr(form, e.message); }
    },
    join: async form => {
        try {
            await api("/circles/join", { method: "POST", body: { code: new FormData(form).get("code") } });
            S.flags.circle = true; save(); closeSheet(); await loadCircles(true); toast("¡Ya estás dentro! 👯");
        } catch (e) { formErr(form, e.message); }
    },
    circleContrib: async form => {
        const f = new FormData(form);
        try {
            await api(`/circles/${f.get("code")}/contribute`, { method: "POST", body: { amount: f.get("amount") } });
            addXp(10); save(); closeSheet(); await loadCircles(true); toast("Aportación al círculo registrada 💪");
        } catch (e) { formErr(form, e.message); }
    },
    coach: form => { const i = form.elements.message; const t = i.value; i.value = ""; sendCoach(t); }
};

/* =========================================================
   Eventos globales
========================================================= */
document.addEventListener("click", e => {
    const el = e.target.closest("[data-act]");
    if (el && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](el, e);
});
document.addEventListener("submit", e => {
    const form = e.target.closest("[data-form]");
    if (!form) return;
    e.preventDefault();
    const err = $(".err", form);
    if (err) err.hidden = true;
    FORMS[form.dataset.form]?.(form);
});
document.addEventListener("input", e => {
    const t = e.target, k = t.dataset.input;
    if (k === "simRange") {
        sim[t.dataset.key] = +t.value;
        $(`#out_${t.dataset.key}`).textContent = rangeFmt[t.dataset.key](+t.value);
        drawSim();
    } else if (k === "simReal") { sim.real = t.checked; drawSim(); }
    else if (k === "simGoalSel") {
        const g = find(t.value);
        sim.goalId = g ? g.id : null;
        if (g) sim = { ...sim, initial: Math.round(saved(g)), monthly: Math.round(g.monthly), years: Math.min(40, Math.max(1, g.year - YEAR)) };
        render(false);
    } else if (k === "income") {
        const v = +t.value, out = $("#budgetOut");
        if (!(v > 0)) { out.textContent = "Escribe tus ingresos y te lo calculo."; return; }
        out.innerHTML = `<div class="split"><div style="flex:50;background:var(--a1)">50%</div><div style="flex:30;background:var(--a2)">30%</div><div style="flex:20;background:var(--warm);color:#1a1200">20%</div></div>
        <div class="grid g3" style="gap:8px;margin-top:10px"><div><b>${fmt(v * .5)}</b><br>Necesidades</div><div><b>${fmt(v * .3)}</b><br>Disfrutar</div><div><b>${fmt(v * .2)}</b><br>Ahorro e inversión</div></div>
        <button class="btn small" style="margin-top:12px" data-act="newGoalFromBudget" data-v="${Math.round(v * .2)}">Crear meta con mi 20%</button>`;
    }
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

function simPointer(e) {
    const cv = e.target.closest?.("#simChart");
    if (!cv || !cv._geom) return;
    const r = cv.getBoundingClientRect(), { L, w } = cv._geom;
    const x = (e.clientX - r.left - L) / w;
    sim.hover = Math.min(sim.years, Math.max(0, Math.round(x * sim.years)));
    drawSim();
}
document.addEventListener("pointermove", simPointer);
document.addEventListener("pointerdown", simPointer);
document.addEventListener("pointerleave", e => { if (e.target.id === "simChart") { sim.hover = null; drawSim(); } }, true);

/* =========================================================
   Arranque
========================================================= */
(async function init() {
    setTheme(lsGet("hz_theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
    render();
    try {
        const me = await api("/auth/me");
        if (me.user) {
            user = me.user;
            S = me.state ? normalize(me.state) : normalize(lsGet(`hz_user_${user.id}`) || S);
            if (!me.state) save();
            lastRoute = null; render(false);
        }
    } catch { /* servidor no disponible: modo invitado */ }
    if (!lsGet("hz_seen") && !hasData(S)) { lsSet("hz_seen", 1); toast("¡Bienvenido/a! Crea una meta o carga datos demo desde tu perfil ✨", 5000); }
})();
