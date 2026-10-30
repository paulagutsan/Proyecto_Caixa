"use strict";
/* Horizonte · servidor sin dependencias (Node >= 18)
   - Auth con scrypt + cookie HttpOnly
   - Estado por usuario sincronizado (/api/state)
   - Círculos compartidos con código de invitación (/api/circles)
   - Salas de Draft Night para jugar con amigos (/api/draft)
   - Votos consultivos de «Tu voz» (/api/voz)
   - Coach financiero con IA gratuita: OpenRouter, Gemini o Pollinations (sin clave); reglas locales si fallan */

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, "public");
const DATA = path.join(__dirname, "data");
const F_USERS = path.join(DATA, "users.json");
const F_CIRCLES = path.join(DATA, "circles.json");
const F_SESSIONS = path.join(DATA, "sessions.json");
const F_VOTES = path.join(DATA, "votes.json");
const COOKIE = "horizonte_session";
const WEEK = 7 * 24 * 3600;

fs.mkdirSync(DATA, { recursive: true });

/* ---------- persistencia ---------- */
const read = (f, def) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return def; } };
function write(f, obj) {
    const tmp = f + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
    fs.renameSync(tmp, f);
}
let users = read(F_USERS, []);
let circles = read(F_CIRCLES, []);
let sessions = read(F_SESSIONS, {});
let votes = read(F_VOTES, {}); // { propuesta: { voterHash: "a" | "c" | "s" } }
const saveUsers = () => write(F_USERS, users);
const saveCircles = () => write(F_CIRCLES, circles);
const saveSessions = () => write(F_SESSIONS, sessions);
const saveVotes = () => write(F_VOTES, votes);

