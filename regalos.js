"use strict";
/* Horizonte · Regalos a cualquier persona
   Sin cuenta: eliges importe, el nombre de quien lo recibe, el tuyo y un mensaje. Se genera un enlace; quien lo recibe
   crea su cuenta y canjea el regalo una sola vez. En esta demostración no se cobra nada.
   Servicio: supabase/schema-v2-regalos.sql. Se carga antes que app.js: sus utilidades solo se usan dentro de funciones. */

const GF_ALPH = "abcdefghjkmnpqrstuvwxyz23456789";
const gfCode = () => Array.from(crypto.getRandomValues(new Uint8Array(14)), b => GF_ALPH[b % GF_ALPH.length]).join("");
const gfPending = () => { try { return localStorage.getItem("hz2_gift") || ""; } catch (e) { return ""; } };
const gfSetPending = c => { try { c ? localStorage.setItem("hz2_gift", c) : localStorage.removeItem("hz2_gift"); } catch (e) { /* nada */ } };
const gfLink = c => `${location.origin}${location.pathname}#/regalo?c=${encodeURIComponent(c)}`;
const gfCall = (fn, body) => sb2Fetch(`/rest/v1/rpc/${fn}`, { method: "POST", body });
let gfMade = null, gfSeen = {};

const gfCard = g => `<div class="gf-card"><span class="gf-k">Un regalo en Horizonte</span><b class="gf-to">Para ${esc(g.para)}</b>
    <span class="gf-amt">${eur(g.importe, g.importe % 1 !== 0)}</span>${g.mensaje ? `<p class="gf-msg">«${esc(g.mensaje)}»</p>` : ""}
    <span class="gf-from">De parte de <b>${esc(g.de)}</b>${g.ocasion && g.ocasion !== "Sin ocasión" ? ` · ${esc(g.ocasion)}` : ""}</span></div>`;

/* ---- portada */
function giftSection() {
    return `<section class="lp-sec alt" id="regala"><div class="lp-in lp-split">
      <div><p class="kicker">Regala</p><h2 class="serif">Regala su primer euro.</h2>
        <p class="lp-lead">Cumpleaños, Navidad o fin de curso: regala una aportación a quien quieras, con su nombre y un mensaje tuyo. No hace falta tener cuenta para regalar; quien lo recibe lo canjea al crear la suya.</p>
        ${lnk(`Hacer un regalo${ic("arrow")}`, "#/regalar", "primary lg")}</div>
      ${gfCard({ para: "Lucía", importe: 20, mensaje: "Para que empieces con buen pie", de: "Abuela Rosa", ocasion: "Cumpleaños" })}
    </div></section>`;
}

/* ---- preparar un regalo */
function vRegalar() {
    const wrap = inner => `<div class="lp">${pubTop(S.role ? pubBack() : lnk("Crear cuenta", "#/alta/joven", "primary sm"))}<section class="lp-sec"><div class="lp-in lp-narrow">${inner}</div></section></div>`;
    if (gfMade) {
        const g = gfMade, link = gfLink(g.code), msg = `${g.de} te ha regalado ${eur(g.importe)} en Horizonte, de CaixaBank. Ábrelo aquí: ${link}`;
        return wrap(`<p class="kicker">Regalo preparado</p><h1 class="serif pub-h1">Ya está. Ahora envíaselo a ${esc(g.para)}.</h1>${gfCard(g)}
          <div class="conn-link gf-link"><input readonly value="${esc(link)}" aria-label="Enlace del regalo" onfocus="this.select()"><div class="conn-btns">${btn(`${ic("link")}Copiar`, "gfCopy", "")}${btn(`${ic("send")}Compartir`, "gfShare", "primary")}<a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">WhatsApp</a></div></div>
          <div class="lp-cta">${btn("Hacer otro regalo", "gfAgain", "lg")}${lnk("Volver", S.role ? "#/ajustes" : "#/", "lg")}</div>`);
    }
    return wrap(`<p class="kicker">Regala</p><h1 class="serif pub-h1">Regala su primer euro.</h1>
      <p class="lp-lead">Elige cuánto, escribe su nombre y un mensaje. Sin cuenta, sin registro.</p>
      <form data-form="giftNew" class="form gf-form">
        <label class="field"><span>Tu nombre</span><input name="de" required maxlength="40" autocomplete="given-name" value="${esc(S.family?.name || "")}"></label>
        <label class="field"><span>Nombre de quien lo recibe</span><input name="para" required maxlength="40" placeholder="Por ejemplo, Lucía"></label>
        <div class="field"><span>Importe</span><div class="chips">${[10, 20, 50, 100].map(v => `<button type="button" class="chip" data-act="gfAmt" data-v="${v}">${v} €</button>`).join("")}</div>
          <div class="amount-in"><input name="importe" type="number" min="1" max="3000" step="1" inputmode="numeric" required placeholder="0" value="20" aria-label="Importe en euros"><span>€</span></div></div>
        <label class="field"><span>Ocasión</span><select name="ocasion"><option>Cumpleaños</option><option>Navidad</option><option>Fin de curso</option><option>Graduación</option><option>Sin ocasión</option></select></label>
        <label class="field"><span>Mensaje (opcional)</span><input name="mensaje" maxlength="120" placeholder="Para que empieces con buen pie"></label>
        <button class="btn primary lg block">Preparar el regalo</button>
        <p class="note">Hasta 3.000 €.</p></form>`);
}

