-- Pedido del usuario 2026-09-16: la duración del turno vuelve a ser configurable por
-- profesional (45 o 60 minutos), en vez de estar fija en 1 hora. Ya se había construido esto
-- una vez (20260814010000...20260814090000) y se revirtió el 15/08 por alcance, no por un
-- problema técnico (20260815010000_revert_configurable_slot_duration.sql) -- esta migración
-- reintroduce ese mismo diseño, adaptado a las funciones actuales (que ya incorporan el fix de
-- redondeo de 20260915000000 y get_month_availability, que no existía en el intento anterior).
--
-- Default 60 para no cambiar el comportamiento de nadie hasta que lo modifiquen a mano.
--
-- Nota sobre "más de una reserva por horario si se superponen al pasar a 45 min": no hace falta
-- tocar nada para eso. `appointments_active_slot_key` (20260813120000) es único por
-- (professional_id, appointment_date, start_time), no por rango -- dos turnos que se solapan
-- pero no arrancan a la misma hora exacta (ej. uno de 60min a las 10:00 y otro de 45min a las
-- 10:30) ya conviven sin violar ese índice. create_appointment_as_professional (20260905010000)
-- ya permite doble-booking manual a propósito. get_schedule_conflicts (20260814060000, no
-- tocada por el revert) ya detecta y avisa esos solapamientos para que el profesional reprograme
-- -- es el mismo mecanismo pensado en su momento para este escenario exacto.

alter table public.professionals
  add column slot_duration_minutes smallint not null default 60
  check (slot_duration_minutes in (45, 60));

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
        floor(extract(epoch from (dr.end_time - dr.start_time)) / 60 / pr.slot_duration_minutes)::int - 1
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
        floor(extract(epoch from (dr.end_time - dr.start_time)) / 60 / pr.slot_duration_minutes)::int - 1
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
  with prof as (
    select slot_duration_minutes from public.professionals where id = p_professional_id
  ),
  days as (
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
    select dr.day, (dr.start_time + (n * pr.slot_duration_minutes || ' minutes')::interval)::time as start_time,
      pr.slot_duration_minutes as duration
    from day_rule dr, prof pr,
      lateral generate_series(
        0,
        floor(extract(epoch from (dr.end_time - dr.start_time)) / 60 / pr.slot_duration_minutes)::int - 1
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
        and (s.start_time + (s.duration || ' minutes')::interval)::time > b.start_time
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
  v_duration_minutes smallint;
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

  select slot_duration_minutes into v_duration_minutes
  from public.professionals
  where id = p_professional_id;

  v_end_time := (p_start_time + (v_duration_minutes || ' minutes')::interval)::time;

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
  v_duration_minutes smallint;
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

  select slot_duration_minutes into v_duration_minutes
  from public.professionals
  where id = v_professional_id;

  v_new_end_time := (p_new_start_time + (v_duration_minutes || ' minutes')::interval)::time;

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

-- create_appointment_as_professional también calculaba el fin fijo a 60 minutos: el alta manual
-- (fuera de get_available_slots a propósito) tiene que respetar la misma duración configurada.
create or replace function public.create_appointment_as_professional(
  p_professional_id uuid,
  p_date date,
  p_start_time time,
  p_first_name text,
  p_last_name text,
  p_whatsapp text,
  p_whatsapp_country text default 'AR',
  p_patient_email text default '',
  p_repeat_frequency text default 'none',
  p_repeat_count integer default 1
)
returns table (
  appointment_id uuid,
  appointment_date date,
  start_time time,
  conflict_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected_length int;
  v_end_time time;
  v_duration_minutes smallint;
  v_current_date date;
  v_conflict_count int;
  v_new_id uuid;
  v_index int;
begin
  if not (public.owns_professional(p_professional_id) or public.is_admin()) then
    raise exception 'No tenés permiso para crear turnos para este profesional.';
  end if;

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

  if coalesce(p_repeat_frequency, 'none') not in ('none', 'weekly', 'biweekly', 'monthly') then
    raise exception 'Frecuencia de repetición inválida.';
  end if;

  if p_repeat_count is null or p_repeat_count < 1 or p_repeat_count > 52 then
    raise exception 'La cantidad de repeticiones debe estar entre 1 y 52.';
  end if;

  select slot_duration_minutes into v_duration_minutes
  from public.professionals
  where id = p_professional_id;

  v_end_time := (p_start_time + (v_duration_minutes || ' minutes')::interval)::time;

  for v_index in 0 .. (p_repeat_count - 1) loop
    v_current_date := case p_repeat_frequency
      when 'weekly' then p_date + (v_index * 7)
      when 'biweekly' then p_date + (v_index * 14)
      when 'monthly' then (p_date + (v_index || ' months')::interval)::date
      else p_date
    end;

    -- No llama a is_interval_available ni get_available_slots: no valida
    -- availability_rules/blocks/date_blocks a propósito (es el punto de la feature).
    select count(*) into v_conflict_count
    from public.appointments a
    where a.professional_id = p_professional_id
      and a.appointment_date = v_current_date
      and a.start_time = p_start_time
      and a.status in ('reservado', 'realizado');

    insert into public.appointments (
      professional_id, appointment_date, start_time, end_time,
      patient_first_name, patient_last_name, patient_whatsapp, patient_whatsapp_country,
      patient_email, created_by_professional
    ) values (
      p_professional_id, v_current_date, p_start_time, v_end_time,
      trim(p_first_name), trim(p_last_name), trim(p_whatsapp), coalesce(p_whatsapp_country, 'AR'),
      nullif(trim(p_patient_email), ''), true
    )
    returning id into v_new_id;

    appointment_id := v_new_id;
    appointment_date := v_current_date;
    start_time := p_start_time;
    conflict_count := v_conflict_count;
    return next;
  end loop;

  return;
end;
$$;

-- Actualiza la duración y recalcula el end_time de los turnos reservados futuros en una sola
-- transacción (pedido explícito del intento anterior, 20260814090000): no basta con cambiar
-- professionals.slot_duration_minutes, los turnos ya reservados quedarían desalineados con la
-- nueva grilla (bug real que ya se había encontrado y corregido en 20260814080000). Turnos
-- pasados o no reservados no se tocan. No hace falta revalidar solapamientos acá:
-- get_schedule_conflicts ya los va a señalar para que el profesional reprograme.
create or replace function public.update_slot_duration(p_professional_id uuid, p_minutes smallint)
returns void
language plpgsql
set search_path = public
as $$
begin
  if p_minutes not in (45, 60) then
    raise exception 'La duración del turno debe ser 45 o 60 minutos.';
  end if;

  update public.professionals
  set slot_duration_minutes = p_minutes
  where id = p_professional_id;

  update public.appointments
  set end_time = (start_time + (p_minutes || ' minutes')::interval)::time
  where professional_id = p_professional_id
    and status = 'reservado'
    and appointment_date >= current_date;
end;
$$;

grant execute on function public.update_slot_duration(uuid, smallint) to authenticated;
