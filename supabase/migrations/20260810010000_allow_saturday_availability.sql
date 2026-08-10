-- Habilita el sábado (day_of_week 6) como día de atención: se mantiene la
-- restricción de domingo (0), que sigue sin ofrecerse en la UI ni en
-- get_available_slots (SALUS no atiende domingos).

alter table public.availability_rules
  drop constraint if exists availability_rules_day_of_week_check;

alter table public.availability_rules
  add constraint availability_rules_day_of_week_check
  check (day_of_week between 1 and 6);
