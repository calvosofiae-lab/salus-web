-- Contexto del turno para la página pública de calificación (docs/backlog/06-calificaciones.md)
--
-- El paciente llega a /valoracion/[token] sin sesión (mismo caso que submit_review, E6-3):
-- la única forma de leer datos es una RPC SECURITY DEFINER. Se valida exactamente lo mismo
-- que valida submit_review antes de insertar (token existe, turno "realizado", no calificado
-- todavía), para que el paciente vea el mismo mensaje de error ahí arriba en vez de recién al
-- enviar el formulario.

create function public.get_review_context(p_token uuid)
returns table (
  patient_first_name text,
  appointment_date date,
  start_time time,
  professional_full_name text,
  professional_photo_url text,
  professional_profession text,
  professional_license_number text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment record;
begin
  select a.patient_first_name, a.appointment_date, a.start_time, a.professional_id,
         a.status, a.reviewed
  into v_appointment
  from public.appointments a
  where a.rating_token = p_token;

  if not found then
    raise exception 'El link de calificación no es válido.';
  end if;

  if v_appointment.status <> 'realizado' then
    raise exception 'Este turno no puede calificarse.';
  end if;

  if v_appointment.reviewed then
    raise exception 'Este turno ya fue calificado.';
  end if;

  return query
  select
    v_appointment.patient_first_name,
    v_appointment.appointment_date,
    v_appointment.start_time,
    p.full_name,
    p.photo_url,
    p.profession,
    p.license_number
  from public.professionals p
  where p.id = v_appointment.professional_id;
end;
$$;

grant execute on function public.get_review_context(uuid) to anon, authenticated;
