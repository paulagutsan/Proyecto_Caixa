-- Horizonte v2 · Mapa de miedos de tu generación
-- Ejecutar UNA vez en Supabase → SQL Editor. Ranking anónimo: solo se guarda el miedo y la edad.
-- Mientras no exista, la app enseña datos de ejemplo.

create table if not exists public.miedos_v2 (
  id bigint generated always as identity primary key,
  miedo text not null check (miedo in ('ia','casa','clima','precios','salud','coche')),
  edad smallint check (edad between 10 and 99),
  creado timestamptz not null default now()
);

alter table public.miedos_v2 enable row level security;

-- cualquiera puede votar (anónimo); nadie puede leer, cambiar ni borrar votos sueltos
drop policy if exists "votar" on public.miedos_v2;
create policy "votar" on public.miedos_v2 for insert to anon, authenticated with check (true);

-- solo se publica el recuento agregado
create or replace view public.miedos_v2_ranking as
  select miedo, count(*)::int as votos from public.miedos_v2 group by miedo;

grant insert on public.miedos_v2 to anon, authenticated;
grant select on public.miedos_v2_ranking to anon, authenticated;
