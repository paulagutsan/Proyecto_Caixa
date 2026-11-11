"use strict";
/* Horizonte · Conecta: tu dinero, en el mundo real
   - Tu voz: desliza sobre propuestas de junta de accionistas y dile a la gestora qué prefieres (consultivo).
   - Tu calle: caza en tu calle las empresas que usas cada día y descubre cómo podrías ser dueño de un trocito.
   - Tu proyecto: cuenta tu proyecto en privado y encuentra empresas asociadas que podrían apoyarlo.
   Se carga antes que app.js: sus utilidades solo se usan dentro de funciones. */

/* ---------- Tu voz ---------- */
const VOZ = [
    { id: "bonus-clima", e: "⚡", co: "Una energética europea", t: "Que el bonus del consejero delegado dependa de reducir emisiones",
      d: "Una parte del sueldo variable del CEO solo se cobraría si la empresa recorta sus emisiones un 30 % antes de 2030.",
      why: "Ata lo que cobra quien dirige a un objetivo de largo plazo. Quien está en contra dice que puede frenar decisiones de negocio." },
    { id: "sueldo-ceo", e: "💻", co: "Una gran tecnológica de EE. UU.", t: "Subir un 40 % el sueldo del consejero delegado",
      d: "El consejo propone la subida tras un año de beneficios récord. La votación sobre sueldos de directivos es consultiva en muchas juntas.",
      why: "Pagar bien puede retener talento, pero sueldos muy altos restan beneficio que podría ir a los accionistas o a la plantilla." },
    { id: "recompra", e: "🏦", co: "Un banco español", t: "Recomprar acciones en vez de subir el dividendo",
      d: "La empresa usaría 1.000 millones en comprar sus propias acciones en lugar de repartir más dividendo.",
      why: "Recomprar reduce el número de acciones y puede subir su precio; el dividendo te da dinero en mano ahora." },
    { id: "consejo", e: "👕", co: "Una cadena de moda", t: "Que la mitad del consejo sean consejeros independientes",
      d: "Hoy la mayoría del consejo está ligada a los accionistas fundadores.",
      why: "Los independientes vigilan que se decida pensando en todos los accionistas, no solo en los grandes." },
    { id: "ia-datos", e: "📱", co: "Una red social", t: "Publicar cada año cómo usa la IA con los datos de sus usuarios",
      d: "Un grupo de accionistas pide un informe anual sobre inteligencia artificial, privacidad y riesgos.",
      why: "La transparencia reduce el riesgo de multas y escándalos. La empresa dice que ya cumple la ley." },
    { id: "brecha", e: "🛒", co: "Una cadena de supermercados", t: "Publicar la brecha salarial entre hombres y mujeres",
      d: "La propuesta pide datos por categoría profesional y un plan para cerrarla.",
      why: "Medirla es el primer paso para corregirla; el consejo argumenta que ya publica datos agregados." },
    { id: "proveedores", e: "🔋", co: "Un fabricante de móviles", t: "Auditar las condiciones laborales de sus proveedores",
      d: "Auditorías independientes en las fábricas que montan sus productos, con resultados públicos.",
      why: "Problemas en la cadena de suministro pueden acabar en boicots y caídas en bolsa." },
    { id: "id-dividendo", e: "💊", co: "Una farmacéutica", t: "Dedicar más beneficio a investigación y menos a dividendos",
      d: "El dividendo bajaría un 20 % durante tres años para financiar nuevos medicamentos.",
      why: "Menos dinero hoy a cambio de posibles productos que hagan crecer la empresa mañana." }
];
const VOZ_LABEL = { a: "A favor", c: "En contra", s: "No lo tengo claro" };

