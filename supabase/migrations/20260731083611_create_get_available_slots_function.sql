-- E4-3: Cálculo de slots disponibles (docs/backlog/04-agenda-profesional.md)
--
-- Cruza availability_rules (según día de semana, convención 0=domingo..6=sábado,
-- igual que extract(dow from date)) menos availability_blocks (si el día está
-- bloqueado, no hay slots) menos appointments ya reservados/realizados. Slots de
-- 1 hora. Excluye fechas pasadas y horarios ya pasados del día de hoy.
--
-- SECURITY DEFINER: se puede llamar sin estar autenticado (paciente anónimo
-- viendo horarios en E5-2), sin depender de las políticas RLS de las tablas
-- que cruza (que están pensadas para el acceso directo del dueño/admin, no
-- para lectura pública).

create function public.get_available_slots(p_professional_id uuid, p_date date)
returns table (start_time time)
language sql
stable
security definer
set search_path = public
as $$
  with day_rules as (
    select ar.start_time, ar.end_time
    from public.availability_rules ar
    where ar.professional_id = p_professional_id
      and ar.day_of_week = extract(dow from p_date)::smallint
  ),
  is_blocked as (
    select exists (
      select 1 from public.availability_blocks ab
      where ab.professional_id = p_professional_id
        and ab.blocked_date = p_date
    ) as blocked
  ),
  slots as (
    select (dr.start_time + (n || ' hour')::interval)::time as start_time
    from day_rules dr,
      lateral generate_series(
        0,
        (extract(epoch from (dr.end_time - dr.start_time)) / 3600)::int - 1
      ) as n
  ),
  booked as (
    select a.start_time
    from public.appointments a
    where a.professional_id = p_professional_id
      and a.appointment_date = p_date
      and a.status in ('reservado', 'realizado')
  )
  select s.start_time
  from slots s
  where not (select blocked from is_blocked)
    and p_date >= current_date
    and (p_date > current_date or s.start_time > current_time)
    and s.start_time not in (select start_time from booked)
  order by s.start_time;
$$;

grant execute on function public.get_available_slots(uuid, date) to anon, authenticated;
