-- Bug encontrado probando la reserva pública (fuera del alcance de la evolución de agenda,
-- pero descubierto durante esas pruebas): `get_available_slots` excluye del cálculo de
-- horarios ocupados a los turnos `cancelado`/`no_asistio` (solo cuentan `reservado` y
-- `realizado`, ver 20260731083611 y su historia), así que un horario con un turno cancelado
-- se sigue ofreciendo como disponible. Pero el `unique (professional_id, appointment_date,
-- start_time)` de `appointments` (20260731082642) no distingue por estado -- cualquier fila
-- existente en ese horario, cancelada o no, choca contra un insert nuevo. Resultado: ese
-- horario se muestra disponible pero `book_appointment` siempre falla con "Ese horario ya fue
-- reservado por otra persona", indefinidamente, para cualquier paciente que lo intente.
--
-- Se reemplaza el unique constraint por un índice único parcial que solo mira los turnos
-- `reservado`/`realizado` -- exactamente la misma definición de "ocupado" que ya usa
-- get_available_slots, para no volver a duplicar la regla en dos lugares con el riesgo de que
-- diverjan. book_appointment/reschedule_appointment no cambian: su `exception when
-- unique_violation` ya atrapa violaciones de cualquier índice único de la tabla.
--
-- `if exists`/`if not exists`: en al menos un entorno local se encontró que este constraint
-- (creado originalmente en 20260731082642, nunca tocado por ninguna otra migración) no
-- existía -- probablemente una base local que divergió del historial de migraciones en algún
-- momento no registrado. La migración no depende de esa causa: hace lo mismo dé o no dé ese
-- constraint por sacar.

alter table public.appointments
  drop constraint if exists appointments_professional_id_appointment_date_start_time_key;

create unique index if not exists appointments_active_slot_key
  on public.appointments (professional_id, appointment_date, start_time)
  where status in ('reservado', 'realizado');
