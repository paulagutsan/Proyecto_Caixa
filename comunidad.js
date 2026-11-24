"use strict";
/* Horizonte · Tu voz y Tu proyecto (vienen de la versión 1)
   - Tu voz: opina sobre propuestas de juntas de accionistas; la gestora vota en nombre del fondo y tu opinión
     se suma a la de la comunidad (consultivo). Los totales se guardan en Supabase (funciones totales_voz y
     votar_voz de schema-social.sql) con la sesión anónima de amigos.js; si no hay servicio, se guarda solo aquí.
   - Tu proyecto: cuenta tu proyecto en privado y mira qué empresas asociadas podrían apoyarlo.
   Se carga antes que app.js: sus utilidades solo se usan dentro de funciones. */

const VOZ = [
    { id: "bonus-clima", co: "Una energética europea", t: "Que el bonus del consejero delegado dependa de reducir emisiones",
      d: "Una parte del sueldo variable del CEO solo se cobraría si la empresa recorta sus emisiones un 30 % antes de 2030.",
      why: "Ata lo que cobra quien dirige a un objetivo de largo plazo. Quien está en contra dice que puede frenar decisiones de negocio." },
    { id: "sueldo-ceo", co: "Una gran tecnológica de EE. UU.", t: "Subir un 40 % el sueldo del consejero delegado",
      d: "El consejo propone la subida tras un año de beneficios récord. La votación sobre sueldos de directivos es consultiva en muchas juntas.",
      why: "Pagar bien puede retener talento, pero sueldos muy altos restan beneficio que podría ir a los accionistas o a la plantilla." },
    { id: "recompra", co: "Un banco español", t: "Recomprar acciones en vez de subir el dividendo",
      d: "La empresa usaría 1.000 millones en comprar sus propias acciones en lugar de repartir más dividendo.",
      why: "Recomprar reduce el número de acciones y puede subir su precio; el dividendo te da dinero en mano ahora." },
    { id: "consejo", co: "Una cadena de moda", t: "Que la mitad del consejo sean consejeros independientes",
      d: "Hoy la mayoría del consejo está ligada a los accionistas fundadores.",
      why: "Los independientes vigilan que se decida pensando en todos los accionistas, no solo en los grandes." },
    { id: "ia-datos", co: "Una red social", t: "Publicar cada año cómo usa la IA con los datos de sus usuarios",
      d: "Un grupo de accionistas pide un informe anual sobre inteligencia artificial, privacidad y riesgos.",
      why: "La transparencia reduce el riesgo de multas y escándalos. La empresa dice que ya cumple la ley." },
    { id: "brecha", co: "Una cadena de supermercados", t: "Publicar la brecha salarial entre hombres y mujeres",
      d: "La propuesta pide datos por categoría profesional y un plan para cerrarla.",
      why: "Medirla es el primer paso para corregirla; el consejo argumenta que ya publica datos agregados." },
    { id: "proveedores", co: "Un fabricante de móviles", t: "Auditar las condiciones laborales de sus proveedores",
      d: "Auditorías independientes en las fábricas que montan sus productos, con resultados públicos.",
      why: "Problemas en la cadena de suministro pueden acabar en boicots y caídas en bolsa." },
    { id: "id-dividendo", co: "Una farmacéutica", t: "Dedicar más beneficio a investigación y menos a dividendos",
      d: "El dividendo bajaría un 20 % durante tres años para financiar nuevos medicamentos.",
      why: "Menos dinero hoy a cambio de posibles productos que hagan crecer la empresa mañana." },
];
const VOZ_LABEL = { a: "A favor", c: "En contra", s: "No lo tengo claro" };

