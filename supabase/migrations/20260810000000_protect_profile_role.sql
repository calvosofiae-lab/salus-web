-- Revisión de seguridad (2026-08-10): profiles_update_own (20260731061806) solo restringe
-- qué FILA se puede tocar (id = auth.uid()), no qué COLUMNA -- así que cualquier usuario
-- autenticado podía auto-otorgarse el rol admin con un update directo a profiles.role
-- (fuera de la UI, que no expone ese campo), igual que el hueco que
-- protect_professional_admin_fields (20260801090000) ya tapó para professionals.
--
-- auth.uid() is not null excluye las conexiones sin sesión de usuario (service_role /
-- SQL Editor), que es como se promueve al primer admin y como un admin promueve a otros
-- a mano -- ese camino sigue funcionando igual que antes.

create function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger trg_protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();
