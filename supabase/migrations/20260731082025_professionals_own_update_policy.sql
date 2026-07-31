-- E3-5 (docs/backlog/03-administracion-profesionales.md): el profesional puede editar
-- su propia fila en `professionals`, pero no puede tocar is_active, is_featured ni
-- profile_id aunque los mande en el payload.
--
-- Nota de arquitectura: en Supabase todos los usuarios logueados comparten el mismo
-- rol de Postgres "authenticated" (admin y profesional no son roles de Postgres
-- distintos, son valores de profiles.role). Por eso no alcanza con GRANT de columnas
-- para diferenciarlos: hace falta un trigger que revierta los campos protegidos
-- salvo que quien edita sea admin (is_admin(), de E2-1).

create policy "professionals_update_own"
  on public.professionals
  for update
  to authenticated
  using (public.owns_professional(id))
  with check (public.owns_professional(id));

create function public.protect_professional_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.is_active := old.is_active;
    new.is_featured := old.is_featured;
    new.profile_id := old.profile_id;
  end if;
  return new;
end;
$$;

create trigger trg_protect_professional_admin_fields
  before update on public.professionals
  for each row execute function public.protect_professional_admin_fields();
