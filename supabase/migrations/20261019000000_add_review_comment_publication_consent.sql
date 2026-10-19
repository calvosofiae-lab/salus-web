-- Autorización del paciente para publicar su comentario.
--
-- En /valoracion/[token] el paciente marca (opcionalmente) "Sí, autorizo" para que su comentario
-- se publique de forma anónima en el perfil del profesional. Sin esa autorización el admin no
-- puede publicarlo: set_review_comment_status lo rechaza y get_published_review_comments no lo
-- devuelve aunque esté en 'published'.
--
-- Las reseñas existentes quedan en false: se escribieron sin que se le preguntara al paciente
-- (mismo criterio que comment_status = 'pending' en 20261017010000).

alter table public.reviews
  add column comment_publication_authorized boolean not null default false;

-- Visible para anon/authenticated como el resto de las columnas de moderación (no expone nada
-- del paciente); `comment` sigue sin ser legible.
grant select (comment_publication_authorized) on public.reviews to anon, authenticated;

-- ---------------------------------------------------------------------------------------
-- submit_review recibe la autorización
-- ---------------------------------------------------------------------------------------

-- Se borra la versión de 3 argumentos para que no queden dos overloads.
drop function public.submit_review(uuid, smallint, text);

create function public.submit_review(
  p_token uuid,
  p_rating smallint,
  p_comment text,
  p_publication_authorized boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment record;
  v_comment text := nullif(trim(coalesce(p_comment, '')), '');
begin
  if p_rating < 1 or p_rating > 5 then
    raise exception 'La calificación debe ser entre 1 y 5.';
  end if;

  select id, professional_id, status, reviewed
  into v_appointment
  from public.appointments
  where rating_token = p_token
  for update;

  if not found then
    raise exception 'El link de calificación no es válido.';
  end if;

  if v_appointment.status <> 'realizado' then
    raise exception 'Este turno no puede calificarse.';
  end if;

  if v_appointment.reviewed then
    raise exception 'Este turno ya fue calificado.';
  end if;

  -- Sin comentario no hay nada que autorizar.
  insert into public.reviews (
    appointment_id, professional_id, rating, comment, comment_publication_authorized
  )
  values (
    v_appointment.id,
    v_appointment.professional_id,
    p_rating,
    v_comment,
    v_comment is not null and coalesce(p_publication_authorized, false)
  );

  update public.appointments set reviewed = true where id = v_appointment.id;
end;
$$;

grant execute on function public.submit_review(uuid, smallint, text, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------------------------
-- El admin solo puede publicar comentarios autorizados
-- ---------------------------------------------------------------------------------------

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

  if p_status = 'published' and not exists (
    select 1 from public.reviews
    where id = p_review_id and comment_publication_authorized
  ) then
    if not exists (select 1 from public.reviews where id = p_review_id) then
      raise exception 'Reseña % no encontrada.', p_review_id;
    end if;
    raise exception 'El paciente no autorizó la publicación de este comentario.';
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
    and r.comment_publication_authorized
  order by r.created_at desc;
$$;