/* ---------- Tu calle ---------- */
const CALLE = [
    { id: "moda", e: "👕", n: "Moda", where: "una tienda de ropa", fact: "Cuando hay crisis es de lo primero que se recorta, así que sus beneficios suben y bajan con la economía." },
    { id: "comida", e: "🍔", n: "Comida rápida", where: "un local de comida rápida", fact: "Muchas cadenas no son dueñas de sus locales: cobran a franquiciados por usar la marca." },
    { id: "super", e: "🛒", n: "Supermercados", where: "un supermercado", fact: "Se sigue comprando comida en las crisis: por eso se consideran empresas defensivas." },
    { id: "cafe", e: "☕", n: "Cafeterías", where: "una cadena de cafeterías", fact: "Ganan más con lo que añades al café (leches especiales, siropes) que con el café en sí." },
    { id: "tele", e: "📶", n: "Telefonía", where: "una tienda de telefonía", fact: "Cobran cuotas cada mes: ingresos estables que suelen permitir repartir dividendos." },
    { id: "energia", e: "⚡", n: "Energía", where: "una gasolinera o una eléctrica", fact: "Las eléctricas suelen pagar dividendos estables; las petroleras dependen mucho del precio del crudo." },
    { id: "banco", e: "🏦", n: "Bancos", where: "una oficina bancaria", fact: "Ganan más cuando suben los tipos de interés y sufren cuando la economía va mal." },
    { id: "salud", e: "💊", n: "Salud", where: "una farmacia o una óptica", fact: "Necesitamos medicinas en cualquier ciclo económico, pero investigar un fármaco nuevo puede costar años." },
    { id: "tech", e: "🎧", n: "Tecnología", where: "una tienda de tecnología", fact: "Muchas tecnológicas reinvierten casi todo en crecer y apenas reparten dividendos." },
    { id: "deporte", e: "👟", n: "Deporte", where: "una tienda de deporte", fact: "Las grandes marcas gastan una parte enorme en publicidad y patrocinios de deportistas." },
    { id: "viajes", e: "✈️", n: "Viajes", where: "una agencia, un hotel o una aerolínea", fact: "En 2020 la pandemia hundió el sector; es de los más sensibles a sustos globales." },
    { id: "ocio", e: "🎬", n: "Ocio", where: "un cine o una tienda de videojuegos", fact: "El negocio se mueve a suscripciones: pagas cada mes en lugar de una vez." }
];

/* ---------- Tu proyecto ---------- */
const PJ_SECTORS = { sostenibilidad: "Sostenibilidad y energía", tecnologia: "Tecnología y apps", salud: "Salud y bienestar", educacion: "Educación", social: "Impacto social", moda: "Moda y consumo", comida: "Alimentación", cultura: "Cultura y ocio" };
const PJ_NEEDS = { financiacion: "Financiación", mentoria: "Mentoría", clientes: "Primeros clientes", socio: "Socio tecnológico" };
const PJ_STAGES = { idea: "Es una idea", prototipo: "Tengo un prototipo", marcha: "Ya está en marcha" };
// Empresas de ejemplo para el prototipo (ficticias)
const PJ_PARTNERS = [
    { id: "p1", n: "Vatio Lab", e: "🌱", sec: ["sostenibilidad"], needs: ["financiacion", "mentoria"], stages: ["prototipo", "marcha"], d: "Programa de aceleración de una energética para proyectos de clima y energía." },
    { id: "p2", n: "Código Abierto Ventures", e: "💻", sec: ["tecnologia", "educacion"], needs: ["financiacion", "socio"], stages: ["prototipo", "marcha"], d: "Fondo que invierte en apps y software creados por menores de 30." },
    { id: "p3", n: "Fundación Raíces", e: "🤝", sec: ["social", "educacion"], needs: ["mentoria", "financiacion"], stages: ["idea", "prototipo"], d: "Becas y mentoría para proyectos con impacto social en barrios y pueblos." },
    { id: "p4", n: "Mercado Nuevo", e: "🛍️", sec: ["moda", "comida"], needs: ["clientes"], stages: ["prototipo", "marcha"], d: "Cadena de tiendas que prueba productos de marcas jóvenes en sus estanterías." },
    { id: "p5", n: "Pulso Salud", e: "💊", sec: ["salud"], needs: ["socio", "mentoria", "clientes"], stages: ["prototipo", "marcha"], d: "Grupo sanitario que busca soluciones digitales para pacientes y hospitales." },
    { id: "p6", n: "Escena", e: "🎭", sec: ["cultura"], needs: ["financiacion", "clientes"], stages: ["idea", "prototipo", "marcha"], d: "Productora que apoya proyectos culturales, musicales y de contenido digital." },
    { id: "p7", n: "Huerta Futura", e: "🥕", sec: ["comida", "sostenibilidad"], needs: ["clientes", "mentoria"], stages: ["idea", "prototipo"], d: "Cooperativa agroalimentaria abierta a ideas de alimentación sostenible." },
    { id: "p8", n: "Aula Siguiente", e: "📚", sec: ["educacion", "tecnologia"], needs: ["clientes", "socio"], stages: ["prototipo", "marcha"], d: "Red de academias que pilota herramientas educativas en sus aulas." }
];

