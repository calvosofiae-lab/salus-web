-- Revisión de seguridad (2026-08-01): BookingForm.tsx valida que el WhatsApp tenga
-- exactamente 10 dígitos (lib/whatsapp.ts, WHATSAPP_NUMBER_LENGTH) antes de enviar, pero
-- book_appointment (E5-4) solo chequeaba que p_whatsapp no viniera vacío. Un llamado directo
-- a la RPC podía guardar cualquier string, rompiendo después el link wa.me de "Enviar
-- encuesta" (AppointmentListItem.tsx) para ese turno.

create or replace function public.book_appointment(
  p_professional_id uuid,
  p_date date,
  p_start_time time,
  p_first_name text,
  p_last_name text,
  p_whatsapp text
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
begin
  if trim(coalesce(p_first_name, '')) = '' or trim(coalesce(p_last_name, '')) = ''
     or trim(coalesce(p_whatsapp, '')) = '' then
    raise exception 'Nombre, apellido y WhatsApp son obligatorios.';
  end if;

  if trim(p_whatsapp) !~ '^\d{10}$' then
    raise exception 'El WhatsApp debe tener 10 números (código de área + línea, sin 0 ni 15).';
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
      patient_first_name, patient_last_name, patient_whatsapp
    ) values (
      p_professional_id, p_date, p_start_time, v_end_time,
      trim(p_first_name), trim(p_last_name), trim(p_whatsapp)
    )
    returning id into v_appointment_id;
  exception when unique_violation then
    raise exception 'Ese horario ya fue reservado por otra persona. Elegí otro horario.';
  end;

  return v_appointment_id;
end;
$$;
