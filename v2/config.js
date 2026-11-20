/* Horizonte v2 · configuración pública.
   - Supabase (mismo proyecto que la v1): solo se usa para el «mapa de miedos de tu generación».
     La clave publishable es PÚBLICA por diseño; las reglas están en supabase/schema-v2.sql.
     Si esa tabla no existe todavía, la app usa datos de ejemplo.
   - geminiEndpoint: si algún día hay un servicio propio que llame a Gemini (Google Cloud),
     pon aquí su URL. Nunca pongas una clave secreta en este archivo. */
window.HZ2_CONFIG = {
    supabaseUrl: "https://norfjljehjyjovgmshdr.supabase.co",
    supabaseAnonKey: "sb_publishable_hIwboI96RdfDtUQZ5b3AwQ_kbbdRdgd",
    geminiEndpoint: null
};
