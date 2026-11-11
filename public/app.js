"use strict";
/* Horizonte · SPA sin dependencias */

/* =========================================================
   Utilidades
========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const eur0 = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
const eur2 = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });
const fmt = n => (Number.isInteger(n) || Math.abs(n) >= 1000 ? eur0 : eur2).format(n);
const fmtR = n => eur0.format(Math.round(n));
const pct = n => `${n.toLocaleString("es-ES", { maximumFractionDigits: 1, useGrouping: "always" })} %`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const isoDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const longDate = s => new Date(s + "T12:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
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
    if (!r.ok) throw Object.assign(new Error(data.error || "No se ha podido completar la operación."), { status: r.status });
    return data;
}

/* =========================================================
   Estado + persistencia (invitado: localStorage · cuenta: servidor)
========================================================= */
const CATS = {
    vivienda: "Vivienda", viaje: "Viajes", formacion: "Formación", emergencia: "Colchón de emergencia",
    vehiculo: "Vehículo", tecnologia: "Tecnología", independencia: "Independencia financiera", otro: "Otro objetivo"
};
const blank = () => ({ v: 3, goals: [], lessons: [], quiz: null, flags: {} });
function normalize(s) {
    const b = blank();
    if (!s || typeof s !== "object") return b;
    return {
        ...b, ...s,
        goals: Array.isArray(s.goals) ? s.goals.map(g => ({ monthly: 0, ...g, category: CATS[g.category] ? g.category : "otro", contribs: Array.isArray(g.contribs) ? g.contribs : [] })) : [],
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
        catch (e) { if (e.status === 401) { user = null; paintChrome(); toast("Tu sesión ha caducado. Accede de nuevo para sincronizar."); } }
    }, 600);
}
const hasData = s => s && s.goals?.length;

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
    if (!isFinite(months)) return "Sin fecha estimada";
    const d = new Date(YEAR, NOW.getMonth() + months, 1);
    return d.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
}
function goalStatus(g) {
    if (isDone(g)) return { cls: "done", txt: "Alcanzado" };
    return monthsToReach(g, 5) <= monthsLeft(g) ? { cls: "ok", txt: "En plazo" } : { cls: "late", txt: "Requiere ajuste" };
}

/* ---- constancia e hitos ---- */
function mondayKey(d) {
    const x = new Date(d + "T12:00:00");
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return isoDate(x);
}
function weekStreak() {
    const weeks = new Set(S.goals.flatMap(g => g.contribs.map(c => mondayKey(c.date))));
    const cursor = new Date(mondayKey(isoDate()) + "T12:00:00");
    if (!weeks.has(isoDate(cursor))) cursor.setDate(cursor.getDate() - 7); // la semana en curso aún está abierta
    let n = 0;
    while (weeks.has(isoDate(cursor))) { n++; cursor.setDate(cursor.getDate() - 7); }
    return n;
}
const contributedThisWeek = () => S.goals.some(g => g.contribs.some(c => mondayKey(c.date) === mondayKey(isoDate())));
const MILESTONES = [
    { name: "Primer objetivo definido", on: () => S.goals.length > 0 },
    { name: "Primera aportación registrada", on: () => totalSaved() > 0 },
    { name: "Tres semanas consecutivas aportando", on: () => weekStreak() >= 3 },
    { name: "1.000 € destinados a objetivos", on: () => totalSaved() >= 1000 },
    { name: "Un objetivo alcanzado", on: () => S.goals.some(isDone) },
    { name: "Perfil de inversor completado", on: () => !!S.quiz },
    { name: "Tres temas dominados", on: () => topicsDone() >= 3 },
    { name: "Miembro de un círculo", on: () => !!S.flags.circle }
];

