/* Respuestas predefinidas del asistente. Se usan en el servidor (Node) y en el navegador
   cuando la IA gratuita no está disponible o va saturada. */
function localCoach(msg, ctx) {
    const m = msg.toLowerCase();
    const left = (ctx?.goals || []).filter(g => g.saved < g.target);
    if (/^(hola|buenas|hey)/.test(m)) return "Hola. Puedo ayudarte con conceptos como el interés compuesto, la inflación, el riesgo o la diversificación, y comentar la evolución de tus objetivos.";
    if (/compuesto/.test(m)) return "El interés compuesto consiste en obtener rendimientos sobre rendimientos ya generados. Con 100 € al mes durante 10 años y un 5 % anual hipotético, se aportan 12.000 € y el capital podría rondar los 15.500 €. El plazo pesa más que el importe: empezar pronto es la principal ventaja. Se trata de una simulación, no de una previsión.";
    if (/inflaci/.test(m)) return "La inflación reduce el poder adquisitivo del dinero. Con una inflación del 3 % anual, un importe sin remunerar pierde en torno a un 26 % de capacidad de compra en diez años. En el simulador puedes ver los importes en términos reales para tenerlo en cuenta.";
    if (/diversific/.test(m)) return "Diversificar es repartir la inversión entre distintos activos, sectores y regiones. Reduce la dependencia de que un único activo evolucione bien; no elimina el riesgo, pero lo modera.";
    if (/riesgo|perder|p[eé]rdida/.test(m)) return "A mayor rentabilidad potencial, mayor riesgo de pérdida. La referencia principal es el plazo: si necesitarás el dinero en menos de tres años, suele primar la estabilidad; con horizontes de diez años o más es posible asumir más volatilidad. El cuestionario de perfil, en Aprende, te ayudará a situarte.";
    if (/emergencia|colch[oó]n/.test(m)) return "Antes de invertir conviene disponer de un colchón de entre tres y seis meses de gastos básicos en un instrumento líquido y de bajo riesgo. Así evitas deshacer inversiones en un mal momento ante un imprevisto.";
    if (/empez|invertir|invierto/.test(m)) return "Un orden razonable es: primero, un colchón de emergencia; segundo, definir objetivos con importe y plazo; tercero, aportar de forma periódica y automática; y cuarto, conocer los costes y riesgos de cada producto. No hace falta mucho capital, sino constancia. Para decisiones concretas, consulta con un asesor profesional.";
    if (/estafa|chiringuito|fraude/.test(m)) return "Señales de alerta de una estafa de inversión: rentabilidades altas «garantizadas», presión para decidir rápido, contacto por redes o llamadas no solicitadas y entidades que no figuran en los registros de la CNMV o del Banco de España. Ante la duda, verifica en cnmv.es antes de enviar dinero.";
    if (/apuesta|apostar|juego/.test(m)) return "Apostar no es invertir. En una apuesta el resultado esperado es negativo por diseño: la casa gana a largo plazo. Invertir consiste en aportar capital a activos que pueden generar valor con el tiempo, asumiendo un riesgo que se puede medir y diversificar.";
    if (/cripto|bitcoin/.test(m)) return "Las criptomonedas son activos muy volátiles y, en muchos casos, sin un valor subyacente fácil de explicar. Una regla prudente: no invertir en nada que no sepas explicar con tus palabras, y nunca dinero que puedas necesitar a corto plazo.";
    if (/comisi|coste/.test(m)) return "Las comisiones se cobran cada año sobre todo tu capital, así que se componen igual que la rentabilidad. Un punto anual de diferencia puede suponer en torno a un 16 % menos de capital tras 30 años. Compara siempre los gastos totales antes de contratar.";
    if (/loud budgeting/.test(m)) return "El loud budgeting consiste en decir abiertamente «esto no entra en mi presupuesto» y proponer alternativas. Normaliza hablar de dinero y reduce el gasto por presión social.";
    if (/doom spending|gasto emocional/.test(m)) return "El doom spending es gastar para aliviar el estrés o la incertidumbre. Ayuda esperar 48 horas antes de una compra no planificada y tener automatizado el ahorro a principio de mes, para que no dependa de la fuerza de voluntad.";
    if (/soft saving/.test(m)) return "El soft saving propone ahorrar de forma sostenible sin renunciar a disfrutar hoy. La clave es fijar una aportación automática realista y gastar el resto sin culpa, revisándola cuando mejoren tus ingresos.";
    if (/regla del 72|duplica/.test(m)) return "La regla del 72 estima cuántos años tarda un capital en duplicarse: 72 dividido entre la rentabilidad anual. Al 6 %, unos 12 años; al 3 %, unos 24. Es una aproximación útil, no un cálculo exacto.";
    if (/burbuja|plazo|horizonte|ca[ií]da/.test(m)) return "Las caídas forman parte de invertir. Lo determinante es el horizonte: si no vas a necesitar el dinero en muchos años, una caída temporal no tiene por qué convertirse en pérdida; si lo necesitas pronto, conviene priorizar la estabilidad. Diversificar reduce el impacto de que un solo activo o sector caiga.";
    if (/meta|objetivo|c[oó]mo (voy|van)|ahorr/.test(m) && left.length) {
        const g = left[0];
        return `Tu objetivo «${g.name}» presenta un avance del ${Math.round((g.saved / g.target) * 100)} %. Restan ${Math.round(g.target - g.saved).toLocaleString("es-ES")} € y la aportación prevista es de ${g.monthly} € al mes. En el simulador puedes comprobar el efecto de incrementar ligeramente esa aportación.`;
    }
    return "Puedo ayudarte con el interés compuesto, la inflación, el riesgo, la diversificación, el colchón de emergencia o el seguimiento de tus objetivos. ¿Sobre cuál quieres profundizar?";
}

if (typeof module !== "undefined") module.exports = { localCoach };
