-- Propuesta alternativa de agenda: detecta turnos reservados futuros que quedaron fuera del
-- horario vigente (cambio de horario/duración, día desactivado, vacaciones, o un bloqueo
-- puntual nuevo desde el calendario) -- reutilizando is_interval_available en vez de duplicar
-- la regla. Además, y a diferencia de feature/agenda-disponibilidad-v2, chequea que dos
-- turnos reservados no se solapen entre sí: al cambiar la duración del turno (45↔60 min) dos
-- reservas que antes convivían bien pueden terminar superponiéndose, y hay que avisarle al
-- profesional para que reprograme una de las dos (pedido explícito del usuario 2026-08-14).
--
-- SECURITY INVOKER (default, sin declarar): se apoya en las RLS existentes de `appointments`
-- para que cada profesional solo vea sus propios conflictos, mismo patrón que
-- reschedule_appointment. Solo lee -- ningún cambio de disponibilidad borra ni modifica una
-- reserva.

create function public.get_schedule_conflicts(p_professional_id uuid)
returns table (appointment_id uuid)
language sql
stable
set search_path = public
as $$
  with mine as (
    select a.id, a.appointment_date, a.start_time, a.end_time
    from public.appointments a
    where a.professional_id = p_professional_id
      and a.status = 'reservado'
      and a.appointment_date >= current_date
  )
  select m.id
  from mine m
  where not public.is_interval_available(
          p_professional_id, m.appointment_date, m.start_time, m.end_time
        )
     or exists (
          select 1
          from mine other
          where other.id <> m.id
            and other.appointment_date = m.appointment_date
            and m.start_time < other.end_time
            and m.end_time > other.start_time
        )
  order by m.appointment_date, m.start_time;
$$;

grant execute on function public.get_schedule_conflicts(uuid) to authenticated;
