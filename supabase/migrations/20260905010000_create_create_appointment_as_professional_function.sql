-- Feature B/C: el profesional (o admin) crea turnos manualmente para un paciente, con
-- repetición opcional (semanal/quincenal/mensual) e ignorando availability_rules/blocks a
-- propósito (a diferencia de book_appointment) -- puede cargar horarios fuera de su
-- disponibilidad configurada. Permite doble-booking: si el horario ya tiene un turno activo,
-- igual se crea y se informa la cantidad de turnos en conflicto para que el profesional
-- avise/reprograme.
--
-- Nombre distinto de book_appointment para no repetir el bug de firmas superpuestas de
-- 20260811170000. Si se cambia esta firma en el futuro, dropear la firma vieja explícitamente
-- en la misma migración que crea la nueva.

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

  v_end_time := (p_start_time + interval '60 minutes')::time;

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

grant execute on function public.create_appointment_as_professional(
  uuid, date, time, text, text, text, text, text, text, integer
) to authenticated;
