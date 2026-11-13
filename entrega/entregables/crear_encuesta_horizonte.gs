/**
 * Crea la encuesta «Jóvenes y dinero» de Horizonte en tu Google Drive.
 *
 * Cómo usarlo (2 minutos):
 *   1. Entra en https://script.google.com con tu cuenta de Google y pulsa «Nuevo proyecto».
 *   2. Borra lo que haya, pega todo este archivo y pulsa Guardar.
 *   3. Arriba, elige la función «crearEncuesta» y pulsa «Ejecutar». Acepta los permisos.
 *   4. En «Registro de ejecución» aparecen dos enlaces: el de responder (para difundir)
 *      y el de editar. Las respuestas se guardan también en una hoja de cálculo.
 */

// Textos de la parte «Imagina una app así»: genéricos a propósito, para no desvelar cómo funciona cada idea
var AYUDA_APP_ = 'Estamos diseñando una app para empezar a ahorrar e invertir. ' +
  'No hace falta que inviertas hoy para opinar: puntúa cada idea según lo útil o divertida que te parezca.';
var TITULO_INTERES_ = '¿Cuánto te interesa cada idea? (1 = nada, 5 = mucho)';
var FILAS_INTERES_ = [
  'Aprender a invertir poco a poco, unos minutos al día',
  'Aprender jugando y competir con amigos, sin poner dinero',
  'Ver cuánto podría crecer tu dinero si lo inviertes',
  'Ponerte metas de ahorro y ver cómo avanzas',
  'Tener voz en las empresas en las que inviertes',
  'Conectar tu inversión con lo que ves en tu día a día',
  'Recibir apoyo para tus propios proyectos o ideas',
  'Ahorrar en grupo con tus amigos'
];

