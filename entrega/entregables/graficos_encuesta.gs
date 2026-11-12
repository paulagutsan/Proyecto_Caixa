/**
 * GRÁFICOS DE LA ENCUESTA «Jóvenes y dinero»
 *
 * Crea en la hoja de respuestas dos pestañas nuevas:
 *   · «Gráficos»: los datos clave para las diapositivas y 14 gráficos.
 *   · «Datos gráficos»: las tablas en las que se basan los gráficos.
 * No toca la pestaña de respuestas. Cada vez que lo ejecutas, las dos pestañas se rehacen con los datos nuevos.
 *
 * Cómo usarlo:
 *   1. Pega este archivo debajo del código que ya tienes en Apps Script y guarda (Ctrl + S).
 *   2. Elige «crearGraficos» en el desplegable y pulsa Ejecutar. Acepta los permisos nuevos.
 *   3. (Opcional) Ejecuta una vez «activarActualizacionAutomatica» para que los gráficos
 *      se rehagan solos cada vez que alguien responde.
 */

var ID_HOJA_RESPUESTAS_ = '1ugk1Bq_X1bmZmJau63MfUw1lI8dbsQiLW_ZaLFIaDjE';
var COLOR_ = { azul: '#007eae', verde: '#0a9d58', rojo: '#e0383e', gris: '#9aa3ab', marino: '#00344f', amarillo: '#ffc20e' };
var PALETA_ = ['#007eae', '#0a9d58', '#ffc20e', '#e0383e', '#00344f', '#8fc7df', '#9aa3ab', '#b8542c', '#5899d2'];

// Respuestas correctas de las 3 preguntas de cultura financiera
var CORRECTAS_ = { interes: 'Más de 102 €', inflacion: 'Menos que hoy', diversificacion: 'Falso' };
var INVIERTE_SI_ = ['Fondos de inversión', 'ETF', 'Acciones', 'Criptomonedas', 'Plan de pensiones'];

