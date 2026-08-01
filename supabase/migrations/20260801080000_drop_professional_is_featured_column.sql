-- La sección "Profesionales Destacados" pasó a ser automática por rating
-- (06-calificaciones.md#E6-7) y el checkbox "Destacado" ya se sacó del formulario. La
-- columna `is_featured` quedó sin ningún lector ni escritor en la app; se elimina para no
-- dejar una columna congelada y sin sentido en la tabla de admin.
--
-- El trigger protect_professional_admin_fields (E3-5,
-- 20260731082025_professionals_own_update_policy.sql) referencia `is_featured` por nombre en
-- su cuerpo plpgsql — hay que redefinirlo sin esa línea ANTES de dropear la columna, o el
-- próximo update a `professionals` rompe en runtime ("record new has no field is_featured").

create or replace function public.protect_professional_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.is_active := old.is_active;
    new.profile_id := old.profile_id;
  end if;
  return new;
end;
$$;

alter table public.professionals drop column is_featured;
