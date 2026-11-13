-- Horizonte · capa social: alias, amigos, puntuaciones de los juegos, círculos de ahorro y salas de Draft Night.
-- Se ejecuta UNA vez en Supabase (SQL Editor → New query → pegar → Run), después de schema.sql.
-- Se puede volver a ejecutar sin problema: todo usa «if not exists» / «or replace».

-- =========================================================
-- 1) Jugadores: el alias público de cada persona
-- =========================================================
create table if not exists public.jugadores (
    user_id uuid primary key references auth.users (id) on delete cascade,
    alias   text not null check (char_length(alias) between 3 and 20),
    creado  timestamptz not null default now()
);
create unique index if not exists jugadores_alias_unico on public.jugadores (lower(alias));
alter table public.jugadores enable row level security;
drop policy if exists "jugadores_ver" on public.jugadores;
drop policy if exists "jugadores_crear" on public.jugadores;
drop policy if exists "jugadores_editar" on public.jugadores;
create policy "jugadores_ver" on public.jugadores for select to authenticated using (true);
create policy "jugadores_crear" on public.jugadores for insert to authenticated with check (auth.uid() = user_id);
create policy "jugadores_editar" on public.jugadores for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on public.jugadores from anon;
grant select, insert, update on public.jugadores to authenticated;

-- =========================================================
-- 2) Amigos: cada persona ve las puntuaciones de las que añade
-- =========================================================
create table if not exists public.amigos (
    user_id  uuid not null references auth.users (id) on delete cascade,
    amigo_id uuid not null references auth.users (id) on delete cascade,
    creado   timestamptz not null default now(),
    primary key (user_id, amigo_id),
    check (user_id <> amigo_id)
);
alter table public.amigos enable row level security;
drop policy if exists "amigos_ver" on public.amigos;
drop policy if exists "amigos_crear" on public.amigos;
drop policy if exists "amigos_borrar" on public.amigos;
create policy "amigos_ver" on public.amigos for select to authenticated using (auth.uid() = user_id);
create policy "amigos_crear" on public.amigos for insert to authenticated with check (auth.uid() = user_id);
create policy "amigos_borrar" on public.amigos for delete to authenticated using (auth.uid() = user_id);
revoke all on public.amigos from anon;
grant select, insert, delete on public.amigos to authenticated;

-- =========================================================
-- 3) Puntuaciones de los juegos
--    Juegos diarios: una fila por día. «Más o menos»: una fila por semana (dia = lunes).
-- =========================================================
create table if not exists public.puntuaciones (
    user_id     uuid not null references auth.users (id) on delete cascade,
    juego       text not null check (juego in ('noticia', 'silueta', 'masomenos')),
    dia         date not null,
    puntos      integer not null check (puntos between 0 and 100000),
    detalle     jsonb not null default '{}'::jsonb,
    actualizada timestamptz not null default now(),
    primary key (user_id, juego, dia)
);
alter table public.puntuaciones enable row level security;
drop policy if exists "puntuaciones_ver" on public.puntuaciones;
drop policy if exists "puntuaciones_crear" on public.puntuaciones;
drop policy if exists "puntuaciones_editar" on public.puntuaciones;
create policy "puntuaciones_ver" on public.puntuaciones for select to authenticated
    using (user_id = auth.uid() or exists (select 1 from public.amigos a where a.user_id = auth.uid() and a.amigo_id = puntuaciones.user_id));
create policy "puntuaciones_crear" on public.puntuaciones for insert to authenticated with check (user_id = auth.uid());
create policy "puntuaciones_editar" on public.puntuaciones for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.puntuaciones from anon;
grant select, insert, update on public.puntuaciones to authenticated;

