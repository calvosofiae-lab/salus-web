-- Fix: la normalización de `profession` en E0-5 (migración de datos legacy) no era
-- insensible a acentos. `ilike '%psicolog%'` no matcheaba "Psicóloga" ni "Psicólogo/a"
-- (el acento cae sobre la "o", a diferencia de "Psicología" donde cae más adelante y sí
-- coincidía). Resultado: quedaron filas con profession = "psicóloga" / "psicólogo/a" en
-- vez de "psicologo". Se corrige normalizando acentos con translate() antes de comparar.

update public.professionals
set profession = case
  when translate(lower(profession), 'áéíóúü', 'aeiouu') ilike '%psiquiatr%' then 'psiquiatra'
  when translate(lower(profession), 'áéíóúü', 'aeiouu') ilike '%psicolog%' then 'psicologo'
  else lower(profession)
end
where profession not in ('psicologo', 'psiquiatra');
