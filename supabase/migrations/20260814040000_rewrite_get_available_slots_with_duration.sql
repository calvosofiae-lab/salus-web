-- Propuesta alternativa de agenda: get_available_slots pasa a generar horarios según la
-- duración configurada del profesional (professionals.slot_duration_minutes), en vez de 1
-- hora fija. La exclusión contra turnos ya reservados ahora es por SOLAPAMIENTO DE INTERVALO
-- (no igualdad exacta de start_time): con duración variable, dos horarios pueden pisarse sin
-- empezar exactamente a la misma hora (ej. una reserva vieja de 1h a las 09:00 se pisa con un
-- slot nuevo de 45min a las 09:30, aunque ninguno empiece igual que el otro).
--
-- is_interval_available: función compartida "¿este professional_id + fecha + [inicio, fin)
-- está dentro del rango habitual del día, sin vacaciones, sin un bloqueo puntual adentro?" --
-- la reutilizan esta función, get_schedule_conflicts y get_day_schedule (próximas
-- migraciones) para no duplicar la regla en tres lugares.
--
-- Mismo nombre/firma que get_available_slots ya tenía: no rompe a quienes ya la llaman
-- (book_appointment, reschedule_appointment, SlotPicker/BookingForm).

create function public.is_interval_available(
  p_professional_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    exists (
      select 1 from public.availability_rules ar
      where ar.professional_id = p_professional_id
        and ar.day_of_week = extract(dow from p_date)::smallint
        and p_start_time >= ar.start_time
        and p_end_time <= ar.end_time
    )
    and not exists (
      select 1 from public.availability_blocks ab
      where ab.professional_id = p_professional_id
        and p_date between ab.start_date and ab.end_date
    )
    and not exists (
      select 1 from public.availability_date_blocks adb
      where adb.professional_id = p_professional_id
        and adb.date = p_date
        and adb.start_time >= p_start_time
        and adb.start_time < p_end_time
    );
$$;

create or replace function public.get_available_slots(p_professional_id uuid, p_date date)
returns table (start_time time)
language sql
stable
security definer
set search_path = public
as $$
  with prof as (
    select slot_duration_minutes from public.professionals where id = p_professional_id
  ),
  day_rule as (
    select ar.start_time, ar.end_time
    from public.availability_rules ar
    where ar.professional_id = p_professional_id
      and ar.day_of_week = extract(dow from p_date)::smallint
  ),
  slots as (
    select (dr.start_time + (n * pr.slot_duration_minutes || ' minutes')::interval)::time as start_time,
      pr.slot_duration_minutes as duration
    from day_rule dr, prof pr,
      lateral generate_series(
        0,
        ((extract(epoch from (dr.end_time - dr.start_time)) / 60) / pr.slot_duration_minutes)::int - 1
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
      (s.start_time + (s.duration || ' minutes')::interval)::time
    )
    and not exists (
      select 1 from booked b
      where s.start_time < b.end_time
        and (s.start_time + (s.duration || ' minutes')::interval)::time > b.start_time
    )
  order by s.start_time;
$$;
