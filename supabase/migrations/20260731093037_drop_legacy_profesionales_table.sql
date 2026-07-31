-- E0-9: Baja de la tabla legacy `profesionales` (docs/backlog/00-fundamentos.md)
--
-- Los datos ya fueron migrados a `professionals` en E0-5. Verificado antes de
-- este drop: ningún código de la app referencia `profesionales` (grep sobre
-- todo el repo, sin resultados), y se exportó un backup completo de las 4
-- filas a docs/backups/profesionales_backup_20260731.json.

drop table public.profesionales;
