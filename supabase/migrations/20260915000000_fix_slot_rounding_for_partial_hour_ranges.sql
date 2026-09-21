-- Bug encontrado probando la consolidación de availability_rules a un rango por día
-- (20260814020000): para un rango que no es múltiplo entero de 60 minutos (ej. 08:30-11:00,
-- 2.5 horas -- típico después de esa consolidación), `(epoch / 60 / 60)::int` redondea 2.5
-- hacia 3 en vez de truncar, generando un turno de más (10:30) que termina a las 11:30, media
-- hora después del cierre real. Se reemplaza por floor() en las tres funciones que repiten este
-- cálculo: get_available_slots (booking público), get_day_schedule y get_month_availability
-- (agenda del profesional). No se toca is_interval_available ni get_schedule_conflicts: no
-- generan slots, solo comparan start_time/end_time ya guardados.

create or replace function public.get_available_slots(p_professional_id uuid, p_date date)
returns table (start_time time)
language sql
stable
security definer
set search_path = public
as $$
  with day_rule as (
    select ar.start_time, ar.end_time
    from public.availability_rules ar
    where ar.professional_id = p_professional_id
      and ar.day_of_week = extract(dow from p_date)::smallint
  ),
  slots as (
    select (dr.start_time + (n * 60 || ' minutes')::interval)::time as start_time
    from day_rule dr,
      lateral generate_series(
        0,
        floor(extract(epoch from (dr.end_time - dr.start_time)) / 3600)::int - 1
      ) as n
  ),
  booked as (
    select a.start_time, a.end_time
    from public.appointments a
    where a.professional_id = p_professional_id
      and a.appointment_date = p_date
      and a.status in ('reservado', 'realizado')
  )
  select distinct s.start_time
  from slots s
  where p_date >= current_date
    and (p_date > current_date or s.start_time > current_time)
    and public.is_interval_available(
      p_professional_id, p_date, s.start_time,
      (s.start_time + interval '60 minutes')::time
    )
    and not exists (
      select 1 from booked b
      where s.start_time < b.end_time
        and (s.start_time + interval '60 minutes')::time > b.start_time
    )
  order by s.start_time;
$$;

create or replace function public.get_day_schedule(p_professional_id uuid, p_date date)
returns table (
  start_time time,
  status text,
  appointment_id uuid,
  patient_first_name text,
  patient_last_name text
)
language sql
stable
set search_path = public
as $$
  with day_rule as (
    select ar.start_time, ar.end_time
    from public.availability_rules ar
    where ar.professional_id = p_professional_id
      and ar.day_of_week = extract(dow from p_date)::smallint
  ),
  slots as (
    select (dr.start_time + (n * 60 || ' minutes')::interval)::time as start_time
    from day_rule dr,
      lateral generate_series(
        0,
        floor(extract(epoch from (dr.end_time - dr.start_time)) / 3600)::int - 1
      ) as n
  ),
  booked as (
    select a.id, a.start_time, a.end_time, a.patient_first_name, a.patient_last_name
    from public.appointments a
    where a.professional_id = p_professional_id
      and a.appointment_date = p_date
      and a.status in ('reservado', 'realizado')
  ),
  blocked as (
    select adb.start_time
    from public.availability_date_blocks adb
    where adb.professional_id = p_professional_id
      and adb.date = p_date
  ),
  matched as (
    select distinct on (s.start_time)
      s.start_time,
      b.id as appointment_id,
      b.patient_first_name,
      b.patient_last_name
    from slots s
    left join booked b
      on s.start_time < b.end_time
      and (s.start_time + interval '60 minutes')::time > b.start_time
    order by s.start_time, b.start_time
  )
  select
    m.start_time,
    case
      when m.appointment_id is not null then 'reservado'
      when bl.start_time is not null then 'bloqueado'
      else 'disponible'
    end as status,
    m.appointment_id,
    m.patient_first_name,
    m.patient_last_name
  from matched m
  left join blocked bl on bl.start_time = m.start_time
  order by m.start_time;
$$;

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
        floor(extract(epoch from (dr.end_time - dr.start_time)) / 3600)::int - 1
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