const PJ_SECTORS = { sostenibilidad: "Sostenibilidad y energía", tecnologia: "Tecnología y apps", salud: "Salud y bienestar", educacion: "Educación", social: "Impacto social", moda: "Moda y consumo", comida: "Alimentación", cultura: "Cultura y ocio" };
const PJ_NEEDS = { financiacion: "Financiación", mentoria: "Mentoría", clientes: "Primeros clientes", socio: "Socio tecnológico" };
const PJ_STAGES = { idea: "Es una idea", prototipo: "Tengo un prototipo", marcha: "Ya está en marcha" };
// Empresas de ejemplo para el prototipo (ficticias)
const PJ_PARTNERS = [
    { id: "p1", n: "Vatio Lab", sec: ["sostenibilidad"], needs: ["financiacion", "mentoria"], stages: ["prototipo", "marcha"], d: "Programa de aceleración de una energética para proyectos de clima y energía." },
    { id: "p2", n: "Código Abierto Ventures", sec: ["tecnologia", "educacion"], needs: ["financiacion", "socio"], stages: ["prototipo", "marcha"], d: "Fondo que invierte en apps y software creados por menores de 30." },
    { id: "p3", n: "Fundación Raíces", sec: ["social", "educacion"], needs: ["mentoria", "financiacion"], stages: ["idea", "prototipo"], d: "Becas y mentoría para proyectos con impacto social en barrios y pueblos." },
    { id: "p4", n: "Mercado Nuevo", sec: ["moda", "comida"], needs: ["clientes"], stages: ["prototipo", "marcha"], d: "Cadena de tiendas que prueba productos de marcas jóvenes en sus estanterías." },
    { id: "p5", n: "Pulso Salud", sec: ["salud"], needs: ["socio", "mentoria", "clientes"], stages: ["prototipo", "marcha"], d: "Grupo sanitario que busca soluciones digitales para pacientes y hospitales." },
    { id: "p6", n: "Escena", sec: ["cultura"], needs: ["financiacion", "clientes"], stages: ["idea", "prototipo", "marcha"], d: "Productora que apoya proyectos culturales, musicales y de contenido digital." },
    { id: "p7", n: "Huerta Futura", sec: ["comida", "sostenibilidad"], needs: ["clientes", "mentoria"], stages: ["idea", "prototipo"], d: "Cooperativa agroalimentaria abierta a ideas de alimentación sostenible." },
    { id: "p8", n: "Aula Siguiente", sec: ["educacion", "tecnologia"], needs: ["clientes", "socio"], stages: ["prototipo", "marcha"], d: "Red de academias que pilota herramientas educativas en sus aulas." },
];

/* ---------------------------------------------------------------- estado */
let voz = { totals: null, err: "", last: null, loading: false };
function cxState() {
    if (!S.cx || typeof S.cx !== "object") S.cx = {};
    S.cx.votes ||= {}; S.cx.project ||= null; S.cx.requests ||= {};
    return S.cx;
}
async function loadVoz() {
    if (voz.loading || !sb2) return;                       // sin sesión todavía: los totales llegan con el primer voto
    voz.loading = true;
    try { voz.totals = await rpc2("totales_voz"); voz.err = ""; } catch (e) { voz.err = e.message; }
    voz.loading = false;
    if (location.hash.startsWith("#/voz")) rerender();
}
async function vozVote(v) {
    const st = cxState(), card = $("#vzCard"), cur = VOZ.find(x => !st.votes[x.id]);
    if (!cur || card?.dataset.busy) return;
    if (card) { card.dataset.busy = "1"; card.classList.add(v === "a" ? "out-r" : v === "c" ? "out-l" : "out-d"); }
    st.votes[cur.id] = v; voz.last = cur.id; save();
    try { voz.totals = await rpc2("votar_voz", { p_propuesta: cur.id, p_voto: v }); voz.err = ""; }
    catch (e) { voz.err = e.message; }
    setTimeout(rerender, card ? 240 : 0);
}
function vozBars(id, mine) {
    const t = voz.totals?.[id], n = t ? (t.a || 0) + (t.c || 0) + (t.s || 0) : 0;
    if (!n) return `<p class="vz-none">${voz.err ? "Los resultados de la comunidad aparecerán cuando el servicio esté activo." : "Aún no hay suficientes opiniones."}</p>`;
    return `<div class="vz-bars">${["a", "c", "s"].map(k => { const p = Math.round((t[k] || 0) / n * 100);
        return `<div class="${k === mine ? "me" : ""}"><span>${VOZ_LABEL[k]}${k === mine ? " · tú" : ""}</span><b>${p} %</b><i><em class="vz-${k}" style="width:${p}%"></em></i></div>`; }).join("")}
      <small>${num(n)} ${n === 1 ? "opinión" : "opiniones"}</small></div>`;
}
function pjMatches(p) {
    return PJ_PARTNERS.map(x => {
        const sec = x.sec.includes(p.sector), needs = p.needs.filter(n => x.needs.includes(n)), stage = x.stages.includes(p.stage);
        const score = Math.min(98, (sec ? 55 : 0) + needs.length * 15 + (stage ? 10 : 0) + (needs.length ? 5 : 0));
        const why = [sec && `trabaja en ${PJ_SECTORS[p.sector].toLowerCase()}`, needs.length && `ofrece ${needs.map(n => PJ_NEEDS[n].toLowerCase()).join(" y ")}`, stage && "apoya proyectos en tu fase"].filter(Boolean);
        return { ...x, score, why };
    }).filter(x => x.score >= 50).sort((a, b) => b.score - a.score).slice(0, 3);
}
const initialsOf = n => n.split(" ").filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join("").toUpperCase();