/* =========================================================
   UI: avisos y paneles
========================================================= */
function toast(msg, ms = 3600) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    $("#toasts").append(el);
    setTimeout(() => el.remove(), ms);
}
function openSheet(html, { side = false } = {}) {
    const root = $("#sheetRoot");
    root.innerHTML = `<div class="overlay ${side ? "side" : ""}" data-act="closeSheetBg"><div class="sheet" role="dialog" aria-modal="true">
        <button class="close" data-act="closeSheet" aria-label="Cerrar">×</button>${html}</div></div>`;
    document.body.style.overflow = "hidden";
    const first = $("input:not([type=hidden]), select", root);
    if (first) setTimeout(() => first.focus(), 60);
}
function closeSheet() {
    $("#sheetRoot").innerHTML = "";
    document.body.style.overflow = "";
}
function paintChrome() {
    const dark = document.documentElement.dataset.theme === "dark", priv = document.documentElement.classList.contains("private");
    const tb = $("#themeBtn"), pb = $("#privBtn");
    if (tb) { const l = dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"; tb.title = l; tb.setAttribute("aria-label", l); }
    if (pb) { const l = priv ? "Mostrar importes" : "Ocultar importes"; pb.title = l; pb.setAttribute("aria-label", l); pb.setAttribute("aria-pressed", priv); }
    const b = $("#authBtn");
    b.textContent = user ? user.username : "Acceder";
    b.dataset.act = user ? "profile" : "auth";
    b.className = user ? "btn sm quiet" : "btn sm";
}

/* =========================================================
   Vistas
========================================================= */
const route = () => (location.hash.replace(/^#\//, "") || "resumen").split("?")[0];
const ARROW = `<span class="arr" aria-hidden="true">→</span>`;

const TEMPLATES = [
    { category: "emergencia", name: "Colchón de emergencia", target: 3000, years: 2, monthly: 125 },
    { category: "viaje", name: "Viaje de fin de carrera", target: 1800, years: 1, monthly: 150 },
    { category: "vivienda", name: "Entrada de vivienda", target: 25000, years: 6, monthly: 300 },
    { category: "formacion", name: "Máster", target: 8000, years: 3, monthly: 220 },
    { category: "vehiculo", name: "Primer coche", target: 9000, years: 3, monthly: 250 },
    { category: "independencia", name: "Independencia financiera", target: 50000, years: 15, monthly: 150 }
];

function futureLetter() {
    const g = S.goals.filter(x => !isDone(x)).sort((a, b) => a.year - b.year)[0];
    if (!g) {
        return S.goals.length
            ? { q: "Todos tus objetivos están cumplidos. Es buen momento para fijar el siguiente horizonte.", note: "Carta de tu yo futuro" }
            : { q: "Lo que hoy decidas sobre tu dinero será lo que yo pueda disfrutar mañana. Empieza por darle un propósito.", note: "Define un objetivo para recibir una proyección personalizada" };
    }
    const proj = fv(saved(g), g.monthly, Math.max(0, monthsLeft(g) / 12), 5);
    const need = requiredMonthly(g.target, saved(g), monthsLeft(g), 5);
    const q = proj >= g.target
        ? `Te escribo desde ${g.year}. Mantener ${fmt(g.monthly)} al mes fue suficiente: «${g.name}» es hoy una realidad.`
        : `Te escribo desde ${g.year}. Con ${fmt(g.monthly)} al mes llegamos a unos ${fmtR(proj)} para «${g.name}». Con ${fmt(roundUp5(need))} al mes, lo habríamos conseguido.`;
    return { q, note: "Proyección con una rentabilidad hipotética del 5 % anual. No constituye previsión ni garantía." };
}

function nextStep() {
    const g = S.goals.filter(x => !isDone(x)).sort((a, b) => a.year - b.year)[0];
    if (!g) return `<h3>${S.goals.length ? "Define tu siguiente objetivo" : "Define tu primer objetivo"}</h3>
        <p class="muted" style="margin-bottom:20px">Ponerle nombre, importe y fecha al ahorro es la decisión que más influye en mantenerlo.</p>
        <button class="btn" data-act="newGoal">Nuevo objetivo ${ARROW}</button>`;
    const streak = weekStreak();
    const msg = contributedThisWeek()
        ? `Ya has aportado esta semana. Llevas ${streak} semana${streak === 1 ? "" : "s"} consecutiva${streak === 1 ? "" : "s"}.`
        : streak ? `Una aportación esta semana extendería tu constancia a ${streak + 1} semanas consecutivas.` : "Registra una aportación esta semana para iniciar tu serie de constancia.";
    return `<h3>${esc(g.name)}</h3><p class="muted" style="margin-bottom:20px">${msg}</p>
        <button class="btn" data-act="contribute" data-id="${g.id}">Registrar aportación ${ARROW}</button>`;
}

// Barras del logo de Horizonte como indicador de progreso (5 barras que suben)
const hBars = (p, cls = "") => `<span class="hbars ${cls}" role="img" aria-label="${Math.round(p)} %">${[1, 2, 3, 4, 5].map(i => `<i class="${p >= i * 20 - 10 ? "on" : ""}"></i>`).join("")}</span>`;

// La categoría solo se muestra si aporta algo: «Colchón de emergencia» no se repite dos veces.
function catLbl(g, cls, tag) {
    const c = CATS[g.category];
    if (c && c.toLowerCase() !== String(g.name).trim().toLowerCase()) return `<${tag} class="${cls}">${c}</${tag}>`;
    return cls === "goal-cat" ? `<p class="goal-cat" aria-hidden="true">&nbsp;</p>` : ""; // mantiene alineadas las columnas
}

// Proyección del Inicio: lo que tendrías invirtiendo (5 % hipotético) frente a solo guardarlo
function horizonData() {
    const has = S.goals.length > 0;
    const pv = has ? totalSaved() : 0, pm = has ? totalMonthly() : 100;
    const endYear = has ? Math.max(...S.goals.map(g => g.year), NOW.getFullYear() + 5) : NOW.getFullYear() + 10;
    const years = Math.max(1, endYear - NOW.getFullYear());
    const inv = [], cash = [];
    for (let y = 0; y <= years; y++) { inv.push(fv(pv, pm, y, 5)); cash.push(pv + pm * 12 * y); }
    return { has, pv, pm, endYear, years, inv, cash };
}
function horizonChart(d) {
    const W = 640, H = 230, max = Math.max(...d.inv) * 1.08 || 1;
    const X = i => (i / d.years) * W, Y = v => H - (v / max) * H;
    const line = arr => arr.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
    const area = `M0,${H} L${line(d.inv).split(" ").join(" L")} L${W},${H} Z`;
    return `<svg class="hz-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Proyección hasta ${d.endYear}: ${fmtR(d.inv.at(-1))} invirtiendo frente a ${fmtR(d.cash.at(-1))} sin invertir">
        <path d="${area}" class="hz-area"/><polyline points="${line(d.cash)}" class="hz-cash"/><polyline points="${line(d.inv)}" class="hz-line"/>
        <circle cx="${W}" cy="${Y(d.inv.at(-1)).toFixed(1)}" r="5" class="hz-dot"/></svg>`;
}
function goalRow(g) {
    const st = goalStatus(g), p = progress(g);
    return `<li class="goal-row">
        <div class="gr-main">${catLbl(g, "gr-cat", "span")}<b>${esc(g.name)}</b></div>
        <div class="gr-prog"><div class="bar"><i style="width:${p}%"></i></div><span class="money">${fmtR(saved(g))} <em>de ${fmtR(g.target)}</em></span></div>
        <span class="tag ${st.cls}">${st.txt}</span>
        <button class="btn sm ghost" data-act="contribute" data-id="${g.id}">Aportar</button>
    </li>`;
}
function viewResumen() {
    const d = horizonData(), end = d.inv.at(-1), gain = end - d.cash.at(-1), streak = weekStreak();
    const t = today(), due = CARDS.filter(c => pulseState().due[c.id] !== undefined && pulseState().due[c.id] <= t).length;
    const g = gState(), cx = cxState(), vozLeft = VOZ.filter(v => !cx.votes[v.id]).length;
    const next = S.goals.filter(x => !isDone(x)).sort((a, b) => a.year - b.year)[0];
    return `
    <section class="hz" id="hz" aria-label="Tu horizonte">
        <div class="hz-text">
            <p class="hz-hello">${user ? `Hola, ${esc(user.username)}` : "Tu horizonte"}</p>
            <h1>${d.has ? `En ${d.endYear} podrías tener` : `Con ${fmtR(d.pm)} al mes, en ${d.endYear} podrías tener`}</h1>
            <p class="hz-big money">${fmtR(end)}</p>
            <p class="hz-chg"><span class="up money">▲ +${fmtR(gain)}</span><span class="up">+${(gain / Math.max(1, d.cash.at(-1)) * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %</span> frente a solo guardar</p>
            <p class="hz-sub">Solo guardándolo serían <span class="money">${fmtR(d.cash.at(-1))}</span>. Invirtiendo, el tiempo trabaja por ti.</p>
            <div class="row">${d.has && next ? `<button class="btn" data-act="contribute" data-id="${next.id}">Aportar a «${esc(next.name)}» ${ARROW}</button>` : `<button class="btn" data-act="newGoal">Crear mi primer objetivo ${ARROW}</button>`}
                <a class="btn ghost" href="#/simulador">Ver escenarios</a></div>
        </div>
        <div class="hz-visual">
            ${horizonChart(d)}
            <div class="hz-axis"><span>Hoy</span><span>${d.endYear}</span></div>
            <div class="hz-legend"><span><i class="l-inv"></i>Invirtiendo</span><span><i class="l-cash"></i>Sin invertir</span></div>
        </div>
        ${d.has ? `<dl class="hz-facts">
            <div><dt>Ahorrado hoy</dt><dd class="money">${fmtR(d.pv)}</dd></div>
            <div><dt>Aportas al mes</dt><dd class="money">${fmtR(d.pm)}</dd></div>
            <div><dt>Racha</dt><dd>${streak} ${streak === 1 ? "semana" : "semanas"}</dd></div>
        </dl>` : ""}
        <p class="hz-note">Hipótesis de rentabilidad del 5 % anual. No es una previsión ni una garantía.</p>
    </section>

    ${S.goals.length ? `<section class="section" id="s-objetivos"><div class="sec-head"><div><h2>Tus objetivos</h2></div><a class="link" href="#/objetivos">Gestionar</a></div>
        <ul class="goal-rows">${S.goals.map(goalRow).join("")}</ul></section>` : ""}

    <section class="section" id="s-hoy"><div class="sec-head"><div><h2>Hoy en Horizonte</h2></div></div>
        <div class="today-grid">
            <a class="t-card" href="#/practica"><span class="t-lbl">Aprende · 3 min</span><b>${due ? `${due} tarjeta${due === 1 ? "" : "s"} por repasar` : "Tu práctica de hoy"}</b><span>Decide antes de ver la respuesta.</span><i>${ARROW}</i></a>
            <a class="t-card" href="#/aguanta"><span class="t-lbl">Juegos · reto #${gDayNo()}</span><b>${g.aguanta.day === t ? "Aguanta: ya jugado" : "¿Aguantarías la caída?"}</b><span>Diez años de bolsa en un minuto.</span><i>${ARROW}</i></a>
            <a class="t-card" href="#/conecta"><span class="t-lbl">Conecta · tu voz</span><b>${vozLeft ? `${vozLeft} propuesta${vozLeft === 1 ? "" : "s"} esperan tu opinión` : "Ya has opinado en todo"}</b><span>Di qué harías tú en las empresas.</span><i>${ARROW}</i></a>
        </div>
    </section>`;
}
function goalCard(g) {
    const st = goalStatus(g), p = progress(g), ml = monthsLeft(g);
    const need = requiredMonthly(g.target, saved(g), ml, 5);
    return `<article class="goal">
        <div class="row between" style="align-items:flex-start"><div>${catLbl(g, "goal-cat", "p")}<h3>${esc(g.name)}</h3></div><span class="tag ${st.cls}">${st.txt}</span></div>
        <div><div class="amt money"><strong>${fmt(saved(g))}</strong><span>de ${fmt(g.target)}</span></div><div class="bar"><i style="width:${p}%"></i></div></div>
        <dl class="meta">
            <div><dt>Horizonte</dt><dd>Dic. ${g.year}</dd></div>
            <div><dt>Aportación</dt><dd class="money">${fmt(g.monthly)}/mes</dd></div>
            <div><dt>Avance</dt><dd>${pct(Math.round(p * 10) / 10)}</dd></div>
            <div><dt>${isDone(g) ? "Estado" : need > g.monthly ? "Necesario (5 % hip.)" : "Fecha estimada"}</dt><dd>${isDone(g) ? "Completado" : need > g.monthly ? `${fmt(roundUp5(need))}/mes` : etaLabel(monthsToReach(g, 0))}</dd></div>
        </dl>
        <div class="acts"><button class="btn sm" data-act="contribute" data-id="${g.id}">Aportar</button>
            <button class="link" data-act="goalDetail" data-id="${g.id}">Detalle</button>
            <button class="link" data-act="simGoal" data-id="${g.id}">Proyectar</button></div>
    </article>`;
}

function viewObjetivos() {
    return `<section class="section"><div class="sec-head"><div><p class="kicker">Objetivos</p><h2 class="page-title">Para qué estás ahorrando</h2>
        <p>Registra tus aportaciones reales. El seguimiento de lo aportado y las proyecciones se muestran siempre por separado.</p></div>
        <button class="btn" data-act="newGoal">Nuevo objetivo ${ARROW}</button></div>
    ${S.goals.length ? `<div class="cols c3">${S.goals.map(goalCard).join("")}</div>`
        : `<div class="empty"><h3>Todavía no has definido ningún objetivo</h3><p class="muted">Parte de una propuesta o crea uno a medida.</p>
        <div class="tpl">${TEMPLATES.map((t, i) => `<button data-act="tpl" data-i="${i}"><span class="goal-cat">${CATS[t.category]}</span><b>${esc(t.name)}</b><small>${fmt(t.target)} · ${t.years} año${t.years === 1 ? "" : "s"}</small></button>`).join("")}</div></div>`}
    </section>`;
}

/* ---- Simulador ---- */
const SCENARIOS = [
    { id: "cero", name: "Sin rentabilidad", rate: 0, c: "--ink3", dash: true },
    { id: "Conservador", name: "Conservador", rate: 2, c: "--c-con" },
    { id: "Moderado", name: "Moderado", rate: 5, c: "--blue" },
    { id: "Dinámico", name: "Dinámico", rate: 8, c: "--c-dyn" }
];
let sim = { initial: null, monthly: 100, years: 10, inflation: 2.5, real: false, goalId: null, hover: null };
const rangeFmt = { initial: v => fmt(v), monthly: v => fmt(v), years: v => `${v} año${v == 1 ? "" : "s"}`, inflation: v => `${String(v).replace(".", ",")} %` };

function viewSimulador() {
    if (sim.initial === null) sim.initial = Math.round(totalSaved());
    const rng = (id, label, min, max, step) => `<div class="ctl"><div class="rv"><label for="sim_${id}">${label}</label><b id="out_${id}">${rangeFmt[id](sim[id])}</b></div>
        <input type="range" id="sim_${id}" data-input="simRange" data-key="${id}" min="${min}" max="${max}" step="${step}" value="${sim[id]}"></div>`;
    return `<section class="section"><div class="sec-head"><div><p class="kicker">Simulador</p><h2 class="page-title">¿Y si sigues así?</h2>
        <p>Compara cómo podría evolucionar tu ahorro bajo distintas hipótesis de rentabilidad. Son supuestos ilustrativos, no previsiones.</p></div></div>
    <div class="sim">
        <div class="sim-ctl">
            ${S.goals.length ? `<div class="field"><label for="simGoal">Vincular a un objetivo</label><select id="simGoal" data-input="simGoalSel">
                <option value="">Simulación libre</option>${S.goals.map(g => `<option value="${g.id}" ${sim.goalId === g.id ? "selected" : ""}>${esc(g.name)}</option>`).join("")}</select></div>` : ""}
            ${rng("initial", "Capital inicial", 0, 50000, 100)}
            ${rng("monthly", "Aportación mensual", 0, 1000, 5)}
            ${rng("years", "Horizonte", 1, 40, 1)}
            ${rng("inflation", "Inflación supuesta", 0, 8, .5)}
            <label class="check"><input type="checkbox" data-input="simReal" ${sim.real ? "checked" : ""}> Mostrar en términos reales</label>
        </div>
        <div class="sim-out">
            <div class="row between" style="margin-bottom:16px"><div><p class="kicker">Evolución estimada</p><h3 id="simTitle" style="font-size:24px"></h3></div></div>
            <canvas class="chart" id="simChart" aria-label="Gráfico de evolución del capital por escenario"></canvas>
        </div>
    </div>
    <div class="cols c21" style="margin-top:28px">
        <div class="tbl-wrap"><table class="tbl" id="simTable"></table></div>
        <div class="note" id="simNote"></div>
    </div>
    <p class="disclaim">Rentabilidades anuales hipotéticas, constantes y sin costes ni fiscalidad. La rentabilidad real puede ser inferior, incluso negativa.</p>
    </section>

    <section class="section" id="s-mercado"><div class="sec-head"><div><p class="kicker">Contexto de mercado</p><h2>Datos de referencia</h2>
        <p>Diferenciamos los datos observados de las hipótesis del simulador. Cifras recogidas para el prototipo: contrástalas siempre con la fuente oficial.</p></div></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Indicador</th><th>Referencia</th><th class="r">Valor</th></tr></thead><tbody>
            <tr><td>Inflación zona euro</td><td class="muted">Agosto 2026 · Eurostat</td><td class="r"><b>3,3 %</b></td></tr>
            <tr><td>Objetivo de inflación del BCE</td><td class="muted">Medio plazo · BCE</td><td class="r"><b>2,0 %</b></td></tr>
            <tr><td>CaixaBank Destino 2026</td><td class="muted">Rentabilidad histórica a 1 año</td><td class="r"><b>6,54 %</b></td></tr>
            <tr><td>CaixaBank Selección Tendencias</td><td class="muted">Rentabilidad histórica a 1 año</td><td class="r"><b>24,64 %</b></td></tr>
        </tbody></table></div>
        <div class="note" style="margin-top:24px">Con una inflación del 3,3 %, <b>1.000 € sin remunerar equivaldrían a unos ${fmtR(1000 / Math.pow(1.033, 10))}</b> de poder adquisitivo actual dentro de diez años.</div>
        <p class="disclaim">Las rentabilidades pasadas no son un indicador fiable de rentabilidades futuras. La información sobre fondos se muestra con fines ilustrativos y no constituye una recomendación.</p>
    </section>`;
}

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
    const contribShown = sim.real ? contributed / Math.pow(1 + sim.inflation / 100, sim.years) : contributed;
    const mine = S.quiz?.profile;

    $("#simTitle").textContent = `${YEAR + sim.years}: entre ${fmtR(series[0].data.at(-1))} y ${fmtR(series.at(-1).data.at(-1))}`;
    $("#simTable").innerHTML = `<thead><tr><th>Escenario</th><th class="r">Rent. hip.</th><th class="r">Capital final</th><th class="r">Rendimiento</th></tr></thead><tbody>
        ${series.map(s => `<tr class="${mine === s.id ? "hl" : ""}"><td><span class="sw" style="background:${s.color}"></span>${s.name}${mine === s.id ? ` <span class="small muted">· tu perfil</span>` : ""}</td>
        <td class="r">${s.rate} %</td><td class="r"><b>${fmtR(s.data.at(-1))}</b></td><td class="r">${s.rate ? fmtR(Math.max(0, s.data.at(-1) - contribShown)) : "—"}</td></tr>`).join("")}
        <tr><td class="muted">Total aportado</td><td></td><td class="r muted">${fmtR(contribShown)}</td><td></td></tr></tbody>`;

    const extra = fv(sim.initial, sim.monthly + 20, sim.years, 5) - fv(sim.initial, sim.monthly, sim.years, 5);
    let note = `<p><b>Sensibilidad.</b> Aumentar la aportación en 20 € al mes supondría unos <b>${fmtR(extra)}</b> adicionales en el escenario moderado a ${sim.years} año${sim.years == 1 ? "" : "s"}.</p>`;
    const g = S.goals.find(x => x.id === sim.goalId);
    if (g) {
        const need = requiredMonthly(g.target, sim.initial, sim.years * 12, 5);
        note += `<p style="margin-top:14px"><b>Objetivo «${esc(g.name)}».</b> Para alcanzar ${fmt(g.target)} en ${sim.years} año${sim.years == 1 ? "" : "s"} con un 5 % hipotético se necesitarían <b>${fmt(Math.ceil(need))} al mes</b>. <button class="link" data-act="simUseNeed" data-v="${roundUp5(need)}">Aplicar</button></p>`;
    }
    note += `<p style="margin-top:14px" class="small">${sim.real ? `Importes en euros de hoy, descontada una inflación del ${String(sim.inflation).replace(".", ",")} %.` : "Importes nominales, sin descontar inflación."}</p>`;
    $("#simNote").innerHTML = note;

    /* gráfico */
    const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    const L = 62, R = 8, T = 10, B = 28, w = W - L - R, h = H - T - B;
    const raw = Math.max(...series.map(s => Math.max(...s.data)), 1) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const max = 4 * [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
    const X = i => L + (i / sim.years) * w, Y = v => T + h - (v / max) * h;
    ctx.font = "11px Inter, sans-serif";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const v = (max / 4) * i, y = Math.round(Y(v)) + .5;
        ctx.strokeStyle = i ? cssVar("--rule2") : cssVar("--ink");
        ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - R, y); ctx.stroke();
        ctx.fillStyle = cssVar("--ink3"); ctx.textAlign = "right";
        ctx.fillText(v >= 1000 ? `${(v / 1000).toLocaleString("es-ES")} mil €` : `${Math.round(v)} €`, L - 10, y + 4);
    }
    ctx.textAlign = "center";
    const stepX = Math.max(1, Math.ceil(sim.years / 8));
    for (let i = 0; i <= sim.years; i += stepX) ctx.fillText(YEAR + i, X(i), H - 8);
    series.forEach(s => {
        ctx.beginPath(); ctx.strokeStyle = s.color; ctx.lineWidth = s.rate === 5 ? 2.5 : 1.5;
        ctx.setLineDash(s.dash ? [4, 4] : []);
        s.data.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
        ctx.stroke();
    });
    ctx.setLineDash([]);
    if (sim.hover !== null) {
        const i = sim.hover, x = Math.round(X(i)) + .5;
        ctx.strokeStyle = cssVar("--ink"); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, T + h); ctx.stroke();
        series.forEach(s => { ctx.fillStyle = s.color; ctx.fillRect(x - 3.5, Y(s.data[i]) - 3.5, 7, 7); });
        const lines = [`${YEAR + i}`, ...series.map(s => [s.name, fmtR(s.data[i])])];
        const bw = 196, bh = lines.length * 19 + 14, bx = x + 12 + bw > W ? x - bw - 12 : x + 12, by = T + 4;
        ctx.fillStyle = "#0a2433"; ctx.fillRect(bx, by, bw, bh);
        lines.forEach((l, k) => {
            const yy = by + 22 + k * 19;
            ctx.fillStyle = k ? "#c9d7e0" : "#ffffff"; ctx.font = `${k ? 400 : 600} 12px Inter, sans-serif`; ctx.textAlign = "left";
            ctx.fillText(k ? l[0] : l, bx + 12, yy);
            if (k) { ctx.textAlign = "right"; ctx.fillStyle = "#ffffff"; ctx.fillText(l[1], bx + bw - 12, yy); }
        });
    }
    cv._geom = { L, w };
}

