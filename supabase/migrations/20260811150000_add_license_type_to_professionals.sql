-- Los profesionales solo tenían license_number (texto libre), mostrado siempre con el
-- prefijo fijo "M.N." hardcodeado en la UI. Se agrega el tipo de matrícula (Nacional o
-- Provincial) y, para el caso provincial, la provincia. La info ya cargada queda en
-- "nacional" por default (el DEFAULT aplica retroactivamente a las filas existentes); los
-- casos con matrícula provincial se van a editar a mano después.

alter table public.professionals
  add column license_type text not null default 'nacional',
  add column license_province text references public.provinces (id);

alter table public.professionals
  add constraint professionals_license_type_check
    check (license_type in ('nacional', 'provincial'));

alter table public.professionals
  add constraint professionals_license_province_consistency
    check (
      (license_type = 'provincial' and license_province is not null)
      or (license_type = 'nacional' and license_province is null)
    );

-- get_review_context (usada por /valoracion/[token]) necesita el tipo y la provincia para
-- poder mostrar "M.N." o "M.P. <Provincia>" igual que el resto de la app.
drop function if exists public.get_review_context(uuid);

create function public.get_review_context(p_token uuid)
returns table (
  patient_first_name text,
  appointment_date date,
  start_time time,
  professional_full_name text,
  professional_photo_url text,
  professional_profession text,
  professional_license_number text,
  professional_license_type text,
  professional_license_province text,
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
    p.license_type,
    p.license_province,
    p.gender
  from public.professionals p
  where p.id = v_appointment.professional_id;
end;
$$;

grant execute on function public.get_review_context(uuid) to anon, authenticated;
