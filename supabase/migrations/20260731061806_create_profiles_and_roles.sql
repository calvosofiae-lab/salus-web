-- E0-1: Modelo de roles y perfiles (docs/backlog/00-fundamentos.md)
--
-- Crea el enum user_role y la tabla profiles (verificado vía API que no existía
-- todavía en este proyecto). Habilita RLS de entrada con la política mínima
-- "ver/editar mi propio perfil" (adelanto parcial de E7-1) para que la tabla
-- nunca quede abierta por defecto ni un instante.
--
-- No toca la tabla legacy `profesionales` en absoluto.

create type public.user_role as enum ('admin', 'professional');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'professional',
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Crea automáticamente la fila de profile (rol "professional" por defecto) cada
-- vez que se registra un usuario nuevo en auth.users. El primer admin se
-- promueve a mano después de esta migración (ver README de la migración).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
