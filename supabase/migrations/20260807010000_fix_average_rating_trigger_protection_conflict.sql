-- Bug: average_rating nunca se actualizaba tras una nueva review.
--
-- trg_update_professional_average_rating (20260731090121) recalcula
-- professionals.average_rating con un UPDATE disparado desde el trigger AFTER
-- INSERT de reviews. Pero protect_professional_admin_fields (BEFORE UPDATE en
-- professionals, endurecido en 20260801090000 para incluir average_rating)
-- revierte cualquier cambio a ese campo si is_admin() es falso -- y is_admin()
-- da falso para la sesión "anon" del paciente que califica vía submit_review,
-- que es siempre quien dispara esta cadena. Resultado: el UPDATE del trigger
-- de rating se pisaba a sí mismo con el valor viejo, silenciosamente (sin
-- error, porque el trigger sí corre, solo que revierte el cambio).
--
-- Fix: distinguir "alguien mandó un UPDATE directo a professionals" (lo que
-- hay que proteger) de "este UPDATE lo disparó otro trigger" (la
-- recalculación legítima de rating, que debe pasar). pg_trigger_depth() harto
-- eso: en un UPDATE directo del cliente, este trigger corre en profundidad 1;
-- cuando lo dispara en cascada el trigger de reviews, corre en profundidad 2+.
-- reviews no tiene policy de insert para nadie (solo entra vía submit_review,
-- SECURITY DEFINER con sus propias validaciones), así que no hay forma de
-- explotar esta cascada para colarse otro campo protegido.

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
    new.consultation_fee := old.consultation_fee;
    new.gender_trained := old.gender_trained;
  end if;
  return new;
end;
$$;