/* ---- Círculo ---- */
let circ = { list: null, err: null, timer: null, last: "" };
const resetCirc = () => { clearInterval(circ.timer); circ = { list: null, err: null, timer: null, last: "" }; };

function viewCirculo() {
    const head = `<section class="section"><div class="sec-head"><div><p class="kicker">Círculo</p><h2 class="page-title">Ahorrad juntos para lo mismo</h2>
        <p>Fija una meta común con amigos o familia e invítalos con un código. Cada participante solo comparte lo que decide aportar a ese objetivo.</p></div>
        ${user ? `<div class="row"><button class="btn line" data-act="joinCircle">Unirme con código</button><button class="btn" data-act="newCircle">Crear círculo</button></div>` : ""}</div>`;
    const privacy = `<div class="panel tint" style="margin-top:24px"><p class="kicker">Privacidad</p><p class="muted">Nadie puede ver ni gestionar tus inversiones. El círculo comparte únicamente el objetivo común y las aportaciones que cada persona decide registrar en él.</p></div>`;
    let body;
    if (!user) body = `<div class="empty"><h3>Accede para crear o unirte a un círculo</h3><p class="muted" style="margin-bottom:24px">Los círculos requieren una cuenta para compartir el progreso entre participantes.</p><button class="btn" data-act="auth">Acceder ${ARROW}</button></div>`;
    else if (circ.err) body = `<div class="err">${esc(circ.err)}</div>`;
    else if (!circ.list) body = `<p class="muted">Cargando…</p>`;
    else if (!circ.list.length) body = `<div class="empty"><h3>Aún no participas en ningún círculo</h3><p class="muted">Crea uno o únete con el código que te hayan facilitado.</p></div>`;
    else body = `<div class="cols c2">${circ.list.map(circleCard).join("")}</div>`;
    return head + body + privacy + `</section>`;
}
function circleCard(c) {
    const p = Math.min(100, (c.total / c.target) * 100);
    const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "ahora" : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`; };
    return `<article class="goal">
        <div class="row between" style="align-items:flex-start"><div><p class="goal-cat">${CATS[c.category] || "Objetivo compartido"} · ${c.members.length} participante${c.members.length === 1 ? "" : "s"}</p><h3>${esc(c.name)}</h3></div>
            ${c.total >= c.target ? `<span class="tag done">Alcanzado</span>` : ""}</div>
        <div><div class="amt money"><strong>${fmt(c.total)}</strong><span>de ${fmt(c.target)} · ${pct(Math.round(p * 10) / 10)}</span></div><div class="bar"><i style="width:${p}%"></i></div></div>
        <table class="tbl"><thead><tr><th>Participante</th><th class="r">Aportado</th><th class="r">Peso</th></tr></thead><tbody>
            ${c.members.map(m => `<tr><td><span class="initial">${esc(m.username[0].toUpperCase())}</span>${esc(m.username)}${m.isMe ? ` <span class="muted small">(tú)</span>` : ""}${m.isOwner ? ` <span class="muted small">· administrador</span>` : ""}</td>
            <td class="r money">${fmt(m.contributed)}</td><td class="r muted">${c.total ? pct(Math.round((m.contributed / c.total) * 1000) / 10) : "—"}</td></tr>`).join("")}</tbody></table>
        <div class="row between"><span class="small muted">Código de invitación</span><span class="code">${esc(c.code)}</span></div>
        <ul class="feed">${c.feed.slice(0, 6).map(f => `<li><span>${esc(f.text)}</span><time>${ago(f.t)}</time></li>`).join("")}</ul>
        <div class="acts"><button class="btn sm" data-act="circleContribute" data-code="${c.code}">Aportar</button>
            <button class="link" data-act="shareCircle" data-code="${c.code}" data-name="${esc(c.name)}">Invitar</button>
            <button class="link neg" data-act="leaveCircle" data-code="${c.code}">Abandonar</button></div>
    </article>`;
}
async function loadCircles(force = false) {
    if (!user) return;
    try {
        const { circles } = await api("/circles");
        const sig = JSON.stringify(circles);
        circ.err = null;
        if (force || sig !== circ.last || !circ.list) { circ.list = circles; circ.last = sig; if (route() === "circulo" && !$(".sheet")) render(false); }
    } catch (e) { circ.err = e.message; if (route() === "circulo" && !circ.list) render(false); }
}
function startCirclePolling() {
    stopCirclePolling();
    if (!user) return;
    loadCircles();
    circ.timer = setInterval(() => document.hidden || loadCircles(), 7000);
}
const stopCirclePolling = () => { clearInterval(circ.timer); circ.timer = null; };

/* ---- Aprende ----
   Una sola sección: cada tema tiene una explicación breve (teoría) y sus tarjetas
   de práctica (CARDS, más abajo). No hay tests aparte: practicar es la comprobación. */
const TOPICS = [
    { id: "compuesto", title: "Interés compuesto", sub: "Por qué el tiempo es el factor más determinante", cards: ["e30", "eearly", "q72", "m-rich"],
      body: "El interés compuesto consiste en obtener rendimientos sobre los rendimientos ya generados. Con <b>100 € al mes durante 30 años</b> y una rentabilidad hipotética del 5 % anual, se aportan 36.000 € y el capital podría alcanzar unos 82.000 €. <b>Empezar pronto suele pesar más que empezar con importes elevados.</b>" },
    { id: "inflacion", title: "Inflación", sub: "El coste invisible del dinero parado", cards: ["einf", "m-cash"],
      body: "La inflación reduce el poder adquisitivo: con un 3 % anual, lo que hoy cuesta 100 € costará unos 134 € dentro de diez años. El dinero sin remunerar <b>compra menos cada año</b>. Por eso el simulador permite ver los importes en términos reales." },
    { id: "riesgo", title: "Riesgo y horizonte", sub: "Cuándo necesitarás el dinero", cards: ["h2020", "h2008", "m-past"],
      body: "A mayor rentabilidad potencial, mayor riesgo de pérdida. La clave es <b>el plazo en que se necesitará el dinero</b>: en horizontes cortos suele primar la estabilidad; en horizontes largos es posible asumir más volatilidad y esperar a que pasen las caídas." },
    { id: "diversificar", title: "Diversificación", sub: "Repartir para no depender de una sola apuesta", cards: ["h2000", "m-div"],
      body: "Diversificar es repartir la inversión entre distintos activos, sectores y regiones para <b>reducir el impacto de que uno de ellos evolucione mal</b>. No elimina el riesgo, pero lo modera." },
    { id: "costes", title: "Costes y comisiones", sub: "Pequeños porcentajes, grandes diferencias", cards: ["efee"],
      body: "Un punto adicional de costes anuales parece poco, pero a 30 años con 100 € al mes puede suponer <b>en torno a un 16 % menos de capital final</b>. Revisa siempre los gastos de cualquier producto." },
    { id: "emergencia", title: "Antes de invertir", sub: "Colchón de emergencia y entender lo que compras", cards: ["qemerg", "crypto"],
      body: "Antes de invertir conviene disponer de <b>entre tres y seis meses de gastos básicos</b> en algo líquido y de bajo riesgo, para no tener que vender en mal momento ante un imprevisto. Y una regla simple: <b>no inviertas en lo que no sabrías explicar</b>." },
    { id: "estafas", title: "Estafas y apuestas", sub: "Cómo reconocer lo que no es invertir", cards: ["scam1", "scam2", "bet"],
      body: "Rentabilidad alta y garantizada no existen a la vez. <b>Urgencia, promesas y entidad no registrada</b> son las señales clásicas de un chiringuito financiero: compruébalo siempre en la CNMV. Y apostar no es invertir: su resultado esperado es negativo por diseño." },
    { id: "habitos", title: "Hábitos de gasto", sub: "Loud budgeting, doom spending y soft saving", cards: ["loud", "doom", "m-soft"],
      body: "Las decisiones pequeñas y repetidas pesan más que las grandes. Decir en voz alta «no entra en mi presupuesto», <b>esperar 48 horas antes de una compra impulsiva</b> y automatizar una cantidad sostenible permiten ahorrar sin renunciar a vivir." }
];
const MASTERED = 2; // caja de Leitner a partir de la cual una tarjeta se da por dominada (acertada dos veces espaciadas)
const isMastered = id => (pulseState().box[id] || 0) >= MASTERED;
const topicDone = t => t.cards.every(isMastered);
const topicsDone = () => TOPICS.filter(topicDone).length;

const PROFILE_QS = [
    { q: "Tu inversión cae un 15 % en un mes. ¿Cómo reaccionas?", o: ["Vendo para evitar más pérdidas", "Mantengo, aunque con inquietud", "Mantengo o aporto más"] },
    { q: "¿En qué plazo prevés necesitar este dinero?", o: ["Menos de 3 años", "Entre 3 y 8 años", "Más de 8 años"] },
    { q: "¿Qué alternativa prefieres?", o: ["Rentabilidad moderada y estable", "Un equilibrio entre ambas", "Mayor rentabilidad potencial con oscilaciones"] },
    { q: "¿Cómo describirías tu conocimiento financiero?", o: ["Básico", "Intermedio", "Avanzado"] },
    { q: "Una pérdida parcial de lo invertido afectaría a tu situación…", o: ["De forma importante", "De forma moderada", "De forma poco relevante"] }
];
const PROFILES = {
    Conservador: "Prioridad a la preservación del capital y a la estabilidad. Horizontes cortos y baja tolerancia a las oscilaciones.",
    Moderado: "Disposición a asumir cierta volatilidad a cambio de crecimiento, con un horizonte de medio plazo.",
    Dinámico: "Mayor tolerancia a las oscilaciones en busca de crecimiento a largo plazo. Más potencial implica también más riesgo de pérdida."
};

function viewAprende() {
    const p = pulseState(), t = today();
    const due = CARDS.filter(c => p.due[c.id] !== undefined && p.due[c.id] <= t).length;
    const fresh = CARDS.filter(c => p.due[c.id] === undefined).length;
    const streak = pulseStreak();
    return `<section class="section"><div class="sec-head"><div><p class="kicker">Aprende</p><h2 class="page-title">Tres minutos al día, con casos reales.</h2>
        <p>Cada tarjeta te pide decidir antes de ver la respuesta. Lo que falles vuelve más adelante; lo que aciertes, cada vez más espaciado.</p></div></div>
        <div class="panel today">
            <div><p class="kicker">Práctica de hoy · 3 minutos</p>
                <h3>${due ? `${due} tarjeta${due === 1 ? "" : "s"} para repasar` : fresh ? "Siete tarjetas nuevas" : "Todo al día"}</h3>
                <p class="muted">${due ? "Primero lo que toca repasar, después contenido nuevo." : fresh ? `Te quedan ${fresh} tarjetas por descubrir.` : "Ya has visto todas las tarjetas. Puedes repasar las que quieras."}</p></div>
            <dl class="today-stats"><div><dt>Racha</dt><dd>${streak} d</dd></div><div><dt>Precisión</dt><dd>${p.answered ? Math.round((p.correct / p.answered) * 100) : 0} %</dd></div><div><dt>Temas dominados</dt><dd>${topicsDone()}/${TOPICS.length}</dd></div></dl>
            <div class="row"><button class="btn" data-act="practice">Empezar ${ARROW}</button>${p.saved.length ? `<button class="btn line" data-act="practice" data-saved="1">Repasar guardadas (${p.saved.length})</button>` : ""}</div>
        </div>
    </section>

    <section class="section" id="a-temas"><div class="sec-head"><div><p class="kicker">Temas</p><h2>Las ideas que más te van a servir</h2>
        <p>Lee la idea clave y practica solo ese tema. Un tema está dominado cuando aciertas todas sus tarjetas dos veces.</p></div></div>
    <div class="lessons">${TOPICS.map((tp, i) => {
        const m = tp.cards.filter(isMastered).length;
        return `<button class="lesson ${topicDone(tp) ? "done" : ""}" data-act="topic" data-id="${tp.id}">
        <span class="n">${String(i + 1).padStart(2, "0")}</span><span><h3>${tp.title}</h3><p>${tp.sub}</p></span><span class="st">${topicDone(tp) ? "Dominado" : `${m} de ${tp.cards.length}`}</span></button>`;
    }).join("")}</div>
    </section>

    <section class="section cols c2" id="a-herramientas">
        <div class="panel"><p class="kicker">Perfil de inversor</p><h3>${S.quiz ? `Perfil ${S.quiz.profile.toLowerCase()}` : "Conoce tu perfil"}</h3>
            <p class="muted" style="margin:8px 0 22px">${S.quiz ? PROFILES[S.quiz.profile] : "Cinco preguntas para orientar el escenario de referencia del simulador. Ejercicio educativo, no evaluación de idoneidad."}</p>
            <button class="btn ${S.quiz ? "line" : ""}" data-act="quiz">${S.quiz ? "Repetir cuestionario" : `Iniciar cuestionario ${ARROW}`}</button></div>
        <div class="panel"><p class="kicker">Regla 50 / 30 / 20</p><h3>Distribuye tus ingresos</h3>
            <div class="field" style="margin-top:16px"><label for="income">Ingresos netos mensuales</label><input id="income" type="number" min="0" step="10" placeholder="1.200" data-input="income"></div>
            <div id="budgetOut" class="muted small">Introduce un importe para ver la distribución orientativa.</div></div>
    </section>`;
}

/* ---- Práctica: feed vertical de decisiones ----
   No se ve: se decide. Cada tarjeta pide una predicción antes de mostrar la respuesta
   (aprendizaje por error de predicción), los fallos vuelven con repetición espaciada
   (cajas de Leitner) y la sesión termina de forma deliberada. */
const today = () => Math.floor((Date.now() - NOW.getTimezoneOffset() * 6e4) / 864e5);
const LEITNER = [0, 1, 3, 7, 16]; // días hasta volver a ver la tarjeta según su caja
const SESSION_SIZE = 7;
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const x1 = n => n.toLocaleString("es-ES", { maximumFractionDigits: 1 });

const CARDS = [
    { id: "h2020", type: "decide", kicker: "Momento histórico · Marzo 2020", topic: "las caídas de mercado y el horizonte de inversión",
      title: "La pandemia hunde las bolsas más de un 30 % en cuatro semanas. Tu inversión es a quince años. ¿Qué haces?",
      o: ["Vendo antes de que caiga más", "Mantengo sin tocar nada", "Mantengo y sigo aportando"], good: [1, 2],
      reveal: () => "El S&P 500 cayó un 34 % entre el 19 de febrero y el 23 de marzo de 2020 y en agosto ya había recuperado sus máximos. Quien vendió convirtió una caída temporal en una pérdida real." },
    { id: "h2008", type: "decide", kicker: "Momento histórico · 2007", topic: "la relación entre plazo y riesgo",
      title: "Ahorras para la entrada de un piso que comprarás en 2009. ¿Dónde mantienes ese dinero?",
      o: ["En bolsa, que no para de subir", "En algo estable y disponible"], good: [1],
      reveal: () => "Entre octubre de 2007 y marzo de 2009 el S&P 500 perdió en torno a un 57 % y no recuperó máximos hasta 2013. Con dos años de plazo, ese riesgo no compensaba: el horizonte decide cuánto riesgo puedes asumir." },
    { id: "h2000", type: "decide", kicker: "Momento histórico · Año 2000", topic: "la diversificación y las burbujas",
      title: "Todo el mundo habla de las empresas de internet. Suben cada semana. ¿Pones todos tus ahorros en ellas?",
      o: ["Sí, es el futuro", "No, reparto entre sectores y regiones"], good: [1],
      reveal: () => "El Nasdaq cayó cerca de un 78 % entre 2000 y 2002 y tardó unos quince años en recuperar aquel máximo. Que una idea tenga futuro no significa que su precio sea razonable." },
    { id: "scam1", type: "decide", kicker: "¿Estafa o legítimo?", topic: "cómo detectar estafas de inversión",
      title: "Un perfil con coches de lujo promete un 20 % mensual «garantizado» si le envías dinero por un grupo privado.",
      o: ["Legítimo", "Estafa"], good: [1],
      reveal: () => "Estafa. Rentabilidad alta y garantizada no existen a la vez. Según la OCU, un 14 % de los jóvenes españoles dice haber sufrido una estafa de inversión, con pérdidas medias de más de 3.000 €. Comprueba siempre el registro de la entidad en la CNMV." },
    { id: "scam2", type: "decide", kicker: "¿Estafa o legítimo?", topic: "las señales de alerta de los chiringuitos financieros",
      title: "Te llaman de una «plataforma de trading» que no aparece en la CNMV. Te piden decidir hoy, antes de que se acabe la oferta.",
      o: ["Aprovecho, la oferta acaba", "Cuelgo y lo verifico"], good: [1],
      reveal: () => "Urgencia y entidad no registrada son las dos señales clásicas de un chiringuito financiero. La CNMV publica listas de entidades no autorizadas: si no está registrada, no inviertas." },
    { id: "bet", type: "decide", kicker: "¿Inversión o apuesta?", topic: "la diferencia entre invertir y apostar",
      title: "Apostar 20 € cada semana a resultados deportivos, ¿es una forma de inversión?",
      o: ["Sí, es otra forma de invertir", "No, es una apuesta"], good: [1],
      reveal: () => "Es una apuesta: el resultado esperado es negativo por diseño. Invertir es aportar capital a activos que generan valor a largo plazo. Según la OCU, el 18 % de los jóvenes confunde ambas cosas." },
    { id: "crypto", type: "decide", kicker: "Antes de invertir", topic: "invertir solo en lo que entiendes",
      title: "Un amigo te recomienda una criptomoneda nueva. No sabes explicar qué hace ni de dónde saldría su valor. ¿Inviertes?",
      o: ["Sí, si a él le funciona", "No hasta entenderlo"], good: [1],
      reveal: () => "Regla básica: no inviertas en lo que no sabrías explicar. La OCU indica que el 17 % de los jóvenes tiene criptomonedas, pero casi la mitad reconoce no entender cómo funcionan." },
    { id: "loud", type: "decide", kicker: "Tendencia · Loud budgeting", topic: "el loud budgeting y poner límites al gasto social",
      title: "Te proponen un viaje de 600 € que no entra en tu presupuesto. ¿Qué haces?",
      o: ["Voy y ya veré", "Digo que no y propongo un plan más barato"], good: [1],
      reveal: () => "Eso es «loud budgeting», la tendencia viral de decir en voz alta «no entra en mi presupuesto». Hablar de dinero sin vergüenza es una de las herramientas de ahorro más eficaces." },
    { id: "doom", type: "decide", kicker: "Tendencia · Doom spending", topic: "el doom spending y el gasto emocional",
      title: "Tras una semana horrible abres la app de compras «porque te lo mereces». ¿Qué te ayuda más?",
      o: ["Comprar ahora", "Esperar 48 horas antes de comprar"], good: [1],
      reveal: () => "El «doom spending» es gastar para aliviar el estrés. La regla de las 48 horas separa el impulso de la decisión: si pasado ese tiempo aún lo quieres, al menos será una compra pensada." },
    { id: "e30", type: "estimate", kicker: "Estima", topic: "el interés compuesto",
      title: "100 € al mes durante 30 años, con un 5 % anual hipotético. ¿Con cuánto acabarías?",
      min: 20000, max: 200000, step: 1000, start: 50000, fmt: v => fmtR(v), truth: () => Math.round(fv(0, 100, 30, 5)), tol: v => v * .15,
      reveal: t => `Unos ${fmtR(t)}. Habrías aportado 36.000 €; los otros ${fmtR(t - 36000)} serían rendimiento acumulado. Eso es el interés compuesto.` },
    { id: "einf", type: "estimate", kicker: "Estima", topic: "la inflación",
      title: "Guardas 1.000 € en un cajón diez años con una inflación del 3 % anual. ¿Cuánto poder de compra conservan, en euros de hoy?",
      min: 400, max: 1000, step: 10, start: 950, fmt: v => fmtR(v), truth: () => Math.round(1000 / Math.pow(1.03, 10)), tol: () => 40,
      reveal: t => `Unos ${fmtR(t)}. Los billetes siguen siendo 1.000 €, pero compran un ${Math.round(100 - t / 10)} % menos.` },
    { id: "efee", type: "estimate", kicker: "Estima", topic: "el efecto de las comisiones",
      title: "Dos fondos idénticos; uno cobra un 1 % más al año. 100 € al mes durante 30 años. ¿Cuánto capital menos tiene el caro?",
      min: 0, max: 50, step: 1, start: 3, fmt: v => `${v} % menos`, truth: () => Math.round((1 - fv(0, 100, 30, 4) / fv(0, 100, 30, 5)) * 100), tol: () => 4,
      reveal: t => `En torno a un ${t} % menos, unos ${fmtR(fv(0, 100, 30, 5) - fv(0, 100, 30, 4))}. Las comisiones parecen pequeñas porque se miran año a año, pero se componen igual que la rentabilidad.` },
    { id: "eearly", type: "estimate", kicker: "Estima", topic: "la ventaja de empezar pronto",
      title: "Ana invierte 100 € al mes desde los 25; Leo, desde los 35. Ambos hasta los 65, al 5 % hipotético. ¿Cuántas veces más capital tiene Ana?",
      min: 1, max: 4, step: .1, start: 1.2, fmt: v => `${x1(v)} veces`, truth: () => Math.round((fv(0, 100, 40, 5) / fv(0, 100, 30, 5)) * 10) / 10, tol: () => .25,
      reveal: t => `Unas ${x1(t)} veces más, aportando solo un 33 % más. Diez años de ventaja valen más que casi cualquier aportación extra.` },
    { id: "m-rich", type: "myth", kicker: "¿Mito o realidad?", topic: "invertir con poco dinero", answer: false,
      title: "Invertir solo merece la pena si tienes mucho dinero.",
      reveal: () => "Mito. Con aportaciones pequeñas y periódicas, el tiempo hace la mayor parte del trabajo. Muchos fondos admiten importes mínimos muy reducidos." },
    { id: "m-past", type: "myth", kicker: "¿Mito o realidad?", topic: "por qué la rentabilidad pasada no garantiza la futura", answer: false,
      title: "Un fondo que subió un 25 % el año pasado probablemente repetirá.",
      reveal: () => "Mito. Las rentabilidades pasadas no son un indicador fiable de las futuras: un año excepcional puede deberse a condiciones que no se repiten." },
    { id: "m-div", type: "myth", kicker: "¿Mito o realidad?", topic: "qué consigue y qué no la diversificación", answer: false,
      title: "Diversificar elimina el riesgo.",
      reveal: () => "Mito. Diversificar reduce la dependencia de un solo activo, pero el riesgo de mercado sigue existiendo." },
    { id: "m-cash", type: "myth", kicker: "¿Mito o realidad?", topic: "la inflación y el dinero parado", answer: true,
      title: "Con inflación positiva, el dinero parado pierde valor real.",
      reveal: () => "Realidad. El importe nominal no cambia, pero cada año compra menos bienes y servicios." },
    { id: "m-soft", type: "myth", kicker: "Tendencia · Soft saving", topic: "el soft saving y el equilibrio entre disfrutar y ahorrar", answer: false,
      title: "Disfrutar hoy y ahorrar para mañana son incompatibles.",
      reveal: () => "Mito. El «soft saving» propone ahorrar con calma sin renunciar a vivir. La clave es automatizar una cantidad sostenible y disfrutar del resto sin culpa." },
    { id: "q72", type: "quiz", kicker: "Regla rápida", topic: "la regla del 72",
      title: "Regla del 72: divide 72 entre la rentabilidad anual y obtienes los años que tarda tu dinero en duplicarse. Al 6 %, ¿cuántos años?",
      o: ["6 años", "12 años", "24 años"], good: [1],
      reveal: () => "72 ÷ 6 = 12 años. Al 3 % serían 24. Una aproximación útil para comparar escenarios de un vistazo." },
    { id: "qemerg", type: "quiz", kicker: "Antes de invertir", topic: "el colchón de emergencia",
      title: "¿Qué debería estar listo antes de empezar a invertir?",
      o: ["Un colchón de 3 a 6 meses de gastos", "Un móvil nuevo", "Nada, cuanto antes mejor"], good: [0],
      reveal: () => "El colchón de emergencia evita tener que vender inversiones en el peor momento si surge un imprevisto." }
];

let pulse = null; // sesión en curso

function pulseState() {
    if (!S.pulse || typeof S.pulse !== "object") S.pulse = {};
    const p = S.pulse;
    p.box ||= {}; p.due ||= {}; p.saved ||= []; p.days ||= [];
    p.answered ||= 0; p.correct ||= 0;
    return p;
}
function pulseStreak() {
    const days = new Set(pulseState().days);
    let d = today(), n = 0;
    if (!days.has(d)) d--;
    while (days.has(d)) { n++; d--; }
    return n;
}
function personalCard() {
    const g = S.goals.filter(x => !isDone(x)).sort((a, b) => a.year - b.year)[0];
    if (!g) return { id: "p-start", type: "personal", kicker: "Para ti", title: "Tu dinero todavía no tiene un nombre.",
        body: "Un objetivo con importe y fecha es la palanca que más ayuda a mantener el ahorro. Te lleva treinta segundos.", act: "newGoal", cta: "Definir un objetivo" };
    const now = monthsToReach(g, 5), plus = monthsToReach({ ...g, monthly: (+g.monthly || 0) + 20 }, 5);
    const diff = isFinite(now) && isFinite(plus) ? now - plus : 0;
    return { id: "p-goal", type: "personal", kicker: "Para ti", title: `«${g.name}»`, goal: g.id,
        body: diff > 0
            ? `Llevas ${fmt(saved(g))} de ${fmt(g.target)}. Con 20 € más al mes lo alcanzarías unos ${diff} meses antes (5 % hipotético).`
            : `Llevas ${fmt(saved(g))} de ${fmt(g.target)}. Cada aportación cuenta: registra la de esta semana.`,
        act: "contribute", cta: "Aportar ahora" };
}
function newPulseSession(ids) {
    if (ids) { pulse = { cards: shuffle(CARDS.filter(c => ids.includes(c.id))), results: {}, idx: 0 }; return; }
    const p = pulseState(), t = today();
    const due = CARDS.filter(c => p.due[c.id] !== undefined && p.due[c.id] <= t).sort((a, b) => (p.box[a.id] || 0) - (p.box[b.id] || 0));
    const fresh = shuffle(CARDS.filter(c => p.due[c.id] === undefined));
    const later = shuffle(CARDS.filter(c => p.due[c.id] > t));
    const cards = [...due, ...fresh, ...later].slice(0, SESSION_SIZE);
    cards.splice(Math.min(3, cards.length), 0, personalCard());
    pulse = { cards, results: {}, idx: 0 };
}

function pulseCardHTML(c, i) {
    const n = pulse.cards.length;
    let body = "";
    if (c.type === "decide" || c.type === "quiz")
        body = `<div class="p-opts">${c.o.map((o, k) => `<button class="p-opt" data-act="pulseAnswer" data-i="${i}" data-v="${k}">${o}</button>`).join("")}</div>`;
    else if (c.type === "myth")
        body = `<div class="p-opts p-two"><button class="p-opt" data-act="pulseAnswer" data-i="${i}" data-v="0">Mito</button><button class="p-opt" data-act="pulseAnswer" data-i="${i}" data-v="1">Realidad</button></div>`;
    else if (c.type === "estimate")
        body = `<div class="p-est"><output id="pv${i}">${c.fmt(c.start)}</output>
            <input type="range" data-input="pulseRange" data-i="${i}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.start}" aria-label="Tu estimación">
            <div class="row between small"><span>${c.fmt(c.min)}</span><span>${c.fmt(c.max)}</span></div>
            <button class="p-opt p-go" data-act="pulseAnswer" data-i="${i}">Comprobar</button></div>`;
    else if (c.type === "personal")
        body = `<p class="p-body">${esc(c.body)}</p><button class="p-opt p-go" data-act="${c.act}" ${c.goal ? `data-id="${c.goal}"` : ""}>${c.cta} →</button>`;
    const saved = pulseState().saved.includes(c.id);
    return `<article class="p-card p-${c.type}" data-i="${i}">
        <div class="p-inner">
            <p class="p-kicker">${c.kicker}</p>
            <h2 class="p-title">${c.type === "personal" ? esc(c.title) : c.title}</h2>
            ${body}
            <div class="p-reveal" id="pr${i}" aria-live="polite"></div>
        </div>
        ${c.type === "personal" ? "" : `<aside class="p-rail">
            <button data-act="pulseSave" data-i="${i}" class="${saved ? "on" : ""}" aria-pressed="${saved}"><b>${saved ? "■" : "□"}</b>Guardar</button>
            <button data-act="pulseExplain" data-i="${i}"><b>?</b>Explicar</button>
            <button data-act="pulseShare" data-i="${i}"><b>↗</b>Enviar</button></aside>`}
        <p class="p-count">${i + 1} / ${n}</p>
    </article>`;
}
function pulseEndHTML() {
    return `<article class="p-card p-end" data-i="${pulse.cards.length}"><div class="p-inner" id="pulseEnd"></div></article>`;
}
function paintPulseEnd() {
    const el = $("#pulseEnd");
    if (!el) return;
    const res = Object.values(pulse.results), ok = res.filter(Boolean).length;
    const back = res.length - ok;
    el.innerHTML = `<p class="p-kicker">Sesión completada</p>
        <h2 class="p-title">${res.length ? `${ok} de ${res.length} decisiones acertadas.` : "Has llegado al final."}</h2>
        <p class="p-body">${back ? `${back} tarjeta${back === 1 ? "" : "s"} volverá${back === 1 ? "" : "n"} en tu próxima sesión: repasar lo que se falla es lo que fija el aprendizaje.` : "Las tarjetas acertadas volverán más adelante, espaciadas, para que no se olviden."}</p>
        <dl class="p-stats"><div><dt>Racha</dt><dd>${pulseStreak()} día${pulseStreak() === 1 ? "" : "s"}</dd></div><div><dt>Precisión total</dt><dd>${pulseState().answered ? Math.round((pulseState().correct / pulseState().answered) * 100) : 0} %</dd></div><div><dt>Guardadas</dt><dd>${pulseState().saved.length}</dd></div></dl>
        <p class="p-body small">Siete tarjetas al día son suficientes. Vuelve mañana: la constancia vale más que el atracón.</p>
        <div class="row"><button class="p-opt p-go" data-act="pulseAgain">Otra sesión</button><a class="p-opt" href="#/aprende">Volver a Aprende</a></div>`;
}

function viewPulso() {
    if (!pulse || pulse.done) newPulseSession();
    const n = pulse.cards.length;
    return `<div class="pulse">
        <header class="p-top">
            <a href="#/aprende" class="p-close" aria-label="Salir de la práctica">×</a>
            <span class="brand imm-brand" aria-label="Horizonte"><img class="brand-star" src="brand/horizonte-icono.svg" alt="" width="23" height="19"><span class="brand-word" aria-hidden="true">Horizonte</span></span>
            <div class="p-bars">${Array.from({ length: n + 1 }, (_, i) => `<i data-b="${i}" class="${i === 0 ? "now" : ""}"></i>`).join("")}</div>
            <span class="p-streak" title="Días seguidos con sesión">${pulseStreak()} d</span>
        </header>
        <div class="p-feed" id="pulseFeed">${pulse.cards.map(pulseCardHTML).join("")}${pulseEndHTML()}</div>
        <p class="p-hint" id="pulseHint">Desliza ↑</p>
    </div>`;
}
function mountPulse() {
    const feed = $("#pulseFeed");
    if (!feed) return;
    paintPulseEnd();
    const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        pulse.idx = +e.target.dataset.i;
        $$(".p-bars i").forEach((b, k) => b.className = k < pulse.idx ? "past" : k === pulse.idx ? "now" : "");
        if (pulse.idx > 0) $("#pulseHint")?.remove();
        if (pulse.idx === pulse.cards.length) { pulse.done = true; paintPulseEnd(); }
    }), { root: feed, threshold: .6 });
    $$(".p-card", feed).forEach(c => io.observe(c));
    pulse.io = io;
}
function pulseGo(dir) {
    const feed = $("#pulseFeed");
    if (feed) feed.scrollTo({ top: (pulse.idx + dir) * feed.clientHeight, behavior: "smooth" });
}

function gradePulse(c, v) {
    if (c.type === "myth") return (v === 1) === c.answer;
    if (c.type === "estimate") return Math.abs(v - c.truth()) <= c.tol(c.truth());
    return c.good.includes(v);
}
function answerPulse(el) {
    const i = +el.dataset.i, c = pulse.cards[i];
    if (i in pulse.results) return;
    const card = el.closest(".p-card");
    const v = c.type === "estimate" ? +$("input[type=range]", card).value : +el.dataset.v;
    const ok = gradePulse(c, v);
    pulse.results[i] = ok;

    const p = pulseState(), t = today();
    p.answered++; if (ok) p.correct++;
    p.box[c.id] = ok ? Math.min(LEITNER.length - 1, (p.box[c.id] || 0) + 1) : 0;
    p.due[c.id] = t + (ok ? LEITNER[p.box[c.id]] : 1);
    if (!p.days.includes(t)) p.days = [...p.days, t].slice(-60);
    save();

    card.classList.add("answered", ok ? "ok" : "ko");
    $$(".p-opt", card).forEach(b => { b.disabled = true; });
    if (c.type === "estimate") {
        $("input[type=range]", card).disabled = true;
        const t2 = c.truth();
        $(".p-est", card).insertAdjacentHTML("beforeend", `<p class="p-cmp">Tu estimación: <b>${c.fmt(v)}</b> · Real: <b>${c.fmt(t2)}</b></p>`);
    } else {
        $$(".p-opt", card).forEach(b => {
            const k = +b.dataset.v;
            if (c.type === "myth" ? (k === 1) === c.answer : c.good.includes(k)) b.classList.add("right");
            else if (k === v) b.classList.add("wrong");
        });
    }
    $(`#pr${i}`).innerHTML = `<p class="p-verdict">${ok ? "Bien visto." : "No exactamente."}</p><p>${c.reveal(c.type === "estimate" ? c.truth() : v)}</p>`;
    $(".p-streak").textContent = `${pulseStreak()} d`;
    paintPulseEnd();
}

