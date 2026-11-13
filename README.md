# Horizonte · Reto CaixaBank Asset Management × Google

Web app para la Generación Z: ponle nombre a tu dinero, simula tu futuro y ahorra con tu círculo.

## Arrancar

```bash
npm start            # http://localhost:3000  (Node >= 18, sin dependencias)
```

Asistente con IA gratuita, sin configurar nada: usa [Pollinations](https://pollinations.ai) (sin clave). También funciona en GitHub Pages, porque el navegador lo llama directamente.

Opcional, para respuestas más estables (ambas claves son gratuitas):

```bash
OPENROUTER_API_KEY=sk-or-... npm start   # modelos gratuitos de OpenRouter (por defecto google/gemma-4-31b-it:free)
GEMINI_API_KEY=... npm start             # capa gratuita de Google AI Studio
```

Orden de uso: OpenRouter → Gemini → Pollinations → respuestas predefinidas.

## Cuentas gratuitas con Supabase

El acceso necesita un servicio con base de datos; GitHub Pages solo sirve archivos. Supabase tiene un plan gratuito sin tarjeta. Se configura una vez:

1. Crea una cuenta en [supabase.com](https://supabase.com) y un proyecto nuevo (región UE; guarda la contraseña de la base de datos).
2. **Authentication → Sign In / Providers → Email**: desactiva **Confirm email** para que las personas entren al registrarse.
3. **SQL Editor → New query**: pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**. Crea la tabla `perfiles` con seguridad por fila: cada persona solo lee y escribe lo suyo.
4. **Project Settings → API** (o el botón **Connect**): copia la **Project URL** y la clave **anon public** (o *publishable*) y pégalas en [`public/config.js`](public/config.js).
5. Sube el cambio a GitHub. Esa clave es pública por diseño; **nunca** pegues la `service_role` ni una clave `secret`.

Notas: en el plan gratuito, un proyecto sin actividad durante una semana se pausa y se reactiva desde el panel. Con Supabase activo, los *Círculos* compartidos no están disponibles (siguen necesitando el servidor propio, `npm start`, sin Supabase).

## Qué hace

- **Aprende**: cursos cortos tipo Duolingo organizados en tres niveles (Primeros pasos, Cómo crece el dinero, Para ir más lejos) y 11 cursos: ahorrar o invertir, inflación, colchón y presupuesto, estafas y apuestas, interés compuesto, riesgo y plazo, diversificación, costes, renta fija, valoración (PER) y psicología del inversor. Cada curso mezcla teoría, mates con ejemplos calculados, gráficas claras, calculadoras con deslizadores (algunas con datos reales 2000-2024) y un test final; quien ya sabe puede saltar al test. El progreso se guarda y cuenta para la racha de estudio. A la derecha, en pequeño, la *Práctica de hoy*: 7 tarjetas en las que decides antes de ver la respuesta, con repetición espaciada (Leitner).
- **Juegos**: cuatro minijuegos con datos reales aproximados (2000-2024) y dinero ficticio, pensados para jugar en 2 minutos y compartir el resultado en el grupo, al estilo Wordle o los juegos de LinkedIn.
  - **Aguanta** (diario): diez años de bolsa pasan en 60 segundos sin decir cuáles. Mantienes pulsado para seguir invertido; si sueltas, vendes. Compites con Leo, que vende por miedo cuando cae un 15 %. Al final se revela la década y se comparte una fila de emojis.
  - **Silueta** (diario): cinco gráficas sin nombre; adivina qué inversión es cada una. Enseña a reconocer el riesgo de cada tipo de activo.
  - **Más o menos** (sin fin): ¿qué acaba con más dinero? Encadena aciertos entre inversiones reales, inflación, comisiones e interés compuesto.
  - **Draft Night** (con amigos, 2-5 jugadores): elegís por turnos cartas de inversión (tecnológicas, España, Japón, oro, bonos…) y jugáis una década secreta año a año hasta el podio. En un solo móvil o online con código de sala.
- **Conecta**: tu dinero en el mundo real, en tres partes.
  - **Tu voz**: tarjetas para deslizar con propuestas típicas de junta de accionistas (sueldo del CEO, emisiones, recompra de acciones…). Dices a la gestora qué preferirías y ves al momento qué opina la comunidad. Es una consulta: en un fondo, quien vota es la gestora.
  - **Tu calle**: cazas con la cámara las empresas que usas a diario (moda, súper, telefonía…) y completas un álbum de sectores. Cada carta explica cómo gana dinero ese tipo de empresa y cómo podrías tener un trocito a través de un fondo. Sin ubicación y sin premios en dinero.
  - **Tu proyecto**: cuentas tu proyecto en privado y ves qué empresas asociadas (de ejemplo) encajan para financiación, mentoría, primeros clientes o un socio tecnológico. Nada se comparte hasta que lo apruebas, y nunca se comparten tus datos personales.
- **Objetivos**: crea objetivos por categoría, registra aportaciones reales, historial, estado «en plazo» y cuánto necesitas al mes.
- **Simulador**: 4 escenarios hipotéticos (0/2/5/8%), inflación, valor real vs nominal, efecto +20 €/mes, gráfica interactiva y datos de mercado de referencia.
- **Círculo**: objetivo compartido con código de invitación; cada persona solo comparte lo que aporta al objetivo común (multiusuario real, actualización en vivo).
- **Hitos y constancia**: racha semanal de aportaciones y 8 hitos, sin elementos de juego.
- **Asistente**: conversacional con IA gratuita (OpenRouter, Gemini o Pollinations; reglas locales si no hay conexión), recuerda la conversación y tiene guardarraíles: educativo, sin asesoramiento personalizado.
- **Resumen / Tu perfil**: sin cuenta, el Resumen muestra la portada «El poder de empezar» y el test *Conoce tu perfil*. Al acceder, la pestaña pasa a llamarse **Tu perfil** y suma lo que solo existe con cuenta: el **historial de tests** de perfil de inversor, la calculadora **Distribuye tus ingresos** (regla 50/30/20, se guarda) y tus objetivos y estadísticas.
- **Cuentas**: registro y acceso con correo y contraseña mediante Supabase (plan gratuito), que funciona también en GitHub Pages; el progreso se sincroniza entre dispositivos. Sin configurar Supabase se usa el servidor local (scrypt, cookie HttpOnly). Modo invitado en localStorage.

## Diseño

- Basado en el lenguaje de las webs oficiales de Apple y Meta: fondo blanco y gris claro, titulares grandes y centrados, baldosas sin borde con esquinas muy redondeadas, botones en forma de píldora, cabecera translúcida y cifras clave «en números».
- Colores: azul CaixaBank (#007EAE) para las acciones y los enlaces; verde y rojo de trading para subidas y bajadas (proyecciones, estados de objetivos, votos a favor y en contra, resultados de los juegos).
- Tipografía: la del sistema en dispositivos Apple (SF Pro) e Inter en el resto.
- Logotipo con el mismo formato que el de caixabank.es: la estrella y la palabra «Horizonte» en serifa (Source Serif 4) subrayada, al mismo tamaño.
- Índice de secciones como en apple.com: al pasar por una sección de la cabecera se despliega su mini índice (enlaces grandes a cada apartado y enlaces rápidos). En el móvil, una barra bajo la cabecera con el nombre de la sección abre ese mismo índice.
- Contenido abierto: la información fluye sobre el fondo separada por líneas finas. Solo van en tarjeta las cosas que se eligen (juegos, accesos del día, votaciones, álbum).
- El Inicio se centra en una sola idea, «Tu horizonte»: cuánto podrías tener invirtiendo frente a solo guardar, con la hipótesis siempre visible. Debajo van tus objetivos y tres accesos del día. Ningún dato aparece dos veces.
- Juegos como baldosas de producto (negra, gris y azul CaixaBank) y pantallas inmersivas en negro. Etiquetas de código (USA, ORO, ESP…) en lugar de emojis en la interfaz.
- Navegación de seis secciones (el simulador vive dentro de Objetivos), modo oscuro completo, barra inferior en móvil y modo privado (icono del ojo) que difumina los importes.

## Estructura

- `server.js` API + estáticos (los datos viven en `data/`, ignorado por git)
- `public/` front-end (`index.html`, `styles.css`, `app.js`, `games.js` con los minijuegos, `conecta.js` con Conecta, `cursos-data.js` con el contenido de los cursos, `cursos.js` con el reproductor y las gráficas, `coach-local.js` con las respuestas del asistente y `config.js` con la configuración pública de las cuentas)
- `supabase/schema.sql` tabla y reglas de seguridad de las cuentas en la nube

> Prototipo académico. Las simulaciones usan hipótesis ilustrativas; no son asesoramiento ni garantía de resultados.
