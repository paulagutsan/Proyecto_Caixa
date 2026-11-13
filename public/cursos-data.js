"use strict";
/* Horizonte · contenido de los cursos
   Tres niveles. Cada curso: pasos de teoría (text), mates con ejemplo calculado (math), calculadoras
   (calc) y un test final (quiz). Las cifras de los ejemplos se calculan aquí para que sean exactas.
   Contenido educativo: no es asesoramiento. Las rentabilidades son hipótesis o datos anuales aproximados.
   Se carga primero; las funciones de gráficas viven en cursos.js y las de cálculo en app.js
   (solo se llaman al pintar un paso, nunca al cargar). */

const T = (h, p, o = {}) => ({ t: "text", h, p, ...o });
const M = (h, formula, o = {}) => ({ t: "math", h, formula, ...o });
const C = (h, inputs, out, o = {}) => ({ t: "calc", h, inputs, out, ...o });
const Q = (q, o, a, why) => ({ t: "quiz", q, o, a, why });
const e2 = v => v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" }) + " €";
const p1 = v => v.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nEur = v => fmtR(v), nPct = v => `${String(v).replace(".", ",")} %`, nYr = v => `${v} año${v === 1 ? "" : "s"}`, nMes = v => `${v} meses`, nPer = v => `${v.toLocaleString("es-ES")} ×`;
const yrTicks = (n, k = 4) => Array.from({ length: k + 1 }, (_, i) => Math.round(n * i / k));
const xYears = v => (v === 0 ? "Hoy" : `${v} años`);
const range = n => Array.from({ length: n + 1 }, (_, i) => i);
const defl = (m, i, n) => m / Math.pow(1 + i / 100, n);
const bondPrice = (cup, y, n, nom = 1000) => { let p = 0; for (let t = 1; t <= n; t++) p += nom * cup / 100 / Math.pow(1 + y / 100, t); return p + nom / Math.pow(1 + y / 100, n); };
const growth = r => r.reduce((a, x) => (a.push(a[a.length - 1] * (1 + x / 100)), a), [10000]);

