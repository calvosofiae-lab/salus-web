-- Los profesionales nuevos arrancan con una valoración base de 3 estrellas
-- (en vez de sin valoración) hasta que reciban sus primeras reviews reales.
-- El trigger trg_update_professional_average_rating sigue recalculando el
-- promedio real apenas entra la primera review.

alter table public.professionals
  alter column average_rating set default 3;
