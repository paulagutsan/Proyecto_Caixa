"use strict";
/* Horizonte · Cuenta compartida
   La familia y la persona joven comparten la misma cuenta desde dos móviles distintos. Quien la abre recibe un
   enlace; quien lo abre en otro móvil entra con su rol (familia o joven) y las dos vistas se sincronizan.
   Estado compartido = todo menos lo propio de cada móvil: rol, asistente y amigos. El correo de la familia no sale del móvil.
   Servicio: supabase/schema-v2-cuentas.sql (funciones v2_cuenta_guardar y v2_cuenta_leer).
   Se carga antes que app.js: sus utilidades solo se usan dentro de funciones. */

const ACC_LOCAL = ["role", "acct", "chat", "friends"];        // no se comparten
const ACC_ALPH = "abcdefghjkmnpqrstuvwxyz23456789";
const accNew = () => Array.from(crypto.getRandomValues(new Uint8Array(26)), b => ACC_ALPH[b % ACC_ALPH.length]).join("");
let accTimer = null, accBusy = false, accApplying = false;

const accCall = (fn, body) => sb2Fetch(`/rest/v1/rpc/${fn}`, { method: "POST", body });
function accSnap() {
    const o = { ...S }; ACC_LOCAL.forEach(k => delete o[k]);
    if (o.family) o.family = { ...o.family, email: undefined };
    return JSON.parse(JSON.stringify(o));
}
function accLink(role) { return `${location.origin}${location.pathname}#/vincular?c=${encodeURIComponent(S.acct.token)}&r=${role}`; }
function accStart() {
    if (S.acct) return;
    S.acct = { token: accNew(), ver: 0, ok: false }; save(); accSchedule(50);
}
/* se llama desde save(): programa un envío cuando hay cuenta compartida */
function accTouch() { if (S.acct && !accApplying) accSchedule(1200); }
function accSchedule(ms) { clearTimeout(accTimer); accTimer = setTimeout(accPush, ms); }

async function accPush() {
    if (!S.acct || accBusy) return;
    accBusy = true;
    try {
        const r = await accCall("v2_cuenta_guardar", { p_token: S.acct.token, p_estado: accSnap(), p_version: S.acct.ver || 0 });
        if (r?.ok) { S.acct.ver = r.version; S.acct.ok = true; accStore(); if (/^#\/(f\/resumen|familia)/.test(location.hash)) rerenderSafe(); }
        else if (r) { await accPull(true); toast("Había cambios nuevos de tu familia. Se han cargado."); }
    } catch (e) { S.acct.ok = false; accStore(); accSchedule(8000); }
    accBusy = false;
}
async function accPull(force) {
    if (!S.acct || (accBusy && !force)) return;
    try {
        const r = await accCall("v2_cuenta_leer", { p_token: S.acct.token });
        if (r && r.version > (S.acct.ver || 0)) accApply(r);
    } catch (e) { /* sin conexión: se reintenta */ }
}
function accStore() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* nada */ } }
/* sustituye el estado por el del servidor, conservando lo propio de este móvil */
function accApply(r, role) {
    const keep = { role: role || S.role, acct: { token: S.acct?.token, ver: r.version, ok: true }, chat: S.chat || [], friends: S.friends || null };
    const email = S.family?.email;
    accApplying = true;
    S = { ...blank(), ...r.estado, ...keep };
    S.fears = (S.fears || []).map(normFear).filter(Boolean);
    if (S.family && email) S.family.email = email;
    accStore(); accApplying = false;
    rerenderSafe();
}
/* solo refresca la pantalla si no se está escribiendo ni hay una ventana abierta */
function rerenderSafe() {
    const a = document.activeElement?.tagName;
    if (!S.role || document.querySelector("#sheet.open") || document.querySelector(".focus") || /INPUT|TEXTAREA|SELECT/.test(a || "")) return;
    rerender();
}
function accInit() {
    if (!S.acct) return;
    accPull(); if (!S.acct.ok) accSchedule(500);
    setInterval(() => { if (!document.hidden) accPull(); }, 15000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) accPull(); });
}