/* =========================================================
   Render + router
========================================================= */
const VIEWS = { practica: viewPulso, resumen: viewResumen, aprende: viewAprende, juegos: viewJuegos, conecta: viewConecta, objetivos: viewObjetivos, simulador: viewSimulador, circulo: viewCirculo, ...GAME_VIEWS };
const IMMERSIVE = ["practica", ...GAME_ROUTES];
const TITLES = { practica: "Práctica", conecta: "Conecta", resumen: "Resumen", aprende: "Aprende", objetivos: "Objetivos", simulador: "Simulador", circulo: "Círculo", ...GAME_TITLES };
let lastRoute = null;

/* =========================================================
   Índice de secciones (como el menú desplegable de apple.com)
   Escritorio: al pasar por una sección de arriba se abre su mini índice.
   Móvil: barra bajo la cabecera con el nombre de la sección y su índice.
========================================================= */
const MENU = {
    resumen: { name: "Inicio", main: [{ t: "Tu horizonte", go: "resumen", sec: "hz" }, { t: "Tus objetivos", go: "resumen", sec: "s-objetivos" }, { t: "Hoy en Horizonte", go: "resumen", sec: "s-hoy" }],
        cols: () => [["Enlaces rápidos", [{ t: "Nuevo objetivo", act: "newGoal" }, { t: "Ver escenarios", go: "simulador" }, { t: "Hablar con el asistente", act: "coach" }]]] },
    aprende: { name: "Aprende", main: [{ t: "Práctica de hoy", go: "practica" }, { t: "Temas", go: "aprende", sec: "a-temas" }, { t: "Perfil de inversor", act: "quiz" }, { t: "Regla 50/30/20", go: "aprende", sec: "a-herramientas" }],
        cols: () => [["Temas más útiles", TOPICS.slice(0, 5).map(tp => ({ t: tp.title, act: "topic", id: tp.id }))]] },
    juegos: { name: "Juegos", main: [{ t: "Aguanta", go: "aguanta" }, { t: "Silueta", go: "silueta" }, { t: "Más o menos", go: "masomenos" }, { t: "Draft Night", go: "draft" }],
        cols: () => [["Enlaces rápidos", [{ t: "Todos los juegos", go: "juegos" }, { t: "Retos diarios", go: "juegos" }]]] },
    conecta: { name: "Conecta", main: [{ t: "Tu voz", go: "conecta", tab: "voz" }, { t: "Tu calle", go: "conecta", tab: "calle" }, { t: "Tu proyecto", go: "conecta", tab: "proyecto" }],
        cols: () => [["Qué es cada una", [{ t: "Vota propuestas de empresas", go: "conecta", tab: "voz" }, { t: "Descubre empresas cerca de ti", go: "conecta", tab: "calle" }, { t: "Encuentra apoyo para tu idea", go: "conecta", tab: "proyecto" }]]] },
    objetivos: { name: "Objetivos", main: [{ t: "Tus objetivos", go: "objetivos" }, { t: "Simulador", go: "simulador" }, { t: "Datos de mercado", go: "simulador", sec: "s-mercado" }],
        cols: () => [["Enlaces rápidos", [{ t: "Nuevo objetivo", act: "newGoal" }, { t: "Conoce tu perfil", act: "quiz" }]]] },
    circulo: { name: "Círculo", main: [{ t: "Tus círculos", go: "circulo" }],
        cols: () => [["Enlaces rápidos", [{ t: "Crear círculo", act: user ? "newCircle" : "auth" }, { t: "Unirme con código", act: user ? "joinCircle" : "auth" }]]] }
};
const navKey = r => r === "practica" ? "aprende" : r === "simulador" ? "objetivos" : GAME_MOUNT[r] ? "juegos" : r;
function menuLink(it, cls) {
    if (it.act) return `<li><button class="fl-link ${cls}" data-act="${it.act}"${it.id ? ` data-id="${it.id}"` : ""}>${it.t}</button></li>`;
    return `<li><a class="fl-link ${cls}" href="#/${it.go}"${it.sec ? ` data-sec="${it.sec}"` : ""}${it.tab ? ` data-cxtab="${it.tab}"` : ""}>${it.t}</a></li>`;
}
function menuHTML(k) {
    const m = MENU[k];
    return `<div class="fl-col fl-main"><p class="fl-h">Explorar ${m.name}</p><ul>${m.main.map(it => menuLink(it, "big")).join("")}</ul></div>`
        + m.cols().map(([h, items]) => `<div class="fl-col"><p class="fl-h">${h}</p><ul>${items.map(it => menuLink(it, "")).join("")}</ul></div>`).join("");
}
let flyTimer = null, flyKey = null;
function openFly(k) {
    clearTimeout(flyTimer);
    if (window.innerWidth <= 860 || document.body.classList.contains("immersive")) return;
    if (flyKey !== k) { $("#flyIn").innerHTML = menuHTML(k); flyKey = k; }
    $("#flyIn").style.setProperty("--fl-left", `${Math.max(20, $("#nav").getBoundingClientRect().left + 12)}px`);
    document.body.classList.add("fly-open");
}
function closeFly(delay = 0) {
    clearTimeout(flyTimer);
    flyTimer = setTimeout(() => { document.body.classList.remove("fly-open"); flyKey = null; }, delay);
}
let pendingSec = null;
function goSec(id) { const t = id && document.getElementById(id); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }
function paintLocalNav(r) {
    const k = navKey(r), ln = $("#localnav");
    if (!ln || !MENU[k]) return;
    $("#lnName").textContent = MENU[k].name;
    $("#lnPanel").innerHTML = menuHTML(k);
    ln.classList.remove("open");
    $("#lnBtn").setAttribute("aria-expanded", "false");
}
function initMenus() {
    $$("#nav a").forEach(a => {
        a.addEventListener("mouseenter", () => { clearTimeout(flyTimer); flyTimer = setTimeout(() => openFly(a.dataset.tab), document.body.classList.contains("fly-open") ? 0 : 140); });
        a.addEventListener("focus", () => openFly(a.dataset.tab));
        a.addEventListener("click", () => closeFly());
    });
    $(".top").addEventListener("mouseleave", () => closeFly(160));
    $("#flyout").addEventListener("mouseenter", () => clearTimeout(flyTimer));
    $(".top-actions").addEventListener("mouseenter", () => closeFly(120));
    $(".brand").addEventListener("mouseenter", () => closeFly(120));
    $("#flyScrim").addEventListener("click", () => closeFly());
    addEventListener("keydown", e => { if (e.key === "Escape" && document.body.classList.contains("fly-open")) closeFly(); });
    $("#lnBtn").addEventListener("click", () => { const o = $("#localnav").classList.toggle("open"); $("#lnBtn").setAttribute("aria-expanded", o); });
    document.addEventListener("click", e => {
        const l = e.target.closest(".fl-link");
        if (!l) return;
        closeFly();
        $("#localnav")?.classList.remove("open");
        if (l.tagName !== "A") return;
        const target = l.getAttribute("href").slice(2);
        if (l.dataset.cxtab) cx.tab = l.dataset.cxtab;
        pendingSec = l.dataset.sec || null;
        if (target === route()) { e.preventDefault(); if (l.dataset.cxtab) { lastRoute = null; render(false); } if (pendingSec) { goSec(pendingSec); pendingSec = null; } else window.scrollTo({ top: 0, behavior: "smooth" }); }
    });
}

