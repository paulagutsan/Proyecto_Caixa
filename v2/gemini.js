"use strict";
/* Horizonte · asistente Gemini
   Responde con los datos de la cuenta del joven (aportaciones, reparto, protección, millas y objetivo de casa).
   Si en config.js se define HZ2_CONFIG.geminiEndpoint (un servicio propio que llame a Gemini en Google Cloud),
   se usa ese servicio; si no responde, se usan estas respuestas calculadas en el navegador. */

const G_EUR = v => Math.round(v).toLocaleString("es-ES", { useGrouping: "always" }) + " €";

function gFuture(monthly, years, start = 0, rate = 0.05) {
    const r = rate / 12;
    let v = start;
    for (let i = 0; i < years * 12; i++) v = v * (1 + r) + monthly;
    return v;
}

function localGemini(question, c) {
    const q = question.toLowerCase();
    const used = [];
    let a;
    const years = Math.max(1, c.goalAge - c.age);
    if (/casa|piso|entrada|hipoteca|vivienda|independiz/.test(q)) {
        const proj = gFuture(c.monthly, years, c.value);
        const gap = Math.max(0, c.down - proj);
        const extra = gap > 0 ? Math.ceil(gap / gFuture(1, years)) : 0;
        a = `Tu objetivo es una vivienda de unos ${G_EUR(c.goalPrice)} a los ${c.goalAge} años, así que la entrada habitual (20 %) serían ${G_EUR(c.down)}. ` +
            `Hoy tienes ${G_EUR(c.value)} y aportáis ${G_EUR(c.monthly)} al mes. A este ritmo, con una rentabilidad estimada del 5 % anual, llegarías a unos ${G_EUR(proj)}. ` +
            (gap > 0 ? `Te faltarían unos ${G_EUR(gap)}: equivale a sumar ${G_EUR(extra)} al mes desde hoy. El aval del ICO para menores de 35 puede reducir la entrada que pide el banco. `
                     : "Cubrirías la entrada. ") +
            `Además, tus ${c.miles.toLocaleString("es-ES")} millas de casa equivalen hoy a ${c.cutTxt} puntos menos de diferencial.`;
        used.push("tu objetivo de casa", "tu dinero invertido", "tus aportaciones", "tus millas");
    } else if (/ant[ií]doto|miedo|por qu[eé]|reparto|fondo/.test(q)) {
        if (!c.fears.length) a = "Todavía no has elegido tus preocupaciones. En la sección Antídoto marca hasta dos y preparo tu reparto.";
        else {
            a = `Tienes ${G_EUR(c.baseAmount)} en el fondo global y ${G_EUR(c.antidoteAmount)} en tu Antídoto: ` +
                c.fears.map(f => `${f.fundName.toLowerCase()} por «${f.label.toLowerCase()}» (${G_EUR(f.amount)})`).join(" y ") + `. ${c.fears[0].why} ` +
                (c.antidoteActive ? "" : "Tu familia aún tiene que aprobarlo. ") + "Reduce el golpe si lo que temes ocurre; no es una garantía.";
            used.push("tus preocupaciones", "tu reparto");
        }
    } else if (/cae|ca[ií]da|baja|perder|p[eé]rdida|proteg/.test(q)) {
        a = c.protectBase > 0
            ? `Tienes ${G_EUR(c.protectBase)} protegidos hasta el ${c.protectEnd}. Si al cumplir el año valieran menos, por ejemplo tras una caída del 20 %, CaixaBank pondría la diferencia: ${G_EUR(c.protectBase * 0.2)}. La única condición es no vender antes. Te quedan ${G_EUR(c.protectRoom)} de margen protegido.`
            : `Aún no tienes dinero propio protegido. Los primeros ${G_EUR(c.protectCap)} que inviertas tú quedarán protegidos durante 12 meses.`;
        used.push("tu dinero propio", "tu año de protección");
    } else if (/milla/.test(q)) {
        a = `Tienes ${c.miles.toLocaleString("es-ES")} millas (${c.cutTxt} puntos menos de diferencial). A tu ritmo sumas unas ${c.milesYear} al año, así que a los ${c.goalAge} tendrías unas ${c.milesAtGoal.toLocaleString("es-ES")}: ${c.cutAtGoalTxt} puntos menos, unos ${G_EUR(c.savingAtGoal)} menos de intereses en la hipoteca de tu objetivo.`;
        used.push("tus millas", "tu ritmo de aportación", "tu objetivo de casa");
    } else if (/paga|ahorrar m[aá]s|ahorro|aportar|cu[aá]nto/.test(q)) {
        if (!c.paga) a = "Si me dices cuánto recibes de paga (en Ajustes), te propongo una aportación semanal que no se note. Mientras, recuerda: aportar poco pero cada semana pesa más que aportar mucho una vez.";
        else {
            const sug = Math.max(1, Math.round(c.paga * 0.15));
            const v = gFuture(sug * 52 / 12, years);
            a = `Con una paga de ${G_EUR(c.paga)} a la semana, apartar ${G_EUR(sug)} (un 15 %) es un buen punto de partida. ` +
                (c.weekly ? `Ahora apartas ${G_EUR(c.weekly)} a la semana. ` : "") +
                `${G_EUR(sug)} a la semana hasta los ${c.goalAge} podrían convertirse en unos ${G_EUR(v)} con una rentabilidad estimada del 5 % anual, y cada mes que aportas suma 10 millas de casa.`;
        }
        used.push("tu paga", "tus aportaciones");
    } else if (/certificad|fundamentos|diploma|linkedin|prueba|revisi[oó]n|racha|juego/.test(q)) {
        a = c.diploma ? `Tienes tu Certificado Horizonte desde el ${c.diploma}. La próxima revisión anual es antes del ${c.itvDue}. ${c.age >= 16 ? "Puedes añadirlo a LinkedIn desde Aprende." : "Podrás añadirlo a LinkedIn a partir de los 16."} Llevas una racha de ${c.streak} semanas: cada 4 suman 20 millas.`
                      : `Llevas ${c.lessonsDone} de ${c.lessonsTotal} temas de Fundamentos. Al superar la prueba final, CaixaBank invierte ${G_EUR(c.prize)} a tu nombre. Un juego al día también suma millas.`;
        used.push("tu certificado", "tu racha");
    } else {
        a = `Tienes ${G_EUR(c.value)} invertidos y ${c.miles.toLocaleString("es-ES")} millas de casa` + (c.fears.length ? `, y tu Antídoto cubre ${c.fears.map(f => f.label.toLowerCase()).join(" y ")}` : "") +
            ". Puedo ayudarte con tu objetivo de casa, tu Antídoto, qué pasa si la bolsa baja, tus millas o cuánto apartar de tu paga.";
        used.push("tu resumen");
    }
    return { answer: a, used };
}

async function askGemini(question, ctx) {
    const ep = window.HZ2_CONFIG && window.HZ2_CONFIG.geminiEndpoint;
    if (ep) {
        try {
            const r = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, context: ctx }) });
            if (r.ok) { const d = await r.json(); if (d.answer) return { answer: d.answer, used: d.used || [] }; }
        } catch (e) { /* se usa la respuesta local */ }
    }
    return localGemini(question, ctx);
}
