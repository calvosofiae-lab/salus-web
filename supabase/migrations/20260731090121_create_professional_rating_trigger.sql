-- E6-4: Cálculo de promedio por profesional (docs/backlog/06-calificaciones.md)
--
-- Se cachea en professionals.average_rating (ya existente desde E0-4) para no
-- tener que recalcular en cada lectura del perfil/landing. Se recalcula cada
-- vez que se inserta una review nueva (solo pasa vía submit_review, E6-3).

create function public.update_professional_average_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.professionals
  set average_rating = (
    select avg(rating)::numeric(3, 2)
    from public.reviews
    where professional_id = new.professional_id
  )
  where id = new.professional_id;
  return new;
end;
$$;

create trigger trg_update_professional_average_rating
  after insert on public.reviews
  for each row execute function public.update_professional_average_rating();