/* ---------- estado ---------- */
let cx = { tab: "voz", i: 0, last: null, totals: null, drag: null, newCard: null };
function cxState() {
    if (!S.conecta || typeof S.conecta !== "object") S.conecta = {};
    const c = S.conecta;
    c.votes ||= {}; c.album ||= {}; c.project ||= null; c.requests ||= {};
    return c;
}
const cxIco = (txt, cls = "") => `<i class="ico ${cls}" aria-hidden="true">${txt}</i>`;
const cxCode = n => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z ]/g, "").slice(0, 3).toUpperCase();
const pjInit = n => n.split(" ").filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join("").toUpperCase();
function voterId() { let v = lsGet("hz_voter"); if (!v) { v = uid() + uid(); lsSet("hz_voter", v); } return v; }

function pjMatches(p) {
    return PJ_PARTNERS.map(x => {
        const sec = x.sec.includes(p.sector), needs = p.needs.filter(n => x.needs.includes(n)), stage = x.stages.includes(p.stage);
        const score = Math.min(98, (sec ? 55 : 0) + needs.length * 15 + (stage ? 10 : 0) + (needs.length ? 5 : 0));
        const why = [sec && `trabaja en ${PJ_SECTORS[p.sector].toLowerCase()}`, needs.length && `ofrece ${needs.map(n => PJ_NEEDS[n].toLowerCase()).join(" y ")}`, stage && "apoya proyectos en tu fase"].filter(Boolean);
        return { ...x, score, why };
    }).filter(x => x.score >= 50).sort((a, b) => b.score - a.score).slice(0, 3);
}

