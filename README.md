# Horizonte · Reto CaixaBank Asset Management × Google

Web app para la Generación Z: ponle nombre a tu dinero, simula tu futuro y ahorra con tu círculo.

## Arrancar

```bash
npm start            # http://localhost:3000  (Node >= 18, sin dependencias)
```

Coach con IA (opcional, Gemini): `GEMINI_API_KEY=... npm start`. Sin clave funciona en modo local.

## Qué hace

- **Metas**: crea metas con emoji, registra aportaciones reales, historial, estado «en plazo» y cuánto necesitas al mes.
- **Simulador**: 4 escenarios hipotéticos (0/2/5/8%), inflación, valor real vs nominal, efecto +20 €/mes, gráfica interactiva.
- **Círculo**: objetivo compartido con código de invitación; cada persona solo comparte lo que aporta al objetivo común (multiusuario real, actualización en vivo).
- **Aprende**: 6 micro-lecciones con test, test de perfil, regla 50/30/20, datos de referencia.
- **Gamificación**: XP, niveles, racha semanal, 8 logros, confeti.
- **Hori**: coach conversacional (Gemini o reglas locales) con guardarraíles: educativo, sin asesoramiento personalizado.
- **Cuentas**: registro/login (scrypt, cookie HttpOnly); los datos se sincronizan por usuario. Modo invitado en localStorage.

## Estructura

- `server.js` API + estáticos (los datos viven en `data/`, ignorado por git)
- `public/` front-end (`index.html`, `styles.css`, `app.js`)

> Prototipo académico. Las simulaciones usan hipótesis ilustrativas; no son asesoramiento ni garantía de resultados.
