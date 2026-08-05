-- El check `end_time > start_time` de availability_rules (20260731082644) no tenía nombre
-- propio, así que Postgres le puso el genérico "availability_rules_check". El trigger de
-- superposición (20260801120000_prevent_overlapping_availability_rules) solo compara contra
-- filas existentes, no valida el propio rango de la fila nueva -- así que si alguien carga
-- un horario con fin <= inicio, el único guardarraíl es este check, y el mensaje que llega al
-- frontend es el crudo de Postgres ("violates check constraint ...") en vez de algo legible.
--
-- Se le da un nombre explícito y descriptivo para poder traducirlo en lib/errors.ts como
-- defensa extra (la validación principal ahora vive en WeeklyAvailabilityForm, del lado del
-- cliente, pero cualquier insert que la esquive -- otra pantalla futura, un script -- cae acá).

alter table public.availability_rules
  drop constraint if exists availability_rules_check;

alter table public.availability_rules
  add constraint availability_rules_end_after_start_check
  check (end_time > start_time);
