-- Reseñas con cantidad y comentarios públicos moderados.
--
--   1. professionals.review_count: cantidad de reseñas, cacheada igual que average_rating para
--      no tener que contar en cada búsqueda. La card y el perfil la muestran junto al promedio
--      (y la ocultan si es 0: el profesional nuevo sigue mostrando las 5 estrellas por defecto,
--      20260807030000).
--   2. reviews.comment_status: los comentarios se publican en el perfil solo si el admin los
--      aprueba. Arrancan en 'pending' -- también los que ya existían, que se escribieron sin
--      que el paciente supiera que podían publicarse.
--   3. La columna `comment` deja de ser legible para anon/authenticated. Hasta ahora reviews era
--      de lectura pública completa (reviews_select_public); con comentarios que esperan
--      moderación eso no puede seguir así, aunque ninguna pantalla los mostrara. Las filas siguen
--      siendo públicas (rating, fechas: las usan get_top_rated_professionals y
--      get_featured_professional_of_month, que corren como SECURITY INVOKER); el texto solo sale
--      por RPCs: get_published_review_comments (público, solo aprobados) y
--      get_admin_review_comments (solo admin).

-- ---------------------------------------------------------------------------------------
-- 1. Cantidad de reseñas
-- ---------------------------------------------------------------------------------------

alter table public.professionals
  add column review_count integer not null default 0;

-- Va antes de sumar review_count a protect_professional_admin_fields (más abajo): esta
-- migración no corre como admin, y el trigger revertiría el backfill.
update public.professionals p
set review_count = r.review_count
from (
  select professional_id, count(*) as review_count
  from public.reviews
  group by professional_id
) r
where r.professional_id = p.id;

create or replace function public.update_professional_average_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.professionals
  set
    average_rating = (
      select avg(rating)::numeric(3, 2)
      from public.reviews
      where professional_id = new.professional_id
    ),
    review_count = (
      select count(*)
      from public.reviews
      where professional_id = new.professional_id
    )
  where id = new.professional_id;
  return new;
end;
$$;

-- review_count, igual que average_rating, solo lo escribe el trigger de reviews (profundidad 2,
-- ver 20260807010000): el profesional no puede inflarse la cantidad editando su perfil.
create or replace function public.protect_professional_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and pg_trigger_depth() <= 1 then
    new.is_active := old.is_active;
    new.profile_id := old.profile_id;
    new.average_rating := old.average_rating;
    new.review_count := old.review_count;
    new.gender_trained := old.gender_trained;
    new.is_premium := old.is_premium;
    new.is_featured_of_month := old.is_featured_of_month;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------
-- 2. Moderación de comentarios
-- ---------------------------------------------------------------------------------------

-- pending   -> todavía no lo revisó el admin (no se publica)
-- published -> aprobado, se muestra en el perfil del profesional
-- hidden    -> el admin decidió no publicarlo
alter table public.reviews
  add column comment_status text not null default 'pending'
    check (comment_status in ('pending', 'published', 'hidden'));

-- Permite contar reseñas con comentario (reporte de admin) sin poder leer el comentario.
alter table public.reviews
  add column has_comment boolean
    generated always as (coalesce(btrim(comment), '') <> '') stored;

-- ---------------------------------------------------------------------------------------
-- 3. El texto del comentario deja de ser público
-- ---------------------------------------------------------------------------------------

revoke select on public.reviews from anon, authenticated;
grant select (id, appointment_id, professional_id, rating, created_at, comment_status, has_comment)
  on public.reviews to anon, authenticated;

-- Comentarios aprobados de un profesional, para su perfil público. Sin appointment_id ni nada
-- que permita identificar al paciente.
create function public.get_published_review_comments(p_professional_id uuid)
returns table (id uuid, rating smallint, comment text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.rating, r.comment, r.created_at
  from public.reviews r
  join public.professionals p on p.id = r.professional_id
  where r.professional_id = p_professional_id
    and p.is_active
    and r.has_comment
    and r.comment_status = 'published'
  order by r.created_at desc;
$$;

grant execute on function public.get_published_review_comments(uuid) to anon, authenticated;

-- Todos los comentarios de un profesional (cualquier estado), para moderarlos desde el panel.
create function public.get_admin_review_comments(p_professional_id uuid)
returns setof public.reviews
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  return query
    select *
    from public.reviews
    where professional_id = p_professional_id
      and has_comment
    order by created_at desc;
end;
$$;

grant execute on function public.get_admin_review_comments(uuid) to authenticated;

create function public.set_review_comment_status(p_review_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'published', 'hidden') then
    raise exception 'Estado de comentario inválido: %', p_status;
  end if;

  update public.reviews
  set comment_status = p_status
  where id = p_review_id;

  if not found then
    raise exception 'Reseña % no encontrada.', p_review_id;
  end if;
end;
$$;

grant execute on function public.set_review_comment_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------------------
-- Reporte de admin: comment_count ya no puede leer `comment` (lo cuenta con has_comment) y suma
-- pending_comment_count, para que el admin vea qué profesionales tienen comentarios por revisar.
-- ---------------------------------------------------------------------------------------

drop function if exists public.get_professional_report();

create function public.get_professional_report()
returns table (
  professional_id uuid,
  full_name text,
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
