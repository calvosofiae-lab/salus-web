-- Feature B/C (agenda-disponibilidad-calendario): el profesional va a poder crear turnos
-- manualmente (batch semanal/diario o puntual fuera de rango) permitiendo doble-booking
-- deliberado. El índice único appointments_active_slot_key (20260813120000) debe seguir
-- protegiendo la reserva pública (book_appointment/reschedule_appointment) pero no debe
-- bloquear estas creaciones manuales.

alter table public.appointments
  add column created_by_professional boolean not null default false;

drop index public.appointments_active_slot_key;

create unique index appointments_active_slot_key
  on public.appointments (professional_id, appointment_date, start_time)
  where status in ('reservado', 'realizado') and not created_by_professional;