/* ---------------------------------------------------------------- Tu voz */
const ideasTabs = cur => `<nav class="ideas-tabs" aria-label="Tus ideas"><a href="#/voz" class="${cur === "voz" ? "on" : ""}">${ic("voice")}Opina sobre las empresas</a><a href="#/proyecto" class="${cur === "proyecto" ? "on" : ""}">${ic("bulb")}Impulsa tu proyecto</a></nav>`;
function vVoz() {
    const st = cxState(), pending = VOZ.filter(v => !st.votes[v.id]), done = VOZ.length - pending.length, cur = pending[0];
    if (!voz.totals && !voz.err) setTimeout(loadVoz, 0);
    const last = voz.last && VOZ.find(v => v.id === voz.last), voted = VOZ.filter(v => st.votes[v.id]);
    return `${pageH("Tus ideas", "Cuando inviertes en un fondo, la gestora vota en las juntas de accionistas de las empresas. Aquí le dices qué preferirías tú.")}${ideasTabs("voz")}
    <div class="grid">
      ${card(cur ? `<div class="vz-top"><span class="kicker">Propuesta ${done + 1} de ${VOZ.length}</span><span class="vz-prog">${VOZ.map((v, i) => `<i class="${i < done ? "done" : i === done ? "on" : ""}"></i>`).join("")}</span></div>
          <article class="vz-card" id="vzCard" tabindex="0" aria-label="Propuesta: ${esc(cur.t)}">
            <span class="vz-stamp a">A favor</span><span class="vz-stamp c">En contra</span>
            <p class="vz-co">${cur.co} · Junta de accionistas</p>
            <h2>${cur.t}</h2><p>${cur.d}</p>
            <p class="vz-why"><b>Por qué te importa.</b> ${cur.why}</p>
          </article>
          <div class="vz-btns">${btn(`${ic("chevl")}En contra`, "vozVote", "vz-c", 'data-v="c"')}${btn("No lo tengo claro", "vozVote", "ghost", 'data-v="s"')}${btn(`A favor${ic("chev")}`, "vozVote", "vz-a", 'data-v="a"')}</div>
          <p class="note center-note">Desliza la tarjeta o usa las flechas del teclado.</p>`
        : `<div class="vz-done"><span class="kicker">Todo respondido</span><h2>Has opinado sobre todas las propuestas.</h2><p>En temporada de juntas llegarán nuevas. Mientras, mira lo que opina la comunidad.</p>${btn("Volver a opinar", "vozReset", "ghost")}</div>`, "c-7")}
      ${card(last ? `<span class="kicker">Lo que opina la comunidad</span><h3 class="vz-lt">${last.t}</h3>${vozBars(last.id, st.votes[last.id])}`
        : `<span class="kicker">Cómo funciona</span><ul class="vz-how"><li><span>1</span><div><b>Lees la propuesta</b><small>Son decisiones reales que se votan en juntas de empresas.</small></div></li><li><span>2</span><div><b>Das tu opinión</b><small>A favor, en contra o no lo tienes claro.</small></div></li><li><span>3</span><div><b>Se suma a la de todos</b><small>La gestora tiene en cuenta lo que opina la comunidad antes de votar.</small></div></li></ul>`, "c-5")}
      ${voted.length ? card(`${cardH("Tus opiniones", `${voted.length} de ${VOZ.length}`)}<div class="vz-list">${voted.map(v => `<div class="vz-row"><div><b>${v.t}</b><span>${v.co}</span></div><span class="vz-mine vz-${st.votes[v.id]}">${VOZ_LABEL[st.votes[v.id]]}</span>${vozBars(v.id, st.votes[v.id])}</div>`).join("")}</div>`, "c-12") : ""}
    </div>
    <p class="note center-note">Propuestas de ejemplo. Tu opinión es consultiva: la decisión final de voto es de la gestora.</p>`;
}

