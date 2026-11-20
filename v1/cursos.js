"use strict";
/* Horizonte · Cursos
   Aprende como en Duolingo, pero con cabeza: cada curso es una ruta corta de pasos (teoría, gráficas,
   mates con ejemplos, calculadoras que se mueven con deslizadores) y termina con un test.
   Quien ya sabe puede saltar directamente al test. El progreso se guarda en el perfil (S.courses).
   Se carga después de cursos-data.js y antes de app.js: las utilidades de app.js ($, S, save, fmtR…)
   solo se usan dentro de funciones. */

const LEVELS = [
    { n: 1, name: "Primeros pasos", sub: "Para empezar de cero: lo básico para entender tu dinero." },
    { n: 2, name: "Cómo crece el dinero", sub: "Interés compuesto, riesgo, diversificación y costes." },
    { n: 3, name: "Para ir más lejos", sub: "Renta fija, valoración y la psicología del inversor." }
];
const PASS = 0.75; // proporción de aciertos del test para dar el curso por completado
const CHECK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;
const crsStore = () => (S.courses && typeof S.courses === "object" ? S.courses : (S.courses = {}));
const crsState = id => (crsStore()[id] ||= { step: 0, best: 0, done: false, tries: 0 });
const coursesDone = () => COURSES.filter(c => crsStore()[c.id]?.done).length;
const crsQuizzes = c => c.steps.filter(s => s.t === "quiz");
const crsMinutes = c => Math.max(3, Math.round(c.steps.length * 1.3));
COURSES.forEach((c, i) => { c.n = i + 1; });

/* =========================================================
   Gráficas y visuales (se dibujan al ancho real para que el texto no se encoja)
========================================================= */
const crsW = () => Math.max(280, Math.min(620, (document.documentElement.clientWidth || 360) - 44));
const fPct = (v, d = 1) => `${v.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d })} %`;
const sg = v => (v > 0 ? "+" : v < 0 ? "−" : "") + fPct(Math.abs(v));

