-- Normaliza professionals.gender a solo 'mujer' | 'hombre' | null.
-- Antes de esta migración había una mezcla de valores libres cargados en
-- distintos momentos: "Mujer", "Prefiero profesional mujer", "Masculino".
-- De acá en adelante el formulario solo permite elegir entre esas dos
-- opciones (o dejarlo sin especificar), así que no hace falta un CHECK a
-- nivel DB: mantenemos gender como texto libre, igual que profession,
-- coverage y modality, gobernado por la UI y las constantes del front.

update public.professionals
set gender = case
  when gender ilike '%mujer%' then 'mujer'
  when gender ilike '%hombre%' or gender ilike '%masculino%' then 'hombre'
  else gender
end
where gender is not null;
