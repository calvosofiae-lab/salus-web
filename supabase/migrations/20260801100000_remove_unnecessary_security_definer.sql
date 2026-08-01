-- Revisión de seguridad (2026-08-01), continuación de E7-7: get_top_rated_professionals y
-- get_featured_professional_of_month corrían como SECURITY DEFINER sin necesitarlo -- ambas
-- solo leen professionals con is_active = true (ya público vía la policy
-- professionals_select_active_public) y reviews (ya público vía reviews_select_public). Por
-- principio de menor privilegio, se sacan del privilegio elevado: corren con los permisos de
-- quien llama (SECURITY INVOKER, el default de Postgres).

create or replace function public.get_top_rated_professionals(p_limit integer default 4)
returns setof public.professionals
language sql
stable
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

create or replace function public.get_featured_professional_of_month()
returns uuid
language sql
stable
set search_path = public
as $$
  select p.id
  from public.professionals p
  join public.reviews r on r.professional_id = p.id
  where p.is_active = true
    and r.created_at >= date_trunc('month', current_date)
  group by p.id
  having count(r.id) >= 3
  order by avg(r.rating) desc
  limit 1;
$$;
