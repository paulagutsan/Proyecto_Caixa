-- Horizonte v2 · Amigos en los juegos
-- Ejecutar UNA vez en Supabase → SQL Editor → New query → pegar → Run. Se puede repetir sin problema.
-- Antes, activar en Authentication → Sign In / Providers → «Allow anonymous sign-ins».
--
-- Qué se comparte: solo el nombre y la inicial del apellido, y los resultados de los juegos
-- (aciertos de cada día). Nada de dinero, Antídoto, millas ni datos de la cuenta.
-- Conexiones como en LinkedIn: una persona invita con un código, la otra acepta, y a partir de ahí
-- las dos ven los resultados de la otra. Las tablas no se pueden leer directamente: todo pasa por
-- funciones que comprueban quién llama.
-- Tablas propias de la v2 (prefijo v2_): no tocan las de la v1.

create table if not exists public.v2_jugadores (
    user_id uuid primary key references auth.users (id) on delete cascade,
    nombre  text not null check (char_length(nombre) between 1 and 40),
    codigo  text not null unique check (codigo ~ '^[A-Z2-9]{6}$'),
    creado  timestamptz not null default now()
);
create table if not exists public.v2_conexiones (
    de     uuid not null references auth.users (id) on delete cascade,
    para   uuid not null references auth.users (id) on delete cascade,
    estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada')),
    creado timestamptz not null default now(),
    primary key (de, para),
    check (de <> para)
);
create index if not exists v2_conexiones_para on public.v2_conexiones (para);
create table if not exists public.v2_partidas (
    user_id  uuid not null references auth.users (id) on delete cascade,
    dia      date not null,
    juego    text not null check (juego in ('titular', 'duelo')),
    aciertos smallint not null check (aciertos between 0 and 10),
    rondas   smallint not null check (rondas between 1 and 10 and aciertos <= rondas),
    creado   timestamptz not null default now(),
    primary key (user_id, dia, juego)
);

alter table public.v2_jugadores enable row level security;
alter table public.v2_conexiones enable row level security;
alter table public.v2_partidas enable row level security;
-- sin políticas: nadie lee ni escribe las tablas directamente
revoke all on public.v2_jugadores, public.v2_conexiones, public.v2_partidas from anon, authenticated;

-- ---------------------------------------------------------------- funciones
-- Crea o actualiza tu perfil de juego y devuelve tu código de invitación
create or replace function public.v2_perfil(p_nombre text)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_cod text; v_n text := left(btrim(coalesce(p_nombre, '')), 40);
begin
    if v_uid is null then raise exception 'sin sesión'; end if;
    if v_n = '' then raise exception 'falta el nombre'; end if;
    select codigo into v_cod from v2_jugadores where user_id = v_uid;
    if v_cod is null then
        loop
            v_cod := (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 6));
            exit when not exists (select 1 from v2_jugadores where codigo = v_cod);
        end loop;
        insert into v2_jugadores (user_id, nombre, codigo) values (v_uid, v_n, v_cod);
    else
        update v2_jugadores set nombre = v_n where user_id = v_uid;
    end if;
    return v_cod;
end $$;

-- Invita por código. Si esa persona ya te había invitado, quedáis conectados.
create or replace function public.v2_conectar(p_codigo text)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_otro uuid;
begin
    if v_uid is null then raise exception 'sin sesión'; end if;
    select user_id into v_otro from v2_jugadores where codigo = upper(btrim(p_codigo));
    if v_otro is null then return 'no_existe'; end if;
    if v_otro = v_uid then return 'eres_tu'; end if;
    if exists (select 1 from v2_conexiones where de = v_otro and para = v_uid) then
        update v2_conexiones set estado = 'aceptada' where de = v_otro and para = v_uid;
        return 'conectados';
    end if;
    if exists (select 1 from v2_conexiones where de = v_uid and para = v_otro) then return 'ya_enviada'; end if;
    if (select count(*) from v2_conexiones where de = v_uid and estado = 'pendiente') >= 30 then return 'limite'; end if;
    insert into v2_conexiones (de, para) values (v_uid, v_otro);
    return 'enviada';
end $$;

-- Acepta o ignora una invitación recibida
create or replace function public.v2_responder(p_codigo text, p_aceptar boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_otro uuid;
begin
    if v_uid is null then raise exception 'sin sesión'; end if;
    select user_id into v_otro from v2_jugadores where codigo = upper(btrim(p_codigo));
    if p_aceptar then update v2_conexiones set estado = 'aceptada' where de = v_otro and para = v_uid;
    else delete from v2_conexiones where de = v_otro and para = v_uid; end if;
end $$;

-- Quita una conexión (o retira una invitación enviada)
create or replace function public.v2_quitar(p_codigo text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_otro uuid;
begin
    if v_uid is null then raise exception 'sin sesión'; end if;
    select user_id into v_otro from v2_jugadores where codigo = upper(btrim(p_codigo));
    delete from v2_conexiones where (de = v_uid and para = v_otro) or (de = v_otro and para = v_uid);
end $$;

-- Tu red: conexiones aceptadas, invitaciones recibidas y enviadas
create or replace function public.v2_red()
returns table (codigo text, nombre text, estado text) language sql stable security definer set search_path = public as $$
    select j.codigo, j.nombre, case when c.estado = 'aceptada' then 'amigo' when c.para = auth.uid() then 'recibida' else 'enviada' end
    from v2_conexiones c join v2_jugadores j on j.user_id = case when c.de = auth.uid() then c.para else c.de end
    where auth.uid() in (c.de, c.para)
    order by c.creado desc;
$$;

-- Guarda tu resultado del día (se queda el mejor de cada juego)
create or replace function public.v2_guardar_partida(p_dia date, p_juego text, p_aciertos int, p_rondas int)
returns void language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'sin sesión'; end if;
    if p_dia not between current_date - 1 and current_date + 1 then raise exception 'fecha no válida'; end if;
    insert into v2_partidas (user_id, dia, juego, aciertos, rondas) values (auth.uid(), p_dia, p_juego, p_aciertos, p_rondas)
    on conflict (user_id, dia, juego) do update set aciertos = greatest(v2_partidas.aciertos, excluded.aciertos), rondas = excluded.rondas;
end $$;

-- Resultados tuyos y de tus amigos desde una fecha (como mucho, 31 días)
create or replace function public.v2_partidas_amigos(p_desde date)
returns table (codigo text, nombre text, yo boolean, dia date, juego text, aciertos smallint, rondas smallint)
language sql stable security definer set search_path = public as $$
    with red as (
        select auth.uid() as uid
        union select case when c.de = auth.uid() then c.para else c.de end from v2_conexiones c
        where c.estado = 'aceptada' and auth.uid() in (c.de, c.para)
    )
    select j.codigo, j.nombre, p.user_id = auth.uid(), p.dia, p.juego, p.aciertos, p.rondas
    from v2_partidas p join red on red.uid = p.user_id join v2_jugadores j on j.user_id = p.user_id
    where p.dia >= greatest(p_desde, current_date - 31)
    order by p.dia desc, p.creado desc;
$$;

revoke all on function public.v2_perfil(text), public.v2_conectar(text), public.v2_responder(text, boolean), public.v2_quitar(text),
    public.v2_red(), public.v2_guardar_partida(date, text, int, int), public.v2_partidas_amigos(date) from public, anon;
grant execute on function public.v2_perfil(text), public.v2_conectar(text), public.v2_responder(text, boolean), public.v2_quitar(text),
    public.v2_red(), public.v2_guardar_partida(date, text, int, int), public.v2_partidas_amigos(date) to authenticated;
