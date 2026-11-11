-- get_weekly_bookings_report pasa a recibir la semana desde la que arranca (p_start) en vez de
-- contar siempre N semanas hacia atrás desde la actual: el panel muestra un rango de 4 semanas y
-- deja moverse hacia atrás y hacia adelante, incluidas semanas futuras (turnos ya agendados).
--
-- Mismo criterio que 20261111010000_create_get_weekly_bookings_report_function: semanas de lunes
-- a domingo según appointment_date, turnos de cualquier origen, cancelados aparte.

drop function if exists public.get_weekly_bookings_report(integer);

create function public.get_weekly_bookings_report(p_start date, p_weeks integer default 4)
returns table (
  professional_id uuid,
  full_name text,
  is_active boolean,
  week_start date,
  session_count bigint,
  web_count bigint,
  agenda_count bigint,
  cancelled_count bigint
)
language sql
stable
set search_path = public
as $$
  with weeks as (
    -- p_start se normaliza al lunes de su semana por si llega otro día.
    select (date_trunc('week', p_start)::date + (n * 7)) as week_start
    from generate_series(0, greatest(least(p_weeks, 26), 1) - 1) as n
  ),
  sessions as (
    select
      a.professional_id,
      date_trunc('week', a.appointment_date)::date as week_start,
      count(*) filter (where a.status <> 'cancelado') as session_count,
      count(*) filter (where a.status <> 'cancelado' and not a.created_by_professional)
        as web_count,
      count(*) filter (where a.status <> 'cancelado' and a.created_by_professional)
        as agenda_count,
      count(*) filter (where a.status = 'cancelado') as cancelled_count
    from public.appointments a
    where a.appointment_date >= (select min(week_start) from weeks)
      and a.appointment_date < (select max(week_start) from weeks) + 7
    group by 1, 2
  )
  select
    p.id,
    p.full_name,
    p.is_active,
    w.week_start,
    coalesce(s.session_count, 0),
    coalesce(s.web_count, 0),
    coalesce(s.agenda_count, 0),
    coalesce(s.cancelled_count, 0)
  from public.professionals p
  cross join weeks w
  left join sessions s on s.professional_id = p.id and s.week_start = w.week_start
  order by p.full_name, w.week_start;
$$;

-- Solo para el panel de admin: se revoca el EXECUTE que Postgres da a PUBLIC por defecto.
revoke execute on function public.get_weekly_bookings_report(date, integer) from public, anon;
grant execute on function public.get_weekly_bookings_report(date, integer) to authenticated;