function crearGraficos() {
  var ss = abrirHoja_();
  var hojaResp = ss.getSheets().filter(function (s) { return s.getFormUrl(); })[0] || ss.getSheets()[0];
  var todo = hojaResp.getDataRange().getValues();
  var cab = todo[0].map(String);
  var filas = todo.slice(1).filter(function (r) { return r.join('').trim() !== ''; });
  var n = filas.length;
  if (!n) throw new Error('Todavía no hay respuestas en la hoja.');
  var form = hojaResp.getFormUrl() ? FormApp.openByUrl(hojaResp.getFormUrl()) : null;

  // ---------- utilidades de lectura
  function col(prefijos) {
    prefijos = [].concat(prefijos);
    for (var i = 0; i < cab.length; i++) for (var j = 0; j < prefijos.length; j++) if (cab[i].indexOf(prefijos[j]) === 0) return i;
    return -1;
  }
  // Si una pregunta cambió de título, la hoja guarda las respuestas en dos columnas: las unimos
  function vals(prefijos) {
    prefijos = [].concat(prefijos);
    var cols = [];
    cab.forEach(function (h, i) { if (prefijos.some(function (p) { return h.indexOf(p) === 0; })) cols.push(i); });
    return filas.map(function (r) {
      return cols.map(function (c) { return String(r[c]).trim(); }).filter(function (x) { return x; }).join(', ');
    });
  }
  function opciones(prefijos) {
    if (!form) return null;
    prefijos = [].concat(prefijos);
    var it = form.getItems().filter(function (i) {
      return prefijos.some(function (p) { return i.getTitle().indexOf(p) === 0; });
    })[0];
    if (!it) return null;
    var t = it.getType();
    if (t === FormApp.ItemType.CHECKBOX) return it.asCheckboxItem().getChoices().map(function (c) { return c.getValue(); });
    if (t === FormApp.ItemType.MULTIPLE_CHOICE) return it.asMultipleChoiceItem().getChoices().map(function (c) { return c.getValue(); });
    return null;
  }
  // Una sola respuesta por persona: cuenta exacta, en el orden del formulario
  function contarUna(prefijos) {
    var v = vals(prefijos), ops = opciones(prefijos) || unicos_(v);
    var res = ops.map(function (o) { return [o, v.filter(function (x) { return x === o; }).length / n]; });
    return res.filter(function (r) { return r[1] > 0 || ops.length <= 8; });
  }
  // Varias respuestas por persona: % de personas que marcan cada opción (las opciones pueden llevar comas)
  function contarVarias(prefijos) {
    var v = vals(prefijos), ops = (opciones(prefijos) || []).slice();
    var largo = ops.slice().sort(function (a, b) { return b.length - a.length; });
    var cuenta = {}; ops.forEach(function (o) { cuenta[o] = 0; });
    var otros = 0;
    v.forEach(function (celda) {
      var resto = celda;
      largo.forEach(function (o) { if (resto.indexOf(o) >= 0) { cuenta[o]++; resto = resto.replace(o, ''); } });
      if (resto.replace(/[,\s]/g, '').length > 0) otros++;
    });
    var res = ops.map(function (o) { return [o, cuenta[o] / n]; });
    if (otros) res.push(['Otro', otros / n]);
    return res.sort(function (a, b) { return b[1] - a[1]; });
  }

  // ---------- cálculos
  var productos = vals('¿Tienes ahora');
  var invierte = productos.map(function (p) { return INVIERTE_SI_.some(function (o) { return p.indexOf(o) >= 0; }); });
  var pInvierte = media_(invierte.map(Number));
  var pCripto = media_(productos.map(function (p) { return p.indexOf('Criptomonedas') >= 0 ? 1 : 0; }));

  var q1 = vals('Tienes 100 €'), q2 = vals('Tu cuenta da'), q3 = vals('Verdadero o falso');
  var aciertos = filas.map(function (_, i) {
    return (q1[i] === CORRECTAS_.interes) + (q2[i] === CORRECTAS_.inflacion) + (q3[i] === CORRECTAS_.diversificacion);
  });
  var saber = vals('¿Cuánto crees que sabes').map(Number);

  var frenos = contarVarias(['Si no inviertes', '¿Qué te frena']);
  var pNoSe = valorDe_(frenos, 'No sé por dónde empezar');
  var fuentes = contarVarias('¿Dónde aprendes');
  var pRedes = valorDe_(fuentes, 'TikTok, Instagram o YouTube');
  var fomo = contarUna('¿Alguna vez has invertido');
  var apartar = contarUna('¿Cuánto podrías apartar');
  var pPoco = ['Nada ahora mismo', 'Menos de 25 €', '25-50 €'].reduce(function (s, o) { return s + valorDe_(apartar, o); }, 0);
  var metas = contarVarias('¿Para qué ahorr');

  // Interés por cada idea (tabla de la cuadrícula)
  var ideas = [];
  var filasActuales = null;   // solo las ideas que hay ahora en el formulario
  if (form) form.getItems(FormApp.ItemType.GRID).forEach(function (g) { filasActuales = g.asGridItem().getRows(); });
  cab.forEach(function (h, c) {
    if (h.indexOf('¿Cuánto te interesa') === 0) {
      var m = h.match(/\[(.*)\]\s*$/);
      if (filasActuales && m && filasActuales.indexOf(m[1]) < 0) return;
      var notas = filas.map(function (r) { return r[c] === '' ? NaN : Number(r[c]); });
      if (!notas.some(function (x) { return !isNaN(x); })) return;
      var notasInv = notas.filter(function (_, i) { return invierte[i]; });
      var notasNo = notas.filter(function (_, i) { return !invierte[i]; });
      ideas.push([m ? m[1] : h, media_(notas), mediaOVacio_(notasInv), mediaOVacio_(notasNo)]);
    }
  });
  ideas.sort(function (a, b) { return b[1] - a[1]; });

  var usaria = vals('¿Usarías').map(Number);
  var nps = vals('Del 0 al 10').map(Number).filter(function (x) { return !isNaN(x); });
  var npsValor = nps.length ? Math.round(100 * (nps.filter(function (x) { return x >= 9; }).length - nps.filter(function (x) { return x <= 6; }).length) / nps.length) : '';

  // ---------- pestañas
  var hG = rehacer_(ss, 'Gráficos'), hD = rehacer_(ss, 'Datos gráficos');
  hG.setHiddenGridlines(true);

  // Datos clave para rellenar las diapositivas
  var kpis = [
    ['Dato', 'Valor', 'Dónde va en el Entregable 04'],
    ['Respuestas', n, 'Diapositivas 2 y 3: n = ___'],
    ['Invierte hoy (fondos, ETF, acciones, cripto o pensiones)', pInvierte, 'Contexto'],
    ['Tiene cripto', pCripto, 'Diapositiva 3 · H2'],
    ['Aprende sobre dinero en redes sociales', pRedes, 'Diapositiva 3 · H2'],
    ['Ha invertido por FOMO', valorDe_(fomo, 'Sí'), 'Diapositiva 3 · H2'],
    ['Marca «No sé por dónde empezar» como freno', pNoSe, 'Diapositiva 3 · H1'],
    ['Acierta las 3 preguntas de cultura financiera', media_(aciertos.map(function (a) { return a === 3 ? 1 : 0; })), 'Diapositiva 3 · H1'],
    ['Podría apartar 50 € al mes o menos', pPoco, 'Diapositiva 3 · H3'],
    ['Meta n.º 1', metas.length ? metas[0][0] : '', 'Diapositiva 3 · H3'],
    ['Interés medio en la app (1-5)', redondea_(media_(usaria), 1), 'Diapositiva 3 · H4'],
    ['Usaría la app (4 o 5 sobre 5)', media_(usaria.map(function (x) { return x >= 4 ? 1 : 0; })), 'Diapositiva 3 · H4'],
    ['Idea favorita', ideas.length ? ideas[0][0] : '', 'Diapositiva 3 · H4 (función favorita)'],
    ['NPS (−100 a 100)', npsValor, 'Diapositiva 3 · H4'],
  ];
  hG.getRange(1, 1).setValue('Encuesta «Jóvenes y dinero» · actualizado ' + Utilities.formatDate(new Date(), 'Europe/Madrid', 'dd/MM/yyyy HH:mm'))
    .setFontSize(14).setFontWeight('bold').setFontColor(COLOR_.marino);
  var rk = hG.getRange(3, 1, kpis.length, 3).setValues(kpis);
  hG.getRange(3, 1, 1, 3).setBackground(COLOR_.azul).setFontColor('#ffffff').setFontWeight('bold');
  hG.getRange(4, 2, kpis.length - 1, 1).setFontWeight('bold').setHorizontalAlignment('right');
  [3, 4, 5, 6, 7, 8, 9, 12].forEach(function (i) { hG.getRange(3 + i - 1, 2).setNumberFormat('0%'); });
  hG.setColumnWidth(1, 380); hG.setColumnWidth(2, 140); hG.setColumnWidth(3, 260);
  rk.setBorder(true, true, true, true, true, true, '#d2d2d7', SpreadsheetApp.BorderStyle.SOLID);

  // ---------- tablas + gráficos
  var filaD = 1, k = 0, filaG0 = kpis.length + 6;
  function tabla(titulo, cabs, datos, formato) {
    hD.getRange(filaD, 1).setValue(titulo).setFontWeight('bold').setFontColor(COLOR_.marino);
    var r = hD.getRange(filaD + 1, 1, datos.length + 1, cabs.length).setValues([cabs].concat(datos));
    if (formato) hD.getRange(filaD + 2, 2, datos.length, cabs.length - 1).setNumberFormat(formato);
    filaD += datos.length + 4;
    return r;
  }
  function grafico(tipo, rango, titulo, extra) {
    var fila = filaG0 + Math.floor(k / 2) * 18, colAncla = (k % 2) ? 3 : 1, dx = (k % 2) ? 50 : 0;
    k++;
    var b = hG.newChart().setChartType(tipo).addRange(rango).setNumHeaders(1)
      .setPosition(fila, colAncla, dx, 0)
      .setOption('title', titulo).setOption('width', 560).setOption('height', 340)
      .setOption('titleTextStyle', { fontSize: 13, bold: true, color: '#1d1d1f' })
      .setOption('legend', { position: 'none' }).setOption('colors', [COLOR_.azul]);
    Object.keys(extra || {}).forEach(function (o) { b.setOption(o, extra[o]); });
    hG.insertChart(b.build());
  }
  var PCT = { hAxis: { format: 'percent', minValue: 0 } };
  var PCTV = { vAxis: { format: 'percent', minValue: 0 } };
  var TARTA = { pieHole: 0.45, legend: { position: 'right' }, colors: PALETA_ };

  grafico(Charts.ChartType.PIE, tabla('Edad', ['Edad', 'Personas'], contarUna('¿Cuántos años'), '0%'), 'Edad de quienes responden', TARTA);
  grafico(Charts.ChartType.PIE, tabla('Ocupación', ['Ocupación', 'Personas'], contarUna('¿A qué te dedicas'), '0%'), '¿A qué se dedican?', TARTA);
  grafico(Charts.ChartType.COLUMN, tabla('Dinero disponible al mes', ['Ingresos', '% personas'], contarUna('¿Cuánto dinero tienes'), '0%'), 'Dinero disponible al mes', PCTV);
  grafico(Charts.ChartType.PIE, tabla('¿Ahorra cada mes?', ['Respuesta', 'Personas'], contarUna('¿Consigues ahorrar'), '0%'), '¿Consiguen ahorrar cada mes?', TARTA);
  grafico(Charts.ChartType.BAR, tabla('Productos que tienen', ['Producto', '% personas'], contarVarias('¿Tienes ahora'), '0%'), '¿Qué productos tienen? (% de personas)', PCT);
  grafico(Charts.ChartType.COLUMN, tabla('Cuánto podrían apartar', ['Al mes', '% personas'], apartar, '0%'), '¿Cuánto podrían apartar al mes?', PCTV);
  grafico(Charts.ChartType.BAR, tabla('Para qué ahorran', ['Meta', '% personas'], metas, '0%'), '¿Para qué ahorran o ahorrarían?', PCT);
  grafico(Charts.ChartType.BAR, tabla('Frenos', ['Freno', '% personas'], frenos, '0%'), '¿Qué les frena para invertir?', extend_(PCT, { colors: [COLOR_.rojo] }));
  grafico(Charts.ChartType.BAR, tabla('Dónde aprenden', ['Fuente', '% personas'], fuentes, '0%'), '¿Dónde aprenden sobre dinero?', PCT);
  grafico(Charts.ChartType.PIE, tabla('FOMO', ['Respuesta', 'Personas'], fomo, '0%'), '¿Han invertido alguna vez por FOMO?', TARTA);

  var test = [
    ['Interés compuesto', media_(q1.map(function (x) { return x === CORRECTAS_.interes ? 1 : 0; }))],
    ['Inflación', media_(q2.map(function (x) { return x === CORRECTAS_.inflacion ? 1 : 0; }))],
    ['Diversificación', media_(q3.map(function (x) { return x === CORRECTAS_.diversificacion ? 1 : 0; }))],
    ['Las 3 bien', media_(aciertos.map(function (a) { return a === 3 ? 1 : 0; }))],
  ];
  grafico(Charts.ChartType.COLUMN, tabla('Cultura financiera', ['Pregunta', '% aciertos'], test, '0%'), 'Cultura financiera: % que acierta', extend_(PCTV, { colors: [COLOR_.verde] }));

  var dk = [1, 2, 3, 4, 5].map(function (s) {
    var g = aciertos.filter(function (_, i) { return saber[i] === s; });
    return [String(s), g.length ? media_(g) : 0];
  });
  grafico(Charts.ChartType.COLUMN, tabla('Lo que creen saber vs lo que saben', ['Cuánto creen saber (1-5)', 'Aciertos medios (de 3)'], dk, '0.0'),
    'Lo que creen saber vs lo que aciertan (de 3)', { vAxis: { minValue: 0, maxValue: 3 }, hAxis: { title: 'Cuánto creen saber (1 = nada, 5 = mucho)' }, colors: [COLOR_.marino] });

  if (ideas.length) {
    grafico(Charts.ChartType.BAR, tabla('Interés por idea', ['Idea', 'Interés medio (1-5)', 'Ya invierten', 'No invierten'],
      ideas.map(function (r) { return [r[0], redondea_(r[1], 2), r[2] === '' ? '' : redondea_(r[2], 2), r[3] === '' ? '' : redondea_(r[3], 2)]; }), '0.00').offset(0, 0, ideas.length + 1, 2),
      '¿Qué ideas interesan más? (media de 1 a 5)', { hAxis: { minValue: 1, maxValue: 5 } });
    var ultima = filaD - ideas.length - 4;   // la tabla anterior: reutilizamos sus columnas para comparar grupos
    var rCmp = hD.getRange(ultima + 1, 1, ideas.length + 1, 4);
    var b = hG.newChart().setChartType(Charts.ChartType.BAR).addRange(rCmp.offset(0, 0, ideas.length + 1, 1)).addRange(rCmp.offset(0, 2, ideas.length + 1, 2))
      .setNumHeaders(1).setPosition(filaG0 + Math.floor(k / 2) * 18, (k % 2) ? 3 : 1, (k % 2) ? 50 : 0, 0)
      .setOption('title', 'Interés por idea: quienes ya invierten vs quienes no').setOption('width', 560).setOption('height', 340)
      .setOption('titleTextStyle', { fontSize: 13, bold: true, color: '#1d1d1f' })
      .setOption('legend', { position: 'top' }).setOption('colors', [COLOR_.azul, COLOR_.gris]).setOption('hAxis', { minValue: 1, maxValue: 5 });
    hG.insertChart(b.build()); k++;
  }
  grafico(Charts.ChartType.BAR, tabla('Qué les daría confianza', ['Motivo', '% personas'], contarVarias('¿Qué te daría confianza'), '0%'), '¿Qué les daría confianza para usar la app?', PCT);
  var dist = [1, 2, 3, 4, 5].map(function (s) { return [String(s), media_(usaria.map(function (x) { return x === s ? 1 : 0; }))]; });
  grafico(Charts.ChartType.COLUMN, tabla('¿Usarían la app?', ['Puntuación (1 = seguro que no, 5 = seguro que sí)', '% personas'], dist, '0%'),
    '¿Usarían la app? (1 = seguro que no, 5 = seguro que sí)', extend_(PCTV, { colors: [COLOR_.verde] }));

  // Respuestas abiertas, para leerlas de un vistazo
  var abiertas = vals('¿Qué tendría que tener').filter(function (x) { return x; });
  if (abiertas.length) tabla('Respuestas abiertas: ¿qué tendría que tener para abrirla cada semana?', ['Respuesta'], abiertas.map(function (x) { return [x]; }));
  hD.setColumnWidth(1, 420);

  ss.setActiveSheet(hG);
  Logger.log('Gráficos creados con ' + n + ' respuestas. Pestaña «Gráficos» en ' + ss.getUrl());
}

