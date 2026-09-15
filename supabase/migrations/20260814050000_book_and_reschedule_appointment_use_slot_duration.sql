-- Propuesta alternativa de agenda: book_appointment/reschedule_appointment calculan
-- end_time según la duración configurada del profesional (professionals.slot_duration_minutes)
-- en vez de 1 hora fija. La revalidación de disponibilidad (contra get_available_slots) ya
-- no necesita cambios -- get_available_slots (migración anterior) ya devuelve los horarios
-- correctos según esa misma duración, así que basta con seguir comparando el start_time
-- elegido contra esa lista, igual que antes.
--
-- Mismos nombres/firmas que ya tenían: no rompe a quienes ya las llaman.

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
