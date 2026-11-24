-- Horizonte v2 · Cuenta compartida entre la familia y la persona joven
-- Ejecutar UNA vez en Supabase → SQL Editor → New query → pegar → Run. Se puede repetir sin problema.
--
-- Qué hace: quien abre la cuenta (la familia, o la persona joven) obtiene un enlace con un código largo y secreto.
-- Quien abre ese enlace en otro móvil entra en la misma cuenta, con su propio rol (familia o joven), y las dos
-- vistas se mantienen sincronizadas: lo que hace uno (regalos, aprobaciones, aportaciones, progreso) lo ve el otro.
--
-- Seguridad: el código tiene 26 caracteres aleatorios (≈128 bits); quien lo tenga puede leer y escribir esa cuenta,
-- así que hay que compartirlo solo dentro de la familia. La tabla no se puede leer directamente: todo pasa por dos
-- funciones. Para evitar que un móvil con datos viejos pise cambios nuevos, cada guardado lleva la versión que
-- el móvil conoce y se rechaza si ya hay otra más reciente.
-- Ojo: la cuenta guarda datos de una persona menor (nombre, fecha de nacimiento, movimientos simulados). El correo de
-- la familia NO se guarda aquí. Antes de pasar a producción, hay que revisarlo con Protección de Datos.

create table if not exists public.v2_cuentas (
    token       text primary key check (token ~ '^[a-z0-9]{20,40}$'),
    estado      jsonb not null,
    version     integer not null default 1,
    actualizado timestamptz not null default now()
);
alter table public.v2_cuentas enable row level security;
revoke all on public.v2_cuentas from anon, authenticated;           -- sin políticas: solo se accede por las funciones

-- Guarda el estado. Devuelve {ok, version}. Si ok = false, hay una versión más nueva y hay que leerla.
create or replace function public.v2_cuenta_guardar(p_token text, p_estado jsonb, p_version integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ver integer;
begin
    if pg_column_size(p_estado) > 400000 then raise exception 'estado demasiado grande'; end if;
    select version into v_ver from v2_cuentas where token = p_token for update;
    if not found then
        insert into v2_cuentas (token, estado) values (p_token, p_estado);
        return jsonb_build_object('ok', true, 'version', 1);
    end if;
    if p_version is distinct from v_ver then
        return jsonb_build_object('ok', false, 'version', v_ver);
    end if;
    update v2_cuentas set estado = p_estado, version = v_ver + 1, actualizado = now() where token = p_token;
    return jsonb_build_object('ok', true, 'version', v_ver + 1);
end $$;

-- Lee el estado. Devuelve {version, estado} o null si el código no existe.
create or replace function public.v2_cuenta_leer(p_token text)
returns jsonb language sql security definer set search_path = public stable as $$
    select jsonb_build_object('version', version, 'estado', estado) from v2_cuentas where token = p_token;
$$;

revoke all on function public.v2_cuenta_guardar(text, jsonb, integer) from public;
revoke all on function public.v2_cuenta_leer(text) from public;
grant execute on function public.v2_cuenta_guardar(text, jsonb, integer) to anon, authenticated;
grant execute on function public.v2_cuenta_leer(text) to anon, authenticated;