/** Rehace los gráficos automáticamente cada vez que llega una respuesta (ejecútala una sola vez). */
function activarActualizacionAutomatica() {
  var ss = abrirHoja_();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'crearGraficos') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('crearGraficos').forSpreadsheet(ss).onFormSubmit().create();
  Logger.log('Listo: los gráficos se actualizarán con cada respuesta nueva.');
}

// ---------- ayudas
function abrirHoja_() {
  try { return SpreadsheetApp.openById(ID_HOJA_RESPUESTAS_); } catch (e) {
    var f = DriveApp.getFilesByName('Respuestas · Jóvenes y dinero');
    if (f.hasNext()) return SpreadsheetApp.openById(f.next().getId());
    throw new Error('No encuentro la hoja «Respuestas · Jóvenes y dinero».');
  }
}
function rehacer_(ss, nombre) {
  var h = ss.getSheetByName(nombre);
  if (h) ss.deleteSheet(h);
  return ss.insertSheet(nombre);
}
function media_(a) {
  var v = a.filter(function (x) { return typeof x === 'number' && !isNaN(x); });
  return v.length ? v.reduce(function (s, x) { return s + x; }, 0) / v.length : 0;
}
function mediaOVacio_(a) { return a.some(function (x) { return !isNaN(x); }) ? media_(a) : ''; }
function redondea_(x, d) { var p = Math.pow(10, d); return Math.round(x * p) / p; }
function valorDe_(tabla, etiqueta) { var r = tabla.filter(function (t) { return t[0] === etiqueta; })[0]; return r ? r[1] : 0; }
function unicos_(v) { return v.filter(function (x, i) { return x && v.indexOf(x) === i; }); }
function extend_(a, b) { var o = {}; Object.keys(a).forEach(function (k) { o[k] = a[k]; }); Object.keys(b).forEach(function (k) { o[k] = b[k]; }); return o; }
