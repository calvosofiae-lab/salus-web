-- E6-5: Profesional destacado del mes (docs/backlog/06-calificaciones.md)
--
-- Requiere al menos 3 reviews dentro del mes en curso para evitar que un
-- profesional con una sola calificación de 5 estrellas quede destacado por
-- sesgo de muestra chica. Es independiente del campo professionals.is_featured
-- (destaque manual del admin, EPIC 3): esta es una señal automática aparte.

create function public.get_featured_professional_of_month()
returns uuid
language sql
stable
security definer
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

grant execute on function public.get_featured_professional_of_month() to anon, authenticated;
