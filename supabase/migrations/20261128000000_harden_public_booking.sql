-- Endurece la reserva pública y la valoración (revisión de seguridad 2026-11-28).
--
-- APLICAR DESPUÉS DE PUBLICAR EL CÓDIGO que reserva desde el servidor
-- (features/appointments/services/bookAppointmentAction.ts). Al final de esta migración,
-- book_appointment deja de poder llamarse con la clave pública (anon/authenticated): solo la
-- llama el servidor con la clave secreta, después de validar el captcha. Si se aplica antes
-- del deploy, la versión anterior del sitio (que llama a la RPC desde el navegador) deja de
-- poder reservar.
--
-- No cambia tablas ni columnas: solo redefine dos funciones y sus permisos.
--
-- book_appointment: misma lógica que 20260916010000, más:
--   * largo máximo de nombre, apellido (80) y email (254);
--   * el profesional tiene que existir y estar activo (get_available_slots no lo revisa);
--   * la fecha no puede estar a más de 365 días;
--   * como máximo 3 turnos reservados por el mismo email o el mismo WhatsApp creados en las
--     últimas 24 horas (frena que un script llene agendas o mande mails a terceros).
--
-- submit_review: misma lógica que 20261019000000, más un largo máximo de comentario (2000).

create or replace function public.book_appointment(
  p_professional_id uuid,
  p_date date,
  p_start_time time,
  p_first_name text,
  p_last_name text,
  p_whatsapp text,
  p_whatsapp_country text default 'AR',
  p_patient_email text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot_available boolean;
  v_end_time time;
  v_appointment_id uuid;
  v_expected_length int;
  v_duration_minutes smallint;
  v_recent_bookings int;
begin
  if trim(coalesce(p_first_name, '')) = '' or trim(coalesce(p_last_name, '')) = ''
     or trim(coalesce(p_whatsapp, '')) = '' or trim(coalesce(p_patient_email, '')) = '' then
    raise exception 'Nombre, apellido, WhatsApp y email son obligatorios.';
  end if;

  if char_length(trim(p_first_name)) > 80 or char_length(trim(p_last_name)) > 80 then
    raise exception 'El nombre y el apellido pueden tener hasta 80 caracteres.';
  end if;

  if char_length(trim(p_patient_email)) > 254 then
    raise exception 'El email es demasiado largo.';
  end if;

  if trim(p_patient_email) !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'El email no tiene un formato válido.';
  end if;

  v_expected_length := case coalesce(p_whatsapp_country, 'AR')
    when 'AR' then 10
    when 'ES' then 9
    else null
  end;

  if v_expected_length is not null then
    if trim(p_whatsapp) !~ ('^\d{' || v_expected_length || '}$') then
      raise exception 'El WhatsApp debe tener % números para el país seleccionado.', v_expected_length;
    end if;
  elsif trim(p_whatsapp) !~ '^\d{4,14}$' then
    raise exception 'El WhatsApp debe tener entre 4 y 14 números.';
  end if;

  if not exists (
    select 1 from public.professionals
    where id = p_professional_id and is_active
  ) then
    raise exception 'El profesional no está disponible para reservas.';
  end if;

  if p_date > current_date + 365 then
    raise exception 'Solo se puede reservar hasta un año adelante.';
  end if;

  select count(*) into v_recent_bookings
  from public.appointments a
  where a.status = 'reservado'
    and a.created_by_professional = false
    and a.created_at > now() - interval '24 hours'
    and (
      lower(a.patient_email) = lower(trim(p_patient_email))
      or (a.patient_whatsapp = trim(p_whatsapp)
          and a.patient_whatsapp_country = coalesce(p_whatsapp_country, 'AR'))
    );

  if v_recent_bookings >= 3 then
    raise exception 'Ya hay varias reservas recientes con estos datos. Si necesitás otro turno, escribile al profesional o a SALUS.';
  end if;

  select exists (
    select 1
    from public.get_available_slots(p_professional_id, p_date) s
    where s.start_time = p_start_time
  ) into v_slot_available;

  if not v_slot_available then
    raise exception 'El horario seleccionado ya no está disponible.';
  end if;

  select slot_duration_minutes into v_duration_minutes
  from public.professionals
  where id = p_professional_id;

  v_end_time := (p_start_time + (v_duration_minutes || ' minutes')::interval)::time;

  begin
    insert into public.appointments (
      professional_id, appointment_date, start_time, end_time,
      patient_first_name, patient_last_name, patient_whatsapp, patient_whatsapp_country,
      patient_email
    ) values (
      p_professional_id, p_date, p_start_time, v_end_time,
      trim(p_first_name), trim(p_last_name), trim(p_whatsapp), coalesce(p_whatsapp_country, 'AR'),
      trim(p_patient_email)
    )
    returning id into v_appointment_id;
  exception when unique_violation then
    raise exception 'Ese horario ya fue reservado por otra persona. Elegí otro horario.';
  end;

  return v_appointment_id;
end;
$$;

-- Solo el servidor (service_role) puede reservar. Supabase le da EXECUTE a anon y
-- authenticated por defecto en cada función nueva, y Postgres a PUBLIC: se sacan los tres.
revoke execute on function public.book_appointment(uuid, date, time, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.book_appointment(uuid, date, time, text, text, text, text, text)
  to service_role;

create or replace function public.submit_review(
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

  if char_length(v_comment) > 2000 then
    raise exception 'El comentario puede tener hasta 2000 caracteres.';
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