function crearEncuesta() {
  // Protección: si la encuesta ya existe, no crea otra (las respuestas siguen en la original)
  if (DriveApp.getFilesByName('Jóvenes y dinero · 5 minutos').hasNext()) {
    throw new Error('La encuesta ya existe, así que no creo otra. Elige otra función en el desplegable (por ejemplo, crearGraficos) antes de pulsar Ejecutar.');
  }
  var form = FormApp.create('Jóvenes y dinero · 5 minutos');
  form.setDescription(
    'Somos tres estudiantes de Comillas ICAI y participamos en un reto de innovación con CaixaBank Asset Management y Google. ' +
    'Queremos entender cómo ahorran e invierten los jóvenes de 18 a 29 años. Son 5 minutos, es anónima y no hay respuestas buenas ni malas.'
  );
  form.setProgressBar(true);
  form.setCollectEmail(false);

  // ---------- Bloque A · Sobre ti
  form.addSectionHeaderItem().setTitle('Sobre ti');
  form.addMultipleChoiceItem().setTitle('¿Cuántos años tienes?')
    .setChoiceValues(['Menos de 18', '18-21', '22-25', '26-29', '30 o más']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('¿A qué te dedicas ahora?')
    .setChoiceValues(['Estudio', 'Trabajo', 'Estudio y trabajo', 'Ninguna de las dos']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('¿Cuánto dinero tienes disponible al mes (sueldo, paga, ayudas…)?')
    .setChoiceValues(['No tengo ingresos propios', 'Menos de 300 €', '300-700 €', '700-1.200 €', 'Más de 1.200 €', 'Prefiero no decirlo']).setRequired(true);
  form.addCheckboxItem().setTitle('¿Qué bancos o apps de dinero usas? (puedes marcar varias)')
    .setChoiceValues(['CaixaBank o imagin', 'Santander u Openbank', 'BBVA', 'Revolut', 'Trade Republic', 'N26', 'MyInvestor o Indexa', 'Exchange de cripto (Binance, Bit2Me…)', 'Ninguna: no tengo cuenta propia'])
    .showOtherOption(true);

  // ---------- Bloque B · Ahorro e inversión
  form.addPageBreakItem().setTitle('Tu dinero hoy');
  form.addMultipleChoiceItem().setTitle('¿Consigues ahorrar algo cada mes?')
    .setChoiceValues(['Sí, casi siempre', 'A veces', 'No', 'No tengo ingresos para ahorrar']).setRequired(true);
  form.addCheckboxItem().setTitle('¿Tienes ahora alguno de estos productos? (puedes marcar varios)')
    .setChoiceValues(['Cuenta remunerada o depósito', 'Fondos de inversión', 'ETF', 'Acciones', 'Criptomonedas', 'Plan de pensiones', 'Ninguno: no tengo nada de esto'])
    .setRequired(true);
  form.addMultipleChoiceItem().setTitle('¿Cuánto podrías apartar al mes para tus metas sin que te cueste mucho?')
    .setChoiceValues(['Nada ahora mismo', 'Menos de 25 €', '25-50 €', '50-100 €', 'Más de 100 €']).setRequired(true);
  form.addCheckboxItem().setTitle('¿Para qué ahorras o ahorrarías? Elige hasta 2')
    .setChoiceValues(['Independizarme o la entrada de una vivienda', 'Viajes', 'Un colchón para imprevistos', 'Estudios', 'Un proyecto propio', 'Jubilación', 'Hacer crecer el dinero sin meta concreta', 'Ahora mismo no ahorro ni me lo planteo'])
    .setValidation(FormApp.createCheckboxValidation().requireSelectAtMost(2).build()).setRequired(true);
  form.addMultipleChoiceItem().setTitle('¿Alguna vez has invertido en algo porque lo estaba haciendo todo el mundo (miedo a quedarte fuera)?')
    .setChoiceValues(['Sí', 'No', 'Nunca he invertido']).setRequired(true);

  // ---------- Bloque C · Frenos, fuentes y conocimientos
  form.addPageBreakItem().setTitle('Qué te frena y dónde aprendes');
  form.addCheckboxItem().setTitle('Si no inviertes, ¿qué te frena? Si ya inviertes, ¿qué te frena para invertir más? Elige hasta 3')
    .setChoiceValues(['No sé por dónde empezar', 'Miedo a perder dinero', 'Tengo poco dinero', 'No me fío de bancos ni apps', 'Las comisiones', 'Pereza o papeleo', 'No lo necesito ahora', 'Nada: ya invierto lo que quiero', 'No me interesa invertir'])
    .setValidation(FormApp.createCheckboxValidation().requireSelectAtMost(3).build()).setRequired(true);
  form.addCheckboxItem().setTitle('¿Dónde aprendes sobre dinero e inversión? (puedes marcar varias)')
    .setChoiceValues(['TikTok, Instagram o YouTube', 'Familia', 'Amigos', 'Mi banco', 'Colegio o universidad', 'Apps de inversión', 'Prensa o podcasts', 'En ningún sitio']).setRequired(true);
  form.addScaleItem().setTitle('¿Cuánto crees que sabes de inversión?').setBounds(1, 5)
    .setLabels('Nada', 'Mucho').setRequired(true);
  // Las tres preguntas clásicas de Lusardi y Mitchell (las usa el Banco de España)
  form.addMultipleChoiceItem().setTitle('Tienes 100 € en una cuenta al 2 % anual. Tras 5 años sin tocarlos, ¿cuánto tendrás?')
    .setChoiceValues(['Más de 102 €', 'Exactamente 102 €', 'Menos de 102 €', 'No lo sé']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Tu cuenta da un 1 % al año y los precios suben un 2 %. Dentro de un año, con ese dinero podrás comprar…')
    .setChoiceValues(['Más que hoy', 'Lo mismo que hoy', 'Menos que hoy', 'No lo sé']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Verdadero o falso: comprar acciones de una sola empresa suele ser más seguro que un fondo con muchas empresas.')
    .setChoiceValues(['Verdadero', 'Falso', 'No lo sé']).setRequired(true);

  // ---------- Bloque D · Horizonte
  form.addPageBreakItem().setTitle('Imagina una app así').setHelpText(AYUDA_APP_);
  var grid = form.addGridItem().setTitle(TITULO_INTERES_);
  grid.setRows(FILAS_INTERES_).setColumns(['1', '2', '3', '4', '5']).setRequired(true);
  form.addCheckboxItem().setTitle('¿Qué te daría confianza para usar una app así? Elige hasta 2')
    .setChoiceValues(['Que sea de un banco conocido', 'Ver claro cuánto pago', 'Poder sacar el dinero cuando quiera', 'Opiniones de otros usuarios', 'Empezar con muy poco', 'Que no me pida datos innecesarios', 'Nada: no la usaría'])
    .setValidation(FormApp.createCheckboxValidation().requireSelectAtMost(2).build()).setRequired(true);
  form.addScaleItem().setTitle('¿Usarías una app que contase con lo que has marcado en la preguntas antriores?').setBounds(1, 5)
    .setLabels('Seguro que no', 'Seguro que sí').setRequired(true);
  form.addScaleItem().setTitle('Del 0 al 10, ¿cuánto se la recomendarías a un amigo?').setBounds(0, 10).setRequired(true);
  form.addParagraphTextItem().setTitle('¿Qué tendría que tener para que la abrieras cada semana?');

  var ss = SpreadsheetApp.create('Respuestas · Jóvenes y dinero');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  Logger.log('Enlace para responder (difúndelo): ' + form.getPublishedUrl());
  Logger.log('Enlace para editar: ' + form.getEditUrl());
  Logger.log('Hoja con las respuestas: ' + ss.getUrl());
}


/**
 * ARREGLA LA ENCUESTA QUE YA CREASTE (mismo enlace y misma hoja de respuestas).
 * Añade una opción válida para todo el mundo en las preguntas que daban por hecho
 * que la persona ahorra, invierte o usaría la app.
 * Ejecútala una sola vez: elige «actualizarEncuesta» arriba y pulsa Ejecutar.
 */
function actualizarEncuesta() {
  var form = encuestaBuena_();

  cambiar_(form, '¿Cuánto dinero tienes disponible al mes', null,
    ['No tengo ingresos propios', 'Menos de 300 €', '300-700 €', '700-1.200 €', 'Más de 1.200 €', 'Prefiero no decirlo']);
  cambiar_(form, '¿Qué bancos o apps de dinero usas', null,
    ['CaixaBank o imagin', 'Santander u Openbank', 'BBVA', 'Revolut', 'Trade Republic', 'N26', 'MyInvestor o Indexa',
     'Exchange de cripto (Binance, Bit2Me…)', 'Ninguna: no tengo cuenta propia']);
  cambiar_(form, '¿Consigues ahorrar algo cada mes', null,
    ['Sí, casi siempre', 'A veces', 'No', 'No tengo ingresos para ahorrar']);
  cambiar_(form, '¿Para qué ahorr', '¿Para qué ahorras o ahorrarías? Elige hasta 2',
    ['Independizarme o la entrada de una vivienda', 'Viajes', 'Un colchón para imprevistos', 'Estudios', 'Un proyecto propio',
     'Jubilación', 'Hacer crecer el dinero sin meta concreta', 'Ahora mismo no ahorro ni me lo planteo']);
  cambiar_(form, '¿Tienes ahora alguno de estos productos', null,
    [ 'Cuenta remunerada o depósito', 'Fondos de inversión', 'ETF', 'Acciones', 'Criptomonedas', 'Plan de pensiones','Ninguno: no tengo nada de esto']);
  cambiar_(form, ['¿Qué te frena para invertir', 'Si no inviertes'],
    'Si no inviertes, ¿qué te frena? Si ya inviertes, ¿qué te frena para invertir más? Elige hasta 3',
    ['No sé por dónde empezar', 'Miedo a perder dinero', 'Tengo poco dinero', 'No me fío de bancos ni apps', 'Las comisiones',
     'Pereza o papeleo', 'No lo necesito ahora', 'Nada: ya invierto lo que quiero', 'No me interesa invertir']);
  cambiar_(form, '¿Qué te daría confianza', '¿Qué te daría confianza para usar una app así? Elige hasta 2',
    ['Que sea de un banco conocido', 'Ver claro cuánto pago', 'Poder sacar el dinero cuando quiera', 'Opiniones de otros usuarios',
     'Empezar con muy poco', 'Que no me pida datos innecesarios', 'Nada: no la usaría']);

  form.getItems().forEach(function (i) {
    if (i.getType() === FormApp.ItemType.PAGE_BREAK && i.getTitle() === 'Imagina una app así') i.setHelpText(AYUDA_APP_);
    if (i.getType() === FormApp.ItemType.GRID) {
      i.asGridItem().setTitle(TITULO_INTERES_).setRows(FILAS_INTERES_);
      Logger.log('Actualizada: ' + TITULO_INTERES_);
    }
  });

  Logger.log('Encuesta actualizada. El enlace para responder no cambia: ' + form.getPublishedUrl());
}

function cambiar_(form, empiezaPor, nuevoTitulo, opciones) {
  var prefijos = [].concat(empiezaPor);
  var item = form.getItems().filter(function (i) {
    return prefijos.some(function (p) { return i.getTitle().indexOf(p) === 0; });
  })[0];
  if (!item) { Logger.log('No encontrada (sin cambios): ' + empiezaPor); return; }
  var tipo = item.getType();
  var q = tipo === FormApp.ItemType.CHECKBOX ? item.asCheckboxItem() : item.asMultipleChoiceItem();
  q.setChoiceValues(opciones);
  if (nuevoTitulo) q.setTitle(nuevoTitulo);
  Logger.log('Actualizada: ' + (nuevoTitulo || item.getTitle()));
}
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
 *   2. Elige «crearGraficos» en el desplegable (¡no crearEncuesta!) y pulsa Ejecutar. Acepta los permisos nuevos.
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
  // Si la pregunta cambió de título, la hoja tiene dos columnas por idea (respuestas antiguas y nuevas):
  // las juntamos por idea, cogiendo para cada persona la columna en la que respondió.
  var colsPorIdea = {}, ordenIdeas = [];
  cab.forEach(function (h, c) {
    if (h.indexOf('¿Cuánto te interesa') !== 0) return;
    var m = h.match(/\[(.*)\]\s*$/), idea = m ? m[1].trim() : h;
    if (filasActuales && filasActuales.indexOf(idea) < 0) return;
    if (!colsPorIdea[idea]) { colsPorIdea[idea] = []; ordenIdeas.push(idea); }
    colsPorIdea[idea].push(c);
  });
  ordenIdeas.forEach(function (idea) {
    var notas = filas.map(function (r) {
      var v = colsPorIdea[idea].map(function (c) { return r[c]; }).filter(function (x) { return x !== '' && x !== null; })[0];
      return v === undefined ? NaN : Number(v);
    });
    if (!notas.some(function (x) { return !isNaN(x); })) return;
    var notasInv = notas.filter(function (_, i) { return invierte[i]; });
    var notasNo = notas.filter(function (_, i) { return !invierte[i]; });
    ideas.push([idea, media_(notas), mediaOVacio_(notasInv), mediaOVacio_(notasNo)]);
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
  // La hoja enlazada a la encuesta que tiene respuestas (aunque haya copias vacías en Drive)
  var form = encuestaBuena_();
  try { return SpreadsheetApp.openById(form.getDestinationId()); } catch (e) {
    return SpreadsheetApp.openById(ID_HOJA_RESPUESTAS_);
  }
}

/** De todas las encuestas «Jóvenes y dinero · 5 minutos» de tu Drive, la que tiene más respuestas. */
function encuestaBuena_() {
  var files = DriveApp.getFilesByName('Jóvenes y dinero · 5 minutos'), mejor = null, max = -1;
  while (files.hasNext()) {
    var f = FormApp.openById(files.next().getId()), r = f.getResponses().length;
    Logger.log('Encuesta encontrada con ' + r + ' respuestas: ' + f.getEditUrl());
    if (r > max) { max = r; mejor = f; }
  }
  if (!mejor) throw new Error('No encuentro la encuesta «Jóvenes y dinero · 5 minutos» en tu Drive.');
  Logger.log('Uso la que tiene ' + max + ' respuestas.');
  return mejor;
}

/** Diagnóstico: lista las encuestas y hojas «Jóvenes y dinero» de tu Drive con sus respuestas. No cambia nada. */
function revisarEncuestas() {
  var files = DriveApp.getFilesByName('Jóvenes y dinero · 5 minutos');
  while (files.hasNext()) {
    var file = files.next(), f = FormApp.openById(file.getId()), dest = '';
    try { dest = f.getDestinationId() ? SpreadsheetApp.openById(f.getDestinationId()).getUrl() : 'sin hoja'; } catch (e) { dest = 'hoja no accesible'; }
    Logger.log('ENCUESTA creada el ' + file.getDateCreated() + ' · ' + f.getResponses().length + ' respuestas\n  responder: ' + f.getPublishedUrl() + '\n  hoja: ' + dest);
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