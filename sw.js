/* Horizonte v2 · service worker
   Para que se pueda instalar como app y abrir sin conexión. Siempre intenta la red primero, así cada
   cambio publicado se ve al momento; si no hay conexión, usa la última copia guardada.
   Actúa en la raíz del sitio; la versión 1 (/v1/) y las redirecciones antiguas quedan fuera.
   Nunca guarda nada de Supabase ni de Gemini (datos de cuenta, amigos, asistente). */
const CACHE = "horizonte-58";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./brand/horizonte-icono.svg", "./brand/horizonte-logo.png"];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("horizonte-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
    const req = e.request, url = new URL(req.url);
    if (req.method !== "GET") return;
    const fonts = url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com";
    if (url.origin !== location.origin && !fonts) return;                        // Supabase, Gemini y demás: directo a la red
    if (url.origin === location.origin && /\/(v1|v2|public)\//.test(url.pathname)) return;
    if (url.origin === location.origin && !url.pathname.startsWith(new URL("./", self.registration.scope).pathname)) return;
    if (fonts) {                                                                 // tipografías: primero la copia guardada
        e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })));
        return;
    }
    // la página y el código se revalidan siempre: GitHub Pages deja guardar 10 minutos y parecía que no se actualizaba
    e.respondWith(fetch(req.mode === "navigate" ? new Request(req.url, { cache: "no-cache", credentials: "same-origin" }) : req, req.mode === "navigate" ? {} : { cache: "no-cache" }).then(res => {   // lo demás: primero la red
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match(req, { ignoreSearch: true })
        .then(h2 => h2 || (req.mode === "navigate" ? caches.match("./index.html") : Response.error())))));
});
