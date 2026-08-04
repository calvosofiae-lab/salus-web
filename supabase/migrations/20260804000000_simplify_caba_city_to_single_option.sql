-- El intake real de profesionales (formulario de alta) mostró que separar CABA por
-- Comuna no tiene sentido para el producto: se decide tratar CABA como una única
-- localidad. Reemplaza las 15 filas "Comuna 1".."Comuna 15" por una sola fila "CABA",
-- para que sea la única opción del selector de ciudad cuando la provincia elegida es
-- CABA (en vez de caer al fallback "General" que se usa cuando una provincia no tiene
-- ninguna fila en cities).
--
-- professionals.city no tiene FK a cities (ver 20260801050022_create_provinces_and_cities_tables):
-- los profesionales ya guardados con una comuna como ciudad no se tocan acá, solo dejan
-- de poder re-seleccionarla en el formulario de edición.

delete from public.cities where province_id = 'CABA';

insert into public.cities (province_id, name) values ('CABA', 'CABA');
