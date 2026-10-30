# Horizonte · Reto CaixaBank Asset Management × Google

Web app para la Generación Z: ponle nombre a tu dinero, simula tu futuro y ahorra con tu círculo.

## Arrancar

```bash
npm start            # http://localhost:3000  (Node >= 18, sin dependencias)
```

Asistente con IA (opcional, Gemini): `GEMINI_API_KEY=... npm start`. Sin clave funciona en modo local.

## Qué hace

- **Pulso**: feed vertical tipo TikTok en el que no se ve, se decide. Momentos históricos (2000, 2008, 2020), «¿estafa o legítimo?», «¿inversión o apuesta?», estimaciones y tendencias (loud budgeting, doom spending, soft saving). Predices antes de ver la respuesta, los fallos vuelven con repetición espaciada (Leitner) y cada sesión acaba tras 7 tarjetas.
- **Objetivos**: crea objetivos por categoría, registra aportaciones reales, historial, estado «en plazo» y cuánto necesitas al mes.
- **Simulador**: 4 escenarios hipotéticos (0/2/5/8%), inflación, valor real vs nominal, efecto +20 €/mes, gráfica interactiva.
- **Círculo**: objetivo compartido con código de invitación; cada persona solo comparte lo que aporta al objetivo común (multiusuario real, actualización en vivo).
- **Formación**: 6 módulos breves con test, test de perfil, regla 50/30/20, datos de referencia.
- **Hitos y constancia**: racha semanal de aportaciones y 8 hitos, sin elementos de juego.
- **Asistente**: conversacional (Gemini o reglas locales) con guardarraíles: educativo, sin asesoramiento personalizado.
- **Cuentas**: registro/login (scrypt, cookie HttpOnly); los datos se sincronizan por usuario. Modo invitado en localStorage.

## Estructura

- `server.js` API + estáticos (los datos viven en `data/`, ignorado por git)
- `public/` front-end (`index.html`, `styles.css`, `app.js`)

> Prototipo académico. Las simulaciones usan hipótesis ilustrativas; no son asesoramiento ni garantía de resultados.
