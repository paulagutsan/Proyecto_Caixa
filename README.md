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

## Qué hace

- **Aprende**: una sola sección para aprender. *Práctica de hoy*: 7 tarjetas en formato vertical en las que decides antes de ver la respuesta (momentos históricos de 2000, 2008 y 2020, «¿estafa o legítimo?», estimaciones, mitos y tendencias como loud budgeting o doom spending); los fallos vuelven con repetición espaciada (Leitner). *Temas*: 8 ideas clave de dos minutos, cada una con sus tarjetas para practicar solo ese tema; un tema queda dominado al acertar todas sus tarjetas dos veces. Incluye el test de perfil y la regla 50/30/20.
- **La Década**: juego tipo fantasy de 10 temporadas con dinero ficticio. Fichas un equipo de cinco jugadores en un campo de fútbol (acciones = delantero, emergentes = extremo, oro = centrocampista, bonos = defensa, liquidez = portero), con valoraciones sencillas de goles (rentabilidad) y sustos (volatilidad). Cada temporada es un año real oculto (2000-2024): noticia del año, victoria o derrota y rendimiento de cada jugador; eliges tu jugada (seguir igual, recolocar, fichar 1.000 € más o mandar al banquillo). Al final se revela la década, ganas una medalla según tu puesto frente a tres rivales (tu equipo fantasma sin tocar, todo liquidez, todo acciones) y descubres tu estilo de entrenador. Con el código de liga, tu grupo juega la misma década y comparte clasificación.
- **Objetivos**: crea objetivos por categoría, registra aportaciones reales, historial, estado «en plazo» y cuánto necesitas al mes.
- **Simulador**: 4 escenarios hipotéticos (0/2/5/8%), inflación, valor real vs nominal, efecto +20 €/mes, gráfica interactiva y datos de mercado de referencia.
- **Círculo**: objetivo compartido con código de invitación; cada persona solo comparte lo que aporta al objetivo común (multiusuario real, actualización en vivo).
- **Hitos y constancia**: racha semanal de aportaciones y 8 hitos, sin elementos de juego.
- **Asistente**: conversacional con IA gratuita (OpenRouter, Gemini o Pollinations; reglas locales si no hay conexión), recuerda la conversación y tiene guardarraíles: educativo, sin asesoramiento personalizado.
- **Cuentas**: registro/login (scrypt, cookie HttpOnly); los datos se sincronizan por usuario. Modo invitado en localStorage.

## Estructura

- `server.js` API + estáticos (los datos viven en `data/`, ignorado por git)
- `public/` front-end (`index.html`, `styles.css`, `app.js`)

> Prototipo académico. Las simulaciones usan hipótesis ilustrativas; no son asesoramiento ni garantía de resultados.
