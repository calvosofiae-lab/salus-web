-- El admin puede publicar comentarios aunque el paciente no haya autorizado la publicación.
--
-- 20261019000000 lo bloqueaba; ahora comment_publication_authorized es solo informativo: el
-- panel de admin lo muestra junto a cada comentario para que el admin decida. Se vuelven
-- set_review_comment_status y get_published_review_comments a como estaban en 20261017010000.

create or replace function public.set_review_comment_status(p_review_id uuid, p_status text)
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

create or replace function public.get_published_review_comments(p_professional_id uuid)
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
