-- Revisión de seguridad (2026-08-01): protect_professional_admin_fields solo revertía
-- is_active/profile_id para no-admins. La policy professionals_update_own solo restringe
-- qué FILA se puede tocar (owns_professional(id)), no qué COLUMNAS -- así que un profesional
-- podía auto-asignarse cualquier valor en average_rating/consultation_fee/gender_trained con
-- un update directo (fuera de la UI, que no expone esos campos). Ninguno de los tres tiene
-- una vía legítima de auto-edición: average_rating lo recalcula solo el trigger de reviews
-- (20260731090121_create_professional_rating_trigger.sql), y consultation_fee/gender_trained
-- son campos migrados de la tabla legacy que ni siquiera están en ProfessionalForm.
--
-- Esto pasó de cosmético a explotable con get_top_rated_professionals (E6-7,
-- 06-calificaciones.md): ahora average_rating decide quién aparece en "Profesionales
-- Destacados" en la home.
--
-- license_number queda afuera a propósito: el profesional sí edita su matrícula
-- legítimamente desde "Mi perfil" (ProfessionalForm).

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
    new.average_rating := old.average_rating;
    new.consultation_fee := old.consultation_fee;
    new.gender_trained := old.gender_trained;
  end if;
  return new;
end;
$$;
