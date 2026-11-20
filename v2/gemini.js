"use strict";
/* Horizonte v2 · asistente «Gemini» de demostración
   En la versión real, Gemini (Google Cloud) respondería con los datos que CaixaBank ya tiene del joven,
   con permiso de sus padres. Aquí las respuestas se calculan en el navegador con los datos de ejemplo
   para enseñar la idea: el Antídoto deja de ser genérico porque habla con tus propios números.
   Si en config.js se define HZ2_CONFIG.geminiEndpoint, se llama a ese servicio y esto queda de respaldo. */

const G_EUR = v => Math.round(v).toLocaleString("es-ES", { useGrouping: "always" }) + " €";
const G_EUR2 = v => v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" }) + " €";

function futureValue(monthly, years, start = 0, rate = 0.05) {
    const r = rate / 12;
    let v = start;
    for (let i = 0; i < years * 12; i++) v = v * (1 + r) + monthly;
    return v;
}

function localGemini(question, c) {
    const q = question.toLowerCase();
    const used = [];
    let a;
    const yearsToHouse = Math.max(1, (c.houseAge || 27) - c.age);
    if (/casa|piso|entrada|hipoteca|vivienda|independiz/.test(q)) {
        const proj = futureValue(c.monthly, yearsToHouse, c.value);
        const gap = Math.max(0, c.houseDown - proj);
        const extra = gap > 0 ? Math.ceil(gap / (futureValue(1, yearsToHouse) || 1)) : 0;
        a = `Ahora tienes ${G_EUR(c.value)} invertidos y entre tú y tu familia ponéis unos ${G_EUR(c.monthly)} al mes. ` +
            `Si sigues así ${yearsToHouse} años, con una rentabilidad hipotética del 5 % anual, podrías llegar a unos ${G_EUR(proj)} a los ${c.houseAge}. ` +
            (gap > 0
                ? `Para una entrada de ejemplo de ${G_EUR(c.houseDown)} te faltarían unos ${G_EUR(gap)}: serían unos ${G_EUR(extra)} más al mes. Con el aval del ICO para menores de 35, la entrada que pide el banco puede ser menor. `
                : `Eso cubriría una entrada de ejemplo de ${G_EUR(c.houseDown)}. `) +
            `Además llevas ${c.miles.toLocaleString("es-ES")} millas de casa, que hoy equivaldrían a ${c.cutTxt} puntos menos de diferencial.`;
        used.push("lo que tienes invertido", "lo que aportáis cada mes", "tu objetivo Mi casa", "tus millas");
    } else if (/ant[ií]doto|miedo|por qu[eé]|reparto|fondo/.test(q)) {
        if (!c.fears.length) {
            a = "Todavía no has elegido tus miedos. Ve a «¿Qué te da miedo?» y marca hasta dos: con eso preparo tu Antídoto.";
        } else {
            const parts = c.fears.map(f => `«${f.label.toLowerCase()}» → ${f.fundName} (${G_EUR(f.amount)})`).join("; ");
            a = `Tu dinero está repartido así: ${G_EUR(c.baseAmount)} en el fondo global y ${G_EUR(c.antidoteAmount)} en tu Antídoto: ${parts}. ` +
                `${c.fears[0].why} Es una forma de reducir el golpe si lo que temes pasa, no una garantía.`;
            if (c.fears.some(f => f.id === "casa")) a += ` Como tu miedo es la casa, sigo cada mes cuánto te falta para la entrada de ${G_EUR(c.houseDown)}.`;
            used.push("tus miedos", "tu reparto actual");
        }
    } else if (/cae|ca[ií]da|baja|perder|p[eé]rdida|seguro|proteg/.test(q)) {
        a = c.protectBase > 0
            ? `Tus primeros ${G_EUR(c.protectBase)} propios están protegidos hasta el ${c.protectEnd}. Si la bolsa cayera un 20 % y al cumplir el año valieran ${G_EUR(c.protectBase * 0.8)}, CaixaBank te pondría los ${G_EUR(c.protectBase * 0.2)} que faltan. Solo hay una condición: no vender antes. Quedan ${c.protectRoom > 0 ? G_EUR(c.protectRoom) + " de margen protegido" : "0 € de margen: ya has llenado los 500 €"}.`
            : `Aún no tienes dinero propio protegido. Tus primeros ${G_EUR(c.protectCap)} propios no podrán perder durante 12 meses: empieza con lo que quieras de tu paga.`;
        used.push("tu dinero propio", "las fechas de tu primer año");
    } else if (/milla/.test(q)) {
        a = `Llevas ${c.miles.toLocaleString("es-ES")} millas de casa (${c.cutTxt} puntos menos de diferencial). A tu ritmo actual sumas unas ${c.milesYear} al año: a los ${c.houseAge} tendrías unas ${c.milesAtHouse.toLocaleString("es-ES")}, una rebaja de ${c.cutAtHouseTxt} puntos que en una hipoteca de ejemplo de ${G_EUR(c.mortgage.amount)} a ${c.mortgage.years} años son unos ${G_EUR(c.savingAtHouse)} menos de intereses.`;
        used.push("tus millas", "tu ritmo de aportación");
    } else if (/gast|paga|redonde|ahorrar m[aá]s|ahorro|movimiento/.test(q)) {
        const byCat = {};
        c.moves.forEach(m => byCat[m.cat] = (byCat[m.cat] || 0) + m.a);
        const top = Object.entries(byCat).sort((x, y) => y[1] - x[1])[0];
        const plus2 = futureValue(8.66, yearsToHouse) ;
        a = `Este mes llevas ${G_EUR2(c.movesTotal)} en ${c.moves.length} compras; donde más gastas es en ${top[0].toLowerCase()} (${G_EUR2(top[1])}). ` +
            `Con el redondeo, esas compras habrían apartado ${G_EUR2(c.roundup)} sin que lo notes. ` +
            `Y si apartas 2 € más por semana de tu paga de ${G_EUR(c.paga)}, a los ${c.houseAge} podrían ser unos ${G_EUR(plus2)} más (simulación al 5 % anual).` +
            (c.savingsAccount ? ` Por cierto: tienes ${G_EUR(c.savingsAccount)} parados al 0 % en tu cuenta.` : "");
        used.push("tu paga", "tus movimientos del mes", "tu saldo en imaginTeens");
    } else if (/carnet|diploma|linkedin|te[oó]rico|examen|itv/.test(q)) {
        a = c.diploma
            ? `Tienes el carnet de joven inversor desde el ${c.diploma}. Te toca la ITV antes del ${c.itvDue}. ${c.age >= 16 ? "Ya puedes añadirlo a LinkedIn desde la pestaña Carnet." : "Podrás añadirlo a LinkedIn cuando cumplas 16."}`
            : `Llevas ${c.lessonsDone} de ${c.lessonsTotal} temas del teórico. Al aprobar el examen ganas ${G_EUR(c.prize)} invertidos y tu diploma.`;
        used.push("tu carnet");
    } else {
        a = `Resumen rápido: tienes ${G_EUR(c.value)} invertidos, ${c.ownFirst ? "ya has puesto tu primer euro propio" : "aún no has puesto tu primer euro propio"}, llevas ${c.miles.toLocaleString("es-ES")} millas de casa` +
            (c.fears.length ? ` y tu Antídoto cubre: ${c.fears.map(f => f.label.toLowerCase()).join(" y ")}.` : ".") +
            " Pregúntame por tu casa, tu Antídoto, qué pasa si la bolsa baja, tus millas o tus gastos.";
        used.push("tu resumen");
    }
    return { answer: a, used };
}

async function askGemini(question, ctx) {
    const ep = window.HZ2_CONFIG && window.HZ2_CONFIG.geminiEndpoint;
    if (ep) {
        try {
            const r = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, context: ctx }) });
            if (r.ok) { const d = await r.json(); if (d.answer) return { answer: d.answer, used: d.used || [], remote: true }; }
        } catch (e) { /* respaldo local */ }
    }
    return localGemini(question, ctx);
}
