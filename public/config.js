/* Horizonte · configuración pública del acceso con cuentas.
   Se usa Supabase (plan gratuito). La clave «anon» / «publishable» es PÚBLICA por diseño:
   va en el navegador y la seguridad la dan las reglas de la base de datos (supabase/schema.sql).
   NUNCA pegues aquí la clave «service_role» ni la «secret».
   Pasos para activarlo: README.md, apartado «Cuentas gratuitas con Supabase». */
window.HZ_CONFIG = {
    supabaseUrl: "",      // p. ej. https://abcdxyz.supabase.co
    supabaseAnonKey: ""   // clave «anon public» o «publishable»
};