/* ---- recibir un regalo */
async function gfLoad(code) {
    gfSeen[code] = { state: "loading" };
    try { const g = await gfCall("v2_regalo_leer", { p_codigo: code }); gfSeen[code] = g ? { state: g.estado === "canjeado" ? "used" : "ok", g } : { state: "none" }; }
    catch (e) { gfSeen[code] = { state: "err" }; }
    if (location.hash.startsWith("#/regalo?")) render();
}
function vRegalo(params) {
    const code = String(params.get("c") || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
    const wrap = inner => `<div class="auth"><header class="auth-top">${brand("#/", 32)}${lnk("Cancelar", "#/", "ghost sm")}</header><main class="auth-card">${inner}</main></div>`;
    if (code.length < 12) return wrap(`<h1>Enlace no válido</h1><p class="sub">Este enlace no incluye ningún regalo. Pide que te lo envíen de nuevo.</p>`);
    if (!gfSeen[code]) gfLoad(code);
    const v = gfSeen[code] || { state: "loading" };
    if (v.state === "loading") return wrap(`<h1>Abriendo tu regalo…</h1><p class="sub">Un momento.</p>`);
    if (v.state === "err") return wrap(`<h1>No hemos podido abrirlo</h1><p class="sub">Comprueba tu conexión e inténtalo de nuevo.</p>${btn("Reintentar", "gfRetry", "primary lg", `data-c="${code}"`)}`);
    if (v.state === "none") return wrap(`<h1>No encontramos este regalo</h1><p class="sub">El enlace está incompleto. Pide que te lo envíen de nuevo.</p>`);
    if (v.state === "used") return wrap(`${gfCard(v.g)}<h1>Este regalo ya se ha canjeado</h1><p class="sub">Cada regalo se puede canjear una sola vez.</p>${lnk("Ir a Horizonte", "#/", "lg")}`);
    return wrap(`${gfCard(v.g)}<h1>Tienes un regalo, ${esc(v.g.para)}</h1>
      <p class="sub">${esc(v.g.de)} te regala ${eur(v.g.importe)} para empezar a invertir. Para recibirlo, crea tu cuenta en Horizonte: es gratis.</p>
      ${btn(S.role === "teen" ? "Canjear mi regalo" : "Crear mi cuenta y recibirlo", "gfAccept", "primary lg block", `data-c="${code}"`)}
      <p class="note">Invertir conlleva riesgos. Si eres menor de edad, tu madre, padre o tutor tiene que autorizar tu cuenta.</p>`);
}
async function giftClaim(code) {
    if (!code || S.role !== "teen") return;
    try {
        const g = await gfCall("v2_regalo_canjear", { p_codigo: code });
        gfSetPending("");
        if (g) { addMoney({ amount: +g.importe, src: "regalo", from: g.de, occasion: g.ocasion, msg: g.mensaje || "" }); toast(`Has recibido ${eur(+g.importe)} de ${esc(g.de)}`); rerender(); }
        else toast("Este regalo ya se había canjeado");
    } catch (e) { toast("No se ha podido canjear ahora. Lo intentaremos de nuevo."); }
}
const giftBanner = () => gfPending() ? `<div class="demo-banner gf-note">${ic("gift")}<p><b>Tu regalo te espera.</b> Al crear la cuenta lo recibirás.</p></div>` : "";

document.addEventListener("submit", async e => {
    const f = e.target.closest('[data-form="giftNew"]'); if (!f) return;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f)), importe = Math.round(+d.importe * 100) / 100;
    if (!(importe >= 1 && importe <= 3000)) return toast("El importe debe estar entre 1 y 3.000 €");
    const g = { code: gfCode(), de: d.de.trim(), para: d.para.trim(), importe, ocasion: d.ocasion, mensaje: (d.mensaje || "").trim() };
    try {
        await gfCall("v2_regalo_crear", { p_codigo: g.code, p_de: g.de, p_para: g.para, p_importe: g.importe, p_ocasion: g.ocasion, p_mensaje: g.mensaje });
        gfMade = g; render(); scrollTo(0, 0);
    } catch (err) { toast("No se ha podido preparar el regalo ahora. Inténtalo en un momento."); }
});
document.addEventListener("click", async e => {
    const b = e.target.closest('[data-act^="gf"]'); if (!b) return;
    const act = b.dataset.act;
    if (act === "gfAmt") { const i = $('input[name="importe"]'); if (i) { i.value = b.dataset.v; i.focus(); } }
    else if (act === "gfAgain") { gfMade = null; render(); }
    else if (act === "gfRetry") gfLoad(b.dataset.c);
    else if (act === "gfAccept") {
        const code = b.dataset.c;
        if (S.role === "teen") { await giftClaim(code); location.hash = "#/inicio"; }
        else if (S.role === "family") toast("Los regalos se canjean desde la cuenta de la persona joven.");
        else { gfSetPending(code); location.hash = "#/alta/joven"; }
    }
    else if (act === "gfCopy" || act === "gfShare") {
        const g = gfMade, link = gfLink(g.code), t = `${g.de} te ha regalado ${eur(g.importe)} en Horizonte, de CaixaBank. Ábrelo aquí: ${link}`;
        if (act === "gfShare" && navigator.share) { try { await navigator.share({ title: "Horizonte", text: t }); } catch (err) { /* cancelado */ } return; }
        try { await navigator.clipboard.writeText(act === "gfShare" ? t : link); toast(act === "gfShare" ? "Mensaje copiado" : "Enlace copiado"); } catch (err) { prompt("Copia el enlace:", link); }
    }
});