-- =========================================================
-- 4) Círculos de ahorro
-- =========================================================
create table if not exists public.circulos (
    id        uuid primary key default gen_random_uuid(),
    codigo    text not null unique,
    nombre    text not null check (char_length(nombre) between 1 and 40),
    categoria text not null default 'otro',
    objetivo  numeric not null check (objetivo > 0 and objetivo <= 100000000),
    dueno     uuid not null references auth.users (id) on delete cascade,
    creado    timestamptz not null default now()
);
create table if not exists public.miembros_circulo (
    circulo_id uuid not null references public.circulos (id) on delete cascade,
    user_id    uuid not null references auth.users (id) on delete cascade,
    alias      text not null,
    aportado   numeric not null default 0 check (aportado >= 0),
    unido      timestamptz not null default now(),
    primary key (circulo_id, user_id)
);
create table if not exists public.movimientos_circulo (
    id         bigint generated always as identity primary key,
    circulo_id uuid not null references public.circulos (id) on delete cascade,
    texto      text not null,
    t          timestamptz not null default now()
);
create index if not exists movimientos_circulo_idx on public.movimientos_circulo (circulo_id, t desc);
alter table public.circulos enable row level security;
alter table public.miembros_circulo enable row level security;
alter table public.movimientos_circulo enable row level security;
-- Todo el acceso pasa por las funciones de más abajo (security definer): sin políticas directas.
revoke all on public.circulos, public.miembros_circulo, public.movimientos_circulo from anon, authenticated;

-- =========================================================
-- 5) Salas de Draft Night (estado de la partida en JSON)
-- =========================================================
create table if not exists public.salas (
    codigo      text primary key,
    host        uuid not null references auth.users (id) on delete cascade,
    version     integer not null default 0,
    estado      jsonb not null,
    creada      timestamptz not null default now(),
    actualizada timestamptz not null default now()
);
alter table public.salas enable row level security;
revoke all on public.salas from anon, authenticated;

-- =========================================================
-- Funciones (security definer: se ejecutan con permisos del sistema y comprueban quién llama)
-- =========================================================
create or replace function public.guardar_alias(p_alias text) returns text
language plpgsql security definer set search_path = public as $$
declare v text := btrim(p_alias);
begin
    if auth.uid() is null then raise exception 'Inicia sesión para continuar.'; end if;
    if v is null or char_length(v) < 3 or char_length(v) > 20 then raise exception 'El alias debe tener entre 3 y 20 caracteres.'; end if;
    if v !~ '^[[:alnum:]_.-]+$' then raise exception 'El alias solo puede llevar letras, números, punto, guion y guion bajo.'; end if;
    begin
        insert into jugadores (user_id, alias) values (auth.uid(), v)
        on conflict (user_id) do update set alias = excluded.alias;
    exception when unique_violation then
        raise exception 'Ese alias ya está en uso. Prueba con otro.';
    end;
    update miembros_circulo set alias = v where user_id = auth.uid();
    return v;
end $$;

create or replace function public.mi_alias() returns text
language sql security definer set search_path = public stable as $$
    select alias from jugadores where user_id = auth.uid();
$$;

create or replace function public.agregar_amigo(p_alias text) returns text
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_alias text;
begin
    if auth.uid() is null then raise exception 'Inicia sesión para continuar.'; end if;
    select user_id, alias into v_id, v_alias from jugadores where lower(alias) = lower(btrim(p_alias));
    if v_id is null then raise exception 'No encontramos a nadie con ese alias.'; end if;
    if v_id = auth.uid() then raise exception 'Ese eres tú.'; end if;
    insert into amigos (user_id, amigo_id) values (auth.uid(), v_id) on conflict do nothing;
    return v_alias;
end $$;

create or replace function public.quitar_amigo(p_amigo uuid) returns void
language sql security definer set search_path = public as $$
    delete from amigos where user_id = auth.uid() and amigo_id = p_amigo;
$$;

create or replace function public.mis_amigos() returns table (user_id uuid, alias text)
language sql security definer set search_path = public stable as $$
    select j.user_id, j.alias from amigos a join jugadores j on j.user_id = a.amigo_id
    where a.user_id = auth.uid() order by lower(j.alias);
