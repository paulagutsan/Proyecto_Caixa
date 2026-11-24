/* La app se ha movido a la raíz: quien la tenía instalada desde /v2/ deja de usar la copia antigua. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.registration.unregister().then(() => self.clients.matchAll({ type: "window" })).then(cs => Promise.all(cs.map(c => c.navigate(c.url))))));
