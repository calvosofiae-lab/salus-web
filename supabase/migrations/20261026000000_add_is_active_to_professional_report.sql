-- Reporte de admin: suma is_active para que el admin pueda filtrar activos e inactivos, igual
-- que en el listado de profesionales.

drop function if exists public.get_professional_report();

create function public.get_professional_report()
returns table (
  professional_id uuid,
  full_name text,
  is_active boolean,
  average_rating numeric,
  review_count bigint,
  comment_count bigint,
  pending_comment_count bigint,
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
    p.is_active,
    p.average_rating,
    coalesce(rv.review_count, 0),
    coalesce(rv.comment_count, 0),
    coalesce(rv.pending_comment_count, 0),
    coalesce(ap.reservado_count, 0),
    coalesce(ap.realizado_count, 0),
    coalesce(ap.cancelado_count, 0),
    coalesce(ap.no_asistio_count, 0)
  from public.professionals p
  left join (
    select
      professional_id,
      count(*) as review_count,
      count(*) filter (where has_comment) as comment_count,
      count(*) filter (where has_comment and comment_status = 'pending') as pending_comment_count
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

grant execute on function public.get_professional_report() to authenticated;
