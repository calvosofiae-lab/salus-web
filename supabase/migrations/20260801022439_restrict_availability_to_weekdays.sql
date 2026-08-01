-- SALUS no atiende fines de semana: restringe availability_rules a
-- lunes-viernes (day_of_week 1-5, convención 0=domingo..6=sábado) a nivel de
-- base de datos, además de que la UI ya no ofrece esos días. Verificado
-- antes de este cambio que no había ninguna fila con day_of_week 0 o 6.

alter table public.availability_rules
  drop constraint if exists availability_rules_day_of_week_check;

alter table public.availability_rules
  add constraint availability_rules_day_of_week_check
  check (day_of_week between 1 and 5);