function render(animate = true) {
    const r = VIEWS[route()] ? route() : "resumen";
    const el = $("#view");
    const changed = r !== lastRoute;
    if (!changed && ((r === "practica" && $("#pulseFeed")) || (GAME_MOUNT[r] && $("#gRoot")))) return paintChrome(); // no reiniciar el feed ni la partida
    if (changed) { if ($(".sheet")) closeSheet(); pulse?.io?.disconnect(); gameLeave(); document.body.classList.toggle("immersive", IMMERSIVE.includes(r)); el.classList.remove("fade"); }
    el.innerHTML = VIEWS[r]();
    if (animate && changed && !IMMERSIVE.includes(r)) { el.classList.remove("fade"); void el.offsetWidth; el.classList.add("fade"); window.scrollTo(0, 0); }
    $$("#nav a").forEach(a => { const on = a.dataset.tab === navKey(r); a.classList.toggle("on", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); });
    if (changed) { stopCirclePolling(); if (r === "circulo") startCirclePolling(); document.title = `Horizonte · ${TITLES[r]}`; }
    lastRoute = r;
    if (r === "simulador") { sim.hover = null; requestAnimationFrame(drawSim); }
    if (r === "practica") mountPulse();
    GAME_MOUNT[r]?.();
    if (r === "conecta") mountConecta();
    paintLocalNav(r);
    if (pendingSec) { const id = pendingSec; pendingSec = null; requestAnimationFrame(() => goSec(id)); }
    paintChrome();
}
addEventListener("hashchange", () => render());
addEventListener("resize", () => route() === "simulador" && drawSim());

