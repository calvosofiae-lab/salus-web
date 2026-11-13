-- Búsqueda pública de profesionales con prioridad para los que menos turnos reciben.
--
-- Problema (2026-11): varios profesionales se dieron de baja por no haber recibido ninguna
-- consulta. Hasta ahora la búsqueda devolvía los resultados en orden 100% aleatorio (shuffle en
-- el browser), así que todos tenían la misma chance de salir arriba sin importar cuántos turnos
-- venían recibiendo.
--
-- Ahora el orden sigue siendo aleatorio pero ponderado: cada profesional recibe un puntaje
-- `random() * (1 + least(turnos_recientes, 4))` y se ordena de menor a mayor. Con 0 turnos
-- recientes el puntaje cae en [0, 1); con 4 o más, en [0, 5). Resultado: los que no
-- reciben turnos aparecen casi siempre en las primeras posiciones, pero mezclados entre sí y con
-- algún profesional con más turnos que "se cuela" arriba de vez en cuando, así que el listado no
-- se ve como un ranking fijo.
--
-- "Turnos recientes" = sesiones no canceladas con fecha (appointment_date) entre 30 días atrás y
-- 30 días adelante, vengan de una reserva del paciente en la web o las cargue el profesional en
-- su agenda (created_by_professional): lo que importa es cuántas sesiones tiene el profesional,
-- no por qué canal le llegaron.
--
-- SECURITY DEFINER porque anon no puede leer appointments (RLS). La función solo expone
-- profesionales activos (lo mismo que permite professionals_select_active_public) y el orden; no
-- devuelve los conteos de turnos.

create or replace function public.search_professionals(
  p_full_name text default null,
  p_profession text default null,
  p_consultation_reason text default null,
  p_orientation text default null,
  p_gender text default null,
  p_coverage text default null,
  p_modality text default null,
  p_province text default null,
  p_city text default null
)
returns setof public.professionals
language sql
volatile
security definer
set search_path = public
as $$
  select p.*
  from public.professionals p
  left join (
    select professional_id, count(*) as recent_count
    from public.appointments
    where status <> 'cancelado'
      and appointment_date between current_date - 30 and current_date + 30
    group by professional_id
  ) ap on ap.professional_id = p.id
  where p.is_active = true
    and (p_full_name is null or p.full_name_normalized like '%' || lower(public.immutable_unaccent(p_full_name)) || '%')
    and (p_profession is null or p.profession = p_profession)
    and (p_consultation_reason is null or p.consultation_reasons @> array[p_consultation_reason])
    and (p_orientation is null or coalesce(p_profession, '') <> 'psicologo' or p.orientations @> array[p_orientation])
    and (p_gender is null or p.gender ilike '%' || p_gender || '%')
    and (p_coverage is null or p.coverage @> array[p_coverage])
    and (p_modality is null or p.modality @> array[p_modality])
    and (p_province is null or p.province = p_province)
    and (p_city is null or p_city = 'General' or p.city = p_city)
  order by random() * (1 + least(coalesce(ap.recent_count, 0), 4));
$$;

grant execute on function public.search_professionals(
  text, text, text, text, text, text, text, text, text
) to anon, authenticated;
