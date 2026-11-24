-- Horizonte v2 · Registro y verificación de certificados
-- Ejecutar UNA vez en Supabase → SQL Editor → New query → pegar → Run. Se puede repetir sin problema.
-- Necesita «Allow anonymous sign-ins» activado (el mismo requisito que Amigos).
--
-- Qué hace: la página de verificación (#/verificar?c=CÓDIGO) ya no se fía de lo que diga la URL. Consulta este
-- registro y solo muestra «Certificado verificado» si el código existe. Muestra únicamente el nombre con la inicial
-- del apellido, la fecha, el resultado y la próxima revisión.
--
-- IMPORTANTE para producción: aquí el certificado lo registra la propia web tras aprobar la prueba en el navegador.
-- Un registro de verdad debe emitirse desde un servidor que corrija la prueba (por ejemplo, una Edge Function que
-- reciba las respuestas y firme la emisión). Esto ya impide las falsificaciones por URL, pero no es a prueba de
-- alguien que llame a la función directamente.

create table if not exists public.v2_certificados (
    codigo    text primary key check (codigo ~ '^HZ-[A-Z0-9]{5}-[A-Z0-9]{5}$'),
    user_id   uuid not null unique references auth.users (id) on delete cascade,
    nombre    text not null check (char_length(nombre) between 1 and 60),
    emitido   date not null,
    resultado text not null check (resultado ~ '^[0-9]{1,2}/[0-9]{1,2}$'),
    revision  date not null,
    estado    text not null default 'vigente' check (estado in ('vigente', 'revocado')),
    creado    timestamptz not null default now()
);
alter table public.v2_certificados enable row level security;
revoke all on public.v2_certificados from anon, authenticated;     -- sin políticas: solo se accede por las funciones

-- Registra (o actualiza la revisión de) el certificado de quien llama. Devuelve el código que queda guardado.
create or replace function public.v2_certificado_emitir(p_codigo text, p_nombre text, p_emitido date, p_resultado text, p_revision date)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_cod text;
begin
    if v_uid is null then raise exception 'sin sesión'; end if;
    insert into v2_certificados (codigo, user_id, nombre, emitido, resultado, revision)
    values (upper(p_codigo), v_uid, left(btrim(p_nombre), 60), p_emitido, p_resultado, p_revision)
    on conflict (user_id) do update set revision = excluded.revision
    returning codigo into v_cod;
    return v_cod;
end $$;

-- Comprueba un código. No exige sesión: cualquiera con el enlace puede verificar.
create or replace function public.v2_certificado_verificar(p_codigo text)
returns json language sql security definer set search_path = public stable as $$
    select json_build_object('nombre', nombre, 'emitido', emitido, 'resultado', resultado, 'revision', revision, 'estado', estado)
    from v2_certificados where codigo = upper(btrim(p_codigo));
$$;

revoke all on function public.v2_certificado_emitir(text, text, date, text, date) from public;
revoke all on function public.v2_certificado_verificar(text) from public;
grant execute on function public.v2_certificado_emitir(text, text, date, text, date) to authenticated;
grant execute on function public.v2_certificado_verificar(text) to anon, authenticated;
