-- Horizonte v2 · Regalos a cualquier persona
-- Ejecutar UNA vez en Supabase → SQL Editor → New query → pegar → Run. Se puede repetir sin problema.
--
-- Qué hace: cualquiera (sin cuenta) puede preparar un regalo con su nombre, el nombre de quien lo recibe, un importe
-- y un mensaje. Se genera un enlace con un código largo. Quien recibe el enlace crea su cuenta y canjea el regalo una
-- sola vez; el importe aparece como regalo, con el nombre de quien lo envía.
--
-- IMPORTANTE para producción: en esta demostración NO se cobra nada. Antes de que un regalo pueda canjearse, el pago
-- (transferencia, Bizum o domiciliación) tiene que estar confirmado, y el canje por una persona menor requiere que su
-- familia haya autorizado la cuenta. Hay que revisarlo con Cumplimiento y Protección de Datos.

create table if not exists public.v2_regalos (
    codigo   text primary key check (codigo ~ '^[a-z0-9]{12,24}$'),
    de       text not null check (char_length(de) between 1 and 40),
    para     text not null check (char_length(para) between 1 and 40),
    importe  numeric(8, 2) not null check (importe between 1 and 3000),
    ocasion  text not null default 'Sin ocasión' check (char_length(ocasion) <= 30),
    mensaje  text check (char_length(mensaje) <= 120),
    estado   text not null default 'pendiente' check (estado in ('pendiente', 'canjeado')),
    creado   timestamptz not null default now(),
    canjeado timestamptz
);
alter table public.v2_regalos enable row level security;
revoke all on public.v2_regalos from anon, authenticated;           -- sin políticas: solo se accede por las funciones

create or replace function public.v2_regalo_crear(p_codigo text, p_de text, p_para text, p_importe numeric, p_ocasion text, p_mensaje text)
returns text language plpgsql security definer set search_path = public as $$
begin
    insert into v2_regalos (codigo, de, para, importe, ocasion, mensaje)
    values (p_codigo, left(btrim(p_de), 40), left(btrim(p_para), 40), p_importe, left(coalesce(nullif(btrim(p_ocasion), ''), 'Sin ocasión'), 30), left(btrim(coalesce(p_mensaje, '')), 120));
    return p_codigo;
end $$;

-- Ver un regalo (para mostrar la tarjeta a quien lo recibe)
create or replace function public.v2_regalo_leer(p_codigo text)
returns json language sql security definer set search_path = public stable as $$
    select json_build_object('de', de, 'para', para, 'importe', importe, 'ocasion', ocasion, 'mensaje', mensaje, 'estado', estado)
    from v2_regalos where codigo = p_codigo;
$$;

-- Canjear: solo funciona la primera vez. Devuelve el regalo, o null si ya estaba canjeado o no existe.
create or replace function public.v2_regalo_canjear(p_codigo text)
returns json language plpgsql security definer set search_path = public as $$
declare v json;
begin
    update v2_regalos set estado = 'canjeado', canjeado = now() where codigo = p_codigo and estado = 'pendiente';
    if not found then return null; end if;
    select json_build_object('de', de, 'para', para, 'importe', importe, 'ocasion', ocasion, 'mensaje', mensaje) into v from v2_regalos where codigo = p_codigo;
    return v;
end $$;

revoke all on function public.v2_regalo_crear(text, text, text, numeric, text, text) from public;
revoke all on function public.v2_regalo_leer(text) from public;
revoke all on function public.v2_regalo_canjear(text) from public;
grant execute on function public.v2_regalo_crear(text, text, text, numeric, text, text) to anon, authenticated;
grant execute on function public.v2_regalo_leer(text) to anon, authenticated;
grant execute on function public.v2_regalo_canjear(text) to anon, authenticated;
