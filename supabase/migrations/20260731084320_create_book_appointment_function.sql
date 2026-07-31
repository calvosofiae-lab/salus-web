-- E5-4: Reserva atómica de turno, sin registro del paciente
-- (docs/backlog/05-reserva-turnos.md)
--
-- Revalida disponibilidad contra get_available_slots (E4-3) al momento de
-- reservar (no confía en lo que el cliente vio antes). El constraint único de
-- appointments (E5-1) es la última barrera: si dos reservas llegan casi
-- simultáneas para el mismo slot, una gana y la otra recibe un error legible
-- en vez de un error crudo de Postgres.

create function public.book_appointment(
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

grant execute on function public.book_appointment(uuid, date, time, text, text, text)
  to anon, authenticated;
