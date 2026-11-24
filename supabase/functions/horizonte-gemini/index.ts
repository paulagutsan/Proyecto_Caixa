// Horizonte · intermediario con Gemini (Supabase Edge Function)
// La clave de Gemini vive SOLO aquí, como secreto de Supabase (GEMINI_API_KEY). Nunca en la web.
// Secretos opcionales: GEMINI_MODEL (modelo preferido), GEMINI_FALLBACK (modelo de reserva) y ALLOWED_ORIGINS.
// Si Google responde que el modelo está saturado (503) o con un error temporal, reintenta una vez y pasa al modelo de reserva.
// Cada llamada a Google se corta a los 7 s y la pregunta entera a los 15 s; los errores quedan en Edge Functions → Logs.
// Al crear la función, desactiva "Verify JWT" (la web la llama sin sesión de usuario).

const KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
// Por defecto, primero el modelo ligero (rápido y el que menos se satura) y de reserva el Flash normal.
// Con los secretos GEMINI_MODEL y GEMINI_FALLBACK puedes poner los ID exactos que veas en AI Studio.
const MODELS = [Deno.env.get("GEMINI_MODEL") ?? "gemini-flash-lite-latest", Deno.env.get("GEMINI_FALLBACK") ?? "gemini-flash-latest"]
  .filter((m, i, a) => m && a.indexOf(m) === i);
const ATTEMPT_MS = 7000;   // máximo por llamada a Google: si se cuelga, se corta
const BUDGET_MS = 15000;   // máximo total por pregunta (la web se rinde a los 20 s y usa sus respuestas locales)
const PER_MINUTE = 20;     // preguntas por minuto y por IP (en una reunión todos comparten wifi)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://paulagutsan.github.io,http://localhost:8099,http://127.0.0.1:8099").split(",").map((s) => s.trim());

const SYSTEM = `Eres el asistente de Horizonte, un servicio de CaixaBank Asset Management para jóvenes que empiezan a invertir con su familia.
Respondes en español de España, con un tono cercano, claro y profesional, como el asistente de un gran banco.
Reglas:
- Usa SOLO las cifras del contexto que te damos (su cuenta). No inventes cifras, rentabilidades ni productos.
- Es educación financiera, no asesoramiento: nunca recomiendes comprar o vender un valor o fondo concreto ni prometas rentabilidades.
- Recuerda cuando venga al caso que invertir tiene riesgo y que el valor puede bajar.
- Conceptos de Horizonte: Fundamentos (5 temas y una prueba; al superarla, 20 € invertidos y el Certificado Horizonte); primer año acompañado (promoción: si a los 12 meses los primeros 500 € aportados valen menos y no se ha vendido, CaixaBank repone la diferencia; con tope y condiciones; nunca digas que «no se puede perder»); Antídoto (75 % en un fondo global diversificado y 25 % en los temas que le preocupan: si lo que teme ocurre, esa parte tiende a ganar; es una cobertura, no una garantía); millas de casa (suman al aprender, aportar con constancia y revisar el plan; los juegos no suman; pueden convertirse en una bonificación posible, no garantizada, de hasta 0,20 puntos en la primera hipoteca, según las condiciones de ese momento).
- Si preguntan algo que no tiene que ver con su dinero, Horizonte o la educación financiera, di amablemente que solo puedes ayudar con eso.
- Respuesta breve: un titular de menos de 8 palabras y un texto de 2 a 4 frases (máximo 90 palabras). Añade hasta 3 cifras clave del contexto si ayudan.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    answer: { type: "STRING" },
    facts: { type: "ARRAY", items: { type: "OBJECT", properties: { label: { type: "STRING" }, value: { type: "STRING" } }, required: ["label", "value"] } },
  },
  required: ["title", "answer"],
};

// Límite sencillo por IP para no agotar la cuota gratuita.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now(), arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  arr.push(now); hits.set(ip, arr);
  return arr.length > PER_MINUTE;
}

function cors(origin: string | null) {
  const ok = origin && ORIGINS.includes(origin) ? origin : ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": ok,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
    "Vary": "Origin",
  };
}
const json = (body: unknown, status: number, h: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ error: "method" }, 405, h);
  if (!KEY) return json({ error: "no-key" }, 500, h);
  const origin = req.headers.get("origin");
  if (origin && !ORIGINS.includes(origin)) return json({ error: "origin" }, 403, h);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (limited(ip)) return json({ error: "rate" }, 429, h);

  let body: { question?: string; context?: Record<string, unknown>; history?: { r: string; t: string }[] };
  try { body = await req.json(); } catch { return json({ error: "json" }, 400, h); }
  const question = String(body.question ?? "").slice(0, 500).trim();
  if (!question) return json({ error: "empty" }, 400, h);
  const context = JSON.stringify(body.context ?? {}).slice(0, 4000);
  const history = (body.history ?? []).slice(-6).map((m) => ({
    role: m.r === "u" ? "user" : "model",
    parts: [{ text: String(m.t ?? "").slice(0, 600) }],
  }));

  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [...history, { role: "user", parts: [{ text: `Contexto de su cuenta (JSON): ${context}\n\nPregunta: ${question}` }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 600, responseMimeType: "application/json", responseSchema: SCHEMA },
  };
  let last = { status: 0, message: "" };
  const started = Date.now();
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (Date.now() - started > BUDGET_MS - 2000) break;   // sin tiempo para otra llamada
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(Math.min(ATTEMPT_MS, BUDGET_MS - (Date.now() - started))),
        });
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          last = { status: r.status, message: String(e?.error?.message ?? "").slice(0, 200) };
          console.error(`gemini ${model} intento ${attempt + 1}: ${r.status} ${last.message}`);   // se ve en Edge Functions → Logs
          if ([429, 500, 503, 504].includes(r.status) && attempt === 0) { await sleep(400); continue; }   // temporal: un reintento rápido
          break;                                                                                            // otro error o ya reintentado: siguiente modelo
        }
        const d = await r.json();
        const txt = d?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
        const out = JSON.parse(txt);
        return json({
          title: String(out.title ?? "").slice(0, 80),
          answer: String(out.answer ?? "").slice(0, 900),
          facts: (out.facts ?? []).slice(0, 3).map((f: { label: string; value: string }) => [String(f.label), String(f.value)]),
          model,
        }, 200, h);
      } catch (e) {
        const timeout = e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError");
        last = { status: 0, message: timeout ? "Google tarda demasiado" : "respuesta no válida" };
        console.error(`gemini ${model} intento ${attempt + 1}: ${last.message}`);
        if (timeout) break;   // si se cuelga, no insistas con el mismo modelo
      }
    }
  }
  return json({ error: "gemini", status: last.status, message: last.message, tried: MODELS }, 502, h);
});