/* =========================================================
   Acciones
========================================================= */
const find = id => S.goals.find(g => g.id === id);

function goalForm(g = {}) {
    const cat = g.category || "otro";
    return `<p class="kicker">${g.id ? "Editar objetivo" : "Nuevo objetivo"}</p><h2>${g.id ? "Ajusta los parámetros" : "¿Para qué quieres ahorrar?"}</h2>
    <form data-form="goal" style="margin-top:24px" novalidate>
        <input type="hidden" name="id" value="${esc(g.id || "")}">
        <div class="field"><label for="gCat">Categoría</label><select id="gCat" name="category">${Object.entries(CATS).map(([k, v]) => `<option value="${k}" ${k === cat ? "selected" : ""}>${v}</option>`).join("")}</select></div>
        <div class="field"><label for="gName">Nombre del objetivo</label><input id="gName" name="name" maxlength="40" placeholder="Ej. Viaje a Japón" value="${esc(g.name || "")}" required></div>
        <div class="cols c2" style="gap:0 16px">
            <div class="field"><label for="gTarget">Importe objetivo (€)</label><input id="gTarget" name="target" type="number" min="1" step="0.01" placeholder="3000" value="${g.target ?? ""}" required></div>
            <div class="field"><label for="gYear">Año</label><input id="gYear" name="year" type="number" min="${YEAR}" max="${YEAR + 60}" value="${g.year ?? YEAR + 2}" required></div>
        </div>
        <div class="field"><label for="gMonthly">Aportación mensual prevista (€)</label><input id="gMonthly" name="monthly" type="number" min="0" step="0.01" placeholder="100" value="${g.monthly ?? ""}"></div>
        <p class="err" hidden></p>
        <button class="btn full" type="submit">${g.id ? "Guardar cambios" : "Crear objetivo"}</button>
    </form>`;
}

