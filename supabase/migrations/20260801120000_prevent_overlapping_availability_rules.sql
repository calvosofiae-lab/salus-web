-- Revisión técnica (2026-08-01): nada impedía cargar dos reglas de disponibilidad que se
-- pisan para el mismo profesional+día (ej. 09:00-13:00 y 11:00-15:00 un lunes). Sin overlap,
-- get_available_slots podía devolver el mismo horario dos veces (no hay `distinct` en el
-- select final), generando horarios duplicados en el selector del paciente.
--
-- Se usa un trigger en vez de un exclusion constraint porque Postgres no tiene un tipo
-- `timerange` nativo (solo tsrange/tstzrange/daterange/numrange) -- habría que castear cada
-- fila a un rango de otro tipo para poder usar `exclude using gist (...)`, más complejo que
-- comparar los dos rangos directo en un trigger.

create function public.prevent_overlapping_availability_rules()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.availability_rules ar
    where ar.professional_id = new.professional_id
      and ar.day_of_week = new.day_of_week
      and ar.id is distinct from new.id
      and new.start_time < ar.end_time
      and new.end_time > ar.start_time
  ) then
    raise exception 'Ese horario se superpone con uno que ya tenés cargado para ese día.';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_overlapping_availability_rules
  before insert or update on public.availability_rules
  for each row execute function public.prevent_overlapping_availability_rules();

-- Defensa extra: aunque el trigger evita superposiciones nuevas, dedupe el resultado por si
-- quedó algún dato viejo superpuesto de antes de este fix.
create or replace function public.get_available_slots(p_professional_id uuid, p_date date)
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
  select distinct s.start_time
  from slots s
  where not (select blocked from is_blocked)
    and p_date >= current_date
    and (p_date > current_date or s.start_time > current_time)
    and s.start_time not in (select start_time from booked)
  order by s.start_time;
$$;
