-- E0-4 (ampliación): agrega dos columnas que existen en la tabla legacy `profesionales`
-- (Capacitacion_en_genero, Valor_de_consulta) y no estaban contempladas en el esquema
-- nuevo original. Se agregan para no perder esa información al migrar los datos en E0-5.

alter table public.professionals
  add column gender_trained boolean,
  add column consultation_fee numeric;
