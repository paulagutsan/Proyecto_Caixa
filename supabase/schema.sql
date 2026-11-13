-- Horizonte · tabla de perfiles (una fila por persona con todo su progreso en JSON).
-- Se ejecuta UNA vez en Supabase: SQL Editor → New query → pegar → Run.

create table if not exists public.perfiles (
    user_id    uuid primary key references auth.users (id) on delete cascade,
    state      jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

-- Seguridad a nivel de fila: cada persona solo puede ver y modificar SU fila.
alter table public.perfiles enable row level security;

drop policy if exists "perfil_select_propio" on public.perfiles;
drop policy if exists "perfil_insert_propio" on public.perfiles;
drop policy if exists "perfil_update_propio" on public.perfiles;
drop policy if exists "perfil_delete_propio" on public.perfiles;

create policy "perfil_select_propio" on public.perfiles for select using (auth.uid() = user_id);
create policy "perfil_insert_propio" on public.perfiles for insert with check (auth.uid() = user_id);
create policy "perfil_update_propio" on public.perfiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "perfil_delete_propio" on public.perfiles for delete using (auth.uid() = user_id);

-- Sin acceso para usuarios anónimos (no registrados).
revoke all on public.perfiles from anon;
grant select, insert, update, delete on public.perfiles to authenticated;
