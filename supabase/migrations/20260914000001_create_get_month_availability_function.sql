-- Resumen de disponibilidad por día para un mes completo, usado para pintar de amarillo (en el
-- almanaque de /profesional/turnos) los días sin ningún horario libre -- ya sea porque no hay
-- regla semanal ese día, porque está completo de turnos, o porque todos sus horarios puntuales
-- están bloqueados. Reimplementa el mismo cálculo de get_day_schedule pero para los ~30 días
-- del mes en una sola consulta, en vez de pegarle a get_day_schedule una vez por día.
create or replace function public.get_month_availability(
  p_professional_id uuid,
  p_year int,
  p_month int
)
returns table (
  day date,
  has_available boolean
)
language sql
stable
set search_path = public
as $$
  with days as (
    select generate_series(
      make_date(p_year, p_month, 1),
      (make_date(p_year, p_month, 1) + interval '1 month - 1 day')::date,
      interval '1 day'
    )::date as day
  ),
  day_rule as (
    select d.day, ar.start_time, ar.end_time
    from days d
    join public.availability_rules ar
      on ar.professional_id = p_professional_id
      and ar.day_of_week = extract(dow from d.day)::smallint
  ),
  slots as (
    select dr.day, (dr.start_time + (n * 60 || ' minutes')::interval)::time as start_time
    from day_rule dr,
      lateral generate_series(
        0,
        (extract(epoch from (dr.end_time - dr.start_time)) / 60 / 60)::int - 1
      ) as n
  ),
  booked as (
    select a.appointment_date as day, a.start_time, a.end_time
    from public.appointments a
    where a.professional_id = p_professional_id
      and a.appointment_date between (select min(day) from days) and (select max(day) from days)
      and a.status in ('reservado', 'realizado')
  ),
  blocked as (
    select adb.date as day, adb.start_time
    from public.availability_date_blocks adb
    where adb.professional_id = p_professional_id
      and adb.date between (select min(day) from days) and (select max(day) from days)
  ),
  free_slots as (
    select s.day, s.start_time
    from slots s
    where not exists (
      select 1 from booked b
      where b.day = s.day
        and s.start_time < b.end_time
        and (s.start_time + interval '60 minutes')::time > b.start_time
    )
    and not exists (
      select 1 from blocked bl
      where bl.day = s.day and bl.start_time = s.start_time
    )
  )
  select d.day, exists (select 1 from free_slots f where f.day = d.day) as has_available
  from days d
  order by d.day;
$$;

grant execute on function public.get_month_availability(uuid, int, int) to authenticated;