const ACTIONS = {
    closeSheet: closeSheet,
    closeSheetBg: (el, e) => { if (e.target === el) closeSheet(); },

    newGoal: () => openSheet(goalForm()),
    tpl: el => {
        const t = TEMPLATES[+el.dataset.i];
        openSheet(goalForm({ category: t.category, name: t.name, target: t.target, year: YEAR + t.years, monthly: t.monthly }));
    },
    editGoal: el => openSheet(goalForm(find(el.dataset.id))),
    deleteGoal: el => {
        const g = find(el.dataset.id);
        if (!confirm(`¿Eliminar «${g.name}» y todas sus aportaciones? Esta acción no se puede deshacer.`)) return;
        S.goals = S.goals.filter(x => x !== g); save(); closeSheet(); render(false); toast("Objetivo eliminado.");
    },

    contribute: el => {
        const g = find(el.dataset.id);
        const sug = [...new Set([g.monthly > 0 ? g.monthly : null, 25, 50, 100, 250].filter(Boolean))].slice(0, 4);
        openSheet(`<p class="kicker">Registrar aportación</p><h2>${esc(g.name)}</h2>
        <p class="muted">Acumulado: ${fmt(saved(g))} de ${fmt(g.target)}.</p>
        <form data-form="contrib" style="margin-top:24px" novalidate><input type="hidden" name="id" value="${g.id}">
            <div class="opts">${sug.map(v => `<button type="button" data-act="quickAmt" data-v="${v}">${fmt(v)}</button>`).join("")}</div>
            <div class="field"><label for="cAmt">Importe (€)</label><input id="cAmt" name="amount" type="number" min="0.01" step="0.01" required></div>
            <div class="field"><label for="cNote">Concepto (opcional)</label><input id="cNote" name="note" maxlength="60" placeholder="Ej. nómina de octubre"></div>
            <p class="err" hidden></p><button class="btn full" type="submit">Registrar</button></form>`);
    },
    quickAmt: el => { $("#cAmt").value = el.dataset.v; $$(".opts button").forEach(b => b.classList.toggle("on", b === el)); },
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
        try { await api("/auth/logout", { method: "POST", body: {} }); } catch { /* ignorar */ }
        user = null; S = normalize(lsGet("hz_guest")); resetCirc();
        closeSheet(); lastRoute = null; render(false); toast("Sesión cerrada.");
    },
    demo: () => {
        const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return isoDate(x); };
        const mk = (category, name, target, year, monthly, list) => ({ id: uid() + name.length, category, name, target, year, monthly, contribs: list.map(([n, a]) => ({ id: uid() + n, amount: a, date: d(n), note: "" })) });
        S.goals.push(
            mk("vivienda", "Entrada de vivienda", 25000, YEAR + 6, 300, [[75, 1200], [50, 300], [22, 300], [15, 300], [8, 300], [1, 300]]),
            mk("viaje", "Viaje a Japón", 3000, YEAR + 1, 150, [[40, 400], [20, 150], [3, 150]]),
            mk("emergencia", "Colchón de emergencia", 3000, YEAR + 2, 125, [[30, 500], [9, 125]])
        );
        save(); closeSheet(); render(false); toast("Datos de demostración cargados.");
    },
    reset: () => {
        if (!confirm("¿Eliminar todos tus datos (objetivos, aportaciones y progreso)? Esta acción no se puede deshacer.")) return;
        S = blank(); save(); closeSheet(); render(false); toast("Datos eliminados.");
    },
    exportData: () => {
        const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: "application/json" })), download: "horizonte-datos.json" });
        a.click(); URL.revokeObjectURL(a.href);
    },

    newCircle: () => openSheet(`<p class="kicker">Nuevo círculo</p><h2>Objetivo compartido</h2>
        <form data-form="circle" style="margin-top:24px" novalidate>
            <div class="field"><label for="ccCat">Categoría</label><select id="ccCat" name="category">${Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
            <div class="field"><label for="ccName">Nombre</label><input id="ccName" name="name" maxlength="40" placeholder="Ej. Interrail de verano" required></div>
            <div class="field"><label for="ccT">Importe objetivo conjunto (€)</label><input id="ccT" name="target" type="number" min="1" step="1" placeholder="4000" required></div>
            <p class="err" hidden></p><button class="btn full" type="submit">Crear círculo</button></form>`),
    joinCircle: () => openSheet(`<p class="kicker">Unirme a un círculo</p><h2>Código de invitación</h2>
        <form data-form="join" style="margin-top:24px" novalidate><div class="field"><label for="jc">Código de 6 caracteres</label>
        <input id="jc" name="code" maxlength="6" autocomplete="off" style="text-transform:uppercase;letter-spacing:.3em;font-family:var(--serif);font-size:22px;text-align:center" required></div>
        <p class="err" hidden></p><button class="btn full" type="submit">Unirme</button></form>`),
    circleContribute: el => {
        const c = circ.list.find(x => x.code === el.dataset.code);
        openSheet(`<p class="kicker">Aportación al círculo</p><h2>${esc(c.name)}</h2>
        <form data-form="circleContrib" style="margin-top:24px" novalidate><input type="hidden" name="code" value="${c.code}">
            <div class="field"><label for="ccA">Importe (€)</label><input id="ccA" name="amount" type="number" min="0.01" step="0.01" required></div>
            <p class="muted small" style="margin-bottom:18px">Solo se comparte este importe con los participantes. El resto de tu información permanece privada.</p>
            <p class="err" hidden></p><button class="btn full" type="submit">Registrar aportación</button></form>`);
    },
    shareCircle: async el => {
        const text = `Te invito a mi círculo «${el.dataset.name}» en Horizonte. Código: ${el.dataset.code}`;
        try { if (navigator.share) return await navigator.share({ text }); } catch { return; }
        try { await navigator.clipboard.writeText(text); toast("Invitación copiada al portapapeles."); } catch { prompt("Copia la invitación:", text); }
    },
    leaveCircle: async el => {
        if (!confirm("¿Abandonar este círculo?")) return;
        try { await api(`/circles/${el.dataset.code}/leave`, { method: "POST", body: {} }); await loadCircles(true); toast("Has abandonado el círculo."); }
        catch (e) { toast(e.message); }
    },

    topic: el => topicSheet(TOPICS.find(t => t.id === el.dataset.id)),
    practice: el => {
        const tp = TOPICS.find(t => t.id === el.dataset.topic);
        newPulseSession(tp ? tp.cards : el.dataset.saved ? pulseState().saved : undefined);
        closeSheet(); lastRoute = null;
        route() === "practica" ? render(false) : (location.hash = "#/practica");
    },
    quiz: () => profileQuiz(0, []),
    quizPick: el => profileQuiz(+el.dataset.step + 1, [...el.dataset.acc.split(",").filter(Boolean).map(Number), +el.dataset.v]),
    newGoalFromBudget: el => openSheet(goalForm({ monthly: +el.dataset.v })),

    pulseAnswer: el => answerPulse(el),
    pulseAgain: () => { newPulseSession(); lastRoute = null; render(false); },
    pulseSave: el => {
        const p = pulseState(), id = pulse.cards[+el.dataset.i].id, on = !p.saved.includes(id);
        p.saved = on ? [...p.saved, id] : p.saved.filter(x => x !== id);
        save();
        el.classList.toggle("on", on); el.setAttribute("aria-pressed", on); $("b", el).textContent = on ? "■" : "□";
    },
    pulseExplain: el => { const c = pulse.cards[+el.dataset.i]; coachSheet(); sendCoach(`Explícame con más detalle ${c.topic}.`); },
    pulseShare: async el => {
        const c = pulse.cards[+el.dataset.i], text = `${c.kicker}: ${c.title.replace(/<[^>]+>/g, "")} ¿Tú qué harías? Pruébalo en Horizonte.`;
        try { if (navigator.share) return await navigator.share({ text }); } catch { return; }
        try { await navigator.clipboard.writeText(text); toast("Tarjeta copiada al portapapeles."); } catch { /* sin portapapeles */ }
    },

    theme: () => {
        const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = t; lsSet("hz_theme", t); paintChrome();
        if (route() === "simulador") drawSim();
    },
    privacy: () => {
        const on = document.documentElement.classList.toggle("private"); lsSet("hz_private", on); paintChrome();
        toast(on ? "Importes ocultos. Pulsa el ojo para volver a verlos." : "Importes visibles.");
    },
    coach: () => coachSheet(),
    coachChip: el => sendCoach(el.dataset.q),
    ...GAME_ACTIONS,
    ...CX_ACTIONS
};

function showDetail(id) {
    const g = find(id);
    if (!g) return closeSheet();
    const hist = [...g.contribs].sort((a, b) => b.date.localeCompare(a.date));
    openSheet(`${catLbl(g, "kicker", "p")}<h2>${esc(g.name)}</h2>
    <div class="facts" style="border-top:1px solid var(--rule);margin:20px 0;grid-template-columns:repeat(3,1fr)">
        <div class="fact" style="padding:16px 12px 16px 0"><span>Acumulado</span><strong style="font-size:24px">${fmt(saved(g))}</strong></div>
        <div class="fact" style="padding:16px 12px"><span>Objetivo</span><strong style="font-size:24px">${fmt(g.target)}</strong></div>
        <div class="fact" style="padding:16px 0 16px 12px;border-top:0"><span>Mensual</span><strong style="font-size:24px">${fmt(g.monthly)}</strong></div></div>
    <p class="kicker" style="margin-top:8px">Movimientos</p>
    ${hist.length ? `<div class="tbl-wrap" style="max-height:260px;overflow:auto"><table class="tbl"><thead><tr><th>Fecha</th><th>Concepto</th><th class="r">Importe</th><th class="r"></th></tr></thead><tbody>
        ${hist.map(c => `<tr><td>${longDate(c.date)}</td><td class="muted">${esc(c.note) || "—"}</td><td class="r"><b>${fmt(c.amount)}</b></td><td class="r"><button class="x" data-act="delContrib" data-id="${g.id}" data-cid="${c.id}">Anular</button></td></tr>`).join("")}</tbody></table></div>`
        : `<p class="muted">Todavía no hay aportaciones registradas.</p>`}
    <div class="row" style="margin-top:28px;gap:20px"><button class="btn sm" data-act="contribute" data-id="${g.id}">Aportar</button>
        <button class="link" data-act="editGoal" data-id="${g.id}">Editar</button>
        <button class="link neg" data-act="deleteGoal" data-id="${g.id}">Eliminar</button></div>`);
}

function authSheet(mode) {
    const reg = mode === "register";
    openSheet(`<p class="kicker">${reg ? "Alta de usuario" : "Acceso"}</p><h2>${reg ? "Crea tu cuenta" : "Accede a Horizonte"}</h2>
    <p class="muted">Tus objetivos se sincronizan entre dispositivos. Las contraseñas se almacenan cifradas.</p>
    <form data-form="${reg ? "register" : "login"}" style="margin-top:24px" novalidate>
        <div class="field"><label for="aU">Usuario</label><input id="aU" name="username" autocomplete="username" maxlength="40" required></div>
        <div class="field"><label for="aP">Contraseña${reg ? " (mínimo 8 caracteres)" : ""}</label><input id="aP" name="password" type="password" autocomplete="${reg ? "new-password" : "current-password"}" minlength="8" required></div>
        ${reg ? `<div class="field"><label for="aP2">Confirmar contraseña</label><input id="aP2" name="password2" type="password" autocomplete="new-password" required></div>` : ""}
        <p class="err" hidden></p><button class="btn full" type="submit">${reg ? "Crear cuenta" : "Acceder"}</button></form>
    <p style="margin-top:20px" class="muted small">${reg ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"} <button class="link" data-act="authSwitch" data-mode="${reg ? "login" : "register"}">${reg ? "Accede" : "Regístrate"}</button></p>`);
}

function profileSheet() {
    openSheet(`<p class="kicker">Mi cuenta</p><h2>${user ? esc(user.username) : "Usuario invitado"}</h2>
    <p class="muted">${user ? "Datos sincronizados con tu cuenta." : `Datos guardados solo en este dispositivo. <button class="link" data-act="auth">Accede</button> para sincronizarlos.`}</p>
    <table class="tbl" style="margin:24px 0"><tbody>
        <tr><td>Objetivos activos</td><td class="r"><b>${S.goals.length}</b></td></tr>
        <tr><td>Perfil de inversor</td><td class="r"><b>${S.quiz ? S.quiz.profile : "Pendiente"}</b></td></tr>
        <tr><td>Temas dominados</td><td class="r"><b>${topicsDone()} de ${TOPICS.length}</b></td></tr>
    </tbody></table>
    <div style="display:grid;gap:10px">
        ${S.goals.length ? "" : `<button class="btn line" data-act="demo">Cargar datos de demostración</button>`}
        <button class="btn quiet" data-act="exportData">Exportar mis datos (JSON)</button>
        <button class="btn danger" data-act="reset">Eliminar mis datos</button>
        ${user ? `<button class="btn" data-act="logout">Cerrar sesión</button>` : ""}
    </div>`);
}

function topicSheet(tp) {
    const i = TOPICS.indexOf(tp) + 1, m = tp.cards.filter(isMastered).length;
    openSheet(`<p class="kicker">Tema ${String(i).padStart(2, "0")} · ${m} de ${tp.cards.length} tarjetas dominadas</p><h2>${tp.title}</h2>
    <p style="margin:16px 0 28px;line-height:1.75">${tp.body}</p>
    <button class="btn" data-act="practice" data-topic="${tp.id}">Practicar este tema · ${tp.cards.length} tarjeta${tp.cards.length === 1 ? "" : "s"} ${ARROW}</button>`);
}

