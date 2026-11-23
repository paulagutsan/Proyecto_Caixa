# horizonte-gemini

Intermediario entre la web de Horizonte (v2) y Gemini. La clave de Google AI Studio se guarda aquí como
**secreto de Supabase** y nunca aparece en la web ni en el repositorio.

## Puesta en marcha (panel de Supabase, unos 5 minutos)

1. **Edge Functions → Deploy a new function → Via Editor.** Nombre: `horizonte-gemini`.
   Pega el contenido de `index.ts` y pulsa **Deploy**.
2. En los ajustes de la función, **desactiva «Verify JWT» / «Enforce JWT verification»**
   (la web la llama sin sesión de usuario).
3. **Edge Functions → Secrets** (o Project Settings → Edge Functions): añade
   - `GEMINI_API_KEY` = tu clave de Google AI Studio.
   - (Opcional) `GEMINI_MODEL` = el ID exacto del modelo que veas en AI Studio, por ejemplo uno Flash o Flash-Lite.
     Si no lo pones, se usa `gemini-flash-latest`.
4. Listo. La web ya apunta a `https://norfjljehjyjovgmshdr.supabase.co/functions/v1/horizonte-gemini`
   (ver `v2/config.js`). Si la función falla o se agota la cuota gratuita, el asistente usa sus respuestas locales.

## Qué hace

- Solo acepta peticiones desde `paulagutsan.github.io` y `localhost:8099` (secreto opcional `ALLOWED_ORIGINS`).
- Límite de 8 preguntas por minuto por dirección IP y textos acotados, para no agotar la cuota.
- Recibe la pregunta, las cifras de la cuenta **sin el nombre** y los últimos mensajes; devuelve título, respuesta y hasta 3 cifras clave.
- Instrucciones al modelo: educación financiera, sin recomendaciones de compra o venta ni promesas de rentabilidad,
  solo con las cifras de la cuenta.

## Límites del plan gratuito de Gemini

Es para pruebas y para la demo del concurso. Las condiciones de la API no permiten usarlo en servicios dirigidos a
menores de 18 años ni ofrecerlo con el plan gratuito a usuarios del Espacio Económico Europeo: un lanzamiento real
iría por el acuerdo de CaixaBank con Google Cloud (Gemini Enterprise / Vertex AI).