/* ---------------------------------------------------------------- Tu proyecto */
function vProyecto() {
    const st = cxState(), p = st.project;
    const priv = `<span class="kicker">Privado por defecto</span><ul class="pj-safe"><li>${ic("lock")}Tu proyecto solo lo ves tú.</li><li>${ic("check")}Ninguna empresa sabe nada hasta que decides contactarla.</li><li>${ic("check")}Incluso entonces, solo ve el resumen: nunca tu nombre, tu email ni tu dinero.</li></ul>`;
    if (!p) return `${pageH("Tus ideas", "Una app, una marca de ropa, un huerto urbano, un podcast… Cuéntalo y descubre quién podría impulsarlo.")}${ideasTabs("proyecto")}
    <div class="grid">
      ${card(`<div class="pj-empty"><span class="kicker">Tu proyecto</span><h2>¿Tienes un proyecto entre manos?</h2><p>Cuéntalo en dos minutos y te enseñamos qué empresas asociadas podrían apoyarlo con financiación, mentoría o primeros clientes.</p>${btn(`Contar mi proyecto${ic("arrow")}`, "pjEdit", "primary lg")}</div>`, "c-7")}
      ${card(priv, "c-5")}
    </div>`;
    const ms = pjMatches(p);
    return `${pageH("Tus ideas", "Privado: solo lo ves tú hasta que decidas contactar con alguien.")}${ideasTabs("proyecto")}
    <div class="grid">
      ${card(`<div class="pj-head"><span class="kicker">${PJ_SECTORS[p.sector]} · ${PJ_STAGES[p.stage]}</span>${btn("Editar", "pjEdit", "sm ghost")}</div>
        <h2 class="pj-title">${esc(p.title)}</h2><p class="pj-desc">${esc(p.desc)}</p>
        <div class="pj-needs">${p.needs.map(n => `<span>${PJ_NEEDS[n]}</span>`).join("")}</div>
        <h3 class="pj-h">Posibles encajes <small>${ms.length} ${ms.length === 1 ? "empresa" : "empresas"}</small></h3>
        ${ms.length ? `<div class="pjm-list">${ms.map(m => `<div class="pj-m"><span class="fr-av">${initialsOf(m.n)}</span><div><b>${m.n} <em>${m.score} % de encaje</em></b><span>${m.d}</span><small>Encaja porque ${m.why.join(", ")}.</small></div>
            ${st.requests[m.id] ? badge(`${ic("check")}Enviada`, "ok") : btn("Me interesa", "pjAsk", "sm", `data-id="${m.id}"`)}</div>`).join("")}</div>`
          : `<p class="vz-none">Aún no hay empresas asociadas que encajen. Prueba a añadir otra necesidad o vuelve pronto: se suman nuevas cada mes.</p>`}`, "c-8")}
      ${card(`${priv}<span class="kicker pj-k2">Si dices «me interesa»</span><ul class="pj-safe"><li>${ic("check")}Antes de enviarlo, ves exactamente lo que verá la empresa.</li><li>${ic("check")}Si le encaja, te responde aquí, dentro de Horizonte.</li><li>${ic("check")}Puedes retirar tu solicitud cuando quieras.</li></ul>
        <p class="note">Empresas de ejemplo para el prototipo. Una conexión no es una oferta de inversión ni de financiación.</p>`, "c-4")}
    </div>`;
}
function pjForm() {
    const p = cxState().project || { title: "", sector: "", stage: "idea", needs: [], desc: "" };
    sheet("Cuéntanos tu proyecto", `<form data-form="pj" class="form pj-form" novalidate>
      <div class="pj-row"><label class="field"><span>Nombre</span><input name="title" maxlength="50" value="${esc(p.title)}" placeholder="Por ejemplo: ropa con redes de pesca" required></label>
      <label class="field"><span>Sector</span><select name="sector" required><option value="">Elige uno</option>${Object.entries(PJ_SECTORS).map(([k, v]) => `<option value="${k}" ${p.sector === k ? "selected" : ""}>${v}</option>`).join("")}</select></label></div>
      <fieldset class="field"><legend>¿En qué punto está?</legend><div class="pj-opts">${Object.entries(PJ_STAGES).map(([k, v]) => `<label><input type="radio" name="stage" value="${k}" ${p.stage === k ? "checked" : ""}><span>${v}</span></label>`).join("")}</div></fieldset>
      <fieldset class="field"><legend>¿Qué te vendría bien?</legend><div class="pj-opts">${Object.entries(PJ_NEEDS).map(([k, v]) => `<label><input type="checkbox" name="needs" value="${k}" ${p.needs.includes(k) ? "checked" : ""}><span>${v}</span></label>`).join("")}</div></fieldset>
      <label class="field"><span>En dos frases</span><textarea name="desc" maxlength="280" rows="2" placeholder="Qué haces y para quién">${esc(p.desc)}</textarea></label>
      <div class="pj-foot"><button class="btn primary block">Guardar y ver encajes</button><p class="note">Solo lo ves tú. Nada se comparte sin tu permiso.</p></div></form>`);
    $("#sheet .sheet-card")?.classList.add("wide");
}
function pjSave(f) {
    const fd = new FormData(f), p = { title: String(fd.get("title") || "").trim().slice(0, 50), sector: fd.get("sector") || "", stage: fd.get("stage") || "idea", needs: fd.getAll("needs").filter(n => PJ_NEEDS[n]), desc: String(fd.get("desc") || "").trim().slice(0, 280) };
    if (!p.title) return toast("Ponle un nombre a tu proyecto");
    if (!PJ_SECTORS[p.sector]) return toast("Elige un sector");
    if (!p.needs.length) return toast("Elige al menos una cosa que te vendría bien");
    cxState().project = p; save(); closeSheet(); toast("Proyecto guardado"); rerender();
}
function pjConsent(id) {
    const p = cxState().project, m = PJ_PARTNERS.find(x => x.id === id); if (!p || !m) return;
    sheet(`Esto es lo que verá ${esc(m.n)}`, `<div class="pj-preview"><b>${esc(p.title)}</b><small>${PJ_SECTORS[p.sector]} · ${PJ_STAGES[p.stage]}</small><p>${esc(p.desc)}</p><small>Busca: ${p.needs.map(n => PJ_NEEDS[n].toLowerCase()).join(", ")}</small></div>
      <p class="note">No verá tu nombre, tu email ni tu dinero. Si le interesa, te escribirá dentro de Horizonte y tú decides si seguir.</p>
      <div class="actions">${btn("Enviar mi resumen", "pjSend", "primary", `data-id="${m.id}"`)}${btn("Ahora no", "closeSheet", "ghost")}</div>`);
}
function cxAct(act, b) {
    if (act === "vozVote") return vozVote(b.dataset.v);
    if (act === "vozReset") { cxState().votes = {}; voz.last = null; save(); return rerender(); }
    if (act === "pjEdit") return pjForm();
    if (act === "pjAsk") return pjConsent(b.dataset.id);
    if (act === "pjSend") { cxState().requests[b.dataset.id] = iso(new Date()); save(); closeSheet(); toast("Solicitud enviada. Te avisaremos si responde."); return rerender(); }
}
/* arrastrar la tarjeta de Tu voz */
let vzDrag = null;
document.addEventListener("pointerdown", e => { const c = e.target.closest("#vzCard"); if (!c || e.button) return; vzDrag = { c, x: e.clientX }; c.setPointerCapture?.(e.pointerId); });
document.addEventListener("pointermove", e => { if (!vzDrag) return; const dx = e.clientX - vzDrag.x; vzDrag.c.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`; vzDrag.c.classList.toggle("lean-r", dx > 50); vzDrag.c.classList.toggle("lean-l", dx < -50); });
document.addEventListener("pointerup", e => {
    if (!vzDrag) return; const dx = e.clientX - vzDrag.x, c = vzDrag.c; vzDrag = null;
    if (Math.abs(dx) > 100) vozVote(dx > 0 ? "a" : "c"); else { c.style.transform = ""; c.classList.remove("lean-r", "lean-l"); }
});
document.addEventListener("keydown", e => {
    if (!location.hash.startsWith("#/voz") || $("#sheet.open") || /input|textarea|select/i.test(document.activeElement?.tagName || "")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); vozVote("a"); } else if (e.key === "ArrowLeft") { e.preventDefault(); vozVote("c"); }
});
