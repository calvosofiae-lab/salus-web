-- E0-5: Migración de datos `profesionales` (legacy) -> `professionals` (esquema nuevo)
-- (docs/backlog/00-fundamentos.md)
--
-- One-time. No modifica ni borra ninguna fila de `profesionales`: solo lee de ahí e
-- inserta en `professionals`. `profesionales` se elimina recién en E0-9, al final de
-- todo el proyecto.
--
-- Mapeo de columnas (ver docs/data-model.md):
--   Nombre_y_apellido      -> full_name
--   Profesion              -> profession ('psicologo' | 'psiquiatra', normalizado)
--   Matricula              -> license_number
--   Genero                 -> gender (texto libre, se copia tal cual; el dato de origen
--                              es inconsistente -- mezcla género real con preferencia de
--                              búsqueda -- pendiente de limpieza manual más adelante)
--   Obra_social             -> coverage[] ('particular' | 'obra_social', normalizado)
--   Modalidad               -> modality[] ('presencial' | 'virtual', normalizado)
--   Motivo_de_consulta     -> consultation_reasons[]
--   Ubicacion               -> location
--   photo                   -> photo_url
--   Whatsapp                -> whatsapp
--   Destacado                -> is_featured
--   Descripcion              -> description
--   Capacitacion_en_genero  -> gender_trained
--   Valor_de_consulta       -> consultation_fee

insert into public.professionals (
  full_name,
  profession,
  license_number,
  gender,
  description,
  photo_url,
  whatsapp,
  coverage,
  modality,
  consultation_reasons,
  location,
  is_featured,
  is_active,
  gender_trained,
  consultation_fee
)
select
  trim(p."Nombre_y_apellido"),

  case
    when translate(lower(p."Profesion"), 'áéíóúü', 'aeiouu') ilike '%psiquiatr%' then 'psiquiatra'
    when translate(lower(p."Profesion"), 'áéíóúü', 'aeiouu') ilike '%psicolog%' then 'psicologo'
    else lower(trim(p."Profesion"))
  end,

  p."Matricula",
  p."Genero",
  nullif(trim(p."Descripcion"), ''),
  p.photo,
  p."Whatsapp",

  case
    when p."Obra_social" is null or lower(trim(p."Obra_social")) in ('', 'no') then '{}'::text[]
    when p."Obra_social" ilike '%particular%' then array['particular']
    else array['obra_social']
  end,

  case
    when p."Modalidad" ilike '%presencial%' then array['presencial']
    when p."Modalidad" ilike '%virtual%' then array['virtual']
    else '{}'::text[]
  end,

  case
    when p."Motivo_de_consulta" is null or trim(p."Motivo_de_consulta") = '' then '{}'::text[]
    else array[trim(p."Motivo_de_consulta")]
  end,

  p."Ubicacion",
  coalesce(lower(trim(p."Destacado")), 'false') in ('true', 'si', 'sí'),
  true,

  case
    when p."Capacitacion_en_genero" is null then null
    when lower(trim(p."Capacitacion_en_genero")) in ('no', '') then false
    else true
  end,

  p."Valor_de_consulta"

from public.profesionales p;
