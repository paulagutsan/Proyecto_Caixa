/* Horizonte v2 · configuración pública.
   - Supabase (mismo proyecto que la v1): solo se usa para el «mapa de miedos de tu generación».
     La clave publishable es PÚBLICA por diseño; las reglas están en supabase/schema-v2.sql.
     Si esa tabla no existe todavía, la app usa datos de ejemplo.
   - geminiEndpoint: la Edge Function de Supabase «horizonte-gemini» (supabase/functions/horizonte-gemini).
     La clave de Gemini está guardada allí como secreto. Nunca pongas una clave secreta en este archivo.
     Si la función no existe o falla, el asistente usa sus respuestas locales. */
window.HZ2_CONFIG = {
    supabaseUrl: "https://norfjljehjyjovgmshdr.supabase.co",
    supabaseAnonKey: "sb_publishable_hIwboI96RdfDtUQZ5b3AwQ_kbbdRdgd",
    geminiEndpoint: "https://norfjljehjyjovgmshdr.supabase.co/functions/v1/horizonte-gemini"
};
