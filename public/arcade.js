"use strict";
/* Horizonte · Arcade
   Adrenalina para aprender: reloj de las rondas, combos y puntos, el juego «Noticia al vuelo» y la liga de amigos.
   Se carga después de games.js y antes de app.js; usa utilidades de games.js y app.js solo dentro de funciones. */

/* =========================================================
   Reloj, combos y puntos (comunes a los juegos contrarreloj)
========================================================= */
let gT = null;
function gTimerStop() { if (gT) { cancelAnimationFrame(gT.raf); clearTimeout(gT.to); gT = null; } }
function gTimerStart(seconds, onEnd) {
    gTimerStop();
    const total = seconds * 1000, t0 = performance.now(), me = (gT = { total, t0, raf: 0, to: 0 });
    const bar = $("#gBar"), left = $("#gLeft");
    const tick = now => {
        if (gT !== me) return;
        const rest = Math.max(0, total - (now - t0));
        if (bar) { bar.style.transform = `scaleX(${rest / total})`; bar.classList.toggle("low", rest < total * 0.3); }
        if (left) left.textContent = Math.ceil(rest / 1000);
        if (rest > 0) me.raf = requestAnimationFrame(tick);
    };
    me.raf = requestAnimationFrame(tick);
    me.to = setTimeout(() => { if (gT === me) { gT = null; onEnd(); } }, total); // el fin de la ronda no depende de que la pestaña pinte
}
const gFrac = () => (gT ? Math.max(0, 1 - (performance.now() - gT.t0) / gT.total) : 0); // fracción de tiempo que queda
const gMult = streak => Math.min(3, 1 + 0.25 * streak); // x1, x1,25, x1,5 … hasta x3
const gMultTxt = m => `×${String(m).replace(".", ",")}`;
const gPts = n => `${Math.round(n).toLocaleString("es-ES", { useGrouping: "always" })} pts`;
function gPop(txt, cls = "") {
    const box = $("#gPop"); if (!box) return;
    box.innerHTML = `<b class="${cls}">${txt}</b>`;
}
const gIso = () => isoDate();
const gWeek = () => mondayKey(isoDate());
function gScore(juego, dia, puntos, detalle) { return socSubmit(juego, dia, puntos, detalle); }