// Gráfica de líneas con ejes. o = { xs, series: [{ y, cls, name, area }], xFmt, yFmt, xTicks, yMin }
function lineChart(o) {
    const W = o.w || crsW(), small = W < 480, H = o.h || Math.round(W * (small ? 0.68 : 0.46));
    const yf = o.yFmt || fmtR, xf = o.xFmt || (v => v), L = small ? 66 : 72, R = 16, T = 12, B = 30, pw = W - L - R, ph = H - T - B;
    const all = o.series.flatMap(s => s.y);
    let lo = o.yMin ?? Math.min(0, ...all), hi = Math.max(...all);
    if (hi === lo) hi = lo + 1;
    const raw = (hi - lo) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
    lo = Math.floor(lo / step + 1e-9) * step; hi = Math.ceil(hi / step - 1e-9) * step;
    const xs = o.xs, x0 = xs[0], x1 = xs[xs.length - 1];
    const X = v => L + (v - x0) / (x1 - x0 || 1) * pw, Y = v => T + ph - (v - lo) / (hi - lo || 1) * ph;
    let grid = "";
    for (let v = lo; v <= hi + step * 1e-6; v += step) { const y = Y(v).toFixed(1); grid += `<line class="g${Math.abs(v) < 1e-9 ? " z" : ""}" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text class="yl" x="${L - 8}" y="${(+y + 4).toFixed(1)}" text-anchor="end">${yf(v)}</text>`; }
    const ticks = o.xTicks || Array.from({ length: 5 }, (_, i) => x0 + (x1 - x0) * i / 4);
    const xl = ticks.map(v => `<text class="xl" x="${X(v).toFixed(1)}" y="${H - 8}" text-anchor="${v === x0 ? "start" : v === x1 ? "end" : "middle"}">${xf(v)}</text>`).join("");
    const lines = o.series.map(s => {
        const pts = xs.map((x, i) => `${X(x).toFixed(1)},${Y(s.y[i]).toFixed(1)}`).join(" ");
        const area = s.area ? `<polygon class="ar ${s.cls}" points="${pts} ${X(x1).toFixed(1)},${Y(Math.max(lo, 0)).toFixed(1)} ${X(x0).toFixed(1)},${Y(Math.max(lo, 0)).toFixed(1)}"/>` : "";
        return `${area}<polyline class="ln ${s.cls}" points="${pts}"/>`;
    }).join("");
    const marks = (o.marks || []).map(m => `<circle class="mk" cx="${X(m.x).toFixed(1)}" cy="${Y(m.y).toFixed(1)}" r="4.5"/>${m.t ? `<text class="mt" x="${(X(m.x) + 8).toFixed(1)}" y="${(Y(m.y) - 8).toFixed(1)}">${m.t}</text>` : ""}`).join("");
    const legend = o.series.filter(s => s.name).map(s => `<span><i class="k ${s.cls}"></i>${s.name}</span>`).join("");
    return `<figure class="fig"><svg class="lc" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(o.alt || "Gráfica")}">${grid}${xl}${lines}${marks}</svg>${legend ? `<figcaption class="legend">${legend}</figcaption>` : ""}${o.cap ? `<p class="fig-cap">${o.cap}</p>` : ""}</figure>`;
}
// Barras horizontales (HTML): items = [{ l, v, cls, t }]
function barsH(items, o = {}) {
    const max = o.max || Math.max(...items.map(i => i.v)) || 1, f = o.fmt || fmtR;
    return `<div class="hb">${items.map(it => `<div class="hb-r"><span class="hb-l">${it.l}</span><span class="hb-t"><i class="${it.cls || ""}" style="width:${Math.max(1.5, it.v / max * 100)}%"></i></span><b>${it.t ?? f(it.v)}</b></div>`).join("")}</div>${o.cap ? `<p class="fig-cap">${o.cap}</p>` : ""}`;
}
// Barras divergentes (positivo a la derecha, negativo a la izquierda): items = [{ l, v }]
function divBars(items, o = {}) {
    const m = Math.max(...items.map(i => Math.abs(i.v))) || 1;
    return `<div class="hb dv">${items.map(it => `<div class="hb-r"><span class="hb-l">${it.l}</span><span class="hb-t dv-t"><i class="dv-z"></i><i class="${it.v < 0 ? "neg" : "pos"}" style="${it.v < 0 ? `right:50%;width:${Math.abs(it.v) / m * 50}%` : `left:50%;width:${it.v / m * 50}%`}"></i></span><b>${sg(it.v)}</b></div>`).join("")}</div>${o.cap ? `<p class="fig-cap">${o.cap}</p>` : ""}`;
}
// Rangos (peor → mejor): items = [{ l, lo, hi }]
function rangeBars(items, o = {}) {
    const mn = Math.min(0, ...items.map(i => i.lo)), mx = Math.max(...items.map(i => i.hi)), span = mx - mn || 1, pc = v => (v - mn) / span * 100;
    return `<div class="hb rg">${items.map(it => `<div class="hb-r"><span class="hb-l">${it.l}</span><span class="hb-t rg-t"><i class="rg-z" style="left:${pc(0)}%"></i><i class="rg-s" style="left:${pc(it.lo)}%;width:${Math.max(1, pc(it.hi) - pc(it.lo))}%"></i></span><b>${sg(it.lo)} / ${sg(it.hi)}</b></div>`).join("")}</div>${o.cap ? `<p class="fig-cap">${o.cap}</p>` : ""}`;
}
// Anillo con porciones: parts = [{ v, cls, l }]
function donut(parts) {
    const R = 46, C = 2 * Math.PI * R, tot = parts.reduce((a, p) => a + p.v, 0); let off = 0;
    const segs = parts.map(p => { const len = p.v / tot * C, el = `<circle class="dn ${p.cls}" cx="60" cy="60" r="${R}" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"/>`; off += len; return el; }).join("");
    return `<figure class="fig donut"><svg viewBox="0 0 120 120" width="150" height="150" role="img" aria-label="Reparto: ${parts.map(p => `${p.l} ${p.v} %`).join(", ")}"><g transform="rotate(-90 60 60)">${segs}</g></svg>
        <figcaption class="legend col">${parts.map(p => `<span><i class="k ${p.cls}"></i><b>${p.v} %</b> ${p.l}</span>`).join("")}</figcaption></figure>`;
}
// Triángulo liquidez · rentabilidad · seguridad (posiciones orientativas)
function triangleViz() {
    const V = { r: [180, 40], s: [38, 258], l: [322, 258] };
    const at = (r, s, l) => [r * V.r[0] + s * V.s[0] + l * V.l[0], r * V.r[1] + s * V.s[1] + l * V.l[1]];
    const pts = [["Cuenta remunerada", at(.1, .45, .45)], ["Depósito", at(.25, .55, .2)], ["Bonos", at(.35, .4, .25)], ["Fondo indexado global", at(.6, .12, .28)], ["Acciones sueltas · cripto", at(.82, .04, .14)]];
    return `<figure class="fig"><svg class="tri" viewBox="0 0 360 292" width="360" height="292" role="img" aria-label="Triángulo de liquidez, rentabilidad y seguridad">
        <polygon class="tri-p" points="${V.r} ${V.s} ${V.l}"/>
        <text class="tri-c" x="180" y="26" text-anchor="middle">Rentabilidad</text><text class="tri-c" x="38" y="280" text-anchor="middle">Seguridad</text><text class="tri-c" x="322" y="280" text-anchor="middle">Liquidez</text>
        ${pts.map(([n, [x, y]]) => `<circle class="tri-d" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/><text class="tri-t" x="${(x + 10).toFixed(1)}" y="${(y + 4).toFixed(1)}">${n}</text>`).join("")}</svg>
        <p class="fig-cap">Posiciones orientativas: sirven para comparar tipos de producto, no para elegir uno concreto.</p></figure>`;
}
const bands = items => `<div class="bands">${items.map(b => `<div class="bd ${b.cls}"><b>${b.h}</b><span>${b.p}</span></div>`).join("")}</div>`;
const flow = items => `<div class="flow">${items.map((t, i) => `${i ? `<span class="fl-a" aria-hidden="true">→</span>` : ""}<span class="fl-b">${t}</span>`).join("")}</div>`;
const blocks = n => `<div class="blocks" role="img" aria-label="${n} meses">${Array.from({ length: n }, () => "<i></i>").join("")}</div>`;
// rentabilidad anual (%, datos anuales aproximados 2000-2024) de las cartas de Juegos
const crsRet = k => G_CARDS.find(c => c.k === k).r;
const ann = (arr, y0 = 0, n = arr.length) => (Math.pow(arr.slice(y0, y0 + n).reduce((p, r) => p * (1 + r / 100), 1), 1 / n) - 1) * 100;

