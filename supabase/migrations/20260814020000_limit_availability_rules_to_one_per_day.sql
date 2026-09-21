-- Propuesta alternativa de agenda: "un único rango de inicio/fin por día" (no hasta 2 como
-- se había explorado en feature/agenda-disponibilidad-v2) -- los huecos dentro de la jornada
-- (ej. almuerzo) se resuelven bloqueando horarios puntuales desde el calendario nuevo
-- (availability_date_blocks, próxima migración), no con múltiples rangos base.
--
-- Los datos reales (copiados anonimizados a este entorno de testing) tienen profesionales con
-- varios rangos por día -- se consolidan a [mínimo inicio, máximo fin] antes de aplicar el
-- constraint. Esto ensancha la disponibilidad ofrecida durante los huecos hasta que cada
-- profesional bloquee esos horarios puntualmente desde la pantalla nueva: es la consecuencia
-- esperada de este diseño (bloqueo manual, sin recurrencia), no un bug de esta migración.
--
-- Todo en una sola sentencia (CTEs, no una tabla temporal): el SQL Editor de Supabase pasa
-- por un pooler de conexiones, y una `temp table` creada en una sentencia puede no ser visible
-- en la siguiente si el pooler asigna otra conexión de fondo entre medio (falla con "relation
-- ... does not exist"). Un único statement con WITH usa siempre la misma conexión, y además
-- todos sus CTEs comparten el mismo snapshot: tmp_day_span calcula sobre las filas originales
-- aunque `deleted` las borre en la misma sentencia.
--
-- trg_prevent_overlapping_availability_rules (20260801120000) valida por fila contra el resto
-- de la tabla, y por ese mismo snapshot compartido todavía "ve" las filas viejas de un
-- profesional mientras se inserta su fila consolidada -- las marca como superpuestas consigo
-- mismas y aborta. Se desactiva solo para este statement: no hace falta revalidar nada acá, el
-- propio agrupamiento por (professional_id, day_of_week) ya garantiza como máximo una fila por
-- profesional y día.

alter table public.availability_rules
  disable trigger trg_prevent_overlapping_availability_rules;

with tmp_day_span as (
  select professional_id, day_of_week,
    min(start_time) as start_time,
    max(end_time) as end_time
  from public.availability_rules
  group by professional_id, day_of_week
),
deleted as (
  delete from public.availability_rules
  returning 1
)
insert into public.availability_rules (professional_id, day_of_week, start_time, end_time)
select professional_id, day_of_week, start_time, end_time
from tmp_day_span;

alter table public.availability_rules
  enable trigger trg_prevent_overlapping_availability_rules;

alter table public.availability_rules
  add constraint availability_rules_one_per_day unique (professional_id, day_of_week);