/* ---------- seguridad ---------- */
function hashPassword(pw, salt = crypto.randomBytes(16).toString("hex")) {
    return `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
}
function checkPassword(pw, stored) {
    try {
        const [salt, hash] = String(stored).split(":");
        return crypto.timingSafeEqual(Buffer.from(crypto.scryptSync(pw, salt, 64).toString("hex"), "hex"), Buffer.from(hash, "hex"));
    } catch { return false; }
}
const publicUser = u => ({ id: u.id, username: u.username, createdAt: u.createdAt });

const attempts = new Map(); // ip -> {n, t}
function tooManyAttempts(ip) {
    const a = attempts.get(ip);
    if (!a || Date.now() - a.t > 10 * 60e3) return false;
    return a.n >= 10;
}
function failAttempt(ip) {
    const a = attempts.get(ip);
    if (!a || Date.now() - a.t > 10 * 60e3) attempts.set(ip, { n: 1, t: Date.now() });
    else a.n++;
}

function newSession(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    sessions[token] = { userId, createdAt: Date.now() };
    for (const [t, s] of Object.entries(sessions)) if (Date.now() - s.createdAt > WEEK * 1000) delete sessions[t];
    saveSessions();
    return token;
}
const cookieOf = req => (req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))?.[1];
function userOf(req) {
    const t = cookieOf(req);
    const s = t && sessions[t];
    if (!s || Date.now() - s.createdAt > WEEK * 1000) return null;
    return users.find(u => u.id === s.userId) || null;
}
const setCookie = t => `${COOKIE}=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${t ? WEEK : 0}`;

/* ---------- http helpers ---------- */
function send(res, status, data, headers = {}) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
    res.end(JSON.stringify(data));
}
function body(req, limit = 300_000) {
    return new Promise((resolve, reject) => {
        if (req.method !== "GET" && !/application\/json/.test(req.headers["content-type"] || "")) return reject(new Error("Content-Type inválido."));
        let raw = "";
        req.on("data", c => {
            raw += c;
            if (raw.length > limit) { reject(new Error("Solicitud demasiado grande.")); req.destroy(); }
        });
        req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("JSON inválido.")); } });
        req.on("error", reject);
    });
}
const HttpError = (status, msg) => Object.assign(new Error(msg), { status });

/* ---------- Draft Night (salas en memoria) ---------- */
const rooms = new Map();
const ROOM_TTL = 6 * 3600e3, DRAFT_LAST = 15;
const DRAFT_CARDS = ["world", "usa", "tech", "esp", "eur", "jpn", "emg", "bon", "oro", "liq"];
function roomCode() {
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let c;
    do c = Array.from({ length: 5 }, () => abc[crypto.randomInt(abc.length)]).join(""); while (rooms.has(c));
    return c;
}
const roomView = (r, pid) => {
    const me = r.players.findIndex(p => p.pid === pid);
    return { code: r.code, phase: r.phase, players: r.players.map(p => p.name), picks: r.picks, t: r.t, per: r.per, start: r.start, me, host: me === 0 };
};

function validateCreds(username, password) {
    if (typeof username !== "string" || !/^[a-zA-Z0-9_.-]{3,40}$/.test(username))
        return "El usuario debe tener 3-40 caracteres: letras, números, . _ -";
    if (typeof password !== "string" || password.length < 8 || password.length > 200)
        return "La contraseña debe tener entre 8 y 200 caracteres.";
    return null;
}

/* ---------- círculos ---------- */
function newCode() {
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code;
    do { code = Array.from({ length: 6 }, () => abc[crypto.randomInt(abc.length)]).join(""); }
    while (circles.some(c => c.code === code));
    return code;
}
// Solo se expone lo que cada miembro decide aportar al objetivo común
function circleView(c, me) {
    const total = c.members.reduce((s, m) => s + m.contributed, 0);
    return {
        code: c.code, name: c.name, category: c.category, target: c.target, total, createdAt: c.createdAt,
        members: c.members
            .map(m => ({ username: m.username, contributed: m.contributed, isMe: m.userId === me.id, isOwner: m.userId === c.ownerId }))
            .sort((a, b) => b.contributed - a.contributed),
        feed: c.feed.slice(-25).reverse()
    };
}
const myCircles = u => circles.filter(c => c.members.some(m => m.userId === u.id));
const clampNum = (v, min, max) => { const n = Number(v); if (!Number.isFinite(n) || n < min || n > max) return null; return Math.round(n * 100) / 100; };
const cleanText = (v, max) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, max);

/* ---------- coach ---------- */
const COACH_SYSTEM = `Eres el asistente de Horizonte, una app de ahorro e inversión para la Generación Z creada para el reto CaixaBank Asset Management x Google.
Tono: profesional y cercano, propio de una gestora de activos; español de España; claro y preciso, sin emojis ni exclamaciones; explica cualquier término técnico. Máximo 120 palabras.
Reglas: eres EDUCATIVO. No des asesoramiento de inversión personalizado, no recomiendes productos concretos ni prometas rentabilidades. Recuerda que la rentabilidad pasada no garantiza la futura y que invertir implica riesgo de pérdida. Si preguntan qué comprar, explica criterios (horizonte, riesgo, diversificación, costes) y sugiere hablar con un asesor. Usa los datos del usuario (metas, ahorro) para personalizar.`;

function localCoach(msg, ctx) {
    const m = msg.toLowerCase();
    const left = (ctx?.goals || []).filter(g => g.saved < g.target);
    if (/^(hola|buenas|hey)/.test(m)) return "Hola. Puedo ayudarte con conceptos como el interés compuesto, la inflación, el riesgo o la diversificación, y comentar la evolución de tus objetivos.";
    if (/compuesto/.test(m)) return "El interés compuesto consiste en obtener rendimientos sobre rendimientos ya generados. Con 100 € al mes durante 10 años y un 5 % anual hipotético, se aportan 12.000 € y el capital podría rondar los 15.500 €. El plazo pesa más que el importe: empezar pronto es la principal ventaja. Se trata de una simulación, no de una previsión.";
    if (/inflaci/.test(m)) return "La inflación reduce el poder adquisitivo del dinero. Con una inflación del 3 % anual, un importe sin remunerar pierde en torno a un 26 % de capacidad de compra en diez años. En el simulador puedes ver los importes en términos reales para tenerlo en cuenta.";
    if (/diversific/.test(m)) return "Diversificar es repartir la inversión entre distintos activos, sectores y regiones. Reduce la dependencia de que un único activo evolucione bien; no elimina el riesgo, pero lo modera.";
    if (/riesgo|perder|p[eé]rdida/.test(m)) return "A mayor rentabilidad potencial, mayor riesgo de pérdida. La referencia principal es el plazo: si necesitarás el dinero en menos de tres años, suele primar la estabilidad; con horizontes de diez años o más es posible asumir más volatilidad. El cuestionario de perfil, en Aprende, te ayudará a situarte.";
    if (/emergencia|colch[oó]n/.test(m)) return "Antes de invertir conviene disponer de un colchón de entre tres y seis meses de gastos básicos en un instrumento líquido y de bajo riesgo. Así evitas deshacer inversiones en un mal momento ante un imprevisto.";
    if (/empez|invertir|invierto/.test(m)) return "Un orden razonable es: primero, un colchón de emergencia; segundo, definir objetivos con importe y plazo; tercero, aportar de forma periódica y automática; y cuarto, conocer los costes y riesgos de cada producto. No hace falta mucho capital, sino constancia. Para decisiones concretas, consulta con un asesor profesional.";
    if (/estafa|chiringuito|fraude/.test(m)) return "Señales de alerta de una estafa de inversión: rentabilidades altas «garantizadas», presión para decidir rápido, contacto por redes o llamadas no solicitadas y entidades que no figuran en los registros de la CNMV o del Banco de España. Ante la duda, verifica en cnmv.es antes de enviar dinero.";
    if (/apuesta|apostar|juego/.test(m)) return "Apostar no es invertir. En una apuesta el resultado esperado es negativo por diseño: la casa gana a largo plazo. Invertir consiste en aportar capital a activos que pueden generar valor con el tiempo, asumiendo un riesgo que se puede medir y diversificar.";
    if (/cripto|bitcoin/.test(m)) return "Las criptomonedas son activos muy volátiles y, en muchos casos, sin un valor subyacente fácil de explicar. Una regla prudente: no invertir en nada que no sepas explicar con tus palabras, y nunca dinero que puedas necesitar a corto plazo.";
    if (/comisi|coste/.test(m)) return "Las comisiones se cobran cada año sobre todo tu capital, así que se componen igual que la rentabilidad. Un punto anual de diferencia puede suponer en torno a un 16 % menos de capital tras 30 años. Compara siempre los gastos totales antes de contratar.";
    if (/loud budgeting/.test(m)) return "El loud budgeting consiste en decir abiertamente «esto no entra en mi presupuesto» y proponer alternativas. Normaliza hablar de dinero y reduce el gasto por presión social.";
    if (/doom spending|gasto emocional/.test(m)) return "El doom spending es gastar para aliviar el estrés o la incertidumbre. Ayuda esperar 48 horas antes de una compra no planificada y tener automatizado el ahorro a principio de mes, para que no dependa de la fuerza de voluntad.";
    if (/soft saving/.test(m)) return "El soft saving propone ahorrar de forma sostenible sin renunciar a disfrutar hoy. La clave es fijar una aportación automática realista y gastar el resto sin culpa, revisándola cuando mejoren tus ingresos.";
    if (/regla del 72|duplica/.test(m)) return "La regla del 72 estima cuántos años tarda un capital en duplicarse: 72 dividido entre la rentabilidad anual. Al 6 %, unos 12 años; al 3 %, unos 24. Es una aproximación útil, no un cálculo exacto.";
    if (/burbuja|plazo|horizonte|ca[ií]da/.test(m)) return "Las caídas forman parte de invertir. Lo determinante es el horizonte: si no vas a necesitar el dinero en muchos años, una caída temporal no tiene por qué convertirse en pérdida; si lo necesitas pronto, conviene priorizar la estabilidad. Diversificar reduce el impacto de que un solo activo o sector caiga.";
    if (/meta|objetivo|c[oó]mo (voy|van)|ahorr/.test(m) && left.length) {
        const g = left[0];
        return `Tu objetivo «${g.name}» presenta un avance del ${Math.round((g.saved / g.target) * 100)} %. Restan ${Math.round(g.target - g.saved).toLocaleString("es-ES")} € y la aportación prevista es de ${g.monthly} € al mes. En el simulador puedes comprobar el efecto de incrementar ligeramente esa aportación.`;
    }
    return "Puedo ayudarte con el interés compuesto, la inflación, el riesgo, la diversificación, el colchón de emergencia o el seguimiento de tus objetivos. ¿Sobre cuál quieres profundizar?";
}

// Proveedores de IA en orden de preferencia; todos tienen opción gratuita:
//   OPENROUTER_API_KEY  modelos «:free» de OpenRouter (clave gratuita en openrouter.ai)
//   GEMINI_API_KEY      capa gratuita de Google AI Studio
//   Pollinations        sin clave ni registro (límite aproximado de 1 petición cada 15 s)
// Si ninguno responde, se usan las respuestas predefinidas.
const POLLINATIONS = "https://text.pollinations.ai/openai";
const OPENROUTER = "https://openrouter.ai/api/v1/chat/completions";

async function openaiChat(url, headers, model, messages) {
    const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ model, messages, temperature: 0.6, max_tokens: 900 }),
        signal: AbortSignal.timeout(25_000)
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const text = j.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("respuesta vacía");
    return { text, model: j.model || model };
}
async function geminiChat(key, messages) {
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: messages[0].content }] },
            contents: messages.slice(1).map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
            generationConfig: { temperature: 0.7, maxOutputTokens: 350 }
        }),
        signal: AbortSignal.timeout(12_000)
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const text = j.candidates?.[0]?.content?.parts?.map(p => p.text).join("").trim();
    if (!text) throw new Error("respuesta vacía");
    return { text, model };
}

function coachProviders() {
    const list = [], or = process.env.OPENROUTER_API_KEY, gem = process.env.GEMINI_API_KEY;
    const orHeaders = { Authorization: `Bearer ${or}`, "X-Title": "Horizonte" };
    if (or) {
        list.push(["openrouter", m => openaiChat(OPENROUTER, orHeaders, process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free", m)]);
        list.push(["openrouter", m => openaiChat(OPENROUTER, orHeaders, "openrouter/free", m)]); // elige un modelo gratuito disponible
    }
    if (gem) list.push(["gemini", m => geminiChat(gem, m)]);
    if (process.env.COACH_POLLINATIONS !== "off") list.push(["pollinations", m => openaiChat(POLLINATIONS, {}, "openai", m)]);
    return list;
}

async function coach(message, context, history) {
    const ctxTxt = context ? `\nDatos del usuario (JSON): ${JSON.stringify(context).slice(0, 2000)}` : "";
    const past = (Array.isArray(history) ? history : []).slice(-6)
        .filter(m => m && (m.role === "user" || m.role === "assistant"))
        .map(m => ({ role: m.role, content: cleanText(m.content, 800) }));
    const messages = [{ role: "system", content: COACH_SYSTEM + ctxTxt }, ...past, { role: "user", content: message }];
    for (const [source, run] of coachProviders()) {
        try {
            const { text, model } = await run(messages);
            return { reply: text, source, model };
        } catch (e) {
            console.warn(`Coach: ${source} no disponible →`, e.message);
        }
    }
    return { reply: localCoach(message, context), source: "local" };
}

/* ---------- API ---------- */
async function api(req, res, url) {
    const ip = req.socket.remoteAddress;
    const route = `${req.method} ${url.pathname}`;
    const auth = () => userOf(req) || (() => { throw HttpError(401, "Inicia sesión para continuar."); })();

    if (route === "POST /api/auth/register" || route === "POST /api/auth/login") {
        if (tooManyAttempts(ip)) throw HttpError(429, "Demasiados intentos. Espera unos minutos.");
        const b = await body(req, 10_000);
        const username = String(b.username || "").trim();
        const password = String(b.password || "");
        let user;
        if (route.endsWith("register")) {
            const err = validateCreds(username, password);
            if (err) throw HttpError(400, err);
            if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) throw HttpError(409, "Ese usuario ya existe.");
            user = { id: crypto.randomUUID(), username, passwordHash: hashPassword(password), createdAt: new Date().toISOString(), state: null };
            users.push(user);
            saveUsers();
        } else {
            user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
            if (!user || !checkPassword(password, user.passwordHash)) {
                failAttempt(ip);
                throw HttpError(401, "Usuario o contraseña incorrectos.");
            }
        }
        return send(res, route.endsWith("register") ? 201 : 200, { ok: true, user: publicUser(user), state: user.state ?? null }, { "Set-Cookie": setCookie(newSession(user.id)) });
    }
    if (route === "GET /api/auth/me") {
        const u = userOf(req);
        return send(res, 200, { user: u ? publicUser(u) : null, state: u?.state ?? null });
    }
    if (route === "POST /api/auth/logout") {
        const t = cookieOf(req);
        if (t) { delete sessions[t]; saveSessions(); }
        return send(res, 200, { ok: true }, { "Set-Cookie": setCookie("") });
    }

    if (route === "PUT /api/state") {
        const u = auth();
        const b = await body(req);
        if (!b.state || typeof b.state !== "object" || Array.isArray(b.state)) throw HttpError(400, "Estado inválido.");
        u.state = b.state;
        saveUsers();
        return send(res, 200, { ok: true });
    }

    if (route === "GET /api/circles") {
        const u = auth();
        return send(res, 200, { circles: myCircles(u).map(c => circleView(c, u)) });
    }
    if (route === "POST /api/circles") {
        const u = auth();
        const b = await body(req, 5_000);
        const name = cleanText(b.name, 40);
        const target = clampNum(b.target, 1, 10_000_000);
        if (!name || target === null) throw HttpError(400, "Pon un nombre y un objetivo válido.");
        if (myCircles(u).length >= 10) throw HttpError(400, "Máximo 10 círculos.");
        const c = {
            code: newCode(), name, category: cleanText(b.category, 20) || "otro", target, ownerId: u.id, createdAt: new Date().toISOString(),
            members: [{ userId: u.id, username: u.username, contributed: 0 }],
            feed: [{ t: Date.now(), text: `${u.username} ha creado el círculo` }]
        };
        circles.push(c);
        saveCircles();
        return send(res, 201, { circle: circleView(c, u) });
    }
    if (route === "POST /api/circles/join") {
        const u = auth();
        const b = await body(req, 2_000);
        const c = circles.find(x => x.code === String(b.code || "").trim().toUpperCase());
        if (!c) throw HttpError(404, "No existe ningún círculo con ese código.");
        if (c.members.length >= 30) throw HttpError(400, "El círculo está completo.");
        if (!c.members.some(m => m.userId === u.id)) {
            c.members.push({ userId: u.id, username: u.username, contributed: 0 });
            c.feed.push({ t: Date.now(), text: `${u.username} se ha unido` });
            saveCircles();
        }
        return send(res, 200, { circle: circleView(c, u) });
    }
    const m = url.pathname.match(/^\/api\/circles\/([A-Z0-9]{6})\/(contribute|leave)$/);
    if (m && req.method === "POST") {
        const u = auth();
        const c = circles.find(x => x.code === m[1]);
        const me = c?.members.find(x => x.userId === u.id);
        if (!me) throw HttpError(404, "No perteneces a este círculo.");
        if (m[2] === "leave") {
            c.members = c.members.filter(x => x.userId !== u.id);
            if (!c.members.length) circles = circles.filter(x => x !== c);
            else {
                if (c.ownerId === u.id) c.ownerId = c.members[0].userId;
                c.feed.push({ t: Date.now(), text: `${u.username} ha abandonado el círculo` });
            }
            saveCircles();
            return send(res, 200, { ok: true });
        }
        const b = await body(req, 2_000);
        const amount = clampNum(b.amount, 0.01, 100_000);
        if (amount === null) throw HttpError(400, "Cantidad no válida.");
        me.contributed = Math.round((me.contributed + amount) * 100) / 100;
        const total = c.members.reduce((s, x) => s + x.contributed, 0);
        c.feed.push({ t: Date.now(), text: `${u.username} ha aportado ${amount.toLocaleString("es-ES")} €` });
        if (total >= c.target && !c.done) { c.done = true; c.feed.push({ t: Date.now(), text: "Objetivo del círculo alcanzado" }); }
        c.feed = c.feed.slice(-100);
        saveCircles();
        return send(res, 200, { circle: circleView(c, u) });
    }

    // Draft Night: salas en memoria con código. Cada jugador se identifica con un pid secreto.
    if (route === "POST /api/draft") {
        const b = await body(req, 2_000), name = cleanText(b.name, 14);
        if (!name) throw HttpError(400, "Escribe tu nombre.");
        for (const [c, r] of rooms) if (Date.now() - r.t0 > ROOM_TTL) rooms.delete(c);
        if (rooms.size > 2000) throw HttpError(503, "Demasiadas salas abiertas. Inténtalo en un rato.");
        const pid = crypto.randomBytes(12).toString("hex");
        const room = { code: roomCode(), players: [{ pid, name }], phase: "lobby", picks: [], t: 0, per: 0, start: crypto.randomInt(DRAFT_LAST + 1), t0: Date.now() };
        rooms.set(room.code, room);
        return send(res, 200, { pid, room: roomView(room, pid) });
    }
    const dm = url.pathname.match(/^\/api\/draft\/([A-Z0-9]{5})(?:\/(join|start|pick))?$/);
    if (dm) {
        const room = rooms.get(dm[1]);
        if (!room) throw HttpError(404, "No existe ninguna sala con ese código.");
        if (!dm[2] && req.method === "GET") return send(res, 200, { room: roomView(room, url.searchParams.get("pid")) });
        if (req.method !== "POST") throw HttpError(405, "Método no permitido.");
        const b = await body(req, 2_000), me = room.players.findIndex(p => p.pid === b.pid);
        if (dm[2] === "join") {
            const name = cleanText(b.name, 14);
            if (!name) throw HttpError(400, "Escribe tu nombre.");
            if (room.phase !== "lobby") throw HttpError(400, "La partida ya ha empezado.");
            if (room.players.length >= 5) throw HttpError(400, "La sala está llena (máximo 5).");
            if (room.players.some(p => p.name.toLowerCase() === name.toLowerCase())) throw HttpError(400, "Ya hay alguien con ese nombre en la sala.");
            const pid = crypto.randomBytes(12).toString("hex");
            room.players.push({ pid, name });
            return send(res, 200, { pid, room: roomView(room, pid) });
        }
        if (me < 0) throw HttpError(403, "No formas parte de esta sala.");
        if (dm[2] === "start") {
            if (me !== 0) throw HttpError(403, "Solo el anfitrión puede empezar.");
            if (room.phase !== "lobby") throw HttpError(400, "La partida ya ha empezado.");
            if (room.players.length < 2) throw HttpError(400, "Hacen falta al menos 2 jugadores.");
            const n = room.players.length;
            Object.assign(room, { phase: "draft", per: n <= 3 ? 3 : 2, picks: room.players.map(() => []), t: 0 });
            return send(res, 200, { room: roomView(room, b.pid) });
        }
        if (dm[2] === "pick") {
            if (room.phase !== "draft") throw HttpError(400, "No es momento de elegir.");
            const n = room.players.length, round = Math.floor(room.t / n), pos = room.t % n;
            if ((round % 2 === 0 ? pos : n - 1 - pos) !== me) throw HttpError(400, "No es tu turno.");
            if (!DRAFT_CARDS.includes(b.card) || room.picks.flat().includes(b.card)) throw HttpError(400, "Esa carta ya no está disponible.");
            room.picks[me].push(b.card); room.t++;
            if (room.t >= n * room.per) room.phase = "done";
            return send(res, 200, { room: roomView(room, b.pid) });
        }
    }

    // Tu voz: votos consultivos sobre propuestas de junta. Un voto por persona y propuesta (se puede cambiar).
    const voteTotals = () => Object.fromEntries(Object.entries(votes).map(([id, m]) => {
        const t = { a: 0, c: 0, s: 0 }; Object.values(m).forEach(v => { if (t[v] !== undefined) t[v]++; }); return [id, t];
    }));
    if (route === "GET /api/voz") return send(res, 200, { totals: voteTotals() });
    const vz = url.pathname.match(/^\/api\/voz\/([a-z0-9-]{2,30})$/);
    if (vz && req.method === "POST") {
        const b = await body(req, 1_000), v = String(b.v || ""), voter = String(b.voter || "").slice(0, 64);
        if (!["a", "c", "s"].includes(v) || voter.length < 8) throw HttpError(400, "Voto no válido.");
        const key = crypto.createHash("sha256").update((userOf(req)?.id || "") + "|" + voter).digest("hex").slice(0, 24);
        if (!votes[vz[1]] && Object.keys(votes).length >= 200) throw HttpError(400, "Propuesta desconocida.");
        (votes[vz[1]] ||= {})[key] = v;
        saveVotes();
        return send(res, 200, { totals: voteTotals() });
    }

    if (route === "POST /api/coach") {
        const b = await body(req, 8_000);
        const message = cleanText(b.message, 500);
        if (!message) throw HttpError(400, "Escribe algo.");
        return send(res, 200, await coach(message, b.context, b.history));
    }

    throw HttpError(404, "Endpoint no encontrado.");
}

/* ---------- estáticos ---------- */
const MIME = {
    ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json", ".png": "image/png",
    ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon"
};
function serve(req, res, pathname) {
    let rel;
    try { rel = decodeURIComponent(pathname); } catch { res.writeHead(400); return res.end(); }
    const file = path.join(PUBLIC, rel === "/" ? "index.html" : rel);
    if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end("Forbidden"); }
    fs.stat(file, (err, st) => {
        if (err || !st.isFile()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("No encontrado"); }
        res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" });
        fs.createReadStream(file).pipe(res);
    });
}

http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) {
        try { await api(req, res, url); }
        catch (e) {
            if (!res.headersSent) send(res, e.status || 400, { error: e.message || "Error." });
        }
        return;
    }
    serve(req, res, url.pathname);
}).listen(PORT, () => {
    console.log(`Horizonte en http://localhost:${PORT}  ·  Coach: ${coachProviders().map(([n]) => n).join(" → ") || "solo respuestas predefinidas"}`);
});
