-- El formulario de reserva de turnos suma el email del paciente (BookingForm.tsx), para que
-- el profesional pueda copiarlo desde "Mis turnos" y escribirle manualmente ante cualquier
-- inconveniente (se descartó el envío automático de mails: no hay proveedor de email en el
-- proyecto). La columna queda nullable a nivel de base -- igual que patient_whatsapp, la
-- obligatoriedad real la exige book_appointment(), no un "not null" que rompería si algo más
-- insertara sin ese dato.

alter table public.appointments
  add column patient_email text;

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

  v_end_time := p_start_time + interval '1 hour';

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
