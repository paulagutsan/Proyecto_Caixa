"use strict";
/* Horizonte · asistente
   Responde con los datos de la cuenta (aportaciones, reparto, protección, millas y objetivo de casa).
   Si en config.js se define HZ2_CONFIG.geminiEndpoint (un servicio propio que llame a Gemini en Google Cloud),
   se usa ese servicio; si no responde, se usan estas respuestas calculadas en el navegador.
   Estilo de las respuestas, tomado de los asistentes de los grandes bancos: breves, con título, con las
   cifras clave aparte, con el siguiente paso a un clic, sin adornos y con aviso de que es información orientativa. */

const G_EUR = v => {
    const r = Math.round(v * 100) / 100;
    return r.toLocaleString("es-ES", { useGrouping: "always", minimumFractionDigits: r % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " €";
};
const G_NUM = v => Math.round(v).toLocaleString("es-ES", { useGrouping: "always" });

function gFuture(monthly, years, start = 0, rate = 0.05) {
    const r = rate / 12;
    let v = start;
    for (let i = 0; i < years * 12; i++) v = v * (1 + r) + monthly;
    return v;
}
const gHello = (h = new Date().getHours()) => h < 6 ? "Buenas noches" : h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";

/* Temas que el asistente sabe resolver. Sirven también como sugerencias. */
const G_TOPICS = [
    { id: "house", q: "¿Cómo va mi objetivo de casa?", label: "Mi objetivo de casa" },
    { id: "drop", q: "¿Qué pasa si el mercado cae?", label: "Si el mercado cae" },
    { id: "antidote", q: "¿Cómo funciona mi Antídoto?", label: "Mi Antídoto" },
    { id: "miles", q: "¿Cuántas millas de casa tengo?", label: "Mis millas de casa" },
    { id: "save", q: "¿Cuánto debería apartar cada semana?", label: "Cuánto apartar" },
    { id: "human", q: "Quiero hablar con una persona", label: "Hablar con una persona" },
];

function gIntent(raw) {
    const q = raw.toLowerCase().trim();
    if (/^(hola|buenas|buenos d[ií]as|buenas tardes|buenas noches|hey|ey|qu[eé] tal|buen d[ií]a)\b/.test(q) && q.split(/\s+/).length <= 4) return "hello";
    if (/^(gracias|muchas gracias|vale|ok|genial|perfecto|entendido)\b/.test(q) && q.split(/\s+/).length <= 4) return "thanks";
    if (/^(adi[oó]s|hasta luego|chao|nos vemos)\b/.test(q)) return "bye";
    if (/persona|gestor|asesor|humano|llamar|tel[eé]fono|oficina|atenci[oó]n al cliente|hablar con/.test(q)) return "human";
    if (/cuesta|coste|costes|comisi[oó]n|comisiones|precio|cobr|gratis|tarifa|cuota de/.test(q)) return "cost";
    if (/retir|sacar|vender|vendo|reembols|recuperar mi dinero|disponer/.test(q)) return "withdraw";
    if (/casa|piso|entrada|hipoteca|vivienda|independiz/.test(q) && !/milla/.test(q)) return "house";
    if (/milla/.test(q)) return "miles";
    if (/cae|ca[ií]da|baja\b|bajar|perder|p[eé]rdida|proteg|crisis|bolsa|mercado/.test(q)) return "drop";
    if (/ant[ií]doto|miedo|preocup|reparto|fondo/.test(q)) return "antidote";
    if (/paga|ahorrar|ahorro|aportar|aportaci|apartar|cu[aá]nto deber[ií]a/.test(q)) return "save";
    if (/certificad|fundamentos|diploma|linkedin|prueba|revisi[oó]n|racha|juego|aprender|curso/.test(q)) return "cert";
    if (/famili|padre|madre|tutor|regalo|permiso|aprob/.test(q)) return "family";
    return "unknown";
}

/* Siguiente paso recomendado según el estado de la cuenta */
function gNext(c) {
    if (!c.diploma) return { label: `Completar Fundamentos (${c.lessonsDone}/${c.lessonsTotal})`, href: "#/aprende", why: `Al superar la prueba final, CaixaBank invierte ${G_EUR(c.prize)} a tu nombre.` };
    if (!c.hasOwn) return { label: "Poner tu primer euro", href: "#/dinero", why: `Con 1 € basta, y tus primeros ${G_EUR(c.protectCap)} aportados tienen protección promocional durante 12 meses.` };
    if (!c.fears.length) return { label: "Elegir tu Antídoto", href: "#/antidoto", why: "Si quieres, una parte pequeña de tu cartera en un tema que te importa, tras un test breve." };
    if (!(c.weekly > 0 || c.roundup)) return { label: "Automatizar tu ahorro", href: "#/dinero", why: "Una cantidad semanal fija suma millas cada mes." };
    return { label: "Hacer la revisión anual", href: "#/antidoto", why: `Tu próxima revisión es antes del ${c.itvDue}.` };
}

const gAsk = t => ({ label: t.label, q: t.q });

function localGemini(question, c) {
    const intent = gIntent(question), years = Math.max(1, c.goalAge - c.age), next = gNext(c);
    const gen = c.generic ? " Es una respuesta general: con el permiso de tu familia te respondo con tus propios datos." : "";
    const R = (title, text, facts = [], actions = [], used = []) => ({ kind: intent, title, text: text + gen, facts: c.generic ? [] : facts, actions, used });
    const topic = id => gAsk(G_TOPICS.find(t => t.id === id));
    const others = skip => G_TOPICS.filter(t => t.id !== skip && t.id !== "human").slice(0, 2).map(gAsk);

    switch (intent) {
        case "hello": {
            return R(`${gHello()}${c.name ? `, ${c.name}` : ""}`,
                `Pregúntame lo que quieras sobre tu dinero, tu Antídoto o tu casa. Te respondo con los datos de tu cuenta. ${next.why}`,
                [["Tu dinero", c.value > 0 ? G_EUR(c.value) : "0 €"], ["Millas de casa", G_NUM(c.miles)]],
                [{ label: next.label, href: next.href, primary: true }], ["tu cuenta"]);
        }
        case "thanks":
            return R("A tu disposición", "Si necesitas algo más sobre tu cuenta, tu Antídoto o tus millas de casa, aquí estoy.", [], [topic("house"), topic("miles")]);
        case "bye":
            return R("Hasta pronto", "Tu cuenta queda al día. Vuelve cuando quieras revisar tu progreso.", [], []);
        case "house": {
            const proj = gFuture(c.monthly, years, c.value), gap = Math.max(0, c.down - proj), extra = gap > 0 ? Math.ceil(gap / gFuture(1, years)) : 0;
            const started = c.value > 0 || c.monthly > 0;
            const text = started
                ? `Con tu ritmo actual y una rentabilidad estimada del 5 % anual, a los ${c.goalAge} años habrías reunido unos ${G_EUR(proj)} frente a una entrada de ${G_EUR(c.down)}. ` +
                  (gap > 0 ? `Para llegar, faltarían unos ${G_EUR(gap)}: sumar ${G_EUR(extra)} al mes desde hoy.` : "Con ello cubrirías la entrada.")
                : `Todavía no hay aportaciones, así que la proyección parte de cero. Para reunir ${G_EUR(c.down)} a los ${c.goalAge} años harían falta unos ${G_EUR(Math.ceil(c.down / gFuture(1, years)))} al mes, con una rentabilidad estimada del 5 % anual.`;
            return R("Tu objetivo de casa", `${text} Existe un aval del ICO para jóvenes que puede reducir la entrada; sus condiciones pueden cambiar.`,
                [["Vivienda objetivo", G_EUR(c.goalPrice)], ["Entrada (20 %)", G_EUR(c.down)], ["Tu ritmo actual", `${G_EUR(c.monthly)} al mes`], [`Proyección a los ${c.goalAge}`, G_EUR(proj)]],
                [{ label: "Ver mi casa", href: "#/casa", primary: true }, { label: "Cambiar mi aportación", href: "#/dinero" }], ["tu objetivo de casa", "tus aportaciones"]);
        }
        case "drop": {
            const base = c.protectBase;
            const prot = base > 0
                ? `Tus ${G_EUR(base)} aportados tienen una protección promocional hasta el ${c.protectEnd}: si a los 12 meses valen menos y no has vendido, CaixaBank repone la diferencia.`
                : `Los primeros ${G_EUR(c.protectCap)} que se aporten (tuyos o de tu familia) tienen protección promocional durante 12 meses, siempre que no vendas antes.`;
            return R("Si el mercado cae", `${prot} Una caída solo se convierte en pérdida si vendes, pero la decisión es tuya y de tu familia. En el MSCI World, ninguna ventana de 15 años entre 1970 y 2023 acabó en negativo, aunque el pasado no garantiza el futuro.`,
                [["Con protección", `${G_EUR(base)} de ${G_EUR(c.protectCap)}`], ["Protección hasta", c.protectEnd || "Desde tu primer euro"], ["Margen disponible", G_EUR(c.protectRoom)]],
                [{ label: "Ver mi primer año", href: "#/dinero", primary: true }, others("drop")[0]], ["tu dinero propio", "tu año de protección"]);
        }
        case "antidote": {
            if (!c.fears.length) {
                return R("Tu Antídoto", "Todavía no has elegido qué te preocupa de tu futuro. Antes hay un test de seis preguntas; si encaja, puedes marcar hasta dos temas y como máximo el 10 % de tu cartera irá a ellos. Es una apuesta temática, no un seguro.",
                    [["Reparto", `${Math.round(RULES.base * 100)} % fondo global · ${Math.round(RULES.antidote * 100)} % Antídoto`]],
                    [{ label: "Elegir mi Antídoto", href: "#/antidoto", primary: true }], ["tu reparto"]);
            }
            return R("Tu Antídoto",
                `${c.fears.map(f => `${f.fundName} por «${f.label.toLowerCase()}» (${G_EUR(f.amount)})`).join(" y ")}. ${c.fears[0].why} ` +
                `${c.antidoteActive ? "" : "Tu familia aún tiene que aprobarlo. "}No es un seguro ni una cobertura: esa parte puede ganar o perder.`,
                [["Fondo global", G_EUR(c.baseAmount)], ["Antídoto", G_EUR(c.antidoteAmount)], ["Estado", c.antidoteActive ? "Activo" : "Pendiente de aprobación"]],
                [{ label: "Ver mi reparto", href: "#/dinero", primary: true }, topic("drop")], ["tus preocupaciones", "tu reparto"]);
        }
        case "miles": {
            if (c.miles === 0) {
                return R("Millas de casa", `Aún no tienes millas. Cada tema de Fundamentos suma ${MILES.lesson}, superar la prueba final ${MILES.theory} y tu primer euro propio ${MILES.firstOwn}. Si pides tu primera hipoteca con CaixaBank, pueden convertirse en una bonificación de hasta ${pts(MILES.maxCut)} puntos, según las condiciones de ese momento.`,
                    [["Rebaja máxima", `${pts(MILES.maxCut)} puntos`], ["Por tema", `${MILES.lesson} millas`], ["Prueba final", `${MILES.theory} millas`]],
                    [{ label: "Empezar Fundamentos", href: "#/aprende", primary: true }], ["tus millas"]);
            }
            return R("Millas de casa", `A tu ritmo sumas unas ${G_NUM(c.milesYear)} millas al año. A los ${c.goalAge} tendrías unas ${G_NUM(c.milesAtGoal)}: ${c.cutAtGoalTxt} puntos de bonificación posible en el diferencial, unos ${G_EUR(c.savingAtGoal)} menos de intereses en una hipoteca de ejemplo. Es una ilustración, no una oferta.`,
                [["Millas hoy", G_NUM(c.miles)], ["Rebaja hoy", `${c.cutTxt} puntos`], [`Millas a los ${c.goalAge}`, G_NUM(c.milesAtGoal)]],
                [{ label: "Ver mis millas", href: "#/casa", primary: true }, topic("house")], ["tus millas", "tu ritmo de aportación"]);
        }
        case "save": {
            const sug = c.weekly || 5, v = gFuture(sug * 52 / 12, years);
            return R("Cuánto apartar", `${c.weekly ? `Ahora apartas ${G_EUR(c.weekly)} a la semana.` : "Un buen punto de partida es una cantidad pequeña que no notes, por ejemplo 5 € a la semana."} Mantenido hasta los ${c.goalAge}, ${G_EUR(sug)} semanales podrían convertirse en unos ${G_EUR(v)} con una rentabilidad estimada del 5 % anual. Aportar poco cada semana pesa más que aportar mucho una sola vez.`,
                [["Cada semana", G_EUR(sug)], ["Al mes", G_EUR(sug * 52 / 12)], [`A los ${c.goalAge}`, G_EUR(v)]],
                [{ label: c.weekly ? "Ver mi ahorro" : "Automatizar mi ahorro", href: "#/dinero", primary: true }], ["tus aportaciones"]);
        }
        case "cert": {
            return c.diploma
                ? R("Certificado Horizonte", `Tienes tu certificado desde el ${c.diploma}. Tu próxima revisión anual es antes del ${c.itvDue}. ${c.age >= 16 ? "Puedes añadirlo a LinkedIn desde Aprende." : "Podrás añadirlo a LinkedIn a partir de los 16."}`,
                    [["Racha actual", `${c.streak} semanas`], ["Próxima revisión", c.itvDue], ["Cada 4 semanas", `+${MILES.streak4} millas`]],
                    [{ label: "Ir a Aprende", href: "#/aprende", primary: true }], ["tu certificado", "tu racha"])
                : R("Fundamentos", `Llevas ${c.lessonsDone} de ${c.lessonsTotal} temas. Al superar la prueba final, CaixaBank invierte ${G_EUR(c.prize)} a tu nombre y recibes el Certificado Horizonte.`,
                    [["Temas", `${c.lessonsDone} de ${c.lessonsTotal}`], ["Premio", `${G_EUR(c.prize)} invertidos`], ["Prueba final", `+${MILES.theory} millas`]],
                    [{ label: "Continuar Fundamentos", href: "#/aprende", primary: true }], ["tu certificado", "tu racha"]);
        }
        case "cost": {
            const yearly = c.value * COST.fee / 100;
            return R("Lo que cuesta", `Horizonte no cobra cuotas ni comisión de apertura, pero invertir tiene un coste: la comisión de gestión de los fondos de CaixaBank Asset Management; como referencia, ${feeTxt} % al año. El documento de datos fundamentales de cada fondo detalla su coste exacto.`,
                [["Cuotas y apertura", "0 €"], ["Comisión de referencia", `${feeTxt} % al año`], ["Con tu dinero de hoy", c.value > 0 ? `≈ ${G_EUR(yearly)} al año` : "Aún nada"]],
                [{ label: "Ver costes en euros", href: "#/dinero", primary: true }], ["tu dinero invertido"]);
        }
        case "withdraw":
            return R("Retirar tu dinero", `Puedes pedir una retirada desde Dinero. Si eres mayor de edad, se hace directamente; si eres menor, la aprueba tu familia. Si retiras antes de 12 meses, pierdes la protección promocional del primer año. En esta versión de demostración no se mueve dinero real.`,
                [["Protección", "Solo si no retiras antes de 12 meses"], ["Hasta los 18", "Aprueba tu familia"]],
                [{ label: "Ir a Dinero", href: "#/dinero", primary: true }, topic("drop")], ["tu año de protección"]);
        case "human":
            return R("Hablar con una persona", `Tu familia puede pedir desde Familia que un gestor de CaixaBank le llame para resolver dudas, sin compromiso. En esta demostración la solicitud se simula.`,
                [["Quién la pide", "Tu madre, padre o tutor"]], [{ label: "Ir a Familia", href: "#/familia", primary: true }], []);
        case "family":
            return R("Tu familia", `Tu familia puede regalarte dinero, puntual o cada mes, con un mensaje, aprobar tu Antídoto y ver tu progreso. Los regalos suman millas de casa: ${MILES.giftPer5} por cada 5 €, con un tope de ${MILES.giftMonthCap} al mes.`,
                [["Regalos recibidos", G_EUR(c.gifts || 0)], ["Millas por regalos", `${MILES.giftPer5} por cada 5 €`], ["Tope mensual", `${MILES.giftMonthCap} millas`]],
                [{ label: "Ir a Familia", href: "#/familia", primary: true }], ["tu familia"]);
        default:
            return R("¿Sobre qué quieres información?", "No he podido relacionar tu consulta con los datos de tu cuenta. Estos son los temas en los que puedo ayudarte.",
                [], G_TOPICS.filter(t => t.id !== "human").slice(0, 5).map(gAsk), []);
    }
}

/* Si hay intermediario (Supabase Edge Function con la clave guardada como secreto), responde Gemini;
   si no responde a tiempo o se agota la cuota, se usa la respuesta local. Nunca se envía el nombre. */
async function askGemini(question, ctx, history = []) {
    const cfg = window.HZ2_CONFIG || {}, ep = cfg.geminiEndpoint, local = localGemini(question, ctx);
    if (ep && !ctx.generic) {                       // sin permiso de la familia no sale ningún dato de la cuenta
        const { name, ...anon } = ctx;
        const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 20000);
        try {
            const headers = { "Content-Type": "application/json" };
            if (cfg.supabaseAnonKey && ep.includes(".supabase.co")) headers.apikey = cfg.supabaseAnonKey;
            const r = await fetch(ep, { method: "POST", headers, signal: ctl.signal,
                body: JSON.stringify({ question, context: anon, history: history.slice(-6).map(m => ({ r: m.r, t: m.r === "u" ? m.t : `${m.title ? m.title + ". " : ""}${m.text || ""}` })) }) });
            if (r.ok) {
                const d = await r.json();
                if (d.answer) return { kind: "remote", title: d.title || "", text: d.answer, facts: d.facts?.length ? d.facts : local.facts || [], actions: local.actions || [], used: ["Gemini", ...(local.used || [])] };
            }
        } catch (e) { /* sin conexión o tiempo agotado: respuesta local */ }
        finally { clearTimeout(timer); }
    }
    return local;
}