/* =========================================================
   Ruta de cursos (portada de Aprende)
========================================================= */
function nodeHTML(c, isNext) {
    const st = crsStore()[c.id], done = !!st?.done, qs = crsQuizzes(c).length, prog = st && !done && st.step > 0;
    const label = done ? `Completado · test ${st.best}/${qs}` : prog ? `En curso · paso ${Math.min(st.step + 1, c.steps.length)}/${c.steps.length}` : isNext ? "Empieza aquí" : "Disponible";
    return `<li class="node${done ? " done" : ""}${isNext ? " next" : ""}"><a href="#/curso?id=${c.id}">
        <i class="dot" aria-hidden="true">${done ? CHECK : c.n}</i>
        <span class="nt"><b>${c.title}</b><em>${c.sub}</em><small>${c.steps.length} pasos · ${crsMinutes(c)} min · test de ${qs}</small></span>
        <span class="st">${label}</span></a></li>`;
}
function rutaHTML() {
    const total = COURSES.length, done = coursesDone(), next = COURSES.find(c => !crsStore()[c.id]?.done);
    return `<div class="ap-main">
        <div class="ap-prog"><div class="bar"><i style="width:${done / total * 100}%"></i></div><span>${done} de ${total} cursos completados</span></div>
        ${LEVELS.map(l => {
            const cs = COURSES.filter(c => c.level === l.n), d = cs.filter(c => crsStore()[c.id]?.done).length;
            return `<section class="lv" id="lv-${l.n}"><header class="lv-h"><span class="lv-n">Nivel ${l.n}</span><div><h3>${l.name}</h3><p>${l.sub}</p></div><span class="lv-p">${d}/${cs.length}</span></header>
                <ol class="path">${cs.map(c => nodeHTML(c, c === next)).join("")}</ol></section>`;
        }).join("")}</div>`;
}