/* =========================================================
   NOTICIA AL VUELO
   Lees un titular real, sin saber el año, y tienes 7 segundos para decir si el mundo entero en bolsa
   acabó ese año en positivo o en negativo. Combos y puntos por rapidez. Mismo reto para todo el mundo cada día.
========================================================= */
const NW_SECONDS = 7, NW_ROUNDS = 10;
// Tono aparente de cada titular de G_NEWS (−1 suena mal, +1 suena bien); sirve para enseñar cuándo el mercado hace lo contrario
const NW_TONE = [-1, -1, -1, 1, 1, 1, 1, -1, -1, -1, -1, -1, 1, -1, -1, -1, -1, 1, -1, 1, -1, 1, -1, -1, 1];
let nw = null;
function nwYears(seed) {
    const rnd = gRand(seed), w = gCard("world").r, idx = w.map((r, i) => [r, i]);
    const neg = gShuffle(idx.filter(([r]) => r <= -3).map(x => x[1]), rnd).slice(0, 4);
    const pos = gShuffle(idx.filter(([r]) => r >= 3).map(x => x[1]), rnd).slice(0, 6);
    return gShuffle([...neg, ...pos], rnd); // 4 años malos y 6 buenos: siempre decir «sube» acierta 6 de 10
}
function nwNew(practice = false) {
    const official = !practice && gState().noticia.day !== today();
    nw = { practice, official, day: today(), years: nwYears(practice ? Math.floor(Math.random() * 1e9) : today() * 7919 + 303), i: 0, pts: 0, streak: 0, bestStreak: 0, res: [], phase: "ask", last: null };
}
function nwMount() { if (!nw || (!nw.practice && nw.day !== today())) nwNew(); nwPaint(); }
function nwPaint() {
    const root = gRoot(); if (!root) return;
    gTimerStop(); clearTimeout(nw.auto);
    $("#gMeta").textContent = nw.practice ? "Práctica" : `#${gDayNo()}`;
    if (nw.phase === "end") return (root.innerHTML = nwEndHTML(), ligaFillBoard("noticia", gIso()));
    const y = nw.years[nw.i], n = nw.i + 1, w = gCard("world").r[y];
    const head = `<div class="nw-top"><span>Ronda <b>${n}</b>/${NW_ROUNDS}</span><span class="nw-pts">${gPts(nw.pts)}</span><span class="nw-combo ${nw.streak >= 2 ? "hot" : ""}">${gMultTxt(gMult(nw.streak))}</span></div>
        <div class="si-dots">${nw.years.map((_, i) => `<i class="${nw.res[i] ? (nw.res[i].ok ? "ok" : "ko") : i === nw.i ? "now" : ""}"></i>`).join("")}</div>`;
    if (nw.phase === "ask") {
        root.innerHTML = `${!nw.official && !nw.practice && nw.i === 0 ? `<p class="g-note">Ya has jugado el reto de hoy. Esta partida no cuenta para la liga.</p>` : ""}
            <div class="g-timer"><i id="gBar"></i><span id="gLeft">${NW_SECONDS}</span></div>${head}
            <p class="g-lbl">Titular</p><h2 class="nw-head">«${G_NEWS[y]}»</h2>
            <p class="nw-q">Ese año, ¿cómo acabó la bolsa mundial?</p>
            <div class="nw-btns"><button class="p-opt nw-down" data-act="nwGuess" data-v="down">▼ Cae</button><button class="p-opt nw-up" data-act="nwGuess" data-v="up">▲ Sube</button></div><div id="gPop" class="g-pop"></div>`;
        gTimerStart(NW_SECONDS, () => nwAnswer(null));
        return;
    }
    const r = nw.last, tone = NW_TONE[y];
    const lesson = tone < 0 && w > 0 ? "El titular sonaba fatal y la bolsa acabó subiendo: los precios ya descuentan el miedo y reaccionan a si lo que ocurre es mejor o peor de lo que se esperaba."
        : tone > 0 && w < 0 ? "Buenas noticias, mal año: cuando todos esperan lo mejor, cualquier decepción pesa más que la alegría."
        : w > 0 ? "Esta vez titular y bolsa fueron en la misma dirección, pero no es lo habitual: invertir a golpe de titular suele salir mal."
        : "Aquí la noticia y la bolsa fueron de la mano. Lo difícil es saberlo de antemano, por eso se invierte a largo plazo y no por titulares.";
    root.innerHTML = `${head}<p class="g-lbl">${G_FROM + y}</p><h2 class="nw-head sm">«${G_NEWS[y]}»</h2>
        <p class="nw-res ${r.ok ? "ok" : "ko"}">${r.ok ? "¡Bien!" : r.timeout ? "Se acabó el tiempo" : "No era eso"} · la bolsa mundial acabó el año <b class="${gTone(w)}">${gSigned(w)}</b></p>
        <p class="nw-gain">${r.gain ? `+${gPts(r.gain)} <small>${r.speed ? `(${gPts(r.speed)} por rapidez)` : ""}${r.mult > 1 ? ` · combo ${gMultTxt(r.mult)}` : ""}</small>` : "Sin puntos. Combo a cero."}</p>
        <div class="g-lesson"><p>${lesson}</p></div>
        <button class="p-opt p-go" data-act="nwNext">${nw.i === NW_ROUNDS - 1 ? "Ver resultado" : "Siguiente titular →"}</button>`;
    nw.auto = setTimeout(() => { if (nw && nw.phase === "reveal" && route() === "noticia") ACTIONS.nwNext(); }, 3400);
}
function nwAnswer(dir) {
    if (nw.phase !== "ask") return;
    const y = nw.years[nw.i], w = gCard("world").r[y], frac = gFrac();
    gTimerStop();
    const ok = dir !== null && (dir === "up") === (w > 0), mult = gMult(nw.streak);
    const speed = ok ? Math.round(100 * frac) : 0, gain = ok ? Math.round((100 + speed) * mult) : 0;
    nw.streak = ok ? nw.streak + 1 : 0; nw.bestStreak = Math.max(nw.bestStreak, nw.streak); nw.pts += gain;
    nw.last = { ok, timeout: dir === null, gain, speed, mult };
    nw.res.push({ ok, gain }); nw.phase = "reveal";
    nwPaint();
}
function nwFinish() {
    nw.phase = "end";
    if (nw.official) {
        const g = gState(), hits = nw.res.filter(r => r.ok).length, grid = nw.res.map(r => r.ok ? "🟩" : "🟥").join("");
        g.noticia = { day: today(), pts: nw.pts, hits, grid, best: Math.max(g.noticia.best || 0, nw.pts) }; gMarkDay(); save();
        gScore("noticia", gIso(), nw.pts, { hits });
    }
    nwPaint();
}
function nwEndHTML() {
    const hits = nw.res.filter(r => r.ok).length, grid = nw.res.map(r => r.ok ? "🟩" : "🟥").join("");
    const msg = hits <= 4 ? "Por debajo del azar de siempre decir «sube» (6 de 10). Los titulares engañan: esa es justo la lección."
        : hits === 6 ? "Igual que quien dice «sube» a todo. Los titulares no te dan ventaja… y es lo normal."
        : hits <= 8 ? "Buen ojo. Pero recuerda: acertar un año suelto no es una estrategia de inversión."
        : "Casi perfecto. Aun así, ni los profesionales aciertan así de bien con las noticias en la vida real.";
    return `<div class="g-end"><p class="g-lbl">${nw.practice ? "Práctica" : `Noticia al vuelo #${gDayNo()}`}</p>
        <h1 class="g-big">${Math.round(nw.pts).toLocaleString("es-ES", { useGrouping: "always" })}</h1><p class="g-muted">puntos · ${hits}/10 aciertos · mejor combo ${gMultTxt(gMult(nw.bestStreak))}</p>
        <p class="g-emo">${gGrid(grid)}</p>
        ${!nw.official && !nw.practice ? `<p class="g-note">Esta partida no cuenta: ya jugaste el reto de hoy.</p>` : ""}
        <div class="g-lesson"><p>${msg}</p><p class="g-muted">Referencia: en este reto, decir siempre «sube» da 6 aciertos.</p></div>
        <div class="g-board" id="gBoard"></div>
        <div class="g-row"><button class="p-opt p-go" data-act="nwShare">Compartir resultado</button><button class="p-opt" data-act="nwAgain">Practicar con otros titulares</button></div></div>`;
}

/* =========================================================
   LIGA DE AMIGOS
   Alias, amigos y clasificaciones en Supabase. Se ve en la portada de Juegos y al terminar cada reto.
========================================================= */
const LG_GAMES = [["noticia", "Noticia"], ["silueta", "Silueta"], ["masomenos", "Más o menos"]];
let liga = { tab: "hoy", rows: null, friends: null, err: null, loading: false, alias: null };
async function ligaLoad() {
    if (!socialOn()) return;
    liga.loading = true; ligaPaint();
    try {
        const [rows, friends, alias] = await Promise.all([socLiga(gWeek(), gIso()), socFriends(true), socEnsureAlias()]);
        Object.assign(liga, { rows, friends, alias, err: null });
    } catch (e) { liga.err = e.message; }
    liga.loading = false; ligaPaint();
}
const ligaMount = () => { if ($("#ligaBox")) { ligaPaint(); ligaLoad(); } };
function ligaPaint() { const b = $("#ligaBox"); if (b) b.innerHTML = ligaHTML(); }
function ligaTable() {
    const day = gIso(), wk = gWeek(), by = new Map();
    for (const r of liga.rows || []) {
        const u = by.get(r.user_id) || { alias: r.alias, yo: r.es_yo, g: {}, total: 0 };
        const inTab = liga.tab === "hoy" ? (r.juego === "masomenos" ? r.dia === wk : r.dia === day) : true;
        if (inTab) { u.g[r.juego] = (u.g[r.juego] || 0) + r.puntos; u.total += r.puntos; }
        by.set(r.user_id, u);
    }
    for (const f of liga.friends || []) if (!by.has(f.user_id)) by.set(f.user_id, { alias: f.alias, yo: false, g: {}, total: 0 });
    if (!by.size && liga.alias) by.set("yo", { alias: liga.alias, yo: true, g: {}, total: 0 });
    const rows = [...by.values()].sort((a, b) => b.total - a.total || a.alias.localeCompare(b.alias));
    return `<table class="lg-t"><thead><tr><th>#</th><th>Jugador</th>${LG_GAMES.map(([, n]) => `<th class="r lg-g">${n}</th>`).join("")}<th class="r">Total</th></tr></thead><tbody>
        ${rows.map((u, i) => `<tr class="${u.yo ? "me" : ""}"><td>${["🥇", "🥈", "🥉"][i] && u.total ? ["🥇", "🥈", "🥉"][i] : i + 1}</td><td>${esc(u.alias)}${u.yo ? ` <small>(tú)</small>` : ""}</td>
            ${LG_GAMES.map(([k]) => `<td class="r lg-g">${u.g[k] ? Math.round(u.g[k]).toLocaleString("es-ES", { useGrouping: "always" }) : "·"}</td>`).join("")}<td class="r"><b>${u.total ? Math.round(u.total).toLocaleString("es-ES", { useGrouping: "always" }) : 0}</b></td></tr>`).join("")}</tbody></table>`;
}
function ligaHTML() {
    const head = `<div class="sec-head"><div><p class="kicker">Liga de amigos</p><h2>Compite con tu gente.</h2><p>Añade a tus amigos por su alias y mirad quién gana cada día y cada semana. Solo se comparten las puntuaciones.</p></div></div>`;
    if (!user) return `${head}<p class="locked">${LOCK}<span>Accede a tu cuenta para guardar tus puntuaciones y ver las de tus amigos.</span><button class="btn" data-act="auth">Acceder ${ARROW}</button></p>`;
    if (!SB) return `${head}<p class="locked">${LOCK}<span>La liga necesita las cuentas en la nube (Supabase). Mira el README para activarlas.</span></p>`;
    if (liga.err) return `${head}<p class="err">${esc(liga.err)}${/function|schema|rpc|404|Could not find/i.test(liga.err) ? " Falta ejecutar supabase/schema-social.sql en tu proyecto." : ""}</p>`;
    if (!liga.rows && liga.loading) return `${head}<p class="muted">Cargando la liga…</p>`;
    const fr = liga.friends || [];
    return `${head}<div class="lg-bar"><div class="opts" role="tablist"><button class="${liga.tab === "hoy" ? "on" : ""}" data-act="ligaTab" data-v="hoy">Hoy</button><button class="${liga.tab === "semana" ? "on" : ""}" data-act="ligaTab" data-v="semana">Esta semana</button></div>
        <p class="small muted">Tu alias: <b>${esc(liga.alias || "…")}</b> · <button class="link" data-act="ligaAlias">Cambiar</button></p></div>
        ${ligaTable()}
        <form class="lg-add" data-form="ligaAdd"><input name="alias" maxlength="20" placeholder="Alias de tu amigo" aria-label="Alias de tu amigo" autocomplete="off"><button class="btn sm">Añadir amigo</button></form>
        ${fr.length ? `<p class="lg-friends">${fr.map(f => `<span class="chip">${esc(f.alias)}<button data-act="ligaDel" data-id="${f.user_id}" aria-label="Quitar a ${esc(f.alias)}">×</button></span>`).join("")}</p>` : `<p class="small muted">Todavía no has añadido a nadie. Pídele su alias a un amigo y añádelo; él tendrá que añadirte a ti para ver tus puntos.</p>`}`;
}
// Clasificación de un reto concreto (pantalla final de cada juego)
async function ligaFillBoard(juego, dia) {
    const box = $("#gBoard"); if (!box) return;
    if (!user) return (box.innerHTML = `<p class="g-muted small">Accede para guardar tu puntuación y compararte con tus amigos.</p>`);
    if (!SB) return;
    box.innerHTML = `<p class="g-lbl">Tus amigos</p><p class="g-muted small">Cargando…</p>`;
    try {
        await new Promise(r => setTimeout(r, 700)); // da tiempo a que se guarde la puntuación
        const rows = (await socLiga(dia, dia)).filter(r => r.juego === juego).sort((a, b) => b.puntos - a.puntos);
        if (!$("#gBoard")) return;
        const friends = await socFriends();
        box.innerHTML = `<p class="g-lbl">${juego === "masomenos" ? "Esta semana" : "Hoy"} · tú y tus amigos</p>` + (rows.length ? `<ol class="lg-board">${rows.map((r, i) => `<li class="${r.es_yo ? "me" : ""}"><span>${i + 1}</span><b>${esc(r.alias)}${r.es_yo ? " (tú)" : ""}</b><i>${Math.round(r.puntos).toLocaleString("es-ES", { useGrouping: "always" })}</i></li>`).join("")}</ol>` : `<p class="g-muted small">Todavía no hay puntuaciones.</p>`)
            + (friends.length ? "" : `<p class="g-muted small">Añade amigos en Juegos → Liga de amigos para ver aquí sus resultados.</p>`);
    } catch (e) { box.innerHTML = `<p class="g-muted small">No se pudo cargar la clasificación.</p>`; }
}

const ARCADE_ACTIONS = {
    nwGuess: el => nwAnswer(el.dataset.v),
    nwNext: () => { clearTimeout(nw?.auto); if (nw.i < NW_ROUNDS - 1) { nw.i++; nw.phase = "ask"; nwPaint(); } else nwFinish(); },
    nwAgain: () => { nwNew(true); nwPaint(); },
    nwShare: () => gShare(`📰 Noticia al vuelo${nw.practice ? " (práctica)" : ` #${gDayNo()}`} · Horizonte\n${nw.res.map(r => r.ok ? "🟩" : "🟥").join("")} ${nw.res.filter(r => r.ok).length}/10 · ${gPts(nw.pts)}\n¿Me ganas?`),
    ligaTab: el => { liga.tab = el.dataset.v; ligaPaint(); },
    ligaDel: async el => { try { await socRemoveFriend(el.dataset.id); await ligaLoad(); } catch (e) { toast(e.message); } },
    ligaAlias: () => openSheet(`<p class="kicker">Liga de amigos</p><h2>Tu alias</h2><p class="muted">Es el nombre con el que te ven tus amigos y con el que te pueden añadir.</p>
        <form data-form="ligaAlias" style="margin-top:24px" novalidate><div class="field"><label for="lgA">Alias (3 a 20 caracteres, sin tildes)</label><input id="lgA" name="alias" maxlength="20" value="${esc(liga.alias || "")}" required></div>
        <p class="err" hidden></p><button class="btn full" type="submit">Guardar alias</button></form>`)
};
const ARCADE_FORMS = {
    ligaAdd: async form => {
        const a = String(new FormData(form).get("alias") || "").trim(); if (!a) return;
        try { const name = await socAddFriend(a); toast(`${name} añadido a tu liga.`); await ligaLoad(); }
        catch (e) { toast(e.message); }
    },
    ligaAlias: async form => {
        try { const a = await socSetAlias(new FormData(form).get("alias")); liga.alias = a; closeSheet(); toast("Alias guardado."); await ligaLoad(); }
        catch (e) { formErr(form, e.message); }
    }
};
