-- La sección "Profesionales Destacados" de la landing deja de depender del flag manual
-- `is_featured` (admin) y pasa a ser 100% automática: los `p_limit` profesionales activos
-- con mejor `average_rating`.
--
-- Desempate: primero cantidad de reviews (una calificación más "confiable"/con más
-- historial gana contra un 5.0 de una sola reseña, mismo espíritu que el mínimo de 3
-- reviews de get_featured_professional_of_month, E6-5) y como último resorte
-- determinístico, full_name — para que el orden no cambie entre cargas de página.
--
-- `average_rating` puede ser null en filas viejas creadas antes de que se le pusiera
-- default 3 (20260801053303_default_professional_average_rating.sql); se ordenan al final
-- con `nulls last` en vez de excluirlas.

create function public.get_top_rated_professionals(p_limit integer default 4)
returns setof public.professionals
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.professionals p
  left join public.reviews r on r.professional_id = p.id
  where p.is_active = true
  group by p.id
  order by p.average_rating desc nulls last, count(r.id) desc, p.full_name asc
  limit p_limit;
$$;

grant execute on function public.get_top_rated_professionals(integer) to anon, authenticated;
