"use strict";
/* Horizonte · servidor sin dependencias (Node >= 18)
   - Auth con scrypt + cookie HttpOnly
   - Estado por usuario sincronizado (/api/state)
   - Círculos compartidos con código de invitación (/api/circles)
   - Coach financiero: Gemini si hay GEMINI_API_KEY, reglas locales si no */

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
const saveUsers = () => write(F_USERS, users);
const saveCircles = () => write(F_CIRCLES, circles);
const saveSessions = () => write(F_SESSIONS, sessions);

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
        code: c.code, name: c.name, emoji: c.emoji, target: c.target, total, createdAt: c.createdAt,
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
const COACH_SYSTEM = `Eres "Hori", el coach financiero de Horizonte, una app de ahorro e inversión para la Generación Z creada para el reto CaixaBank Asset Management x Google.
Tono: cercano, claro, español de España, frases cortas, algún emoji, cero jerga sin explicar. Máximo 120 palabras.
Reglas: eres EDUCATIVO. No des asesoramiento de inversión personalizado, no recomiendes productos concretos ni prometas rentabilidades. Recuerda que la rentabilidad pasada no garantiza la futura y que invertir implica riesgo de pérdida. Si preguntan qué comprar, explica criterios (horizonte, riesgo, diversificación, costes) y sugiere hablar con un asesor. Usa los datos del usuario (metas, ahorro) para personalizar.`;

function localCoach(msg, ctx) {
    const m = msg.toLowerCase();
    const goals = ctx?.goals || [];
    const left = goals.filter(g => g.saved < g.target);
    if (/hola|buenas|hey/.test(m)) return "¡Ey! 👋 Soy Hori. Pregúntame por tus metas, el interés compuesto, la inflación o cómo empezar a invertir sin liarte.";
    if (/inter[eé]s compuesto|compuesto/.test(m)) return "El interés compuesto es cobrar intereses… sobre tus intereses 🌱. Con 100 €/mes al 5% hipotético, en 10 años aportas 12.000 € y podrías tener ~15.500 €. El tiempo pesa más que la cantidad: empezar pronto es tu superpoder. (Es una simulación, no una promesa).";
    if (/inflaci/.test(m)) return "La inflación hace que tus euros compren menos cada año 📉. Si dejas dinero parado con una inflación del 3%, en 10 años pierde ~26% de poder de compra. Por eso en el simulador puedes ver el valor «real» además del nominal.";
    if (/diversific/.test(m)) return "Diversificar = no poner todos los huevos en la misma cesta 🥚. Repartir entre distintos activos, sectores y países reduce el impacto de que una sola inversión vaya mal. No elimina el riesgo, pero lo suaviza.";
    if (/riesgo|perder/.test(m)) return "Más rentabilidad potencial = más riesgo de pérdida, siempre. Pregúntate: ¿cuándo necesito este dinero? Para <3 años, suele pesar más la estabilidad; para 10+ años, puedes tolerar más vaivenes. Haz el test de perfil en Aprende ✨";
    if (/emergencia|colch[oó]n/.test(m)) return "Antes de invertir, monta un colchón de 3-6 meses de gastos básicos en algo líquido y seguro 🛟. Es lo que evita que tengas que vender en mal momento si surge un imprevisto.";
    if (/empez|invertir|invertir/.test(m)) return "Para empezar: 1️⃣ colchón de emergencia, 2️⃣ define para qué ahorras (¡tus metas!), 3️⃣ aporta una cantidad pequeña y automática cada mes, 4️⃣ aprende costes y riesgos. No necesitas mucho dinero, necesitas constancia. Esto es educativo; para decisiones concretas habla con un asesor.";
    if (/meta|objetivo|cu[aá]nto|llego|ahorr/.test(m) && left.length) {
        const g = left[0];
        const need = Math.max(0, g.target - g.saved);
        return `Tu meta «${g.name}» va al ${Math.round((g.saved / g.target) * 100)}% 🎯. Te faltan ${Math.round(need).toLocaleString("es-ES")} € y aportas ${g.monthly} €/mes. Mira el simulador para ver qué pasa si subes 20 € al mes: a veces el cambio es mayor de lo que parece.`;
    }
    return "Buena pregunta 🤔. Te puedo ayudar con: interés compuesto, inflación, riesgo, diversificación, fondo de emergencia o con tus metas. ¿Por cuál empezamos?";
}

async function coach(message, context) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return { reply: localCoach(message, context), source: "local" };
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const ctxTxt = context ? `Datos del usuario (JSON): ${JSON.stringify(context).slice(0, 2000)}` : "";
    try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: `${COACH_SYSTEM}\n${ctxTxt}` }] },
                contents: [{ role: "user", parts: [{ text: message }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 350 }
            }),
            signal: AbortSignal.timeout(12_000)
        });
        if (!r.ok) throw new Error(`Gemini ${r.status}`);
        const j = await r.json();
        const text = j.candidates?.[0]?.content?.parts?.map(p => p.text).join("").trim();
        if (!text) throw new Error("vacío");
        return { reply: text, source: "gemini" };
    } catch (e) {
        console.warn("Coach: fallback local →", e.message);
        return { reply: localCoach(message, context), source: "local" };
    }
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
            code: newCode(), name, emoji: cleanText(b.emoji, 4) || "🎯", target, ownerId: u.id, createdAt: new Date().toISOString(),
            members: [{ userId: u.id, username: u.username, contributed: 0 }],
            feed: [{ t: Date.now(), text: `${u.username} creó el círculo` }]
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
            c.feed.push({ t: Date.now(), text: `${u.username} se unió 🎉` });
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
                c.feed.push({ t: Date.now(), text: `${u.username} salió del círculo` });
            }
            saveCircles();
            return send(res, 200, { ok: true });
        }
        const b = await body(req, 2_000);
        const amount = clampNum(b.amount, 0.01, 100_000);
        if (amount === null) throw HttpError(400, "Cantidad no válida.");
        me.contributed = Math.round((me.contributed + amount) * 100) / 100;
        const total = c.members.reduce((s, x) => s + x.contributed, 0);
        c.feed.push({ t: Date.now(), text: `${u.username} aportó ${amount.toLocaleString("es-ES")} € 💪` });
        if (total >= c.target && !c.done) { c.done = true; c.feed.push({ t: Date.now(), text: "¡Objetivo del círculo conseguido! 🏆" }); }
        c.feed = c.feed.slice(-100);
        saveCircles();
        return send(res, 200, { circle: circleView(c, u) });
    }

    if (route === "POST /api/coach") {
        const b = await body(req, 8_000);
        const message = cleanText(b.message, 500);
        if (!message) throw HttpError(400, "Escribe algo.");
        return send(res, 200, await coach(message, b.context));
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
    console.log(`Horizonte en http://localhost:${PORT}  ·  Coach: ${process.env.GEMINI_API_KEY ? "Gemini" : "modo local (define GEMINI_API_KEY para activar Gemini)"}`);
});
