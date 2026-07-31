-- E6-3: Envío de calificación vía token único (docs/backlog/06-calificaciones.md)
--
-- SECURITY DEFINER: el paciente nunca tiene sesión ni acceso directo a
-- appointments, así que la única forma de calificar es este RPC, que valida
-- todo server-side: token existe, turno "realizado", no calificado antes.
-- `for update` bloquea la fila mientras se valida, para que dos submits casi
-- simultáneos con el mismo token no generen dos reviews (el unique de
-- appointment_id en reviews es la barrera final de todos modos).

create function public.submit_review(
  p_token uuid,
  p_rating smallint,
  p_comment text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment record;
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

  insert into public.reviews (appointment_id, professional_id, rating, comment)
  values (
    v_appointment.id,
    v_appointment.professional_id,
    p_rating,
    nullif(trim(coalesce(p_comment, '')), '')
  );

  update public.appointments set reviewed = true where id = v_appointment.id;
end;
$$;

grant execute on function public.submit_review(uuid, smallint, text) to anon, authenticated;
