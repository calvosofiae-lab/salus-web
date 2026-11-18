-- Pedido del usuario 2026-11-18, dos cambios independientes en professionals:
--
-- 1. break_minutes: el turno (slot_duration_minutes, 45 o 60) se desglosa en tiempo de sesión +
--    tiempo de descanso. Ej: turno de 60 con 10 de descanso = sesión de 50 + 10 libres antes del
--    turno siguiente. El descanso va DENTRO del turno, así que la grilla de horarios, los
--    end_time de los turnos y toda la lógica de solapamiento/conflictos quedan exactamente igual:
--    es solo información de cuánto dura la sesión. Default 0 = nadie cambia hasta que lo toque.
--
-- 2. fee_schedule: tarifario opcional además de consultation_fee ("Precio de la sesión"), para
--    otros tipos de sesión con otro precio (ej. terapia de pareja). Array de {label, price}. Es
--    informativo (se muestra en el perfil público); el paciente no elige tipo al reservar.
--
-- Ninguna de las dos va en protect_professional_admin_fields: el profesional las auto-edita,
-- igual que consultation_fee (ver 20260807040000).

alter table public.professionals
  add column break_minutes smallint not null default 0
  check (break_minutes in (0, 5, 10, 15));

alter table public.professionals
  add column fee_schedule jsonb not null default '[]'::jsonb
  check (jsonb_typeof(fee_schedule) = 'array');