/* =========================================================
   Vista
========================================================= */
function viewConecta() {
    const tabs = [["voz", "Tu voz"], ["calle", "Tu calle"], ["proyecto", "Tu proyecto"]];
    return `<section class="section"><div class="sec-head"><div><p class="kicker">Conecta</p><h2>Tu dinero, en el mundo real</h2>
        <p>Invertir no es mirar una gráfica: es ser dueño de un trocito de las empresas que usas, opinar sobre lo que hacen y que tus ideas encuentren quien las apoye.</p></div></div>
        <div class="opts cx-tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${cx.tab === k}" class="${cx.tab === k ? "on" : ""}" data-act="cxTab" data-v="${k}">${l}</button>`).join("")}</div>
        <div id="cxBody">${{ voz: vozHTML, calle: calleHTML, proyecto: pjHTML }[cx.tab]()}</div>
    </section>`;
}
function cxPaint() { const b = $("#cxBody"); if (b) b.innerHTML = { voz: vozHTML, calle: calleHTML, proyecto: pjHTML }[cx.tab](); }
function mountConecta() { if (cx.tab === "voz" && !cx.totals) loadVoz(); }

/* ---------- Tu voz ---------- */
async function loadVoz() {
    try { cx.totals = (await api("/voz")).totals; }
    catch { cx.totals = {}; cx.offline = true; }
    if (cx.tab === "voz" && route() === "conecta") cxPaint();
}
function vozResult(id, mine) {
    const t = { a: 0, c: 0, s: 0, ...(cx.totals?.[id] || {}) };
    if (cx.offline && mine) t[mine] = Math.max(t[mine], 1);
    const n = t.a + t.c + t.s || 1;
    return `<div class="vz-res">${["a", "c", "s"].map(k => `<div class="${k === mine ? "me" : ""}"><span>${VOZ_LABEL[k]}${k === mine ? " · tú" : ""}</span><i style="width:${Math.round(t[k] / n * 100)}%"></i><b>${Math.round(t[k] / n * 100)} %</b></div>`).join("")}</div>
        <p class="small muted">${cx.offline ? "Sin conexión con el servidor: solo cuenta tu voto." : `${n} ${n === 1 ? "persona ha" : "personas han"} opinado en Horizonte.`}</p>`;
}
function vozHTML() {
    const st = cxState(), pending = VOZ.filter(v => !st.votes[v.id]);
    const done = VOZ.length - pending.length;
    const card = pending[0];
    const last = cx.last && VOZ.find(v => v.id === cx.last);
    return `<div class="cx-grid">
        <div>
            <p class="cx-intro">Cuando inviertes en un fondo, es la gestora quien vota en las juntas de accionistas de las empresas. Aquí le dices <b>qué preferirías tú</b>. Es una consulta: tu opinión se suma a la de los demás y la gestora la tiene en cuenta.</p>
            ${card ? `<div class="vz-stack">
                ${pending[1] ? `<div class="vz-card ghost" aria-hidden="true"></div>` : ""}
                <article class="vz-card" id="vzCard" data-id="${card.id}" tabindex="0" aria-label="Propuesta: ${esc(card.t)}">
                    <span class="vz-stamp a">A favor</span><span class="vz-stamp c">En contra</span>
                    <p class="vz-co">${card.co} · Junta de accionistas</p>
                    <h3>${card.t}</h3>
                    <p>${card.d}</p>
                    <p class="vz-why"><b>Por qué te importa:</b> ${card.why}</p>
                    <p class="vz-n">${done + 1} de ${VOZ.length}</p>
                </article>
            </div>
            <div class="vz-btns">
                <button class="btn quiet vz-c" data-act="vozVote" data-v="c">← En contra</button>
                <button class="btn quiet" data-act="vozVote" data-v="s">No lo tengo claro</button>
                <button class="btn quiet vz-a" data-act="vozVote" data-v="a">A favor →</button>
            </div>
            <p class="small muted cx-hint">Arrastra la tarjeta o usa las flechas del teclado. Propuestas de ejemplo; el voto es consultivo.</p>`
            : `<div class="panel cx-done"><h3>Has opinado sobre todas las propuestas</h3><p class="muted">Vuelve más adelante: en temporada de juntas llegarán nuevas.</p>
                <button class="btn quiet" data-act="vozReset">Volver a opinar</button></div>`}
        </div>
        ${last ? `<aside class="panel vz-side"><p class="kicker">Resultado</p><h3>${last.t}</h3>${vozResult(last.id, st.votes[last.id])}</aside>` : ""}
    </div>`;
}
async function vozVote(v) {
    const card = $("#vzCard");
    if (!card || card.dataset.busy) return;
    card.dataset.busy = "1";
    const id = card.dataset.id, st = cxState();
    card.classList.add(v === "a" ? "out-r" : v === "c" ? "out-l" : "out-d");
    st.votes[id] = v; save();
    cx.last = id;
    try { cx.totals = (await api(`/voz/${id}`, { method: "POST", body: { v, voter: voterId() } })).totals; cx.offline = false; }
    catch { cx.offline = true; }
    setTimeout(cxPaint, 260);
}

/* ---------- Tu calle ---------- */
function calleHTML() {
    const st = cxState(), got = Object.keys(st.album).length;
    return `<div class="cx-grid">
        <div>
            <p class="cx-intro">Las empresas en las que invierte un fondo están en tu calle: la tienda donde compras ropa, el súper, tu compañía de móvil. Cuando pases por una, <b>cázala</b> y descubre cómo gana dinero y cómo podrías ser dueño de un trocito.</p>
            <button class="btn cx-cta" data-act="calleCapture">Cazar una empresa</button>
            <p class="small muted" style="margin-top:10px">Las fotos se quedan en tu móvil y no guardamos tu ubicación.</p>
            <div class="row between" style="margin:30px 0 12px"><b>Tu álbum</b><span class="small muted">${got} de ${CALLE.length} sectores</span></div>
            <div class="bar" style="margin-bottom:16px"><i style="width:${got / CALLE.length * 100}%"></i></div>
            <div class="cl-album">${CALLE.map(c => { const a = st.album[c.id];
                return a ? `<button class="cl-card got" data-act="calleOpen" data-id="${c.id}">${a.photo ? `<img src="${a.photo}" alt="">` : `<span class="cl-e">${cxCode(c.n)}</span>`}<b>${c.n}</b><small>${esc(a.brand || "Cazada")}</small></button>`
                    : `<div class="cl-card"><span class="cl-e">?</span><b>${c.n}</b><small>Por descubrir</small></div>`; }).join("")}</div>
        </div>

    </div>`;
}
function calleSheet(pre) {
    cx.newCard = { sector: pre || null, photo: null };
    openSheet(`<p class="kicker">Cazar una empresa</p><h2>¿Qué has encontrado?</h2>
        <form data-form="calle" style="margin-top:18px" novalidate>
            <label class="cl-photo" id="clPhotoLbl"><input type="file" accept="image/*" capture="environment" id="clPhoto" hidden><b>Hacer una foto</b><small>Opcional</small></label>
            <div class="field"><label>Sector</label><div class="cl-pick">${CALLE.map(c => `<button type="button" class="${pre === c.id ? "on" : ""}" data-act="callePick" data-id="${c.id}">${c.n}</button>`).join("")}</div></div>
            <div class="field"><label for="clBrand">¿Qué tienda era? (opcional)</label><input id="clBrand" name="brand" maxlength="30" placeholder="El nombre del sitio"></div>
            <p class="err" hidden></p>
            <button class="btn full">Añadir a mi álbum</button>
        </form>`);
}
function calleReveal(c, a) {
    openSheet(`<div class="cl-reveal">${a.photo ? `<img src="${a.photo}" alt="">` : `<span class="cl-e big">${cxCode(c.n)}</span>`}
        <p class="kicker">${a.isNew ? "¡Nueva carta!" : "Tu carta"}</p><h2>${c.n}${a.brand ? ` · ${esc(a.brand)}` : ""}</h2></div>
        <p style="margin:14px 0">${c.fact}</p>
        <div class="note">¿Puedes ser dueño de un trocito? <b>Sí.</b> No hace falta comprar acciones sueltas: un fondo indexado de bolsa mundial o europea suele incluir empresas de ${c.n.toLowerCase()} junto a cientos de otras, desde pocos euros.</div>
        <div class="row" style="margin-top:20px"><button class="btn" data-act="closeSheet">Seguir cazando</button><a class="btn ghost" href="#/aprende">Qué es un fondo</a></div>`);
}
function shrinkPhoto(file) {
    return new Promise(res => {
        const img = new Image(), url = URL.createObjectURL(file);
        img.onload = () => {
            const k = 240 / Math.max(img.width, img.height), cv = document.createElement("canvas");
            cv.width = Math.round(img.width * Math.min(1, k)); cv.height = Math.round(img.height * Math.min(1, k));
            cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
            URL.revokeObjectURL(url); res(cv.toDataURL("image/jpeg", .7));
        };
        img.onerror = () => res(null);
        img.src = url;
    });
}
document.addEventListener("change", async e => {
    if (e.target.id !== "clPhoto" || !e.target.files?.[0] || !cx.newCard) return;
    cx.newCard.photo = await shrinkPhoto(e.target.files[0]);
    const l = $("#clPhotoLbl");
    if (l && cx.newCard.photo) l.innerHTML = `<img src="${cx.newCard.photo}" alt=""><b>Foto lista</b><small>Toca para cambiarla</small><input type="file" accept="image/*" capture="environment" id="clPhoto" hidden>`;
});

/* ---------- Tu proyecto ---------- */
function pjHTML() {
    const st = cxState(), p = st.project;
    if (!p) return `<div class="cx-grid">
        <div class="panel pj-empty">
            <p class="kicker">Tu proyecto</p><h3>¿Tienes un proyecto entre manos?</h3>
            <p class="muted">Una app, una marca de ropa, un huerto urbano, un podcast… Cuéntalo en dos minutos y te enseñamos qué empresas asociadas podrían apoyarlo con financiación, mentoría o primeros clientes.</p>
            <button class="btn" data-act="pjEdit">Contar mi proyecto ${ARROW}</button>
        </div>
        <aside class="panel"><p class="kicker">Privado por defecto</p><ul class="cx-list">
            <li>Tu proyecto solo lo ves tú.</li><li>Ninguna empresa sabe nada hasta que tú decidas contactarla.</li><li>Incluso entonces, solo ve el resumen del proyecto: nunca tu nombre, tu email ni tu dinero.</li></ul></aside>
    </div>`;
    const ms = pjMatches(p);
    return `<div class="cx-grid">
        <div>
            <article class="panel pj-card"><div class="row between" style="align-items:flex-start"><div><p class="kicker">${PJ_SECTORS[p.sector]} · ${PJ_STAGES[p.stage]}</p><h3>${esc(p.title)}</h3></div><button class="link" data-act="pjEdit">Editar</button></div>
                <p class="muted" style="margin:8px 0 12px">${esc(p.desc)}</p>
                <div class="chips">${p.needs.map(n => `<li class="on">${PJ_NEEDS[n]}</li>`).join("")}</div>
                <p class="small muted" style="margin-top:12px">Privado · solo lo ves tú</p></article>
            <div class="row between" style="margin:26px 0 12px"><b>Posibles encajes</b><span class="small muted">${ms.length} empresa${ms.length === 1 ? "" : "s"}</span></div>
            ${ms.length ? ms.map(m => { const r = st.requests[m.id];
                return `<article class="panel pj-match"><span class="pj-e">${pjInit(m.n)}</span><div><div class="row between"><h3>${m.n}</h3><span class="pj-score">${m.score} % de encaje</span></div>
                    <p class="muted small">${m.d}</p><p class="small" style="margin-top:6px">Encaja porque ${m.why.join(", ")}.</p></div>
                    <div class="pj-act">${r ? `<span class="tag ok">Solicitud enviada</span>` : `<button class="btn sm" data-act="pjAsk" data-id="${m.id}">Me interesa</button>`}</div></article>`; }).join("")
            : `<div class="panel"><p class="muted">Aún no hay empresas asociadas que encajen. Prueba a añadir otra necesidad o vuelve pronto: se suman nuevas cada mes.</p></div>`}
        </div>
        <aside class="panel"><p class="kicker">Qué pasa si dices «me interesa»</p><ul class="cx-list">
            <li>Te enseñamos exactamente qué va a ver la empresa antes de enviarlo.</li><li>Si le encaja, te responde aquí, dentro de Horizonte.</li><li>Puedes retirar tu solicitud cuando quieras.</li></ul>
            <p class="disclaim">Empresas de ejemplo para el prototipo. Una conexión no es una oferta de inversión ni de financiación.</p></aside>
    </div>`;
}
function pjForm() {
    const p = cxState().project || { title: "", sector: "", stage: "idea", needs: [], desc: "" };
    openSheet(`<p class="kicker">Tu proyecto · privado</p><h2>Cuéntanos tu proyecto</h2>
        <form data-form="pj" style="margin-top:18px" novalidate>
            <div class="field"><label for="pjT">Nombre</label><input id="pjT" name="title" maxlength="50" value="${esc(p.title)}" placeholder="Ej.: Ropa hecha con redes de pesca"></div>
            <div class="field"><label for="pjS">Sector</label><select id="pjS" name="sector"><option value="">Elige uno</option>${Object.entries(PJ_SECTORS).map(([k, v]) => `<option value="${k}" ${p.sector === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
            <div class="field"><label>¿En qué punto está?</label><div class="opts">${Object.entries(PJ_STAGES).map(([k, v]) => `<label class="pj-radio"><input type="radio" name="stage" value="${k}" ${p.stage === k ? "checked" : ""}><span>${v}</span></label>`).join("")}</div></div>
            <div class="field"><label>¿Qué te vendría bien?</label><div class="pj-needs">${Object.entries(PJ_NEEDS).map(([k, v]) => `<label><input type="checkbox" name="needs" value="${k}" ${p.needs.includes(k) ? "checked" : ""}><span>${v}</span></label>`).join("")}</div></div>
            <div class="field"><label for="pjD">En dos frases</label><textarea id="pjD" name="desc" maxlength="280" rows="3" placeholder="Qué haces y para quién">${esc(p.desc)}</textarea></div>
            <p class="err" hidden></p>
            <button class="btn full">Guardar y ver encajes</button>
            <p class="small muted" style="margin-top:10px">Solo lo ves tú. Nada se comparte sin tu permiso.</p>
        </form>`);
}
function pjConsent(m) {
    const p = cxState().project;
    openSheet(`<p class="kicker">Antes de enviar</p><h2>Esto es lo que verá ${esc(m.n)}</h2>
        <div class="pj-preview"><b>${esc(p.title)}</b><p class="small muted">${PJ_SECTORS[p.sector]} · ${PJ_STAGES[p.stage]}</p><p style="margin:8px 0">${esc(p.desc)}</p><p class="small">Busca: ${p.needs.map(n => PJ_NEEDS[n].toLowerCase()).join(", ")}</p></div>
        <p class="small muted" style="margin:14px 0">No verá tu nombre, tu email, tus objetivos ni tu dinero. Si le interesa, te escribirá dentro de Horizonte y tú decides si seguir.</p>
        <div class="row"><button class="btn" data-act="pjSend" data-id="${m.id}">Enviar mi resumen</button><button class="btn quiet" data-act="closeSheet">Ahora no</button></div>`);
}

