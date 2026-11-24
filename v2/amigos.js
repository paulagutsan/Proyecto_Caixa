"use strict";
/* Horizonte · Amigos en los juegos
   Conexiones como en LinkedIn (invitas con tu código, la otra persona acepta) solo para ver los resultados
   de los juegos. Se comparte el nombre con la inicial del apellido y los aciertos de cada día; nada más.
   Usa una sesión anónima de Supabase y las funciones de supabase/schema-v2-amigos.sql.
   Hasta los 18 años necesita el permiso de la familia. */

const SB2 = { url: (window.HZ2_CONFIG?.supabaseUrl || "").replace(/\/+$/, ""), key: window.HZ2_CONFIG?.supabaseAnonKey || "" };
const SB2_KEY = "hz2_sb";
let sb2 = null;
try { sb2 = JSON.parse(localStorage.getItem(SB2_KEY) || "null"); } catch (e) { sb2 = null; }
const sb2Save = v => { sb2 = v; try { v ? localStorage.setItem(SB2_KEY, JSON.stringify(v)) : localStorage.removeItem(SB2_KEY); } catch (e) { /* sin almacenamiento */ } };

async function sb2Fetch(path, { method = "GET", body, token } = {}) {
    let r;
    try {
        r = await fetch(SB2.url + path, { method, body: body === undefined ? undefined : JSON.stringify(body),
            headers: { apikey: SB2.key, "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    } catch (e) { throw new Error("Sin conexión. Inténtalo de nuevo en un momento."); }
    const txt = await r.text();
    let d = null; try { d = txt ? JSON.parse(txt) : null; } catch (e) { d = null; }
    if (!r.ok) {
        const code = d?.error_code || d?.code || "", msg = d?.msg || d?.message || "";
        if (code === "anonymous_provider_disabled" || /anonymous sign-ins are disabled/i.test(msg)) throw new Error("Falta activar los accesos anónimos en Supabase (Authentication → Sign In / Providers).");
        if (code === "PGRST202" || /could not find the function/i.test(msg)) throw new Error("Falta ejecutar supabase/schema-v2-amigos.sql en Supabase.");
        throw Object.assign(new Error(msg || "No se ha podido completar."), { status: r.status });
    }
    return d;
}
function sb2Set(d) { sb2Save({ access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600) }); }
let sb2Pending = null;                                                    // una sola sesión aunque lleguen varias llamadas a la vez
function sb2Token() { return sb2Pending || (sb2Pending = sb2TokenNow().finally(() => { sb2Pending = null; })); }
async function sb2TokenNow() {
    if (!SB2.url) throw new Error("El servicio de amigos no está configurado.");
    if (!sb2) {
        sb2Set(await sb2Fetch("/auth/v1/signup", { method: "POST", body: { data: {} } }));     // sesión anónima
        if (S.friends?.on) {                                                    // la sesión se perdió: se rehace el perfil con un código nuevo
            const code = await sb2Fetch("/rest/v1/rpc/v2_perfil", { method: "POST", body: { p_nombre: publicName() || "Jugador" }, token: sb2.access_token });
            S.friends.code = code; save();
        }
    } else if (sb2.expires_at - 60 < Date.now() / 1000) {
        try { sb2Set(await sb2Fetch("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: sb2.refresh_token } })); }
        catch (e) { if (e.status >= 400 && e.status < 500) sb2Save(null); throw e; }
    }
    return sb2.access_token;
}
const rpc2 = async (fn, args = {}) => sb2Fetch(`/rest/v1/rpc/${fn}`, { method: "POST", body: args, token: await sb2Token() });

/* ---------------------------------------------------------------- estado */
let soc = { red: [], partidas: [], loaded: false, loading: false, err: "" };
const friendsAllowed = () => isAdult() || !!S.friendsOk;
const friendsOn = () => !!S.friends?.on && friendsAllowed();
const publicName = () => `${S.teen?.name || ""}${S.teen?.surname ? ` ${S.teen.surname.trim().charAt(0).toUpperCase()}.` : ""}`.trim();
const inviteUrl = code => `${location.origin}${location.pathname}#/amigos?c=${encodeURIComponent(code)}`;
const pendingInvite = () => { try { return localStorage.getItem("hz2_invite") || ""; } catch (e) { return ""; } };
const setPendingInvite = c => { try { c ? localStorage.setItem("hz2_invite", c) : localStorage.removeItem("hz2_invite"); } catch (e) { /* nada */ } };

async function loadSocial(silent = false) {
    if (!friendsOn() || soc.loading) return;
    soc.loading = true; if (!silent) soc.err = "";
    try {
        const desde = iso(new Date(Date.now() - 6 * 864e5));
        const [red, partidas] = await Promise.all([rpc2("v2_red"), rpc2("v2_partidas_amigos", { p_desde: desde })]);
        soc = { red: red || [], partidas: partidas || [], loaded: true, loading: false, err: "", t: Date.now() };
    } catch (e) { soc.loading = false; soc.loaded = true; soc.t = Date.now(); soc.err = e.message; }
    if (/^#\/(aprende|juego)/.test(location.hash) && !(typeof mm !== "undefined" && mm?.phase === "play")) rerender();
}
async function activateFriends() {
    try {
        const code = await rpc2("v2_perfil", { p_nombre: publicName() || "Jugador" });
        S.friends = { on: true, code }; save();
        const recent = Object.entries(S.games).filter(([d]) => d >= iso(new Date(Date.now() - 864e5)));
        await Promise.all(recent.map(([d, g]) => pushGame(d, g.id, g.score)));
        toast("Amigos activados. Comparte tu código para conectar.");
        await loadSocial();
    } catch (e) { toast(esc(e.message)); }
}
async function pushGame(dia, juego, aciertos, rondas) {
    const g = GAMES.find(x => x.id === juego); if (!g) return;
    try { await rpc2("v2_guardar_partida", { p_dia: dia, p_juego: juego, p_aciertos: aciertos, p_rondas: rondas || g.rounds || aciertos + 1 }); } catch (e) { /* se reintenta en la próxima partida */ }
}
/* tras cada partida: guarda el resultado y refresca lo de los amigos */
function friendsAfterGame(id, score, rondas) { if (friendsOn()) pushGame(iso(new Date()), id, score, rondas).then(() => loadSocial(true)); }

async function connectCode(raw) {
    const c = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length !== 6) return toast("El código tiene 6 caracteres");
    try {
        const r = await rpc2("v2_conectar", { p_codigo: c });
        toast({ enviada: "Invitación enviada. Cuando la acepte, veréis vuestros resultados.", conectados: "Ya estáis conectados", ya_enviada: "Ya le habías enviado una invitación",
            no_existe: "No encontramos ese código", eres_tu: "Ese es tu propio código", limite: "Tienes demasiadas invitaciones pendientes" }[r] || "Hecho");
        if (["enviada", "conectados", "ya_enviada"].includes(r)) { setPendingInvite(""); closeSheet(); }
        loadSocial(true);
    } catch (e) { toast(esc(e.message)); }
}

/* ---------------------------------------------------------------- vistas */
const initials = n => esc(String(n || "?").trim().charAt(0).toUpperCase());
function weekBoard() {
    const by = {};
    soc.partidas.forEach(p => {
        const k = p.codigo; by[k] = by[k] || { codigo: k, nombre: p.nombre, yo: p.yo, aciertos: 0, rondas: 0, partidas: 0 };
        by[k].aciertos += p.aciertos; by[k].rondas += p.rondas; by[k].partidas++;
    });
    soc.red.filter(x => x.estado === "amigo").forEach(x => { by[x.codigo] = by[x.codigo] || { codigo: x.codigo, nombre: x.nombre, aciertos: 0, rondas: 0, partidas: 0 }; });
    if (!Object.values(by).some(x => x.yo)) by[S.friends.code] = { codigo: S.friends.code, nombre: publicName(), yo: true, aciertos: 0, rondas: 0, partidas: 0 };
    return Object.values(by).sort((a, b) => b.aciertos - a.aciertos || a.rondas - b.rondas);
}
function friendsCard() {
    const head = t => cardH(`<span class="gem">${ic("family")}Amigos</span>`, t);
    if (!friendsAllowed()) return card(`${head("Compara tus resultados en los juegos con tus amigos.")}
      ${empty("lock", "Necesitas el permiso de tu familia", `Hasta los ${RULES.adultAge}, tu madre, padre o tutor decide si puedes conectar con amigos en los juegos.`, lnk("Ver permisos", "#/familia", "primary"))}`, "c-12 friends");
    if (!friendsOn()) return card(`${head("Conecta con tus amigos y mirad quién acierta más cada semana.")}
      <div class="fr-intro"><ul><li>${ic("check")}Solo se comparten tus resultados en los juegos.</li><li>${ic("check")}Te verán como «${esc(publicName())}».</li><li>${ic("check")}Nada de tu dinero, tu Antídoto ni tus millas.</li></ul>
      ${btn("Activar amigos", "frOn", "primary")}</div>`, "c-12 friends");
    if (!soc.loading && Date.now() - (soc.t || 0) > 30000) setTimeout(() => loadSocial(soc.loaded), 0);
    const inv = pendingInvite(), recib = soc.red.filter(x => x.estado === "recibida"), amigos = soc.red.filter(x => x.estado === "amigo");
    const today = iso(new Date()), feed = soc.partidas.filter(p => p.dia === today && !p.yo);
    const board = soc.loaded ? weekBoard() : [];
    const gameName = id => GAMES.find(g => g.id === id)?.t || id;
    return card(`${cardH(`<span class="gem">${ic("family")}Amigos</span>`, amigos.length ? `${amigos.length} ${amigos.length === 1 ? "conexión" : "conexiones"} · tu código <b class="fr-code">${esc(S.friends.code)}</b>` : `Tu código: <b class="fr-code">${esc(S.friends.code)}</b>`, btn(`${ic("plus")}Añadir`, "frAdd", "sm"))}
      ${soc.err ? `<p class="fr-err">${esc(soc.err)}</p>` : ""}
      ${inv && inv !== S.friends.code ? `<div class="fr-inv"><span class="fr-av">${ic("send")}</span><div><b>Te han invitado</b><span>Código ${esc(inv)}</span></div><div class="fr-btns">${btn("Ignorar", "frInvNo", "sm ghost")}${btn("Conectar", "frInvYes", "sm primary")}</div></div>` : ""}
      ${recib.map(x => `<div class="fr-inv"><span class="fr-av">${initials(x.nombre)}</span><div><b>${esc(x.nombre)}</b><span>Quiere conectar contigo</span></div><div class="fr-btns">${btn("Ignorar", "frResp", "sm ghost", `data-c="${esc(x.codigo)}" data-ok="0"`)}${btn("Aceptar", "frResp", "sm primary", `data-c="${esc(x.codigo)}" data-ok="1"`)}</div></div>`).join("")}
      ${!soc.loaded ? `<p class="note">Cargando…</p>` : amigos.length ? `<div class="fr-grid">
        <div><h3 class="fr-h">Esta semana</h3><ol class="fr-board">${board.map((x, i) => `<li class="${x.yo ? "me" : ""}"><span class="fr-pos">${i + 1}</span><span class="fr-av">${initials(x.nombre)}</span><div><b>${x.yo ? "Tú" : esc(x.nombre)}</b><span>${x.partidas ? `${x.partidas} ${x.partidas === 1 ? "partida" : "partidas"}` : "Sin jugar"}</span></div><b class="fr-pts">${x.aciertos}<small> aciertos</small></b></li>`).join("")}</ol></div>
        <div><h3 class="fr-h">Hoy</h3>${feed.length ? `<div class="fr-feed">${feed.map(p => `<div><span class="fr-av">${initials(p.nombre)}</span><p><b>${esc(p.nombre)}</b> ${p.juego === "masomenos" ? `ha hecho una racha de <b>${p.aciertos}</b> en` : `ha hecho <b>${p.aciertos}/${p.rondas}</b> en`} ${esc(gameName(p.juego))}</p></div>`).join("")}</div>`
          : `<p class="fr-none">Tus amigos aún no han jugado hoy.</p>`}</div></div>`
        : `<div class="fr-empty"><p>Aún no tienes conexiones. Comparte tu código o tu enlace: cuando acepten, veréis los resultados de cada uno.</p>${btn(`${ic("send")}Compartir invitación`, "frShare", "primary")}</div>`}`, "c-12 friends");
}
function friendsSheet() {
    const amigos = soc.red.filter(x => x.estado === "amigo"), env = soc.red.filter(x => x.estado === "enviada");
    sheet("Añadir amigos", `<div class="fr-mycode"><span>Tu código</span><b>${esc(S.friends.code)}</b>${btn(`${ic("send")}Compartir invitación`, "frShare", "sm")}</div>
      <form data-form="frCode" class="form"><label class="field"><span>Código de tu amigo</span><input name="c" maxlength="6" autocomplete="off" autocapitalize="characters" placeholder="Por ejemplo, K3P9QX" value="${esc(pendingInvite())}" required></label>
      <button class="btn primary block">Enviar invitación</button></form>
      ${amigos.length || env.length ? `<div class="rows fr-list">${[...amigos.map(x => [x, "Conectados", "Quitar"]), ...env.map(x => [x, "Invitación enviada", "Retirar"])].map(([x, st, a]) => `<div class="row"><span class="fr-av">${initials(x.nombre)}</span><div><b>${esc(x.nombre)}</b><span>${st}</span></div>${btn(a, "frDel", "sm ghost", `data-c="${esc(x.codigo)}"`)}</div>`).join("")}</div>` : ""}
      <p class="note">Solo veis vuestros resultados en los juegos. Puedes quitar una conexión cuando quieras.</p>`);
}
/* en la pantalla final de cada juego: cómo les ha ido hoy a tus amigos en ese juego */
function friendsToday(id) {
    if (!friendsOn()) return "";
    const today = iso(new Date()), xs = soc.partidas.filter(p => p.dia === today && p.juego === id && !p.yo);
    return xs.length ? `<div class="fr-today"><span>Hoy, tus amigos:</span>${xs.slice(0, 4).map(p => `<b>${esc(p.nombre)} ${p.juego === "masomenos" ? `racha ${p.aciertos}` : `${p.aciertos}/${p.rondas}`}</b>`).join("")}</div>` : "";
}
async function friendsAct(act, b) {
    if (act === "frJump") return $(".friends")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (act === "frOn") return activateFriends();
    if (act === "frAdd") return friendsSheet();
    if (act === "frShare") {
        const u = inviteUrl(S.friends.code), t = `Juega conmigo en Horizonte y comparemos resultados. Mi código: ${S.friends.code} · ${u}`;
        if (navigator.share) { try { await navigator.share({ title: "Horizonte", text: t }); } catch (e) { /* cancelado */ } }
        else { try { await navigator.clipboard.writeText(t); toast("Invitación copiada"); } catch (e) { prompt("Copia la invitación:", t); } }
        return;
    }
    if (act === "frInvYes") return connectCode(pendingInvite());
    if (act === "frInvNo") { setPendingInvite(""); return rerender(); }
    if (act === "frResp") { try { await rpc2("v2_responder", { p_codigo: b.dataset.c, p_aceptar: b.dataset.ok === "1" }); toast(b.dataset.ok === "1" ? "Ya estáis conectados" : "Invitación ignorada"); } catch (e) { toast(esc(e.message)); } return loadSocial(true); }
    if (act === "frDel") { try { await rpc2("v2_quitar", { p_codigo: b.dataset.c }); closeSheet(); toast("Conexión quitada"); } catch (e) { toast(esc(e.message)); } return loadSocial(true); }
}
