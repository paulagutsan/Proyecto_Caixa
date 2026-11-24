"use strict";
/* Horizonte · Asistente flotante (Gemini)
   Botón abajo a la derecha en toda el área del joven; abre un panel con la conversación. Vive fuera de #app,
   así que no se cierra ni pierde lo escrito al cambiar de pantalla. En la prueba final no aparece.
   Se carga antes que app.js: sus utilidades solo se usan dentro de funciones. */
let gemOpen = false, gemHad = "";
function gemRender() {
    const el = $("#gem"), route = location.hash.replace(/^#\/?/, "").split(/[/?]/)[0];
    const show = S.role === "teen" && document.body.dataset.view !== "public" && route !== "prueba";
    if (!show) { el.innerHTML = ""; gemHad = ""; document.body.classList.remove("gem-open"); if (S.role !== "teen") gemOpen = false; return; }
    const can = geminiAllowed(), key = `${gemOpen}|${can}`;
    if (gemHad !== key) {                                  // solo se rehace al abrir, cerrar o cambiar el permiso
        gemHad = key;
        el.innerHTML = gemOpen ? `<section class="gem-panel" role="dialog" aria-label="Asistente Horizonte">
            <header><span class="am-av" aria-hidden="true">${ic("spark")}</span><div><b>Asistente Horizonte</b><small>${can ? "Pregunta lo que quieras sobre tu dinero. Responde con tus datos." : "Pregunta lo que quieras sobre invertir. Respuestas generales."}</small></div><button class="icon-btn" data-act="gemToggle" aria-label="Cerrar el asistente">${ic("close")}</button></header>
            <div class="chat" id="chat" aria-live="polite"></div>
            <div class="sugg">${G_TOPICS.map(t => `<button class="chip" data-act="ask" data-q="${esc(t.q)}">${t.label}</button>`).join("")}</div>
            <form class="ask" data-form="ask"><input name="q" placeholder="Escribe tu consulta" aria-label="Tu consulta" autocomplete="off" required><button class="icon-btn primary" aria-label="Enviar">${ic("send")}</button></form>
            <p class="note">${can ? "" : `Estas respuestas no usan ningún dato de tu cuenta. <button class="gem-perm" data-act="askPerm" data-p="gemini">Pedir permiso</button> · `}Información orientativa, no es asesoramiento financiero.</p>
        </section>` : `<button class="gem-fab" data-act="gemToggle" aria-label="Abrir el asistente Horizonte">${ic("spark")}<span>Pregunta a Gemini</span></button>`;
    }
    document.body.classList.toggle("gem-open", gemOpen);
    const chat = $("#chat"); if (chat) { chat.innerHTML = chatHTML(); chat.scrollTop = chat.scrollHeight; }
}
function gemToggle(open = !gemOpen) {
    gemOpen = open; gemRender();
    if (open) { if (matchMedia("(min-width: 861px)").matches) $("#gem .ask input")?.focus(); }
    else $("#gem .gem-fab")?.focus();
}
document.addEventListener("click", e => {
    if (e.target.closest('[data-act="gemToggle"]')) gemToggle();
    else if (e.target.closest("#gem .chat a") && matchMedia("(max-width: 860px)").matches) gemToggle(false);   // en el móvil, al ir a una pantalla se cierra
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && gemOpen && !document.querySelector("#sheet.open")) gemToggle(false); });
