-- Reemplaza `location` (texto libre) por `province` + `city`, los mismos
-- valores canónicos que ya usa el buscador público (PROVINCIAS /
-- CIUDADES_POR_PROVINCIA en features/professionals/constants.ts). Motivo:
-- el profesional cargaba su ubicación como texto libre ("Santa Fe capital")
-- mientras el paciente filtraba eligiendo de una lista fija ("Santa Fe" /
-- "Santa Fe Capital") — un ilike de texto libre contra una lista fija es
-- frágil y no garantiza que coincidan.

alter table public.professionals
  add column province text,
  add column city text;

-- Migración best-effort de los datos existentes (todos de prueba a esta
-- altura). De acá en adelante toda carga nueva sale de los mismos
-- selectores Provincia/Ciudad en ambos lados, así que no hace falta una
-- lógica más general que esta.
update public.professionals
set
  city = case
    when location ilike '%santa fe capital%' then 'Santa Fe Capital'
    else null
  end,
  province = case
    when location ilike '%caba%' then 'CABA'
    when location ilike '%santa fe%' then 'Santa Fe'
    when location ilike '%buenos aires%' then 'Buenos Aires'
    when location ilike '%c%rdoba%' then 'Córdoba'
    when location ilike '%mendoza%' then 'Mendoza'
    when location ilike '%tucum%n%' then 'Tucumán'
    when location ilike '%salta%' then 'Salta'
    when location ilike '%entre r%os%' then 'Entre Ríos'
    else null
  end
where location is not null;

alter table public.professionals drop column location;
