-- Pedido explícito del usuario 2026-08-14: al cambiar la duración del turno, los turnos ya
-- reservados (futuros) deben ajustarse a la nueva duración -- no basta con que la grilla de
-- turnos nuevos cambie. Antes, updateSlotDuration solo tocaba professionals.slot_duration_minutes
-- y dejaba el end_time de los turnos existentes intacto, lo que generaba desalineación entre la
-- duración vigente y turnos ya reservados (ver migración 20260814080000, que corrige un bug de
-- get_day_schedule causado exactamente por esa desalineación).
--
-- Esta función reemplaza el update directo sobre `professionals` desde el cliente: actualiza la
-- duración y recalcula el end_time de los turnos reservados futuros en una sola transacción.
-- Solo toca turnos con status = 'reservado' y appointment_date >= hoy -- los ya realizados o de
-- fechas pasadas no se tocan, según "los cambios solo afectan turnos futuros".
--
-- No hace falta volver a chequear solapamientos acá: si el nuevo end_time hace que un turno
-- quede fuera de horario o se superponga con otro, get_schedule_conflicts ya lo va a detectar
-- (usa el end_time actual de appointments) y el profesional lo va a ver señalado para
-- reprogramar -- mismo mecanismo que cualquier otro cambio de disponibilidad.
--
-- SECURITY INVOKER (default, sin declarar): se apoya en las RLS existentes de `professionals`
-- (el profesional puede editar su propia fila, slot_duration_minutes no está protegido por el
-- trigger de campos de admin) y `appointments` (appointments_update_own_status permite update
-- de la fila completa, no solo status).

create function public.update_slot_duration(p_professional_id uuid, p_minutes smallint)
returns void
language plpgsql
set search_path = public
as $$
begin
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
