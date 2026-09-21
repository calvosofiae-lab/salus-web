-- Reporte de valoraciones y turnos por profesional para el panel de admin (2026-09-01):
-- tabla simple con promedio de rating, cantidad de reviews y cantidad de turnos por estado.
-- Se agrega en SQL (dos subconsultas agrupadas, no un join directo) para no duplicar filas de
-- professionals por cada combinación review/appointment y para no traer todos los reviews y
-- appointments de la base al cliente solo para contarlos ahí.
--
-- SECURITY INVOKER (default): no hace falta elevar privilegios, RLS ya le da a un admin
-- lectura completa de professionals (professionals_admin_full_access) y appointments
-- (appointments_select_own, con el OR is_admin()); reviews es de lectura pública
-- (reviews_select_public).
create or replace function public.get_professional_report()
returns table (
  professional_id uuid,
  full_name text,
  average_rating numeric,
  review_count bigint,
  reservado_count bigint,
  realizado_count bigint,
  cancelado_count bigint,
  no_asistio_count bigint
)
language sql
stable
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.average_rating,
    coalesce(rv.review_count, 0),
    coalesce(ap.reservado_count, 0),
    coalesce(ap.realizado_count, 0),
    coalesce(ap.cancelado_count, 0),
    coalesce(ap.no_asistio_count, 0)
  from public.professionals p
  left join (
    select professional_id, count(*) as review_count
    from public.reviews
    group by professional_id
  ) rv on rv.professional_id = p.id
  left join (
    select
      professional_id,
      count(*) filter (where status = 'reservado') as reservado_count,
      count(*) filter (where status = 'realizado') as realizado_count,
      count(*) filter (where status = 'cancelado') as cancelado_count,
      count(*) filter (where status = 'no_asistio') as no_asistio_count
    from public.appointments
    group by professional_id
  ) ap on ap.professional_id = p.id
  order by p.full_name;
$$;

-- Solo tiene sentido para el panel de admin; no se otorga a `anon`.
grant execute on function public.get_professional_report() to authenticated;