/* =========================================================
   Acciones y formularios (app.js los integra)
========================================================= */
const CX_ACTIONS = {
    cxTab: el => { cx.tab = el.dataset.v; $$(".cx-tabs button").forEach(b => { const on = b.dataset.v === cx.tab; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); }); cxPaint(); if (cx.tab === "voz" && !cx.totals) loadVoz(); },
    vozVote: el => vozVote(el.dataset.v),
    vozReset: () => { cxState().votes = {}; cx.last = null; save(); cxPaint(); },
    calleCapture: () => calleSheet(),
    callePick: el => { if (cx.newCard) cx.newCard.sector = el.dataset.id; $$(".cl-pick button").forEach(b => b.classList.toggle("on", b === el)); },
    calleOpen: el => { const c = CALLE.find(x => x.id === el.dataset.id); calleReveal(c, cxState().album[c.id]); },
    pjEdit: () => pjForm(),
    pjAsk: el => pjConsent(PJ_PARTNERS.find(x => x.id === el.dataset.id)),
    pjSend: el => { cxState().requests[el.dataset.id] = { t: Date.now() }; save(); closeSheet(); cxPaint(); toast("Resumen enviado. Si le encaja, te responderá aquí."); }
};
const CX_FORMS = {
    calle: form => {
        const n = cx.newCard;
        if (!n?.sector) return formErr(form, "Elige el sector de lo que has encontrado.");
        const st = cxState(), c = CALLE.find(x => x.id === n.sector), isNew = !st.album[c.id];
        st.album[c.id] = { t: Date.now(), brand: String(new FormData(form).get("brand") || "").trim().slice(0, 30), photo: n.photo || st.album[c.id]?.photo || null };
        save(); cx.newCard = null; cxPaint();
        calleReveal(c, { ...st.album[c.id], isNew });
    },
    pj: form => {
        const f = new FormData(form), title = String(f.get("title") || "").trim(), sector = f.get("sector"), desc = String(f.get("desc") || "").trim();
        if (!title) return formErr(form, "Ponle un nombre a tu proyecto.");
        if (!PJ_SECTORS[sector]) return formErr(form, "Elige un sector.");
        const needs = f.getAll("needs").filter(n => PJ_NEEDS[n]);
        if (!needs.length) return formErr(form, "Marca al menos una cosa que te vendría bien.");
        cxState().project = { title, sector, stage: PJ_STAGES[f.get("stage")] ? f.get("stage") : "idea", needs, desc: desc || "Sin descripción todavía." };
        save(); closeSheet(); cxPaint();
    }
};

