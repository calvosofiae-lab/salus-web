-- La sección "Profesionales Destacados" de la landing deja de ser automática por
-- average_rating (E6-7, 20260801070000_create_get_top_rated_professionals_function) y pasa a
-- depender del plan pago: se listan los profesionales activos con `is_premium = true`, sin
-- límite fijo (antes p_limit=4) y en orden aleatorio en cada carga -- a diferencia del ranking
-- por rating, acá no hay un criterio de mérito que ordenar, así que un orden fijo (ej.
-- alfabético) favorecería siempre a los mismos nombres en la sección más visible de la home.
--
-- get_top_rated_professionals queda sin lectores (el único era getFeaturedProfessionals en
-- professionalsRepository.ts) y se elimina. SECURITY INVOKER (no definer) siguiendo el mismo
-- criterio de mínimo privilegio de 20260801100000_remove_unnecessary_security_definer: la
-- policy professionals_select_active_public ya permite este select a anon/authenticated.

drop function if exists public.get_top_rated_professionals(integer);

create function public.get_premium_professionals()
returns setof public.professionals
language sql
stable
set search_path = public
as $$
  select *
  from public.professionals
  where is_active = true
    and is_premium = true
  order by random();
$$;

grant execute on function public.get_premium_professionals() to anon, authenticated;