/* =========================================================
   Reproductor del curso (pantalla completa)
========================================================= */
let crs = null;
const crsCourse = () => { const id = new URLSearchParams((location.hash.split("?")[1] || "")).get("id"); return COURSES.find(c => c.id === id); };
function viewCurso() {
    const c = crsCourse();
    if (!c) { crs = null; return `<section class="section"><div class="empty"><h3>No encontramos ese curso</h3><a class="btn" href="#/aprende">Volver a Aprende</a></div></section>`; }
    crs = { c, i: -1, score: 0, wrong: [], answered: {}, saved: false };
    return `<div class="crs" id="crs"><header class="crs-top"><a class="crs-x" href="#/aprende" aria-label="Salir del curso">×</a><div class="crs-bar" id="crsBar"></div><span class="crs-lv" id="crsLv"></span></header>
        <div class="crs-scroll" id="crsScroll"><div class="crs-body" id="crsBody"></div></div><footer class="crs-foot" id="crsFoot"></footer></div>`;
}
const mountCurso = () => { if (crs) paintCurso(); };
const cursoLeave = () => { crs = null; };
const cv = (x, ...a) => (typeof x === "function" ? x(...a) : x);

function introHTML() {
    const c = crs.c, st = crsState(c.id), qs = crsQuizzes(c).length;
    return `<p class="kicker">Nivel ${c.level} · Curso ${c.n} de ${COURSES.length}</p><h1 class="crs-h1">${c.title}</h1><p class="crs-lead">${c.sub}</p>
        <h3 class="sub-h">Lo que aprenderás</h3><ul class="learn">${c.learn.map(l => `<li>${CHECK}<span>${l}</span></li>`).join("")}</ul>
        <p class="muted small">${c.steps.length} pasos · unos ${crsMinutes(c)} minutos · test final de ${qs} preguntas${st.done ? ` · ya completado (mejor test ${st.best}/${qs})` : ""}</p>`;
}
function stepHTML(s, i) {
    const c = crs.c, lbl = { text: "Teoría", math: "Las mates", calc: "Pruébalo tú", quiz: "Test final" }[s.t];
    if (s.t === "quiz") {
        const qs = crsQuizzes(c), k = qs.indexOf(s) + 1, a = crs.answered[i];
        return `<p class="kicker">Test final · pregunta ${k} de ${qs.length}</p><h2 class="crs-h">${s.q}</h2>
            <div class="q-opts">${s.o.map((o, j) => `<button class="q-opt${a !== undefined ? (j === s.a ? " right" : j === a ? " wrong" : " dim") : ""}" data-act="crsPick" data-v="${j}" ${a !== undefined ? "disabled" : ""}><span class="q-k">${"ABCD"[j]}</span><span>${o}</span></button>`).join("")}</div>`;
    }
    let h = `<p class="kicker">${lbl}</p><h2 class="crs-h">${s.h}</h2>`;
    if (s.t === "text") h += (s.p || []).map(p => `<p class="crs-p">${cv(p)}</p>`).join("") + (s.list ? `<ul class="crs-ul">${s.list.map(l => `<li>${l}</li>`).join("")}</ul>` : "") + (s.viz ? `<div class="crs-viz">${cv(s.viz)}</div>` : "") + (s.note ? `<p class="crs-note">${cv(s.note)}</p>` : "");
    if (s.t === "math") {
        const ex = cv(s.ex);
        h += (s.p ? `<p class="crs-p">${cv(s.p)}</p>` : "") + `<div class="fx">${s.formula}</div>` + (s.vars ? `<dl class="vars">${s.vars.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join("")}</dl>` : "")
            + (ex ? `<div class="ex"><p class="ex-h">${ex.title}</p>${ex.lines.map(l => `<p>${l}</p>`).join("")}</div>` : "") + (s.viz ? `<div class="crs-viz">${cv(s.viz)}</div>` : "");
    }
    if (s.t === "calc") h += (s.p ? `<p class="crs-p">${cv(s.p)}</p>` : "") + `<div class="calc">${s.inputs.map(n => `<label for="crsin_${n.id}"><span>${n.l}</span><output id="crc_${n.id}">${n.f(n.v)}</output><input type="range" id="crsin_${n.id}" data-input="crsCalc" data-id="${n.id}" min="${n.min}" max="${n.max}" step="${n.step}" value="${n.v}"></label>`).join("")}</div><div class="calc-out" id="crsCalcOut"></div>${s.note ? `<p class="crs-note">${cv(s.note)}</p>` : ""}`;
    return h;
}
function stepFoot(s, i) {
    const back = i > 0 ? `<button class="btn ghost" data-act="crsBack">Atrás</button>` : `<button class="btn ghost" data-act="crsBack">Inicio</button>`;
    if (s.t !== "quiz") return `<div class="crs-fb"></div><div class="crs-btns">${back}<button class="btn" data-act="crsNext">Continuar ${ARROW}</button></div>`;
    const a = crs.answered[i];
    if (a === undefined) return `<div class="crs-fb"><span class="muted">Elige una respuesta.</span></div><div class="crs-btns"><button class="btn" disabled>Continuar</button></div>`;
    const ok = a === s.a;
    return `<div class="crs-fb ${ok ? "ok" : "ko"}"><b>${ok ? "Correcto" : "No exactamente"}</b><span>${s.why}</span></div><div class="crs-btns"><button class="btn" data-act="crsNext">${i === crs.c.steps.length - 1 ? "Ver resultado" : "Continuar"} ${ARROW}</button></div>`;
}
function doneHTML() {
    const c = crs.c, qs = crsQuizzes(c).length, ok = crs.score >= Math.ceil(qs * PASS), st = crsState(c.id), next = COURSES[COURSES.indexOf(c) + 1];
    const wrong = crs.wrong.map(w => `<li><b>${w.q}</b><span>Respuesta correcta: ${w.right}. ${w.why}</span></li>`).join("");
    return `<p class="kicker">${ok ? "Curso completado" : "Casi lo tienes"}</p><h1 class="crs-h1">${crs.score} de ${qs} correctas</h1>
        <p class="crs-lead">${ok ? (crs.score === qs ? "Test perfecto. Esto ya lo dominas." : "Superas el test. Repasa lo que has fallado para dejarlo atado.") : `Necesitas al menos ${Math.ceil(qs * PASS)} aciertos. Repasa la teoría y vuelve a intentarlo: es lo que fija el aprendizaje.`}</p>
        ${wrong ? `<h3 class="sub-h">Para repasar</h3><ul class="redo">${wrong}</ul>` : ""}
        <div class="done-row">${c.practice ? `<button class="btn ghost" data-act="practice" data-topic="${c.practice}">Practicar tarjetas de este tema</button>` : ""}</div>
        ${ok && next ? `<p class="muted small">Siguiente: <b>${next.title}</b></p>` : ""}${st.done && !ok ? `<p class="muted small">Este curso ya figuraba como completado; tu mejor test es ${st.best}/${qs}.</p>` : ""}`;
}
function doneFoot() {
    const c = crs.c, qs = crsQuizzes(c).length, ok = crs.score >= Math.ceil(qs * PASS), next = COURSES[COURSES.indexOf(c) + 1];
    return `<div class="crs-fb"></div><div class="crs-btns">${ok ? `<a class="btn ghost" href="#/aprende">Volver a Aprende</a>${next ? `<a class="btn" href="#/curso?id=${next.id}">Siguiente curso ${ARROW}</a>` : `<a class="btn" href="#/aprende">Terminar</a>`}`
        : `<button class="btn ghost" data-act="crsReview">Repasar la teoría</button><button class="btn" data-act="crsRetry">Repetir el test ${ARROW}</button>`}</div>`;
}
function introFoot() {
    const c = crs.c, at = crsResume(c, crsState(c.id));
    return `<div class="crs-fb"></div><div class="crs-btns"><button class="btn ghost" data-act="crsToTest">Ya lo sé: ir al test</button><button class="btn" data-act="crsStart">${at > 0 ? `Continuar en el paso ${at + 1}` : "Empezar el curso"} ${ARROW}</button></div>`;
}
function paintCurso() {
    if (!crs) return;
    const c = crs.c, n = c.steps.length, i = crs.i, body = $("#crsBody"), foot = $("#crsFoot");
    $("#crsBar").innerHTML = Array.from({ length: n }, (_, k) => `<i class="${i > k || i >= n ? "past" : k === i ? "now" : ""}"></i>`).join("");
    $("#crsLv").textContent = i < 0 ? `Nivel ${c.level}` : i >= n ? "Resultado" : `${i + 1} / ${n}`;
    if (i < 0) { body.innerHTML = introHTML(); foot.innerHTML = introFoot(); }
    else if (i >= n) { if (!crs.saved) crsFinish(); body.innerHTML = doneHTML(); foot.innerHTML = doneFoot(); }
    else { const s = c.steps[i]; body.innerHTML = stepHTML(s, i); foot.innerHTML = stepFoot(s, i); if (s.t === "calc") crsCalcRun(); }
    body.classList.remove("in"); void body.offsetWidth; body.classList.add("in");
    $("#crsScroll").scrollTo(0, 0);
}
function crsFinish() {
    const c = crs.c, qs = crsQuizzes(c).length, ok = crs.score >= Math.ceil(qs * PASS), st = crsState(c.id);
    crs.saved = true; st.tries++; st.best = Math.max(st.best, crs.score);
    st.step = 0; if (ok) st.done = true;
    const p = pulseState(), t = today(); if (!p.days.includes(t)) p.days = [...p.days, t].slice(-60); // el estudio también cuenta para la racha
    save();
}
function crsGo(i) {
    crs.i = i;
    const st = crsState(crs.c.id); if (i >= 0 && i < crs.c.steps.length && !st.done) { st.step = i; save(); }
    paintCurso();
}
const crsFirstQuiz = c => c.steps.findIndex(s => s.t === "quiz");
// dónde reanudar: en el último paso de teoría; si se dejó a mitad del test, al principio del test
const crsResume = (c, st) => (st.done || !(st.step > 0 && st.step < c.steps.length)) ? 0 : c.steps[st.step].t === "quiz" ? crsFirstQuiz(c) : st.step;
function crsCalcValues(s) { const v = {}; s.inputs.forEach(n => { v[n.id] = +$(`#crsin_${n.id}`).value; }); return v; }
function crsCalcRun() {
    const s = crs?.c.steps[crs.i]; if (!s || s.t !== "calc") return;
    $("#crsCalcOut").innerHTML = s.out(crsCalcValues(s));
}
function crsCalcInput(t) {
    const s = crs?.c.steps[crs.i]; if (!s || s.t !== "calc") return;
    const n = s.inputs.find(x => x.id === t.dataset.id); if (n) $(`#crc_${n.id}`).textContent = n.f(+t.value);
    crsCalcRun();
}
const COURSE_ACTIONS = {
    crsStart: () => crsGo(crsResume(crs.c, crsState(crs.c.id))),
    crsToTest: () => { crs.score = 0; crs.wrong = []; crs.answered = {}; crsGo(crsFirstQuiz(crs.c)); },
    crsNext: () => crsGo(crs.i + 1),
    crsBack: () => crsGo(crs.i - 1),
    crsReview: () => { crs.saved = false; crs.score = 0; crs.wrong = []; crs.answered = {}; crsGo(0); },
    crsRetry: () => { crs.saved = false; crs.score = 0; crs.wrong = []; crs.answered = {}; crsGo(crsFirstQuiz(crs.c)); },
    crsPick: el => {
        const s = crs.c.steps[crs.i], v = +el.dataset.v; if (crs.answered[crs.i] !== undefined) return;
        crs.answered[crs.i] = v;
        if (v === s.a) crs.score++; else crs.wrong.push({ q: s.q, right: s.o[s.a], why: s.why });
        $("#crsBody").innerHTML = stepHTML(s, crs.i); $("#crsFoot").innerHTML = stepFoot(s, crs.i);
    }
};
addEventListener("keydown", e => {
    if (e.key !== "Enter" || route() !== "curso" || /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(e.target.tagName)) return;
    const b = $(".crs-foot .btn:not(.ghost):not(:disabled)"); if (b) { e.preventDefault(); b.click(); }
});
let crsResizeT;
addEventListener("resize", () => { clearTimeout(crsResizeT); crsResizeT = setTimeout(() => { if (crs && crs.i >= 0 && crs.i < crs.c.steps.length) { const s = crs.c.steps[crs.i]; if (s.t === "calc") crsCalcRun(); else if (s.t !== "quiz") $("#crsBody").innerHTML = stepHTML(s, crs.i); } }, 200); });
