-- Propuesta alternativa de agenda (docs/analisis/agenda-disponibilidad-calendario, si se
-- documenta más adelante): la duración del turno pasa a ser configurable por profesional
-- (45 o 60 minutos), en vez de estar fija en 1 hora en todo el sistema. Default 60 para no
-- cambiar el comportamiento actual de nadie hasta que lo modifiquen a mano.

alter table public.professionals
  add column slot_duration_minutes smallint not null default 60
  check (slot_duration_minutes in (45, 60));
