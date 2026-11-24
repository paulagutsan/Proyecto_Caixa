"use strict";
/* Horizonte · Mercado del prototipo
   Un índice por fondo, igual para todo el mundo y que avanza con el reloj: cada euro sigue al fondo en el que está,
   puede subir o bajar y todo cuadra (saldo, gráfica, resumen semanal y Liga). Es un modelo, NO precios reales.
   Para datos reales basta con cambiar mkPrice(fondo, instante) por los valores liquidativos.
   Se carga antes que app.js: sus utilidades solo se usan dentro de funciones. */
const MK_DAY = 864e5, MK_0 = Date.UTC(2024, 0, 1), MK_SEED = 20665;
const mkGauss = r => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
const mkRnd = s => prng(hashStr(`${MK_SEED}|${s}`));
let mkMkt = null, mkLogs = {}, mkIntra = {};
function mkLog(f, n) {                                   // logaritmo del índice al empezar cada día
    mkMkt ||= { r: mkRnd("mercado"), v: [] };
    const L = mkLogs[f] ||= { r: mkRnd(f), v: [0] }, vol = (VOL[f] || 16) / 100 / Math.sqrt(365), mu = (FUNDS[f].r / 100) / 365 - vol * vol / 2;
    while (L.v.length <= n) {
        const i = L.v.length - 1;
        while (mkMkt.v.length <= i) mkMkt.v.push(mkGauss(mkMkt.r));
        L.v.push(L.v[i] + mu + vol * (0.7 * mkMkt.v[i] + 0.714 * mkGauss(L.r)));
    }
    return L.v[n];
}
function mkDay(f, d) {                                   // movimiento dentro del día, cada 5 minutos, anclado a sus dos extremos
    const k = f + d;
    if (mkIntra[k]) return mkIntra[k];
    const r = mkRnd(k), w = [0], n = 288, s = (VOL[f] || 16) / 100 / Math.sqrt(365) * .6 / Math.sqrt(n);
    for (let i = 1; i <= n; i++) w.push(w[i - 1] + mkGauss(r) * s);
    return mkIntra[k] = w.map((x, i) => x - i / n * w[n]);
}
function mkPrice(f, t) {
    const x = Math.max(0, t - MK_0) / MK_DAY, d = Math.floor(x), u = x - d, a = mkLog(f, d), b = mkLog(f, d + 1), w = mkDay(f, d), j = u * 288, i = Math.floor(j);
    return Math.exp(a + (b - a) * u + w[i] + ((w[i + 1] ?? 0) - w[i]) * (j - i));
}
/* Cuánto vale cada euro aportado en «a» cuando llega «b». Si cambia el reparto (por ejemplo, al activar el Antídoto), lo anterior no se toca. */
const mkMix = () => Object.fromEntries(allocation().parts.map(p => [p.fund, p.w]));
function mkGrow(a, b) {
    const log = S.mix?.length ? S.mix : [{ t: 0, w: mkMix() }];
    let v = 1, from = a;
    for (let i = 0; i < log.length; i++) {
        const end = Math.min(b, log[i + 1]?.t ?? Infinity);
        if (end <= from) continue;
        v *= Object.entries(log[i].w).reduce((s, [f, w]) => s + w * mkPrice(f, end) / mkPrice(f, from), 0);
        from = end;
    }
    return v;
}
function mkTouch() {                                     // desde save(): apunta el reparto cuando cambia
    if (!S.teen || !S.money?.length) return;
    const w = mkMix(), log = S.mix ||= [], last = log[log.length - 1], key = o => JSON.stringify(Object.entries(o).filter(x => x[1]).sort());
    if (!last || key(last.w) !== key(w)) log.push({ t: last ? Date.now() : 0, w });
}
const depTime = c => Math.min(c.ts || depT(c), Date.now());
const mkValue = (t = Date.now()) => S.money.reduce((s, c) => { const d = depTime(c); return d <= t ? s + c.amount * mkGrow(d, t) : s; }, 0);
/* En directo: refresca la cifra y la gráfica cada pocos segundos, sin molestar si estás mirando un punto */
setInterval(() => {
    if (document.hidden || S.role !== "teen" || !S.money.length || !/^#\/(inicio|dinero)/.test(location.hash) || $("#sheet.open")) return;
    $$("[data-vchart]").forEach(b => { if (!b.matches(":hover")) drawValueChart(b); });
}, 5000);

/* ---------------------------------------------------------------- cuenta de ejemplo: una persona ficticia con catorce meses de historia */
function loadExample() {
    const now = Date.now(), ago = d => iso(new Date(now - d * MK_DAY)), at = d => new Date(ago(d) + "T10:00:00").getTime();
    const dep = (d, amount, src, extra = {}) => ({ date: ago(d), ts: at(d), amount, src, ...extra });
    S = { ...blank(), role: "teen", example: true, teen: { name: "Lucía", surname: "Martín", birth: birthFromAge(17) }, family: { name: "Elena", relation: "Madre" }, familyAuth: true, joined: { teen: true, family: true },
        geminiOk: true, friendsOk: false, antidoteApproved: true, voted: true, weekly: 10, roundup: true, goal: { price: 150000, age: 30 } };
    LESSONS.forEach((l, i) => { S.lessons[l.id] = ago(424 - i * 2); });
    S.exam = { date: ago(412), score: 9, total: RULES.examSize, passed: true };
    S.diploma = { id: "HZ-EJEMP-LUCIA", date: ago(412), reg: true };
    S.itv = [ago(50)];
    S.money = [dep(412, RULES.prize, "premio")];
    for (let k = 0; k < 14; k++) S.money.push(dep(405 - k * 30, [30, 25, 40, 30][k % 4], "paga"));
    S.money.push(dep(330, 50, "regalo", { from: "Abuela Rosa", msg: "Feliz cumpleaños", occasion: "Cumpleaños" }), dep(235, 120, "verano"),
        dep(150, 60, "regalo", { from: "Elena", msg: "¡Por tus notas!", occasion: "Fin de curso" }), dep(60, 40, "regalo", { from: "Tío Marcos", msg: "Para tu casa", occasion: "Sin ocasión" }));
    for (let k = 0; k < 10; k++) S.money.push(dep(290 - k * 28, 3 + (k * 7) % 5 + .4, "redondeo"));
    S.money.sort((a, b) => a.date.localeCompare(b.date));
    S.fears = [FEARS[0], FEARS[1]].map(f => ({ id: f.id, label: f.label, fund: f.fund }));
    S.mix = [{ t: 0, w: { global: 1 } }, { t: at(380), w: mkMix() }];
    for (let k = 1; k < 24; k++) S.games[ago(k * 3)] = { id: k % 2 ? "titular" : "duelo", score: 3 + k % 3 };
    S.mmBest = 8;
    save(); location.hash = "#/inicio"; toast("Estás viendo una cuenta de ejemplo");
}
document.addEventListener("click", e => { if (e.target.closest('[data-act="example"]') && !S.role) loadExample(); });