const COURSES = [
/* ============================ NIVEL 1 ============================ */
{ id: "ahorrar", level: 1, title: "Ahorrar o invertir", sub: "Qué hace cada cosa y cuándo usar una u otra", practice: null,
  learn: ["La diferencia real entre ahorrar e invertir", "El triángulo liquidez · rentabilidad · seguridad", "Qué herramienta encaja con cada plazo"],
  steps: [
    T("Guardar no es lo mismo que poner a trabajar", [
        "<b>Ahorrar</b> es apartar dinero para más adelante. Sabes cuánto tendrás y puedes usarlo cuando quieras, pero rinde poco.",
        "<b>Invertir</b> es comprar activos (acciones, bonos, fondos, inmuebles…) que pueden subir de valor o pagarte rentas. A cambio de poder ganar más, <b>aceptas que el valor suba y baje, y que puedas perder parte</b>.",
        "No compiten entre sí: primero se ahorra (colchón y objetivos cercanos) y después se invierte lo que no vas a necesitar pronto."]),
    T("El triángulo: no existe el activo perfecto", [
        "Todo producto financiero se mueve entre tres propiedades: <b>liquidez</b> (convertirlo en dinero rápido sin perder valor), <b>rentabilidad</b> (cuánto puede dar) y <b>seguridad</b> (que no pierdas lo que pones).",
        "Puedes tener dos a la vez, nunca las tres. Quien te ofrezca rentabilidad alta, disponibilidad inmediata y cero riesgo te engaña o no te cuenta todo."], { viz: () => triangleViz() }),
    T("Cada plazo, su herramienta", [
        "La pregunta clave no es «¿qué rinde más?» sino «<b>¿cuándo voy a necesitar este dinero?</b>».",
        "Esta es solo una referencia general, no una recomendación personalizada:"],
        { viz: () => bands([{ h: "Menos de 3 años", p: "Estabilidad y disponibilidad", cls: "a" }, { h: "De 3 a 8 años", p: "Mezcla de estabilidad y crecimiento", cls: "b" }, { h: "Más de 8 años", p: "Más peso en renta variable diversificada", cls: "c" }]),
          note: "Cuanto más largo es el plazo, más tiempo hay para que se recuperen las caídas. Lo veremos con datos en «Riesgo y plazo»." }),
    Q("Necesitas el dinero para un viaje dentro de 8 meses. ¿Qué debería pesar más?", ["La máxima rentabilidad posible", "Que esté disponible y sin riesgo de pérdida", "Que esté invertido en bolsa", "Que sea difícil de retirar"], 1, "A corto plazo una caída podría coincidir justo con el momento en que lo necesitas."),
    Q("Un producto promete un 12 % anual garantizado y poder retirar el dinero cuando quieras. ¿Qué piensas?", ["Que es una oportunidad única", "Que incumple el triángulo: no pueden darse alta rentabilidad, seguridad y liquidez a la vez", "Que es normal en los depósitos", "Que solo es válido para grandes importes"], 1, "Rentabilidad alta, garantía y liquidez inmediata no existen juntas. Es una señal de alerta."),
    Q("¿Cuál es la diferencia principal entre ahorrar e invertir?", ["Invertir siempre da más dinero", "Al invertir aceptas que el valor pueda bajar a cambio de poder ganar más", "Ahorrar requiere un banco e invertir no", "No hay diferencia"], 1, "Invertir implica riesgo de pérdida; ahorrar busca conservar el dinero y tenerlo disponible."),
    Q("¿Qué orden suele ser más razonable?", ["Invertir primero y ahorrar con lo que sobre", "Colchón de emergencia, objetivos cercanos y después invertir a largo plazo", "Solo ahorrar toda la vida", "Invertir todo en un único activo"], 1, "Primero la red de seguridad y lo que necesitarás pronto; después, lo que puedes dejar crecer años.")
  ] },

{ id: "inflacion", level: 1, title: "Inflación: el coste invisible", sub: "Por qué el dinero parado pierde valor", practice: "inflacion",
  learn: ["Qué es la inflación y cómo se mide", "Calcular el poder adquisitivo con una fórmula", "Qué es la rentabilidad real"],
  steps: [
    T("Los precios suben, tu dinero no", [
        "La <b>inflación</b> es la subida general y sostenida de los precios. Con un 3 % anual, lo que hoy cuesta 100 € costará unos 134 € dentro de diez años.",
        "El dinero en una cuenta sin interés no «pierde» euros: pierde <b>poder adquisitivo</b>. Con los mismos euros compras menos cosas.",
        "En España se mide con el <b>IPC</b> (Índice de Precios de Consumo) que publica el INE."]),
    M("La fórmula del poder adquisitivo", "Valor real = Dinero ÷ (1 + i)<sup>n</sup>",
        { vars: [["i", "inflación anual (3 % → 0,03)"], ["n", "años que pasan"]],
          ex: () => ({ title: "Ejemplo: 1.000 € parados, 3 % de inflación, 10 años", lines: [`1.000 ÷ 1,03<sup>10</sup> = <b>${e2(defl(1000, 3, 10))}</b> de hoy`, `Para comprar lo mismo necesitarás <b>${e2(1000 * Math.pow(1.03, 10))}</b>.`] }),
          viz: () => barsH([0, 10, 20, 30].map(n => ({ l: n === 0 ? "Hoy" : `En ${n} años`, v: defl(1000, 3, n), cls: n === 0 ? "a" : "d" })), { max: 1000, cap: "Lo que compran 1.000 € guardados sin rentabilidad, con una inflación del 3 % anual." }) }),
    C("¿Cuánto valdrán tus ahorros?", [
        { id: "m", l: "Dinero guardado", min: 1000, max: 50000, step: 500, v: 5000, f: nEur }, { id: "i", l: "Inflación anual", min: 0.5, max: 8, step: 0.5, v: 3, f: nPct }, { id: "n", l: "Años", min: 1, max: 40, step: 1, v: 10, f: nYr }],
        ({ m, i, n }) => `<p>Tus <b>${nEur(m)}</b> parados valdrán <b>${nEur(defl(m, i, n))}</b> de hoy. Para comprar lo mismo necesitarás <b>${nEur(m * Math.pow(1 + i / 100, n))}</b>.</p>${barsH([{ l: "Hoy", v: m, cls: "a" }, { l: `En ${n} años`, v: defl(m, i, n), cls: "d" }], { max: m })}<p class="muted small">Pierdes un <b>${p1((1 - defl(m, i, n) / m) * 100)} %</b> de poder adquisitivo.</p>`),
    M("Rentabilidad real", "Rentabilidad real = (1 + r) ÷ (1 + i) − 1 ≈ r − i",
        { vars: [["r", "rentabilidad nominal (la que te dicen)"], ["i", "inflación"]],
          ex: () => ({ title: "Un depósito al 2 % con inflación del 3 %", lines: [`(1,02 ÷ 1,03) − 1 = <b>${sg((1.02 / 1.03 - 1) * 100)}</b>`, "Aunque la cuenta marque +2 %, <b>pierdes poder adquisitivo cada año</b>.", `Con una inversión que rindiera un 6 %: (1,06 ÷ 1,03) − 1 = <b>${sg((1.06 / 1.03 - 1) * 100)}</b> reales.`] }) }),
    Q("Con una inflación del 3 %, ¿qué pasa con 1.000 € guardados sin interés durante 10 años?", ["Valen 1.300 €", "Siguen siendo 1.000 €, pero compran lo que hoy se compraría con unos 744 €", "Valen lo mismo en todos los sentidos", "Se duplican"], 1, "1.000 ÷ 1,03¹⁰ ≈ 744 €: mismos euros, menos poder de compra."),
    Q("Tu depósito rinde un 2 % y la inflación es del 3 %. ¿Rentabilidad real aproximada?", ["+2 %", "+5 %", "−1 %", "0 %"], 2, "r − i = 2 − 3 = −1 %. Ganas euros pero pierdes poder adquisitivo."),
    Q("¿Qué mide el IPC?", ["La rentabilidad de la bolsa", "La variación de los precios de una cesta de bienes y servicios de consumo", "El tipo de interés oficial", "El sueldo medio"], 1, "Es el indicador con el que se mide la inflación de los precios al consumo."),
    Q("¿Cuál de estas opciones NO protege del efecto de la inflación a largo plazo?", ["Invertir de forma diversificada", "Dejar todo el dinero en efectivo", "Aumentar tus ingresos", "Aportar de forma periódica"], 1, "El efectivo no rinde nada y la inflación erosiona su valor cada año.")
  ] },

{ id: "colchon", level: 1, title: "Colchón y presupuesto", sub: "Tu red de seguridad antes de invertir", practice: "emergencia",
  learn: ["Cuánto colchón necesitas y dónde tenerlo", "La regla 50 / 30 / 20", "Hábitos de gasto que sostienen el ahorro"],
  steps: [
    T("El colchón: dinero que no se toca para invertir", [
        "Un <b>colchón de emergencia</b> cubre imprevistos (avería, paro, gastos médicos) sin tener que vender inversiones en mal momento.",
        "Referencia habitual: <b>entre 3 y 6 meses de gastos básicos</b>; más si tus ingresos son variables, por ejemplo siendo autónomo.",
        "Debe estar <b>disponible y sin riesgo de pérdida</b>: cuenta corriente o remunerada, no bolsa."]),
    M("¿Cuánto necesito?", "Colchón = gastos básicos mensuales × meses de cobertura",
        { vars: [["Gastos básicos", "vivienda, comida, transporte, facturas, deudas…"], ["Meses", "entre 3 y 6 (o más)"]],
          ex: () => ({ title: "Ejemplo", lines: ["900 € al mes × 4 meses = <b>3.600 €</b>", "Si ahorras 150 € al mes: 3.600 ÷ 150 = <b>24 meses</b> en llenarlo."] }) }),
    C("Calcula tu colchón", [
        { id: "g", l: "Gastos básicos al mes", min: 300, max: 3000, step: 50, v: 900, f: nEur }, { id: "m", l: "Meses de cobertura", min: 3, max: 12, step: 1, v: 4, f: nMes }, { id: "a", l: "Ahorro mensual", min: 20, max: 800, step: 10, v: 150, f: nEur }],
        ({ g, m, a }) => { const obj = g * m, t = Math.ceil(obj / a); return `<p>Tu colchón objetivo: <b>${nEur(obj)}</b>.</p>${blocks(m)}<p class="muted small">Cada cuadrado es un mes de gastos cubierto. Ahorrando ${nEur(a)} al mes lo completarías en <b>${t} meses</b>${t >= 12 ? ` (${p1(t / 12)} años)` : ""}.</p>`; }),
    T("Regla 50 / 30 / 20", [
        "Un reparto sencillo del sueldo neto: <b>50 % necesidades</b> (vivienda, comida, transporte, facturas), <b>30 % ocio y estilo de vida</b> y <b>20 % ahorro e inversión</b>.",
        "Es una referencia, no un dogma: en ciudades caras las necesidades pesan más y el ahorro menos. Lo importante es <b>pagarte primero</b>: automatiza el ahorro el día que cobras.",
        "En tu perfil tienes la calculadora para aplicarlo a tus ingresos."], { viz: () => donut([{ v: 50, cls: "a", l: "Necesidades" }, { v: 30, cls: "b", l: "Ocio y estilo de vida" }, { v: 20, cls: "c", l: "Ahorro e inversión" }]) }),
    T("Hábitos que sostienen el ahorro", [
        "<b>Loud budgeting</b>: decir en voz alta «esto no entra en mi presupuesto» y proponer otro plan. Normaliza hablar de dinero.",
        "<b>Doom spending</b>: gastar para aliviar el estrés. Truco: espera 48 horas antes de una compra no planificada.",
        "<b>Soft saving</b>: ahorrar una cantidad sostenible sin renunciar a disfrutar hoy; automática y revisada cuando suban tus ingresos."]),
    Q("¿Cuántos meses de gastos básicos suele recomendarse como colchón?", ["1 mes", "Entre 3 y 6 meses", "24 meses", "Ninguno si inviertes"], 1, "Es la referencia habitual: suficiente para absorber un imprevisto sin vender inversiones."),
    Q("Tus gastos básicos son 1.000 € al mes y quieres 5 meses de colchón. ¿Cuánto es?", ["2.000 €", "5.000 €", "10.000 €", "1.500 €"], 1, "Colchón = gastos mensuales × meses = 1.000 × 5."),
    Q("¿Dónde conviene tener el colchón de emergencia?", ["En acciones", "En criptomonedas", "En algo disponible y sin riesgo de pérdida", "Prestado a un amigo"], 2, "Debe poder usarse en cualquier momento sin que una caída de mercado lo reduzca."),
    Q("En la regla 50/30/20, ¿qué porcentaje se destina a ahorro e inversión?", ["50 %", "30 %", "20 %", "5 %"], 2, "50 % necesidades, 30 % ocio y 20 % ahorro e inversión.")
  ] },

{ id: "estafas", level: 1, title: "Estafas y apuestas", sub: "Cómo reconocer lo que no es invertir", practice: "estafas",
  learn: ["Las señales de alerta de un fraude", "Por qué apostar no es invertir (esperanza matemática)", "Cómo comprobar una entidad"],
  steps: [
    T("La señal más clara: rentabilidad alta y garantizada", [
        "En finanzas <b>rentabilidad y riesgo van de la mano</b>. Si alguien promete ganancias altas y seguras a la vez, o miente o no es una inversión.",
        "Los fraudes cambian de disfraz (criptomonedas, forex, «trading automático», clubes de inversión) pero repiten las mismas señales:"],
        { list: ["Promesa de rentabilidad garantizada o muy superior a la del mercado.", "Urgencia: «solo hoy», «plazas limitadas».", "Contacto no solicitado por redes sociales, mensajería o llamada.", "Piden ingresar dinero primero para «desbloquear» las ganancias.", "La entidad no figura en los registros de la CNMV ni del Banco de España."] }),
    T("El esquema Ponzi: pagar a unos con el dinero de otros", [
        "En una <b>pirámide o esquema Ponzi</b> los «beneficios» de los primeros se pagan con lo que aportan los nuevos. No hay negocio detrás.",
        "Funciona mientras entra más dinero del que sale. Cuando el flujo se frena, <b>se cae y casi nadie recupera lo aportado</b>."],
        { viz: () => flow(["Nuevos inversores aportan", "El organizador", "Paga «beneficios» a los antiguos"]) }),
    M("Apostar no es invertir: la esperanza matemática", "Esperanza = Σ (probabilidad × resultado)",
        { p: "En una apuesta con ventaja para la casa, el resultado <b>esperado</b> es negativo por diseño. Puedes ganar un día, pero la media juega en tu contra.",
          vars: [["Probabilidad", "de cada resultado posible"], ["Resultado", "ganancia o pérdida en euros"]],
          ex: () => ({ title: "Ruleta europea (37 casillas): 1 € a un número", lines: ["Ganas 35 € con probabilidad 1/37 y pierdes 1 € con probabilidad 36/37.", `Esperanza = (1/37) × 35 − (36/37) × 1 = <b>${sg(-100 / 37)}</b> por euro apostado.`] }) }),
    C("¿Cuánto pierdes de media?", [
        { id: "a", l: "Apostado por jugada", min: 1, max: 100, step: 1, v: 10, f: nEur }, { id: "n", l: "Número de jugadas", min: 10, max: 1000, step: 10, v: 100, f: v => `${v}` }],
        ({ a, n }) => { const tot = a * n; return `<p>Apuestas en total <b>${nEur(tot)}</b>. Con la ruleta europea, lo esperado es perder <b>${nEur(tot / 37)}</b> (un 2,7 %).</p>${barsH([{ l: "Apostado", v: tot, cls: "a" }, { l: "Pérdida esperada", v: tot / 37, cls: "d" }], { max: tot })}<p class="muted small">A corto plazo manda el azar; cuantas más jugadas, más se cumple la media.</p>`; }),
    T("Cómo comprobarlo", [
        "Busca la entidad en los registros de la <b>CNMV</b> (cnmv.es) y consulta su lista de <b>advertencias</b> sobre chiringuitos financieros.",
        "No ingreses dinero para «desbloquear» ganancias, no compartas claves ni des acceso remoto a tu ordenador, y desconfía de quien te contacta sin que lo pidas.",
        "Ante la duda, espera: una buena oportunidad no desaparece en una hora."]),
    Q("Un desconocido te escribe por Instagram con una inversión que da un 8 % semanal garantizado. ¿Qué haces?", ["Pruebo con poco dinero", "Lo ignoro: es una señal clásica de fraude", "Le pido más información y decido luego", "Se lo cuento a mis amigos para que entren"], 1, "Rentabilidad altísima garantizada y contacto no solicitado son dos señales de alerta a la vez."),
    Q("¿Dónde compruebas si una entidad puede ofrecer servicios de inversión en España?", ["En sus redes sociales", "En los registros de la CNMV", "En Google Maps", "En una web de opiniones"], 1, "La CNMV mantiene los registros oficiales y una lista de advertencias."),
    Q("La ruleta europea tiene una esperanza de −2,7 % por euro apostado. Esto significa que…", ["Siempre pierdes", "A largo plazo lo habitual es perder ese porcentaje de lo apostado", "Si ganas una vez ya no puedes perder", "Es una inversión conservadora"], 1, "Se pueden tener rachas ganadoras, pero la media a largo plazo es negativa."),
    Q("En un esquema Ponzi, ¿de dónde salen los «beneficios» de los primeros inversores?", ["De un negocio muy rentable", "Del dinero que aportan los nuevos inversores", "De la bolsa", "De los bancos centrales"], 1, "No hay actividad real detrás: se paga a unos con el dinero de otros hasta que se corta el flujo.")
  ] },

/* ============================ NIVEL 2 ============================ */
{ id: "compuesto", level: 2, title: "Interés compuesto", sub: "Por qué el tiempo pesa más que el importe", practice: "compuesto",
  learn: ["La diferencia entre interés simple y compuesto", "Las fórmulas, con y sin aportaciones mensuales", "La regla del 72 y por qué empezar pronto lo cambia todo"],
  steps: [
    T("Intereses sobre intereses", [
        "Con <b>interés simple</b> ganas siempre sobre lo que pusiste al principio. Con <b>interés compuesto</b> los rendimientos se suman al capital y, a partir de ahí, también generan rendimientos.",
        "Al principio apenas se nota. Con los años la curva se dispara, y por eso <b>el tiempo pesa tanto</b>."]),
    M("La fórmula", "Capital final = C × (1 + r)<sup>n</sup>",
        { vars: [["C", "capital inicial"], ["r", "rentabilidad anual (5 % → 0,05)"], ["n", "años"]],
          ex: () => ({ title: "10.000 € al 5 % durante 30 años", lines: [`Interés simple: 10.000 × (1 + 0,05 × 30) = <b>${e2(10000 * 2.5)}</b>`, `Interés compuesto: 10.000 × 1,05<sup>30</sup> = <b>${e2(10000 * Math.pow(1.05, 30))}</b>`] }),
          viz: () => lineChart({ xs: range(30), xTicks: [0, 10, 20, 30], xFmt: xYears, alt: "Interés simple frente a compuesto", series: [{ y: range(30).map(x => 10000 * (1 + 0.05 * x)), cls: "d", name: "Interés simple" }, { y: range(30).map(x => 10000 * Math.pow(1.05, x)), cls: "b", name: "Interés compuesto" }] }) }),
    M("Con aportaciones mensuales", "Capital final = A × [(1 + i)<sup>m</sup> − 1] ÷ i",
        { p: "Lo normal es aportar cada mes. La fórmula suma cada aportación creciendo durante los meses que le quedan.",
          vars: [["A", "aportación mensual"], ["i", "rentabilidad mensual equivalente = (1 + r)<sup>1/12</sup> − 1"], ["m", "número de meses"]],
          ex: () => ({ title: "50 € al mes durante 30 años al 5 % anual", lines: [`i = 1,05<sup>1/12</sup> − 1 = ${(Math.pow(1.05, 1 / 12) - 1).toLocaleString("es-ES", { maximumFractionDigits: 5 })}`, `Capital final = <b>${e2(fv(0, 50, 30, 5))}</b> (aportas ${nEur(50 * 360)}).`, `El tiempo añade <b>${nEur(fv(0, 50, 30, 5) - 18000)}</b>: más que tú.`] }) }),
    T("La regla del 72", [
        "Para estimar en cuántos años se duplica un capital: <b>72 ÷ rentabilidad anual (%)</b>.",
        "Es una aproximación muy útil para hacer cuentas de cabeza."], { viz: () => barsH([3, 6, 9, 12].map(r => ({ l: `Al ${r} %`, v: 72 / r, cls: "b", t: `≈ ${72 / r} años` })), { max: 24, cap: "Años que tarda en duplicarse un capital." }) }),
    C("Juega con las tres palancas", [
        { id: "c", l: "Capital inicial", min: 0, max: 20000, step: 500, v: 1000, f: nEur }, { id: "a", l: "Aportación mensual", min: 0, max: 500, step: 10, v: 100, f: nEur }, { id: "r", l: "Rentabilidad anual", min: 1, max: 10, step: 0.5, v: 5, f: nPct }, { id: "n", l: "Años", min: 5, max: 40, step: 1, v: 25, f: nYr }],
        ({ c, a, r, n }) => { const fin = fv(c, a, n, r), put = c + a * 12 * n; return `<p>Aportas <b>${nEur(put)}</b> y llegas a <b>${nEur(fin)}</b>: el tiempo añade <b>${nEur(fin - put)}</b>.</p>${lineChart({ xs: range(n), xTicks: yrTicks(n), xFmt: xYears, alt: "Capital aportado y capital final", series: [{ y: range(n).map(y => c + a * 12 * y), cls: "d", name: "Aportado" }, { y: range(n).map(y => fv(c, a, y, r)), cls: "b", name: "Capital", area: true }] })}`; }),
    T("Empezar antes vale más que aportar más", [
        () => { const ana = fv(fv(0, 100, 10, 5), 0, 30, 5), luis = fv(0, 100, 30, 5), marta = fv(0, 100, 40, 5);
            return `Tres personas aportan 100 € al mes con una rentabilidad hipotética del 5 %. <b>Ana</b> aporta de los 25 a los 35 años y deja el dinero crecer hasta los 65. <b>Luis</b> aporta de los 35 a los 65. <b>Marta</b> aporta de los 25 a los 65.<br><br>Ana pone ${nEur(12000)} y llega a <b>${nEur(ana)}</b>: el ${Math.round(ana / luis * 100)} % de lo que logra Luis con tres veces más aportado (${nEur(36000)}). Marta, que empezó antes y no paró, llega a <b>${nEur(marta)}</b>.`; }],
        { viz: () => barsH([{ l: "Ana · 10 años aportando", v: fv(fv(0, 100, 10, 5), 0, 30, 5), cls: "a" }, { l: "Luis · 30 años aportando", v: fv(0, 100, 30, 5), cls: "b" }, { l: "Marta · 40 años aportando", v: fv(0, 100, 40, 5), cls: "c" }]), note: "Ejemplo con una hipótesis de rentabilidad constante; en la vida real la rentabilidad varía y puede ser negativa algunos años." }),
    Q("¿Qué diferencia al interés compuesto del simple?", ["Que es más seguro", "Que los intereses generan a su vez intereses", "Que solo se cobra al final", "Que es ilegal en España"], 1, "En el compuesto los rendimientos se reinvierten y también rinden."),
    Q("Con la regla del 72, ¿en cuántos años se duplica un capital que rinde un 6 % anual?", ["6 años", "12 años", "18 años", "72 años"], 1, "72 ÷ 6 = 12 años."),
    Q("Inviertes 1.000 € al 10 % anual compuesto durante 2 años. ¿Cuánto tienes?", ["1.200 €", "1.210 €", "1.100 €", "1.020 €"], 1, "1.000 × 1,10 × 1,10 = 1.210 €. Con interés simple serían 1.200 €."),
    Q("¿Qué factor suele pesar más a largo plazo en el resultado final?", ["Adivinar el mejor momento para entrar", "Empezar pronto y mantener las aportaciones", "Elegir el producto de moda", "Mirar la cartera todos los días"], 1, "El tiempo es la palanca más potente del interés compuesto.")
  ] },

{ id: "riesgo", level: 2, title: "Riesgo y plazo", sub: "Cuándo necesitarás el dinero lo cambia todo", practice: "riesgo",
  learn: ["Qué es el riesgo (y qué no)", "Rentabilidad anualizada y caídas históricas", "Cómo el plazo reduce la dispersión de resultados"],
  steps: [
    T("Riesgo no es «perderlo todo», es incertidumbre", [
        "En finanzas, <b>riesgo es la incertidumbre del resultado</b>: cuánto puede alejarse lo que obtengas de lo que esperabas, hacia arriba o hacia abajo. Se mide con la <b>volatilidad</b>.",
        "Hay otro riesgo que se olvida: <b>no invertir</b>. El dinero parado pierde frente a la inflación.",
        "Las caídas no son un fallo del sistema: son el precio de la rentabilidad esperada."]),
    M("Rentabilidad anualizada", "Rentabilidad anualizada = (Valor final ÷ Valor inicial)<sup>1/n</sup> − 1",
        { p: "Para comparar inversiones de distinta duración se pasa todo a «tanto por año».", vars: [["n", "años transcurridos"]],
          ex: () => ({ title: "10.000 € que se convierten en 15.000 € en 6 años", lines: [`(15.000 ÷ 10.000)<sup>1/6</sup> − 1 = <b>${fPct((Math.pow(1.5, 1 / 6) - 1) * 100)}</b> anual`, "No es un 50 % ÷ 6 = 8,3 %: el efecto compuesto hace que cada año rinda algo menos."] }) }),
    T("El plazo reduce la dispersión", [
        "Con datos anuales aproximados del índice mundial de renta variable (2000–2024), esta es la <b>peor y la mejor rentabilidad anualizada</b> que habrías obtenido según cuánto tiempo mantuvieras la inversión:"],
        { viz: () => { const w = crsRet("world"), rolling = h => { const o = []; for (let s = 0; s + h <= w.length; s++) o.push(ann(w, s, h)); return o; };
            return rangeBars([1, 3, 5, 10, 15].map(h => { const r = rolling(h); return { l: h === 1 ? "1 año" : `${h} años`, lo: Math.min(...r), hi: Math.max(...r) }; }), { cap: "Peor / mejor resultado anualizado en cualquier ventana del periodo. Datos aproximados e ilustrativos." }); },
          note: "Con pocos años de datos las ventanas largas se solapan mucho, y el pasado no garantiza el futuro. Pero la idea es robusta: <b>cuanto más tiempo, menos depende el resultado del mal momento de entrada</b>." }),
    T("Las grandes caídas… y cuánto tardó en recuperarse", [
        "Mismo índice mundial, datos anuales aproximados. Esto fue lo que cayó en tres episodios y en qué año se volvió al nivel previo:"],
        { viz: () => { const w = crsRet("world"), eps = [[2000, 2002, "Burbuja puntocom"], [2008, 2008, "Crisis financiera"], [2022, 2022, "Subida de tipos e inflación"]].map(([a, b, n]) => { let cum = 1; for (let i = a - 2000; i <= b - 2000; i++) cum *= 1 + w[i] / 100; let k = b - 2000, c = cum; while (c < 1 && k < w.length - 1) { k++; c *= 1 + w[k] / 100; } return { n, a, b, loss: (cum - 1) * 100, rec: c >= 1 ? 2000 + k : null }; });
            return divBars(eps.map(e => ({ l: `${e.a === e.b ? e.a : `${e.a}–${e.b}`}`, v: e.loss }))) + `<ul class="crs-ul">${eps.map(e => `<li><b>${e.n}</b>: ${sg(e.loss)} acumulado${e.rec ? `; recuperó el nivel previo en ${e.rec}.` : "; aún sin recuperar en los datos."}</li>`).join("")}</ul>`; } }),
    T("Tolerancia, capacidad y horizonte", [
        "<b>Tolerancia al riesgo</b>: cuánto aguantas emocionalmente sin vender en pánico.",
        "<b>Capacidad para asumir pérdidas</b>: cuánto puedes perder sin que cambie tu vida (ingresos estables, colchón, deudas).",
        "<b>Horizonte</b>: cuándo necesitarás el dinero. Los tres cuentan, y manda el más bajo.",
        "En tu perfil tienes el test que orienta el escenario de referencia del simulador."]),
    Q("En finanzas, ¿qué es el riesgo?", ["La probabilidad de perderlo todo", "La incertidumbre sobre el resultado, que puede ser mejor o peor del esperado", "Un impuesto", "Algo que solo existe en la bolsa"], 1, "Mide cuánto puede alejarse el resultado de lo esperado, en las dos direcciones."),
    Q("Según los datos del curso, al alargar el horizonte de inversión, la diferencia entre el mejor y el peor resultado anualizado…", ["Aumenta", "Se reduce", "Se mantiene igual", "Desaparece por completo"], 1, "Las ventanas largas suavizan los años malos y los buenos."),
    Q("Necesitarás el dinero dentro de 2 años. ¿Qué debería pesar más?", ["La rentabilidad máxima", "La estabilidad: una caída podría coincidir con tu plazo", "Que tenga un nombre conocido", "Invertir todo en un único activo"], 1, "Con plazos cortos no hay tiempo para recuperarse de una caída."),
    Q("Una inversión pasa de 10.000 € a 12.100 € en 2 años. ¿Rentabilidad anualizada?", ["21 %", "10 %", "10,5 %", "5 %"], 1, "(12.100 ÷ 10.000)^(1/2) − 1 = 1,21^0,5 − 1 = 10 %.")
  ] },

{ id: "diversificar", level: 2, title: "Diversificación", sub: "Repartir para no depender de una sola apuesta", practice: "diversificar",
  learn: ["Qué consigue (y qué no) diversificar", "La rentabilidad de una cartera mezclada", "Probar mezclas con datos reales 2000–2024"],
  steps: [
    T("No pongas todos los huevos en la misma cesta", [
        "<b>Diversificar</b> es repartir lo que inviertes entre activos que no se comportan igual: países, sectores, tamaños de empresa y tipos de activo (acciones, bonos, oro…).",
        "Si una parte cae, otra puede amortiguar el golpe. <b>No elimina el riesgo, pero lo modera</b> y reduce la dependencia de una sola apuesta."]),
    M("Rentabilidad de una cartera", "Rentabilidad cartera = w<sub>1</sub>·r<sub>1</sub> + w<sub>2</sub>·r<sub>2</sub> + …",
        { p: "La rentabilidad media de una cartera es la media ponderada de sus activos. El riesgo, en cambio, <b>no</b> se calcula así: suele ser menor que la media de los riesgos, porque las caídas no coinciden del todo.",
          vars: [["w<sub>i</sub>", "peso de cada activo (suman 100 %)"], ["r<sub>i</sub>", "rentabilidad de cada activo"]],
          ex: () => ({ title: "60 % en el activo A (8 %) y 40 % en el B (3 %)", lines: ["0,6 × 8 % + 0,4 × 3 % = <b>6,0 %</b>"] }) }),
    C("Mezcla acciones y bonos con datos reales", [{ id: "w", l: "Porcentaje en acciones mundiales (el resto, bonos)", min: 0, max: 100, step: 10, v: 60, f: v => `${v} %` }],
        ({ w }) => { const a = crsRet("world"), b = crsRet("bon"), mix = a.map((r, i) => w / 100 * r + (1 - w / 100) * b[i]), g = growth(mix), x = range(25).map(i => 2000 + i);
            return `<p>Con <b>${w} %</b> en acciones y <b>${100 - w} %</b> en bonos (rebalanceando cada año), 2000–2024:</p>
                <dl class="stats"><div><dt>Rentabilidad anualizada</dt><dd>${fPct(ann(mix))}</dd></div><div><dt>Peor año</dt><dd>${sg(Math.min(...mix))}</dd></div><div><dt>Mejor año</dt><dd>${sg(Math.max(...mix))}</dd></div><div><dt>10.000 € se convierten en</dt><dd>${nEur(g[25])}</dd></div></dl>
                ${lineChart({ xs: x, xTicks: [2000, 2005, 2010, 2015, 2020, 2025], xFmt: v => `${v}`, alt: "Evolución de 10.000 euros", series: [{ y: growth(a), cls: "a", name: "100 % acciones" }, { y: g, cls: "b", name: "Tu mezcla" }, { y: growth(b), cls: "d", name: "100 % bonos" }] })}`; },
        { note: "Datos anuales aproximados e ilustrativos (índice mundial de renta variable y bonos de EE. UU.). No es una recomendación." }),
    T("Diversificar dentro de la renta variable", [
        "Un fondo o ETF global reparte tu dinero en cientos o miles de empresas de muchos países: diversificas con una sola compra.",
        "Ojo con lo que <b>parece</b> diversificado y no lo es: diez acciones tecnológicas del mismo país, o varios fondos que tienen las mismas empresas."]),
    T("Los límites: cuando todo cae a la vez", [
        "En crisis muy fuertes casi todos los activos de riesgo caen a la vez. Así fue 2008 (rentabilidades anuales aproximadas):"],
        { viz: () => divBars([["Acciones mundiales", "world"], ["Bonos", "bon"], ["Oro", "oro"], ["Liquidez", "liq"]].map(([l, k]) => ({ l, v: crsRet(k)[8] }))),
          note: "La diversificación <b>reduce</b> el golpe, no lo evita. Por eso se combina con un horizonte largo, aportaciones periódicas y un <b>rebalanceo</b> (volver a los porcentajes de partida) de vez en cuando." }),
    Q("¿Qué consigue la diversificación?", ["Eliminar el riesgo", "Reducir la dependencia de un único activo y moderar el riesgo", "Asegurar ganancias", "Evitar pagar comisiones"], 1, "Modera el riesgo, pero no lo elimina ni garantiza resultados."),
    Q("Cartera 50 % activo A (8 %) y 50 % activo B (2 %). ¿Rentabilidad media esperada?", ["10 %", "6 %", "5 %", "4 %"], 2, "0,5 × 8 + 0,5 × 2 = 5 %."),
    Q("¿Cuál de estas carteras está más diversificada?", ["Diez acciones tecnológicas de un solo país", "Un fondo global con cientos de empresas de muchos países", "Una sola acción muy conocida", "Tres fondos con las mismas empresas"], 1, "Reparte entre más empresas, países y sectores."),
    Q("En 2008 casi todas las bolsas cayeron a la vez. ¿Qué enseña?", ["Que diversificar no sirve", "Que la diversificación modera las caídas, pero no las evita en una crisis global", "Que hay que vender todo", "Que los bonos siempre suben"], 1, "Sirve para reducir el impacto, no para eliminar el riesgo de mercado.")
  ] },

{ id: "costes", level: 2, title: "Costes y comisiones", sub: "Pequeños porcentajes, grandes diferencias", practice: "costes",
  learn: ["Qué costes tiene un fondo y cuándo se cobran", "Cuánto muerden a 30 años", "Dónde mirar los costes antes de contratar"],
  steps: [
    T("Los costes se cobran siempre, ganes o pierdas", [
        "Los gastos de un fondo (gastos corrientes o <b>TER</b>) se descuentan cada año del patrimonio. Si cobran un 1,5 % y el mercado rinde un 5 %, tu rentabilidad se queda en torno a un 3,5 %.",
        "Hay más costes: comisiones de suscripción o reembolso, de custodia, de intermediación al comprar y vender, y a veces una <b>comisión de éxito</b>."]),
    M("Cómo muerde el largo plazo", "Rentabilidad neta ≈ rentabilidad bruta − costes",
        { p: "El coste se resta cada año de la rentabilidad, y al componerse durante décadas el efecto se multiplica.",
          ex: () => { const f = c => fv(0, 100, 30, 5 - c); return { title: "100 € al mes durante 30 años, rentabilidad bruta del 5 %", lines: [`Costes 0,2 %: <b>${nEur(f(0.2))}</b>`, `Costes 1,5 %: <b>${nEur(f(1.5))}</b>`, `Costes 2,5 %: <b>${nEur(f(2.5))}</b>`, `Un punto más de costes (5 % → 4 %) deja un <b>${Math.round((1 - fv(0, 100, 30, 4) / fv(0, 100, 30, 5)) * 100)} % menos</b> de capital final.`] }; },
          viz: () => barsH([0.2, 1.5, 2.5].map((c, i) => ({ l: `Costes del ${String(c).replace(".", ",")} %`, v: fv(0, 100, 30, 5 - c), cls: ["b", "a", "d"][i] })), { cap: "Capital final tras 30 años aportando 100 € al mes." }) }),
    C("Calculadora de comisiones", [
        { id: "a", l: "Aportación mensual", min: 20, max: 500, step: 10, v: 100, f: nEur }, { id: "n", l: "Años", min: 5, max: 40, step: 1, v: 30, f: nYr }, { id: "r", l: "Rentabilidad bruta", min: 2, max: 10, step: 0.5, v: 5, f: nPct }, { id: "c", l: "Costes anuales", min: 0, max: 3, step: 0.1, v: 1.5, f: nPct }],
        ({ a, n, r, c }) => { const sin = fv(0, a, n, r), con = fv(0, a, n, Math.max(0, r - c)); return `<p>Sin costes llegarías a <b>${nEur(sin)}</b>; con ellos, a <b>${nEur(con)}</b>. Los costes te quitan <b>${nEur(sin - con)}</b> (${Math.round((1 - con / sin) * 100)} %).</p>${lineChart({ xs: range(n), xTicks: yrTicks(n), xFmt: xYears, alt: "Capital con y sin costes", series: [{ y: range(n).map(y => fv(0, a, y, r)), cls: "b", name: "Sin costes" }, { y: range(n).map(y => fv(0, a, y, Math.max(0, r - c))), cls: "a", name: "Con costes", area: true }] })}`; }),
    T("Dónde mirar los costes", [
        "El <b>Documento de Datos Fundamentales (DFI / KID)</b> de cada fondo indica sus costes y un indicador de riesgo de 1 a 7.",
        "Busca los <b>gastos corrientes (TER)</b> y compáralos entre fondos de la misma estrategia: un fondo indexado global suele costar una fracción de uno de gestión activa.",
        "Lo caro no es mejor por serlo: según diversos estudios, en periodos largos la mayoría de fondos de gestión activa no supera a su índice de referencia una vez descontados los costes."]),
    Q("Un fondo cobra un 1,5 % anual de gastos. ¿Cuándo se descuenta?", ["Solo si gana dinero", "Cada año, ganes o pierdas", "Solo al vender", "Una única vez"], 1, "Los gastos corrientes se descuentan del patrimonio de forma continua."),
    Q("Un fondo rinde un 6 % bruto y tiene costes del 1 %. ¿Rentabilidad neta aproximada?", ["7 %", "6 %", "5 %", "1 %"], 2, "Rentabilidad neta ≈ bruta − costes = 6 − 1 = 5 %."),
    Q("¿Qué documento resume los costes y el riesgo de un fondo?", ["La factura del banco", "El DFI / KID", "El extracto mensual", "El contrato de la cuenta"], 1, "El Documento de Datos Fundamentales es obligatorio y estandarizado."),
    Q("A 30 años, ¿qué efecto tiene un punto más de costes anuales?", ["Ninguno apreciable", "Reduce el capital final de forma notable (del orden del 16 %)", "Lo duplica", "Solo afecta al primer año"], 1, "Al componerse durante décadas, un punto extra de costes resta en torno a una sexta parte del capital final.")
  ] },

/* ============================ NIVEL 3 ============================ */
{ id: "bonos", level: 3, title: "Renta fija y tipos de interés", sub: "Por qué el precio de un bono baja cuando suben los tipos", practice: null,
  learn: ["Qué es un bono: cupón, nominal y vencimiento", "Cómo se calcula su precio", "Por qué la renta fija también cae"],
  steps: [
    T("Un bono es un préstamo", [
        "Al comprar un <b>bono</b> prestas dinero a un Estado o a una empresa (el <b>emisor</b>). A cambio recibes un <b>cupón</b> periódico y te devuelven el <b>nominal</b> al <b>vencimiento</b>.",
        "No está libre de riesgo: el emisor puede no pagar (<b>riesgo de crédito</b>, medido por el <b>rating</b>) y el precio del bono cambia con los tipos de interés (<b>riesgo de tipos</b>)."]),
    M("Precio de un bono", "Precio = Σ Cupón ÷ (1 + y)<sup>t</sup> + Nominal ÷ (1 + y)<sup>n</sup>",
        { p: "El precio es el valor, a día de hoy, de todos los pagos futuros descontados a la rentabilidad que exige el mercado.",
          vars: [["y", "rentabilidad exigida hoy por el mercado (yield)"], ["t", "año de cada cupón"], ["n", "años hasta el vencimiento"]],
          ex: () => ({ title: "Bono de 1.000 € de nominal, cupón del 3 %, 5 años", lines: [`Si el mercado exige un 3 %: precio <b>${e2(bondPrice(3, 3, 5))}</b>`, `Si los tipos suben y exige un 4 %: <b>${e2(bondPrice(3, 4, 5))}</b>`, `Si los tipos bajan y exige un 2 %: <b>${e2(bondPrice(3, 2, 5))}</b>`, "<b>Tipos arriba, precio abajo; tipos abajo, precio arriba.</b>"] }) }),
    T("Por qué los bonos cayeron en 2022", [
        () => `En 2022 los bancos centrales subieron los tipos para frenar la inflación. Los bonos ya emitidos, con cupones más bajos, valían menos y el índice agregado de bonos de EE. UU. cayó alrededor de un <b>${String(Math.abs(crsRet("bon")[22])).replace(".", ",")} %</b> (dato anual aproximado).`,
        "Cuanto <b>más largo el vencimiento</b>, más sensible es el precio a los tipos:"],
        { viz: () => lineChart({ xs: [1, 2, 3, 4, 5, 6, 7], xTicks: [1, 2, 3, 4, 5, 6, 7], xFmt: v => `${v} %`, yMin: 600, yFmt: v => nEur(v), alt: "Precio de un bono según los tipos", series: [{ y: [1, 2, 3, 4, 5, 6, 7].map(y => bondPrice(3, y, 2)), cls: "d", name: "Vence en 2 años" }, { y: [1, 2, 3, 4, 5, 6, 7].map(y => bondPrice(3, y, 5)), cls: "b", name: "5 años" }, { y: [1, 2, 3, 4, 5, 6, 7].map(y => bondPrice(3, y, 10)), cls: "a", name: "10 años" }], cap: "Precio de un bono de 1.000 € con cupón del 3 % según el tipo que exige el mercado (eje horizontal)." }) }),
    C("Mueve los tipos y mira el precio", [
        { id: "c", l: "Cupón", min: 1, max: 6, step: 0.5, v: 3, f: nPct }, { id: "n", l: "Años hasta el vencimiento", min: 1, max: 30, step: 1, v: 5, f: nYr }, { id: "y", l: "Rentabilidad exigida hoy", min: 0.5, max: 8, step: 0.25, v: 4, f: nPct }],
        ({ c, n, y }) => { const p = bondPrice(c, y, n), up = bondPrice(c, y + 1, n); return `<p>Precio del bono: <b>${e2(p)}</b> (${sg((p / 1000 - 1) * 100)} frente al nominal).</p><p>Si los tipos suben un punto más, el precio caería a <b>${e2(up)}</b>: <b>${sg((up / p - 1) * 100)}</b>.</p>${barsH([{ l: "Nominal", v: 1000, cls: "d" }, { l: "Precio hoy", v: p, cls: "b" }], { max: Math.max(1000, p), fmt: e2 })}`; }),
    Q("Si suben los tipos de interés, ¿qué suele pasar con el precio de un bono ya emitido?", ["Sube", "Baja", "No cambia", "Se duplica"], 1, "Los bonos nuevos pagan más, así que los antiguos valen menos."),
    Q("¿Qué es el cupón?", ["El precio del bono", "El interés periódico que paga el bono", "La comisión del banco", "El día del vencimiento"], 1, "Es lo que cobra el inversor cada periodo por prestar su dinero."),
    Q("Ante la misma subida de tipos, un bono a 30 años frente a uno a 2 años…", ["Cae menos", "Cae más", "Cae igual", "Sube"], 1, "A mayor vencimiento, mayor sensibilidad del precio a los tipos."),
    Q("¿Qué mide el rating de un emisor?", ["Su beneficio por acción", "Su capacidad para pagar sus deudas", "El precio del bono", "El tipo de interés del banco central"], 1, "Las agencias lo asignan para valorar el riesgo de crédito.")
  ] },

{ id: "valoracion", level: 3, title: "Valoración: PER y dividendos", sub: "Cuánto pagas por lo que gana una empresa", practice: null,
  learn: ["Qué es una acción y de dónde sale su valor", "PER, rentabilidad por beneficio y por dividendo", "Por qué un ratio solo no basta"],
  steps: [
    T("Una acción es un trozo de empresa", [
        "Al comprar una <b>acción</b> te haces dueño de una pequeña parte de la empresa: de sus beneficios futuros y, a veces, de un <b>dividendo</b> que reparte.",
        "La pregunta clave es si el precio que pagas es razonable respecto a lo que gana. Para eso existen ratios sencillos."]),
    M("PER y rentabilidad por beneficio", "PER = Precio ÷ Beneficio por acción (BPA)<br>Rentabilidad por beneficio = BPA ÷ Precio = 1 ÷ PER",
        { vars: [["BPA", "beneficio anual de la empresa ÷ número de acciones"], ["Dividendo", "parte del beneficio que reparte, por acción"]],
          ex: () => ({ title: "Acción a 50 € con un beneficio de 2,50 € por acción", lines: ["PER = 50 ÷ 2,50 = <b>20</b>", "Rentabilidad por beneficio = 2,50 ÷ 50 = <b>5 %</b>", "Si reparte 1 € de dividendo: 1 ÷ 50 = <b>2 %</b> de rentabilidad por dividendo."] }) }),
    T("Un PER, muchas lecturas", [
        "Cuanto mayor es el PER, menos beneficio obtienes por cada euro pagado, y viceversa:"],
        { viz: () => barsH([10, 15, 20, 30, 50].map(p => ({ l: `PER ${p}`, v: 100 / p, cls: "b", t: `${p1(100 / p)} %` })), { max: 10, cap: "Rentabilidad por beneficio (1 ÷ PER)." }),
          note: "Un PER alto no es «malo» por sí solo (puede reflejar que se espera crecer mucho) y uno bajo no es una ganga automática (puede esconder problemas)." }),
    C("Calcula los ratios", [
        { id: "p", l: "Precio de la acción", min: 5, max: 200, step: 1, v: 50, f: nEur }, { id: "b", l: "Beneficio por acción", min: 0.5, max: 15, step: 0.1, v: 2.5, f: v => `${p1(v)} €` }, { id: "d", l: "Dividendo por acción", min: 0, max: 6, step: 0.1, v: 1, f: v => `${p1(v)} €` }],
        ({ p, b, d }) => `<dl class="stats"><div><dt>PER</dt><dd>${p1(p / b)}</dd></div><div><dt>Rentabilidad por beneficio</dt><dd>${fPct(b / p * 100)}</dd></div><div><dt>Rentabilidad por dividendo</dt><dd>${fPct(d / p * 100)}</dd></div><div><dt>Parte del beneficio que reparte</dt><dd>${fPct(Math.min(999, d / b * 100), 0)}</dd></div></dl>`),
    T("Límites y buenas prácticas", [
        "Un ratio no basta: compara con empresas del mismo sector y con su propia historia, y mira la deuda, los márgenes y el crecimiento.",
        "Los beneficios cambian con el ciclo económico y pueden verse afectados por criterios contables o resultados extraordinarios.",
        "Para la mayoría de personas, comprar <b>cientos de empresas a la vez</b> con un fondo indexado evita tener que acertar con una sola."]),
    Q("Una acción cotiza a 40 € y gana 2 € por acción. ¿Cuál es su PER?", ["2", "20", "40", "80"], 1, "PER = precio ÷ BPA = 40 ÷ 2 = 20."),
    Q("Un PER de 25 equivale a una rentabilidad por beneficio de…", ["25 %", "2,5 %", "4 %", "10 %"], 2, "1 ÷ 25 = 0,04 = 4 %."),
    Q("Una acción que cotiza a 30 € paga 1,50 € de dividendo al año. ¿Rentabilidad por dividendo?", ["1,5 %", "5 %", "20 %", "0,5 %"], 1, "1,50 ÷ 30 = 5 %."),
    Q("¿Por qué un PER bajo no garantiza que una acción sea barata?", ["Porque el PER no se puede calcular", "Porque puede reflejar problemas de la empresa o beneficios extraordinarios", "Porque siempre sube", "Porque solo vale para bancos"], 1, "Un ratio aislado puede engañar: hay que mirar el contexto de la empresa.")
  ] },

{ id: "sesgos", level: 3, title: "Psicología del inversor", sub: "Por qué decidimos mal con el dinero (y cómo evitarlo)", practice: null,
  learn: ["Los sesgos que más cuestan", "Por qué una pérdida duele el doble que una ganancia", "Qué cuesta perderse los mejores años"],
  steps: [
    T("Tu cerebro no está hecho para invertir", ["Casi siempre el mayor enemigo del inversor es él mismo. Estos son los sesgos que más dinero cuestan:"],
        { list: ["<b>Aversión a las pérdidas</b>: una pérdida duele más que lo que alegra una ganancia igual. Lleva a vender en pánico.", "<b>Efecto rebaño y FOMO</b>: comprar porque «todo el mundo» compra o por miedo a perderse una subida.", "<b>Exceso de confianza</b>: creer que sabes más de lo que sabes y operar demasiado.", "<b>Anclaje</b>: aferrarse al precio al que compraste, aunque ya no sea relevante.", "<b>Sesgo de recencia</b>: pensar que lo que ha pasado últimamente va a seguir pasando."] }),
    M("Perder duele más que ganar alegra", "v(x) = x<sup>α</sup> si x ≥ 0 &nbsp;·&nbsp; v(x) = −λ · (−x)<sup>α</sup> si x &lt; 0",
        { p: "La <b>teoría de las perspectivas</b> (Kahneman y Tversky) describe cómo valoramos subjetivamente ganancias y pérdidas.",
          vars: [["α", "≈ 0,88: cada euro adicional importa menos"], ["λ", "≈ 2,25: aversión a las pérdidas (estimación de 1992)"]],
          ex: () => { const g = Math.pow(100, 0.88); return { title: "Ganar 100 € frente a perder 100 €", lines: [`Ganar 100 €: v = 100<sup>0,88</sup> ≈ <b>${p1(g)}</b>`, `Perder 100 €: v = −2,25 × ${p1(g)} ≈ <b>${p1(-2.25 * g)}</b>`, "La pérdida pesa unas <b>2,25 veces</b> más."] }; },
          viz: () => lineChart({ xs: range(20).map(i => -100 + i * 10), xTicks: [-100, -50, 0, 50, 100], xFmt: v => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)} €`, yFmt: v => String(Math.round(v)).replace("-", "−"), alt: "Función de valor de la teoría de las perspectivas", series: [{ y: range(20).map(i => { const x = -100 + i * 10; return x >= 0 ? Math.pow(x, 0.88) : -2.25 * Math.pow(-x, 0.88); }), cls: "a", name: "Valor subjetivo" }], cap: "Eje horizontal: ganancia o pérdida. Eje vertical: lo que sentimos, en unidades arbitrarias." }) }),
    C("¿Cuánto cuesta perderse los mejores años?", [{ id: "n", l: "Mejores años que te pierdes", min: 0, max: 5, step: 1, v: 0, f: v => `${v}` }],
        ({ n }) => { const w = crsRet("world"), idx = w.map((r, i) => [r, i]).sort((a, b) => b[0] - a[0]), skip = new Set(idx.slice(0, n).map(x => x[1])), fin = w.reduce((p, r, i) => p * (skip.has(i) ? 1 : 1 + r / 100), 10000), all = w.reduce((p, r) => p * (1 + r / 100), 10000);
            return `<p>10.000 € en el índice mundial, 2000–2024 (datos aproximados):</p>${barsH([{ l: "Siempre invertido", v: all, cls: "b" }, { l: n ? `Sin los ${n} mejores años` : "Sin perderte ninguno", v: fin, cls: n ? "d" : "b" }], { max: all })}
                ${n ? `<p class="muted small">Te pierdes: ${idx.slice(0, n).map(([r, i]) => `${2000 + i} (${sg(r)})`).join(", ")}. Resultado: <b>${sg((fin / all - 1) * 100)}</b> frente a no haberte movido.</p>` : `<p class="muted small">Mueve el deslizador: varios de los mejores años (2003, 2009, 2019, 2023) llegaron justo después de años negativos.</p>`}`; }),
    T("Antídotos", [
        "Escribe un <b>plan</b> antes de que haya turbulencias: objetivo, plazo y qué harás si cae un 20 %.",
        "<b>Automatiza</b> las aportaciones (una cantidad fija periódica): compras barato y caro sin tener que adivinar.",
        "Mira menos la cartera: revisarla cada día aumenta la tentación de actuar por impulso.",
        "Diversifica y <b>rebalancea</b> en fechas fijas, no por emociones."]),
    Q("¿Qué es la aversión a las pérdidas?", ["Evitar cualquier inversión", "Sentir más el dolor de perder que el placer de ganar la misma cantidad", "Vender cuando sube", "No mirar la cartera"], 1, "Las pérdidas pesan más (en torno a 2 veces) que las ganancias equivalentes."),
    Q("Todo el mundo habla de una acción que sube sin parar y quieres comprar por miedo a perdértela. ¿Qué sesgo es?", ["Anclaje", "Efecto rebaño / FOMO", "Diversificación", "Rebalanceo"], 1, "Decidir por el miedo a quedarte fuera suele llevar a comprar caro."),
    Q("Los datos del curso muestran que perderse unos pocos de los mejores años…", ["No afecta al resultado", "Reduce mucho el resultado final", "Lo mejora", "Solo afecta a los bonos"], 1, "Pocos años concentran gran parte de la rentabilidad, y suelen llegar tras las caídas."),
    Q("¿Qué ayuda a no decidir por impulso?", ["Mirar la cartera cada hora", "Un plan escrito y aportaciones automáticas", "Seguir las noticias del día", "Copiar lo que hace un conocido"], 1, "Un plan previo y la automatización reducen la influencia de las emociones.")
  ] }
];
