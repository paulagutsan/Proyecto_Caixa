"use strict";
/* Horizonte · capa social sobre Supabase
   Alias público, amigos, puntuaciones de los juegos, círculos de ahorro y salas de Draft Night.
   Todo pasa por funciones SQL (supabase/schema-social.sql) que comprueban quién llama.
   Se carga antes que app.js; usa SB, user, sbSess, sbToken y sbFetch de app.js solo dentro de funciones. */

const socialOn = () => !!(SB && user && sbSess);
const sbRpc = async (name, args = {}) => sbFetch(`/rest/v1/rpc/${name}`, { method: "POST", token: await sbToken(), body: args });
const soc = { alias: null, friends: null };
const socReset = () => { soc.alias = null; soc.friends = null; };
const ALIAS_OK = /^[A-Za-z0-9_.-]{3,20}$/;
const asciiAlias = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9_.-]/g, "");

// Devuelve el alias de la persona; si todavía no tiene, crea uno a partir de su nombre.
async function socEnsureAlias() {
    if (soc.alias) return soc.alias;
    let a = await sbRpc("mi_alias");
    if (!a) {
        const base = (asciiAlias(user.username) || "jugador").slice(0, 16).padEnd(3, "_");
        for (let i = 0; i < 8 && !a; i++) {
            const cand = i ? `${base.slice(0, 17)}${10 + Math.floor(Math.random() * 90)}` : base;
            try { a = await sbRpc("guardar_alias", { p_alias: cand }); }
            catch (e) { if (!/en uso/i.test(e.message)) throw e; }
        }
    }
    return (soc.alias = a);
}
async function socSetAlias(alias) {
    const v = String(alias || "").trim();
    if (!ALIAS_OK.test(v)) throw new Error("El alias necesita entre 3 y 20 caracteres: letras sin tildes, números, punto, guion o guion bajo.");
    return (soc.alias = await sbRpc("guardar_alias", { p_alias: v }));
}
async function socFriends(force = false) {
    if (force || !soc.friends) soc.friends = (await sbRpc("mis_amigos")) || [];
    return soc.friends;
}
async function socAddFriend(alias) { const a = await sbRpc("agregar_amigo", { p_alias: String(alias || "").trim() }); await socFriends(true); return a; }
async function socRemoveFriend(id) { await sbRpc("quitar_amigo", { p_amigo: id }); await socFriends(true); }
// dia: fecha ISO del reto; para «Más o menos» se usa el lunes de la semana
async function socSubmit(juego, dia, puntos, detalle = {}) {
    if (!socialOn()) return false;
    try { await socEnsureAlias(); await sbRpc("guardar_puntuacion", { p_juego: juego, p_dia: dia, p_puntos: Math.max(0, Math.round(puntos)), p_detalle: detalle }); return true; }
    catch (e) { console.warn("No se pudo guardar la puntuación:", e.message); return false; }
}
async function socLiga(desde, hasta) { await socEnsureAlias(); return (await sbRpc("liga", { p_desde: desde, p_hasta: hasta })) || []; }

/* Círculos: Supabase si está configurado; si no, el servidor local de Horizonte */
const circApi = {
    list: async () => SB ? { circles: (await sbRpc("mis_circulos")) || [] } : api("/circles"),
    create: async b => { if (!SB) return api("/circles", { method: "POST", body: b }); await socEnsureAlias(); return sbRpc("crear_circulo", { p_nombre: String(b.name || ""), p_categoria: String(b.category || "otro"), p_objetivo: Number(b.target) }); },
    join: async code => { if (!SB) return api("/circles/join", { method: "POST", body: { code } }); await socEnsureAlias(); return sbRpc("unirse_circulo", { p_codigo: String(code || "") }); },
    contribute: async (code, amount) => SB ? sbRpc("aportar_circulo", { p_codigo: String(code), p_importe: Number(amount) }) : api(`/circles/${code}/contribute`, { method: "POST", body: { amount } }),
    leave: async code => SB ? sbRpc("salir_circulo", { p_codigo: String(code) }) : api(`/circles/${code}/leave`, { method: "POST", body: {} })
};

/* Salas de Draft Night: estado de la partida en JSON con control de versión */
const salaApi = {
    create: estado => sbRpc("sala_crear", { p_estado: estado }),
    read: codigo => sbRpc("sala_leer", { p_codigo: codigo }),
    write: (codigo, version, estado) => sbRpc("sala_escribir", { p_codigo: codigo, p_version: version, p_estado: estado })
};
