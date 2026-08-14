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

create temp table tmp_day_span as
select professional_id, day_of_week,
  min(start_time) as start_time,
  max(end_time) as end_time
from public.availability_rules
group by professional_id, day_of_week;

delete from public.availability_rules;

insert into public.availability_rules (professional_id, day_of_week, start_time, end_time)
select professional_id, day_of_week, start_time, end_time
from tmp_day_span;

drop table tmp_day_span;

alter table public.availability_rules
  add constraint availability_rules_one_per_day unique (professional_id, day_of_week);