/* Tu voz: arrastrar la tarjeta o usar el teclado */
document.addEventListener("pointerdown", e => {
    const c = e.target.closest("#vzCard");
    if (!c || e.target.closest("button")) return;
    cx.drag = { x: e.clientX, c, id: e.pointerId };
    c.setPointerCapture?.(e.pointerId); c.classList.add("drag");
});
document.addEventListener("pointermove", e => {
    if (!cx.drag) return;
    const dx = e.clientX - cx.drag.x, c = cx.drag.c;
    c.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    c.style.setProperty("--a", Math.max(0, Math.min(1, dx / 110)));
    c.style.setProperty("--c", Math.max(0, Math.min(1, -dx / 110)));
});
["pointerup", "pointercancel"].forEach(ev => document.addEventListener(ev, e => {
    if (!cx.drag) return;
    const dx = e.clientX - cx.drag.x, c = cx.drag.c;
    cx.drag = null; c.classList.remove("drag");
    if (Math.abs(dx) > 100) { c.style.transform = ""; vozVote(dx > 0 ? "a" : "c"); }
    else { c.style.transform = ""; c.style.setProperty("--a", 0); c.style.setProperty("--c", 0); }
}));
document.addEventListener("keydown", e => {
    if (route() !== "conecta" || cx.tab !== "voz" || $(".sheet") || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === "ArrowRight") { e.preventDefault(); vozVote("a"); }
    if (e.key === "ArrowLeft") { e.preventDefault(); vozVote("c"); }
});
