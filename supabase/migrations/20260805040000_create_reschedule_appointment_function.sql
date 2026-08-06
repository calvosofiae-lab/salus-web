-- Permite al profesional reprogramar un turno reservado a otro día/horario disponible,
-- reutilizando get_available_slots (E4-3) para revalidar disponibilidad al momento de
-- confirmar (no confía en lo que el cliente vio antes, igual que book_appointment en E5-4).
--
-- SECURITY INVOKER (default): corre con los permisos de quien llama, así que tanto la
-- lectura del turno como el update quedan acotados por las policies existentes
-- (appointments_select_own / appointments_update_own_status), sin duplicar la
-- verificación de dueño acá.

create function public.reschedule_appointment(
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

  v_new_end_time := p_new_start_time + interval '1 hour';

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

grant execute on function public.reschedule_appointment(uuid, date, time) to authenticated;
