-- Bug real encontrado en pruebas de navegador (2026-08-14): get_day_schedule podía devolver
-- el mismo start_time dos veces. Causa: el LEFT JOIN contra `booked` matchea TODAS las
-- reservas que se solapan con un slot, no solo una -- y cuando la grilla de horarios actual
-- (según slot_duration_minutes vigente) no coincide con la duración con la que se reservaron
-- turnos existentes (que nunca se recalculan retroactivamente, por la regla de no destruir
-- turnos), un mismo slot puede pisar el límite entre dos reservas consecutivas distintas.
-- Ejemplo real: profesional con 3 turnos de 60min consecutivos (14-15, 15-16, 16-17) reservados
-- cuando su duración era 60min, luego cambia a 45min -- el slot 15:45-16:30 se solapa a la vez
-- con la reserva de 15-16 y la de 16-17, generando dos filas para "15:45".
--
-- Esto no es un caso de borde de los datos de prueba: es un escenario esperado y permanente en
-- producción apenas un profesional cambie su duración de turno teniendo turnos ya reservados.
--
-- Fix: `distinct on (s.start_time) ... order by s.start_time, b.start_time` se queda con una
-- sola fila por horario (la reserva que empieza más temprano, si hay más de una solapada) antes
-- de resolver el status -- así el llamador (la grilla de colores) nunca ve un start_time
-- repetido. get_available_slots no tiene este problema porque excluye con `not exists` (no
-- arma filas por cada solape); get_schedule_conflicts tampoco, porque no arma una fila por
-- slot.

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
      and (s.start_time + (s.duration || ' minutes')::interval)::time > b.start_time
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

grant execute on function public.get_day_schedule(uuid, date) to authenticated;
