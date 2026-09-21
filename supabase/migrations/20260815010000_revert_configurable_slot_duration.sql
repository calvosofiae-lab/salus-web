-- Pedido explícito del usuario 2026-08-15: se saca la duración de turno configurable de esta
-- propuesta -- queda fija en 60 minutos, sin poder cambiarse. Revierte lo agregado en
-- 20260814010000, 20260814040000, 20260814050000, 20260814070000, 20260814080000 y
-- 20260814090000 en vez de reescribir el historial de migraciones ya aplicado.
--
-- get_available_slots, get_day_schedule, book_appointment y reschedule_appointment vuelven a
-- generar/calcular horarios de 60 minutos fijos (ya no leen professionals.slot_duration_minutes).
-- get_schedule_conflicts e is_interval_available no dependían de la duración configurable
-- (trabajan con el start_time/end_time ya guardado de cada turno), así que no cambian.

drop function public.update_slot_duration(uuid, smallint);

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
        (extract(epoch from (dr.end_time - dr.start_time)) / 60 / 60)::int - 1
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
        (extract(epoch from (dr.end_time - dr.start_time)) / 60 / 60)::int - 1
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

grant execute on function public.get_day_schedule(uuid, date) to authenticated;

create or replace function public.book_appointment(
  p_professional_id uuid,
  p_date date,
  p_start_time time,
  p_first_name text,
  p_last_name text,
  p_whatsapp text,
  p_whatsapp_country text default 'AR',
  p_patient_email text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot_available boolean;
  v_end_time time;
  v_appointment_id uuid;
  v_expected_length int;
begin
  if trim(coalesce(p_first_name, '')) = '' or trim(coalesce(p_last_name, '')) = ''
     or trim(coalesce(p_whatsapp, '')) = '' or trim(coalesce(p_patient_email, '')) = '' then
    raise exception 'Nombre, apellido, WhatsApp y email son obligatorios.';
  end if;

  if trim(p_patient_email) !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'El email no tiene un formato válido.';
  end if;

  v_expected_length := case coalesce(p_whatsapp_country, 'AR')
    when 'AR' then 10
    when 'ES' then 9
    else null
  end;

  if v_expected_length is not null then
    if trim(p_whatsapp) !~ ('^\d{' || v_expected_length || '}$') then
      raise exception 'El WhatsApp debe tener % números para el país seleccionado.', v_expected_length;
    end if;
  elsif trim(p_whatsapp) !~ '^\d{4,14}$' then
    raise exception 'El WhatsApp debe tener entre 4 y 14 números.';
  end if;

  select exists (
    select 1
    from public.get_available_slots(p_professional_id, p_date) s
    where s.start_time = p_start_time
  ) into v_slot_available;

  if not v_slot_available then
    raise exception 'El horario seleccionado ya no está disponible.';
  end if;

  v_end_time := (p_start_time + interval '60 minutes')::time;

  begin
    insert into public.appointments (
      professional_id, appointment_date, start_time, end_time,
      patient_first_name, patient_last_name, patient_whatsapp, patient_whatsapp_country,
      patient_email
    ) values (
      p_professional_id, p_date, p_start_time, v_end_time,
      trim(p_first_name), trim(p_last_name), trim(p_whatsapp), coalesce(p_whatsapp_country, 'AR'),
      trim(p_patient_email)
    )
    returning id into v_appointment_id;
  exception when unique_violation then
    raise exception 'Ese horario ya fue reservado por otra persona. Elegí otro horario.';
  end;

  return v_appointment_id;
end;
$$;

create or replace function public.reschedule_appointment(
  p_appointment_id uuid,
  p_new_date date,
  p_new_start_time time
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_professional_id uuid;
  v_status public.appointment_status;
  v_slot_available boolean;
  v_new_end_time time;
begin
  select professional_id, status
    into v_professional_id, v_status
  from public.appointments
  where id = p_appointment_id;

  if v_professional_id is null then
    raise exception 'El turno no existe o no tenés permiso para modificarlo.';
  end if;

  if v_status <> 'reservado' then
    raise exception 'Solo se pueden reprogramar turnos reservados.';
  end if;

  select exists (
    select 1
    from public.get_available_slots(v_professional_id, p_new_date) s
    where s.start_time = p_new_start_time
  ) into v_slot_available;

  if not v_slot_available then
    raise exception 'El horario seleccionado ya no está disponible.';
  end if;

  v_new_end_time := (p_new_start_time + interval '60 minutes')::time;

  begin
    update public.appointments
    set appointment_date = p_new_date,
        start_time = p_new_start_time,
        end_time = v_new_end_time
    where id = p_appointment_id;
  exception when unique_violation then
    raise exception 'Ese horario ya fue reservado por otra persona. Elegí otro horario.';
  end;
end;
$$;

alter table public.professionals drop column slot_duration_minutes;