function profileQuiz(step, acc) {
    if (step >= PROFILE_QS.length) {
        const score = acc.reduce((a, b) => a + b, 0); // 0..10
        const profile = score <= 3 ? "Conservador" : score <= 6 ? "Moderado" : "Dinámico";
        S.quiz = { profile, score };
        save(); render(false);
        return openSheet(`<p class="kicker">Resultado</p><h2>Perfil ${profile.toLowerCase()}</h2><p style="margin:16px 0">${PROFILES[profile]}</p>
        <p class="muted small">Resultado orientativo con fines educativos. No sustituye la evaluación de idoneidad ni el asesoramiento de un profesional. El simulador destacará este escenario.</p>
        <a class="btn full" href="#/simulador" data-act="closeSheet" style="margin-top:24px">Ver en el simulador ${ARROW}</a>`);
    }
    const q = PROFILE_QS[step];
    openSheet(`<p class="kicker">Pregunta ${step + 1} de ${PROFILE_QS.length}</p>
    <div class="steps">${PROFILE_QS.map((_, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>
    <h2 style="font-size:26px;margin-bottom:24px">${q.q}</h2>
    ${q.o.map((o, i) => `<button class="qopt" data-act="quizPick" data-step="${step}" data-v="${i}" data-acc="${acc.join(",")}">${o}</button>`).join("")}`);
}

/* ---- Asistente ---- */
let chat = [{ who: "bot", text: "Hola, soy el asistente de Horizonte. Puedo explicarte conceptos como el interés compuesto, la inflación o la diversificación, y comentar la situación de tus objetivos. Mi función es educativa: no realizo recomendaciones de inversión personalizadas." }];
function coachSheet() {
    const sugg = ["¿Qué es el interés compuesto?", "¿Cómo van mis objetivos?", "¿Por dónde empiezo a invertir?", "¿Cómo me afecta la inflación?"];
    openSheet(`<p class="kicker">Asistente</p><h2>¿En qué puedo ayudarte?</h2>
    <div class="chat" id="chat" aria-live="polite">${chat.map(chatMsg).join("")}</div>
    <div class="sugg">${sugg.map(c => `<button data-act="coachChip" data-q="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <form class="chat-form" data-form="coach"><input name="message" maxlength="500" placeholder="Escribe tu pregunta" autocomplete="off" aria-label="Pregunta para el asistente"><button class="btn" type="submit">Enviar</button></form>`, { side: true });
    const c = $("#chat"); c.scrollTop = c.scrollHeight;
}
const chatSrc = m => m.src === "local" ? "Respuesta predefinida" : `Respuesta generada con IA${m.model ? ` · ${m.model}` : ""}`;
const plainText = t => String(t).replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s*/gm, "").replace(/^\s*[*-]\s+/gm, "· ");
const chatMsg = m => `<div class="msg ${m.who}">${esc(plainText(m.text))}${m.src ? `<small>${chatSrc(m)}</small>` : ""}</div>`;
// Sin servidor (por ejemplo, en GitHub Pages) el navegador llama directamente a Pollinations, gratis y sin clave.
const COACH_SYSTEM = `Eres el asistente de Horizonte, una app de ahorro e inversión para la Generación Z (prototipo CaixaBank Asset Management x Google). Responde en español de España, con tono profesional y cercano, sin emojis, en un máximo de 120 palabras y sin formato markdown. Eres educativo: no des asesoramiento de inversión personalizado, no recomiendes productos concretos ni prometas rentabilidades. Recuerda que invertir implica riesgo de pérdida y que la rentabilidad pasada no garantiza la futura. Si preguntan qué comprar, explica criterios (horizonte, riesgo, diversificación, costes) y sugiere consultar a un asesor.`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function browserCoach(text, ctx, history, retry = true) {
    const r = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "openai", temperature: 0.6, max_tokens: 900, messages: [
            { role: "system", content: `${COACH_SYSTEM}
Datos del usuario (JSON): ${JSON.stringify(ctx).slice(0, 2000)}` }, ...history, { role: "user", content: text }] })
    });
    // Sin clave solo admite una pregunta cada ~15 s: se espera lo que haga falta y se reintenta una vez.
    if ((r.status === 429 || r.status >= 500) && retry) {
        await sleep(Math.min(16, +r.headers.get("retry-after") || 14) * 1000);
        return browserCoach(text, ctx, history, false);
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json(), reply = j.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("respuesta vacía");
    return { reply, source: "pollinations", model: j.model };
}
async function sendCoach(text) {
    text = text.trim();
    if (!text) return;
    chat.push({ who: "me", text });
    const box = $("#chat");
    box.insertAdjacentHTML("beforeend", chatMsg(chat.at(-1)) + `<div class="msg bot typing" id="typing"></div>`);
    box.scrollTop = box.scrollHeight;
    let reply;
    const ctx = { goals: S.goals.map(g => ({ name: g.name, target: g.target, saved: Math.round(saved(g)), monthly: g.monthly, year: g.year })), profile: S.quiz?.profile };
    const history = chat.slice(1, -1).slice(-6).map(m => ({ role: m.who === "me" ? "user" : "assistant", content: m.text }));
    try {
        reply = await api("/coach", { method: "POST", body: { message: text, context: ctx, history } });
    } catch (e) {
        try { if (e.status && e.status < 404) throw e; reply = await browserCoach(text, ctx, history); }
        catch { reply = { reply: localCoach(text, ctx), source: "local" }; }
    }
    chat.push({ who: "bot", text: reply.reply, src: reply.source, model: reply.model });
    $("#typing")?.remove();
    const b = $("#chat");
    if (b) { b.insertAdjacentHTML("beforeend", chatMsg(chat.at(-1))); b.scrollTop = b.scrollHeight; }
}

/* =========================================================
   Formularios
========================================================= */
function formErr(form, msg) { const e = $(".err", form); e.textContent = msg; e.hidden = false; }
function afterAuth(res) {
    user = res.user;
    if (res.state && (hasData(normalize(res.state)) || !hasData(S))) S = normalize(res.state);
    save(); // si el servidor no tenía datos, se suben los locales
    resetCirc(); lastRoute = null;
    closeSheet(); render(false);
    toast(`Sesión iniciada como ${user.username}.`);
}
const FORMS = {
    goal: form => {
        const f = new FormData(form), name = String(f.get("name")).trim(), target = +f.get("target"), year = +f.get("year"), monthly = +f.get("monthly") || 0;
        if (!name) return formErr(form, "Indica un nombre para el objetivo.");
        if (!(target > 0)) return formErr(form, "El importe objetivo debe ser mayor que cero.");
        if (!(year >= YEAR && year <= YEAR + 60)) return formErr(form, `El año debe estar entre ${YEAR} y ${YEAR + 60}.`);
        if (monthly < 0) return formErr(form, "La aportación no puede ser negativa.");
        const id = f.get("id"), data = { name, target, year, monthly, category: f.get("category") };
        if (id) { Object.assign(find(id), data); toast("Objetivo actualizado."); }
        else { S.goals.push({ id: uid(), ...data, contribs: [] }); toast("Objetivo creado."); }
        save(); closeSheet(); render(false);
    },
    contrib: form => {
        const f = new FormData(form), amount = Math.round(+f.get("amount") * 100) / 100, g = find(f.get("id"));
        if (!(amount > 0) || amount > 1e7) return formErr(form, "Introduce un importe válido.");
        const before = progress(g);
        g.contribs.push({ id: uid(), amount, date: isoDate(), note: String(f.get("note")).trim() });
        save();
        const after = progress(g), hit = [100, 75, 50, 25].find(m => before < m && after >= m);
        closeSheet(); render(false);
        toast(hit === 100 ? `Objetivo «${g.name}» alcanzado.` : hit ? `«${g.name}» supera el ${hit} % de avance.` : `Aportación de ${fmt(amount)} registrada.`, hit ? 5000 : 3600);
    },
    login: async form => {
        const f = new FormData(form);
        try { afterAuth(await api("/auth/login", { method: "POST", body: { username: f.get("username"), password: f.get("password") } })); }
        catch (e) { formErr(form, e.message); }
    },
    register: async form => {
        const f = new FormData(form);
        if (f.get("password") !== f.get("password2")) return formErr(form, "Las contraseñas no coinciden.");
        try { afterAuth(await api("/auth/register", { method: "POST", body: { username: f.get("username"), password: f.get("password") } })); }
        catch (e) { formErr(form, e.message); }
    },
    circle: async form => {
        const f = new FormData(form);
        try {
            await api("/circles", { method: "POST", body: { name: f.get("name"), target: f.get("target"), category: f.get("category") } });
            S.flags.circle = true; save(); closeSheet(); await loadCircles(true); toast("Círculo creado. Comparte el código para invitar a otros participantes.");
        } catch (e) { formErr(form, e.message); }
    },
    join: async form => {
        try {
            await api("/circles/join", { method: "POST", body: { code: new FormData(form).get("code") } });
            S.flags.circle = true; save(); closeSheet(); await loadCircles(true); toast("Te has unido al círculo.");
        } catch (e) { formErr(form, e.message); }
    },
    circleContrib: async form => {
        const f = new FormData(form);
        try {
            await api(`/circles/${f.get("code")}/contribute`, { method: "POST", body: { amount: f.get("amount") } });
            closeSheet(); await loadCircles(true); toast("Aportación al círculo registrada.");
        } catch (e) { formErr(form, e.message); }
    },
    coach: form => { const i = form.elements.message; const t = i.value; i.value = ""; sendCoach(t); },
    ...GAME_FORMS,
    ...CX_FORMS
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
    if (k === "pulseRange") { const c = pulse.cards[+t.dataset.i]; $(`#pv${t.dataset.i}`).textContent = c.fmt(+t.value); return; }
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
        if (!(v > 0)) { out.textContent = "Introduce un importe para ver la distribución orientativa."; return; }
        out.innerHTML = `<div class="split"><div style="flex:50;background:var(--navy)">50 %</div><div style="flex:30;background:var(--blue)">30 %</div><div style="flex:20;background:var(--accent)">20 %</div></div>
        <table class="tbl"><tbody><tr><td>Necesidades</td><td class="r"><b>${fmt(v * .5)}</b></td></tr><tr><td>Ocio y estilo de vida</td><td class="r"><b>${fmt(v * .3)}</b></td></tr><tr><td>Ahorro e inversión</td><td class="r"><b>${fmt(v * .2)}</b></td></tr></tbody></table>
        <button class="btn sm line" style="margin-top:16px" data-act="newGoalFromBudget" data-v="${Math.round(v * .2)}">Crear un objetivo con el 20 %</button>`;
    }
});
document.addEventListener("keydown", e => {
    if (e.key === "Escape") return closeSheet();
    if (route() !== "practica" || $(".sheet") || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (["ArrowDown", "PageDown", "j"].includes(e.key)) { e.preventDefault(); pulseGo(1); }
    if (["ArrowUp", "PageUp", "k"].includes(e.key)) { e.preventDefault(); pulseGo(-1); }
});

function simPointer(e) {
    const cv = e.target.closest?.("#simChart");
    if (!cv || !cv._geom) return;
    const r = cv.getBoundingClientRect(), { L, w } = cv._geom;
    const i = Math.min(sim.years, Math.max(0, Math.round(((e.clientX - r.left - L) / w) * sim.years)));
    if (i !== sim.hover) { sim.hover = i; drawSim(); }
}
document.addEventListener("pointermove", simPointer);
document.addEventListener("pointerdown", simPointer);
document.addEventListener("pointerleave", e => { if (e.target.id === "simChart") { sim.hover = null; drawSim(); } }, true);

/* =========================================================
   Arranque
========================================================= */
(async function init() {
    const legacy = { "#/inicio": "resumen", "#/metas": "objetivos", "#/formacion": "aprende", "#/pulso": "practica", "#/decada": "juegos" }[location.hash.split("?")[0]];
    if (legacy) history.replaceState(null, "", "#/" + legacy);
    initMenus();
    render();
    try {
        const me = await api("/auth/me");
        if (me.user) {
            user = me.user;
            S = me.state ? normalize(me.state) : normalize(lsGet(`hz_user_${user.id}`) || S);
            if (!me.state) save();
            lastRoute = null; render(false);
        }
    } catch { /* sin servidor: modo invitado */ }
})();
