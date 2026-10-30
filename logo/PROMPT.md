# Prompt para el otro ordenador

Copia todo lo que hay debajo de la línea y adjunta la carpeta `logo-horizonte` (o al menos `horizonte-logo-oscuro.svg`, `horizonte-logo-claro.svg`, `horizonte-icono.svg` y `estrella.png`).

---

Estoy trabajando en **Horizonte**, el prototipo de app de ahorro e inversión para la Generación Z del reto CaixaBank Asset Management × Google (repo `paulagutsan/Proyecto_Caixa`). La app es HTML, CSS y JS sin dependencias: `public/index.html`, `public/styles.css`, `public/app.js` y `server.js`.

Te adjunto el logo nuevo. Quiero que lo integres en la app **sin cambiar el diseño del logo**.

## Cómo es el logo (no lo modifiques)

- **Estrella:** es la estrella de CaixaBank tal cual, con sus dos puntos (amarillo y rojo). Está en `estrella.png` con el fondo transparente. No la redibujes, ni la recolorees, ni la deformes; escálala siempre manteniendo la proporción.
- **Separador:** una línea vertical fina entre la estrella y el texto.
- **Nombre:** «Horizonte» en Source Serif 4, peso 400. Va en blanco sobre fondo oscuro y en azul marino `#00344f` sobre fondo claro.
- **Debajo del nombre:**
  - Un pequeño histograma de 5 barras que suben, en azul claro `#9cc7dc` con opacidad creciente. La última barra es naranja `#ff8300`, y representa ir de lo que aportas hoy a tu objetivo.
  - Al lado del histograma, «FONDOS DE INVERSIÓN» en Inter, peso 600, en mayúsculas muy espaciadas.
- **Fondo:** la versión principal es oscura, azul marino `#1c3450`.
- **Archivos:**
  - `horizonte-logo-oscuro.svg`: el principal, con fondo azul marino.
  - `horizonte-logo-oscuro-transparente.svg`: el mismo, sin fondo, para ponerlo sobre una superficie oscura.
  - `horizonte-logo-claro.svg`: para fondos blancos.
  - `horizonte-icono.svg`: solo la estrella.
- **Letras:** en los SVG el texto ya está convertido a trazos, así que se ven igual en cualquier ordenador.

## Qué quiero que hagas

1. Copia los SVG y `estrella.png` a `public/` (por ejemplo, en `public/brand/`).
2. Cabecera: sustituye la marca actual (`.brand-mark` y `.brand-name`) por el logo. La cabecera es blanca, así que usa la versión clara.
3. Favicon e icono de la app: usa la estrella (`horizonte-icono.svg`) en `index.html` y en `manifest.webmanifest`.
4. Pantallas oscuras (Pulso y La Década): si encaja, pon la versión oscura transparente en pequeño en la barra superior.
5. Mantén la estética institucional actual: esquinas rectas, sin emojis, tipografías Source Serif 4 e Inter.
6. Comprueba que se ve bien en móvil (375 px) y en ordenador (1400 px).
7. No hagas commit ni push hasta que te lo confirme.
