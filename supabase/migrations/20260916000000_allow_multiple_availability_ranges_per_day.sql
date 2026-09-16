-- Pedido del usuario 2026-09-16: volver a permitir más de una franja horaria por día
-- (ej. mañana y tarde con un corte de almuerzo), como estaba antes de la consolidación a
-- "un único rango por día" del 14/08 (20260814020000_limit_availability_rules_to_one_per_day).
--
-- Alcanza con sacar el constraint de unicidad: el trigger de superposición
-- (trg_prevent_overlapping_availability_rules, 20260801120000) ya sigue vigente y evita cargar
-- dos franjas que se pisen para el mismo profesional+día, y get_available_slots/get_day_schedule/
-- get_month_availability ya generan los horarios haciendo JOIN contra todas las filas que
-- matchean profesional+día_de_semana (sin LIMIT ni agregación), así que ya soportan varias
-- franjas por día sin tocarlas.
--
-- Importante (dato para quien lea el historial): la consolidación del 14/08 fusionó cada
-- profesional+día a un único rango [mínimo inicio, máximo fin], por lo que los huecos que tenían
-- antes (ej. horario de almuerzo) no se restauran solos con esta migración -- cada profesional va
-- a tener que volver a cargar sus franjas separadas manualmente desde la pantalla de horario
-- semanal.

alter table public.availability_rules
  drop constraint availability_rules_one_per_day;
