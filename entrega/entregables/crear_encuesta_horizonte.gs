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
function crearEncuesta() {
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
    .setChoiceValues(['Menos de 300 €', '300-700 €', '700-1.200 €', 'Más de 1.200 €', 'Prefiero no decirlo']).setRequired(true);
  form.addCheckboxItem().setTitle('¿Qué bancos o apps de dinero usas? (puedes marcar varias)')
    .setChoiceValues(['CaixaBank o imagin', 'Santander u Openbank', 'BBVA', 'Revolut', 'Trade Republic', 'N26', 'MyInvestor o Indexa', 'Exchange de cripto (Binance, Bit2Me…)'])
    .showOtherOption(true);

  // ---------- Bloque B · Ahorro e inversión
  form.addPageBreakItem().setTitle('Tu dinero hoy');
  form.addMultipleChoiceItem().setTitle('¿Consigues ahorrar algo cada mes?')
    .setChoiceValues(['Sí, casi siempre', 'A veces', 'No']).setRequired(true);
  form.addCheckboxItem().setTitle('¿Tienes ahora alguno de estos productos? (puedes marcar varios)')
    .setChoiceValues(['Ninguno', 'Cuenta remunerada o depósito', 'Fondos de inversión', 'ETF', 'Acciones', 'Criptomonedas', 'Plan de pensiones'])
    .setRequired(true);
  form.addMultipleChoiceItem().setTitle('¿Cuánto podrías apartar al mes para tus metas sin que te cueste mucho?')
    .setChoiceValues(['Nada ahora mismo', 'Menos de 25 €', '25-50 €', '50-100 €', 'Más de 100 €']).setRequired(true);
  form.addCheckboxItem().setTitle('¿Para qué ahorrarías? Elige hasta 2')
    .setChoiceValues(['Independizarme o la entrada de una vivienda', 'Viajes', 'Un colchón para imprevistos', 'Estudios', 'Un proyecto propio', 'Jubilación', 'Hacer crecer el dinero sin meta concreta'])
    .setValidation(FormApp.createCheckboxValidation().requireSelectAtMost(2).build()).setRequired(true);
  form.addMultipleChoiceItem().setTitle('¿Alguna vez has invertido en algo porque lo estaba haciendo todo el mundo (miedo a quedarte fuera)?')
    .setChoiceValues(['Sí', 'No', 'Nunca he invertido']).setRequired(true);

  // ---------- Bloque C · Frenos, fuentes y conocimientos
  form.addPageBreakItem().setTitle('Qué te frena y dónde aprendes');
  form.addCheckboxItem().setTitle('¿Qué te frena para invertir (o para invertir más)? Elige hasta 3')
    .setChoiceValues(['No sé por dónde empezar', 'Miedo a perder dinero', 'Tengo poco dinero', 'No me fío de bancos ni apps', 'Las comisiones', 'Pereza o papeleo', 'No lo necesito ahora'])
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
  form.addPageBreakItem().setTitle('Imagina una app así')
    .setHelpText('Horizonte es una app de CaixaBank Asset Management para empezar a invertir. Puntúa cuánto te interesa cada parte.');
  var grid = form.addGridItem().setTitle('¿Cuánto te interesa…? (1 = nada, 5 = mucho)');
  grid.setRows([
    'Aprende: una práctica de 3 minutos al día con casos reales',
    'Juegos: minijuegos diarios con datos reales de bolsa para retar a tus amigos',
    'Tu horizonte: ver cuánto tendrías invirtiendo frente a solo guardar',
    'Objetivos: poner metas (viaje, piso…) y ver cómo avanzas',
    'Conecta: opinar sobre propuestas de empresas y descubrir las de tu barrio',
    'Círculo: ahorrar en grupo con amigos'
  ]).setColumns(['1', '2', '3', '4', '5']).setRequired(true);
  form.addCheckboxItem().setTitle('¿Qué te daría confianza para meter dinero en una app así? Elige hasta 2')
    .setChoiceValues(['Que sea de un banco conocido', 'Ver claro cuánto pago', 'Poder sacar el dinero cuando quiera', 'Opiniones de otros usuarios', 'Empezar con muy poco', 'Que no me pida datos innecesarios'])
    .setValidation(FormApp.createCheckboxValidation().requireSelectAtMost(2).build()).setRequired(true);
  form.addScaleItem().setTitle('¿Usarías una app así de CaixaBank?').setBounds(1, 5)
    .setLabels('Seguro que no', 'Seguro que sí').setRequired(true);
  form.addScaleItem().setTitle('Del 0 al 10, ¿cuánto se la recomendarías a un amigo?').setBounds(0, 10).setRequired(true);
  form.addParagraphTextItem().setTitle('¿Qué tendría que tener para que la abrieras cada semana?');

  var ss = SpreadsheetApp.create('Respuestas · Jóvenes y dinero');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  Logger.log('Enlace para responder (difúndelo): ' + form.getPublishedUrl());
  Logger.log('Enlace para editar: ' + form.getEditUrl());
  Logger.log('Hoja con las respuestas: ' + ss.getUrl());
}