$$;

create or replace function public.guardar_puntuacion(p_juego text, p_dia date, p_puntos integer, p_detalle jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'Inicia sesión para continuar.'; end if;
    if p_juego not in ('noticia', 'silueta', 'masomenos') then raise exception 'Juego no válido.'; end if;
    if p_puntos < 0 or p_puntos > 100000 then raise exception 'Puntuación no válida.'; end if;
    if p_dia < current_date - 8 or p_dia > current_date + 1 then raise exception 'Fecha no válida.'; end if;
    insert into puntuaciones (user_id, juego, dia, puntos, detalle) values (auth.uid(), p_juego, p_dia, p_puntos, coalesce(p_detalle, '{}'::jsonb))
    on conflict (user_id, juego, dia) do update
        set puntos = greatest(puntuaciones.puntos, excluded.puntos),
            detalle = case when excluded.puntos > puntuaciones.puntos then excluded.detalle else puntuaciones.detalle end,
            actualizada = now();
end $$;

create or replace function public.liga(p_desde date, p_hasta date)
returns table (user_id uuid, alias text, juego text, dia date, puntos integer, es_yo boolean)
language sql security definer set search_path = public stable as $$
    select p.user_id, j.alias, p.juego, p.dia, p.puntos, (p.user_id = auth.uid())
    from puntuaciones p join jugadores j on j.user_id = p.user_id
    where p.dia between p_desde and p_hasta
      and (p.user_id = auth.uid() or exists (select 1 from amigos a where a.user_id = auth.uid() and a.amigo_id = p.user_id));
$$;

create or replace function public.crear_circulo(p_nombre text, p_categoria text, p_objetivo numeric) returns text
language plpgsql security definer set search_path = public as $$
declare v_code text; v_id uuid; v_alias text;
begin
    if auth.uid() is null then raise exception 'Inicia sesión para continuar.'; end if;
    if p_nombre is null or char_length(btrim(p_nombre)) = 0 or char_length(p_nombre) > 40 then raise exception 'Ponle un nombre al círculo (máximo 40 caracteres).'; end if;
    if p_objetivo is null or p_objetivo <= 0 then raise exception 'El objetivo debe ser mayor que cero.'; end if;
    select alias into v_alias from jugadores where user_id = auth.uid();
    if v_alias is null then raise exception 'Elige un alias antes de crear un círculo.'; end if;
    loop
        v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
        exit when not exists (select 1 from circulos where codigo = v_code);
    end loop;
    insert into circulos (codigo, nombre, categoria, objetivo, dueno) values (v_code, btrim(p_nombre), coalesce(p_categoria, 'otro'), p_objetivo, auth.uid()) returning id into v_id;
    insert into miembros_circulo (circulo_id, user_id, alias) values (v_id, auth.uid(), v_alias);
    insert into movimientos_circulo (circulo_id, texto) values (v_id, v_alias || ' ha creado el círculo');
    return v_code;
end $$;

create or replace function public.unirse_circulo(p_codigo text) returns text
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_alias text;
begin
    if auth.uid() is null then raise exception 'Inicia sesión para continuar.'; end if;
    select id into v_id from circulos where codigo = upper(btrim(p_codigo));
    if v_id is null then raise exception 'No existe ningún círculo con ese código.'; end if;
    select alias into v_alias from jugadores where user_id = auth.uid();
    if v_alias is null then raise exception 'Elige un alias antes de unirte a un círculo.'; end if;
    if exists (select 1 from miembros_circulo where circulo_id = v_id and user_id = auth.uid()) then raise exception 'Ya formas parte de ese círculo.'; end if;
    if (select count(*) from miembros_circulo where circulo_id = v_id) >= 50 then raise exception 'El círculo está completo.'; end if;
    insert into miembros_circulo (circulo_id, user_id, alias) values (v_id, auth.uid(), v_alias);
    insert into movimientos_circulo (circulo_id, texto) values (v_id, v_alias || ' se ha unido al círculo');
    return upper(btrim(p_codigo));
end $$;

create or replace function public.aportar_circulo(p_codigo text, p_importe numeric) returns void
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_alias text; v_objetivo numeric; v_antes numeric; v_despues numeric; v_txt text;
begin
    if auth.uid() is null then raise exception 'Inicia sesión para continuar.'; end if;
    if p_importe is null or p_importe <= 0 or p_importe > 100000 then raise exception 'Cantidad no válida.'; end if;
    select c.id, c.objetivo into v_id, v_objetivo from circulos c where c.codigo = upper(btrim(p_codigo))
        and exists (select 1 from miembros_circulo m where m.circulo_id = c.id and m.user_id = auth.uid());
    if v_id is null then raise exception 'No formas parte de ese círculo.'; end if;
    select coalesce(sum(aportado), 0) into v_antes from miembros_circulo where circulo_id = v_id;
    update miembros_circulo set aportado = round(aportado + p_importe, 2) where circulo_id = v_id and user_id = auth.uid() returning alias into v_alias;
    v_txt := regexp_replace(translate(to_char(p_importe, 'FM999,999,990.00'), ',.', '.,'), ',00$', '');  -- 1.234,5 € en formato español
    insert into movimientos_circulo (circulo_id, texto) values (v_id, v_alias || ' ha aportado ' || v_txt || ' €');
    v_despues := v_antes + p_importe;
    if v_antes < v_objetivo and v_despues >= v_objetivo then
        insert into movimientos_circulo (circulo_id, texto) values (v_id, 'Objetivo del círculo alcanzado');
    end if;
end $$;

create or replace function public.salir_circulo(p_codigo text) returns void
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_alias text;
begin
    select c.id into v_id from circulos c where c.codigo = upper(btrim(p_codigo));
    if v_id is null then return; end if;
    delete from miembros_circulo where circulo_id = v_id and user_id = auth.uid() returning alias into v_alias;
    if v_alias is null then return; end if;
    if not exists (select 1 from miembros_circulo where circulo_id = v_id) then
        delete from circulos where id = v_id;
    else
        update circulos set dueno = (select user_id from miembros_circulo where circulo_id = v_id order by unido limit 1) where id = v_id and dueno = auth.uid();
        insert into movimientos_circulo (circulo_id, texto) values (v_id, v_alias || ' ha abandonado el círculo');
    end if;
end $$;

create or replace function public.mis_circulos() returns jsonb
language sql security definer set search_path = public stable as $$
    select coalesce(jsonb_agg(q.c order by q.creado desc), '[]'::jsonb) from (
        select ci.creado, jsonb_build_object(
            'code', ci.codigo, 'name', ci.nombre, 'category', ci.categoria, 'target', ci.objetivo,
            'total', coalesce((select sum(m.aportado) from miembros_circulo m where m.circulo_id = ci.id), 0),
            'done', coalesce((select sum(m.aportado) from miembros_circulo m where m.circulo_id = ci.id), 0) >= ci.objetivo,
            'members', coalesce((select jsonb_agg(jsonb_build_object('username', m.alias, 'contributed', m.aportado, 'isMe', m.user_id = auth.uid(), 'isOwner', m.user_id = ci.dueno) order by m.aportado desc, m.unido) from miembros_circulo m where m.circulo_id = ci.id), '[]'::jsonb),
            'feed', coalesce((select jsonb_agg(jsonb_build_object('t', (extract(epoch from x.t) * 1000)::bigint, 'text', x.texto) order by x.t desc) from (select * from movimientos_circulo mv where mv.circulo_id = ci.id order by mv.t desc limit 25) x), '[]'::jsonb)
        ) as c
        from circulos ci
        where exists (select 1 from miembros_circulo mm where mm.circulo_id = ci.id and mm.user_id = auth.uid())
    ) q;
$$;

create or replace function public.sala_crear(p_estado jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_code text; abc text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
    if auth.uid() is null then raise exception 'Inicia sesión para jugar online.'; end if;
    delete from salas where creada < now() - interval '1 day';
    loop
        v_code := '';
        for i in 1..5 loop v_code := v_code || substr(abc, 1 + floor(random() * length(abc))::int, 1); end loop;
        exit when not exists (select 1 from salas where codigo = v_code);
    end loop;
    insert into salas (codigo, host, estado) values (v_code, auth.uid(), p_estado);
    return jsonb_build_object('codigo', v_code, 'version', 0, 'estado', p_estado);
end $$;

create or replace function public.sala_leer(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare r salas;
begin
    if auth.uid() is null then raise exception 'Inicia sesión para jugar online.'; end if;
    select * into r from salas where codigo = upper(btrim(p_codigo));
    if r.codigo is null then raise exception 'No existe ninguna sala con ese código.'; end if;
    return jsonb_build_object('codigo', r.codigo, 'version', r.version, 'estado', r.estado);
end $$;

create or replace function public.sala_escribir(p_codigo text, p_version integer, p_estado jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r salas;
begin
    if auth.uid() is null then raise exception 'Inicia sesión para jugar online.'; end if;
    update salas set estado = p_estado, version = version + 1, actualizada = now()
    where codigo = upper(btrim(p_codigo)) and version = p_version returning * into r;
    if r.codigo is null then raise exception 'conflicto'; end if;
    return jsonb_build_object('codigo', r.codigo, 'version', r.version, 'estado', r.estado);
end $$;

-- =========================================================
-- 6) Conecta · Tu voz: votos consultivos de la comunidad
-- =========================================================
create table if not exists public.votos_voz (
    user_id   uuid not null references auth.users (id) on delete cascade,
    propuesta text not null check (propuesta ~ '^[a-z0-9-]{2,30}$'),
    voto      text not null check (voto in ('a', 'c', 's')),
    primary key (user_id, propuesta)
);
alter table public.votos_voz enable row level security;
revoke all on public.votos_voz from anon, authenticated;

create or replace function public.totales_voz() returns jsonb
language sql security definer set search_path = public stable as $$
    select coalesce(jsonb_object_agg(q.propuesta, q.t), '{}'::jsonb) from (
        select propuesta, jsonb_build_object(
            'a', count(*) filter (where voto = 'a'),
            'c', count(*) filter (where voto = 'c'),
            's', count(*) filter (where voto = 's')) as t
        from votos_voz group by propuesta
    ) q;
$$;

create or replace function public.votar_voz(p_propuesta text, p_voto text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'Inicia sesión para continuar.'; end if;
    if p_voto not in ('a', 'c', 's') then raise exception 'Voto no válido.'; end if;
    if p_propuesta !~ '^[a-z0-9-]{2,30}$' then raise exception 'Propuesta no válida.'; end if;
    insert into votos_voz (user_id, propuesta, voto) values (auth.uid(), p_propuesta, p_voto)
    on conflict (user_id, propuesta) do update set voto = excluded.voto;
    return public.totales_voz();
end $$;

-- Solo personas con sesión pueden llamar a las funciones.
do $$
declare f text;
begin
    foreach f in array array[
        'guardar_alias(text)', 'mi_alias()', 'agregar_amigo(text)', 'quitar_amigo(uuid)', 'mis_amigos()',
        'guardar_puntuacion(text,date,integer,jsonb)', 'liga(date,date)', 'crear_circulo(text,text,numeric)',
        'unirse_circulo(text)', 'aportar_circulo(text,numeric)', 'salir_circulo(text)', 'mis_circulos()',
        'sala_crear(jsonb)', 'sala_leer(text)', 'sala_escribir(text,integer,jsonb)', 'totales_voz()', 'votar_voz(text,text)'
    ] loop
        execute format('revoke all on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;

-- Los totales de «Tu voz» son solo recuentos: se pueden ver sin iniciar sesión.
grant execute on function public.totales_voz() to anon;
