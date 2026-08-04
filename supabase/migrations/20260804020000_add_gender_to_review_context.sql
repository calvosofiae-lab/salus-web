-- La página /valoracion/[token] necesita mostrar un avatar genérico (hombre/mujer) cuando el
-- profesional no cargó foto. get_review_context no devolvía el género; se agrega la columna
-- sin tocar el resto de la validación (token válido, turno realizado, no calificado todavía).

create or replace function public.get_review_context(p_token uuid)
returns table (
  patient_first_name text,
  appointment_date date,
  start_time time,
  professional_full_name text,
  professional_photo_url text,
  professional_profession text,
  professional_license_number text,
  professional_gender text
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
    p.license_number,
    p.gender
  from public.professionals p
  where p.id = v_appointment.professional_id;
end;
$$;

grant execute on function public.get_review_context(uuid) to anon, authenticated;