/* ---------------------------------------------------------------- vincular desde un enlace */
let vinc = { token: "", state: "idle", data: null };
function parseToken(raw) {
    const t = String(raw || "").trim(), m = t.match(/[?&]c=([a-z0-9]{20,40})/i);
    return (m ? m[1] : t).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
}
async function vincLoad(token) {
    vinc = { token, state: "loading", data: null };
    try { const r = await accCall("v2_cuenta_leer", { p_token: token }); vinc = { token, state: r ? "ok" : "none", data: r }; }
    catch (e) { vinc = { token, state: "err", data: null }; }
    if (location.hash.startsWith("#/vincular")) render();
}
function vVincular(params) {
    const token = parseToken(params.get("c")), want = params.get("r") === "familia" ? "family" : params.get("r") === "joven" ? "teen" : "";
    const wrap = inner => `<div class="auth"><header class="auth-top">${brand("#/", 32)}${lnk("Cancelar", "#/", "ghost sm")}</header><main class="auth-card">${inner}</main></div>`;
    if (token.length < 20) return wrap(`<h1>Conecta tu cuenta</h1><p class="sub">Pega aquí el enlace (o el código) que te han enviado para entrar en la cuenta que ya está creada.</p>
      <form data-form="vincCode" class="form"><label class="field"><span>Enlace o código</span><input name="c" required autocomplete="off" placeholder="https://…#/vincular?c=…"></label><button class="btn primary lg block">Continuar</button></form>`);
    if (vinc.token !== token) vincLoad(token);
    if (vinc.state === "loading" || vinc.token !== token) return wrap(`<h1>Buscando la cuenta…</h1><p class="sub">Un momento.</p>`);
    if (vinc.state === "none") return wrap(`<h1>No encontramos esta cuenta</h1><p class="sub">El enlace está incompleto o la cuenta aún no se ha creado. Pide que te lo envíen de nuevo.</p>${lnk("Volver", "#/", "lg")}`);
    if (vinc.state === "err") return wrap(`<h1>No hemos podido conectar</h1><p class="sub">Comprueba tu conexión e inténtalo de nuevo.</p>${btn("Reintentar", "vincRetry", "primary lg")}`);
    const d = vinc.data.estado, teen = esc(d.teen?.name || "la persona joven"), fam = esc(d.family?.name || "su familia");
    const opt = (role, label, sub) => `<button class="btn ${want === role || !want ? "primary" : ""} lg block" data-act="vincGo" data-role="${role}">${label}</button><p class="note">${sub}</p>`;
    return wrap(`<h1>Cuenta de ${teen}</h1><p class="sub">Esta cuenta ya está creada. Al conectarte, las dos vistas (la de ${teen} y la de su familia) quedan unidas y lo que haga una lo ve la otra.</p>
      ${!want || want === "teen" ? opt("teen", `Entrar como ${teen}`, "Verás tu dinero, tus cursos y tu progreso.") : ""}
      ${!want || want === "family" ? opt("family", `Entrar como madre, padre o tutor de ${teen}`, `Podrás aprobar decisiones, hacer regalos y ver su progreso${d.family?.name ? ` (cuenta abierta por ${fam})` : ""}.`) : ""}
      <p class="auth-foot">${ic("lock")}Quien tiene este enlace puede entrar en la cuenta. No lo compartas fuera de la familia.</p>`);
}
function vincGo(role) {
    const d = vinc.data;
    if (S.role && S.acct?.token !== vinc.token && !confirm("Este dispositivo ya tiene una cuenta. Se sustituirá por esta. ¿Continuar?")) return;
    S = { ...blank(), ...d.estado, role, acct: { token: vinc.token, ver: d.version, ok: true }, chat: [], friends: null };
    S.fears = (S.fears || []).map(normFear).filter(Boolean);
    S.joined = { ...(S.joined || {}), [role]: true };
    save(); location.hash = role === "family" ? "#/f/resumen" : "#/inicio"; toast("Cuentas conectadas");
    accInit();
}

/* ---------------------------------------------------------------- tarjeta con el enlace */
function connectCard(viewer) {
    const other = viewer === "family" ? "teen" : "family", joined = !!S.joined?.[other], teen = esc(teenName() || "tu hijo o hija");
    const who = viewer === "family" ? teen : esc(S.family?.name || "tu familia");
    if (joined) return card(`<div class="conn ok"><span class="mv-ic own">${ic("check")}</span><div><b>${viewer === "family" ? `La cuenta de ${teen} está conectada` : `${who} está conectado`}</b><span>Lo que haga cada uno lo ve el otro en su móvil.</span></div></div>`, "c-12");
    const role = viewer === "family" ? "joven" : "familia";
    const link = S.acct ? accLink(role) : "";
    const msg = viewer === "family" ? `${esc(S.family?.name || "Tu familia")} te ha creado una cuenta en Horizonte, de CaixaBank. Ábrela aquí y entrarás directamente: ${link}`
        : `Estoy aprendiendo a invertir en Horizonte, de CaixaBank. Conecta tu cuenta de familia desde aquí para autorizarme y ayudarme: ${link}`;
    return card(`<div class="conn"><div class="conn-t"><span class="kicker">Un último paso</span><h2>${viewer === "family" ? `Conecta la cuenta de ${teen}` : "Conecta a tu familia"}</h2>
        <p>${viewer === "family" ? `Envíale este enlace. Al abrirlo en su móvil entrará directamente en su cuenta, que ya está a su nombre, y las dos cuentas quedarán conectadas.` : "Envía este enlace a tu madre, padre o tutor. Al abrirlo en su móvil entrará en tu cuenta desde el área familiar, para autorizarte y ayudarte."}</p></div>
      ${S.acct ? `<div class="conn-link"><input readonly value="${esc(link)}" aria-label="Enlace de conexión" onfocus="this.select()"><div class="conn-btns">${btn(`${ic("link")}Copiar`, "accCopy", "", `data-role="${role}"`)}${btn(`${ic("send")}Compartir`, "accShare", "primary", `data-role="${role}"`)}<a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">WhatsApp</a></div></div>
        <p class="note">${S.acct.ok ? "Enlace listo." : "Creando el enlace…"} Quien lo tenga puede entrar en la cuenta: no lo compartas fuera de la familia.</p>`
        : `<div class="actions">${btn("Crear el enlace", "accStart", "primary")}</div>`}</div>`, "c-12 conn-card");
}
async function accShareCopy(share, role) {
    const link = accLink(role), t = role === "joven" ? `${S.family?.name || "Tu familia"} te ha creado una cuenta en Horizonte, de CaixaBank. Ábrela aquí: ${link}` : `Conecta tu cuenta de familia en Horizonte desde aquí: ${link}`;
    if (share && navigator.share) { try { await navigator.share({ title: "Horizonte", text: t }); } catch (e) { /* cancelado */ } return; }
    try { await navigator.clipboard.writeText(share ? t : link); toast(share ? "Mensaje copiado" : "Enlace copiado"); } catch (e) { prompt("Copia el enlace:", link); }
}
