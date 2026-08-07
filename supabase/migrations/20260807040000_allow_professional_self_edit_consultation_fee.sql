-- consultation_fee ("precio de la sesión") pasa a poder auto-editarse: se agrega a
-- ProfessionalForm y ahora el profesional lo carga desde "Mi perfil", igual que
-- license_number (ver 20260801090000). Se saca de la lista que
-- protect_professional_admin_fields revierte para no-admins; is_active/profile_id/
-- average_rating/gender_trained siguen protegidos porque no tienen vía legítima de
-- auto-edición.

create or replace function public.protect_professional_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and pg_trigger_depth() <= 1 then
    new.is_active := old.is_active;
    new.profile_id := old.profile_id;
    new.average_rating := old.average_rating;
    new.gender_trained := old.gender_trained;
  end if;
  return new;
end;
$$;
