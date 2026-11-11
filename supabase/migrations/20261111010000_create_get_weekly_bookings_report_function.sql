-- Reporte de admin: sesiones por profesional y por semana, para detectar a tiempo a los
-- profesionales que no están teniendo consultas (ver
-- 20261111000000_create_search_professionals_function).
--
-- - Semana = lunes a domingo en hora de Argentina, según la fecha del turno (appointment_date):
--   lo que interesa es cuántas sesiones tiene el profesional cada semana. La semana actual
--   incluye los turnos que todavía no pasaron.
-- - Cuentan los turnos de cualquier origen: reservas de pacientes en la web y turnos que carga el
--   profesional en su agenda (created_by_professional). Se informan también por separado.
-- - session_count no incluye los cancelados; esos van aparte en cancelled_count.
-- - Devuelve una fila por profesional y semana, incluidas las semanas en 0, para que el panel no
--   tenga que rellenar huecos.
--
-- SECURITY INVOKER: igual que get_professional_report, depende de que la RLS de appointments deje
-- ver todo solo al admin.

drop function if exists public.get_weekly_bookings_report(integer);

create function public.get_weekly_bookings_report(p_weeks integer default 8)
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
    select (
      date_trunc('week', (now() at time zone 'America/Argentina/Buenos_Aires'))::date
      - (n * 7)
    ) as week_start
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

-- Solo tiene sentido para el panel de admin. Postgres da EXECUTE a PUBLIC por defecto al crear
-- una función, así que hay que revocarlo explícitamente para que anon no la pueda llamar (no
-- vería turnos por la RLS, pero no tiene por qué poder ejecutarla).
revoke execute on function public.get_weekly_bookings_report(integer) from public, anon;
grant execute on function public.get_weekly_bookings_report(integer) to authenticated;
