-- Web pública: avisar agenda completa / próxima fecha disponible.
--
-- Reusa get_available_slots (E4-3) día a día dentro de un horizonte de búsqueda, en vez de
-- duplicar el cruce de availability_rules/availability_blocks/appointments. Devuelve null si
-- no hay ningún día disponible dentro del horizonte (agenda completa por ahora).
--
-- SECURITY DEFINER por el mismo motivo que get_available_slots: se llama sin estar
-- autenticado (paciente anónimo viendo el selector de turnos en la ficha pública).

create function public.get_next_available_date(
  p_professional_id uuid,
  p_from_date date,
  p_horizon_days int default 90
)
returns date
language sql
stable
security definer
set search_path = public
as $$
  select d::date
  from generate_series(p_from_date, p_from_date + p_horizon_days, interval '1 day') as d
  where exists (
    select 1 from public.get_available_slots(p_professional_id, d::date)
  )
  order by d
  limit 1;
$$;

grant execute on function public.get_next_available_date(uuid, date, int) to anon, authenticated;
