-- Propuesta alternativa de agenda: función para el calendario de colores en
-- /profesional/disponibilidad. Devuelve TODOS los horarios candidatos del día (según el
-- rango habitual + duración del turno), cada uno con su estado: 'reservado' (ya tiene un
-- turno), 'bloqueado' (el profesional lo bloqueó puntualmente ese día) o 'disponible'.
--
-- A diferencia de get_available_slots (que solo devuelve los disponibles, para la reserva
-- pública), esta función es para que el propio profesional vea y gestione su día completo --
-- por eso es SECURITY INVOKER (no la necesita llamar un paciente anónimo): se apoya en las
-- RLS existentes de `availability_rules`/`appointments`/`availability_date_blocks` para que
-- cada profesional solo vea/gestione su propio calendario.

create function public.get_day_schedule(p_professional_id uuid, p_date date)
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
  )
  select distinct
    s.start_time,
    case
      when b.id is not null then 'reservado'
      when bl.start_time is not null then 'bloqueado'
      else 'disponible'
    end as status,
    b.id as appointment_id,
    b.patient_first_name,
    b.patient_last_name
  from slots s
  left join booked b
    on s.start_time < b.end_time
    and (s.start_time + (s.duration || ' minutes')::interval)::time > b.start_time
  left join blocked bl
    on bl.start_time = s.start_time
  order by s.start_time;
$$;

grant execute on function public.get_day_schedule(uuid, date) to authenticated;
