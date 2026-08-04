-- El intake real de profesionales incluyó al menos un caso con WhatsApp de España
-- (formato +34, 9 dígitos), que la validación actual (10 dígitos fijos, formato AR) no
-- puede representar. Se agrega una columna de país por cada campo de WhatsApp
-- (professionals.whatsapp y appointments.patient_whatsapp) y se generaliza la validación
-- para admitir una longitud distinta según el país, con Argentina como default.
--
-- El número se sigue guardando como dígitos locales sin código de país (igual que antes
-- para Argentina): el país solo determina cuántos dígitos se esperan y cómo se arma el
-- link wa.me (código de país + prefijo de móvil si corresponde).

alter table public.professionals
  add column whatsapp_country text not null default 'AR';

alter table public.appointments
  add column patient_whatsapp_country text not null default 'AR';

create or replace function public.validate_professional_whatsapp()
returns trigger
language plpgsql
as $$
declare
  v_expected_length int;
begin
  if new.whatsapp is not null
     and (
       tg_op = 'INSERT'
       or new.whatsapp is distinct from old.whatsapp
       or new.whatsapp_country is distinct from old.whatsapp_country
     ) then
    v_expected_length := case coalesce(new.whatsapp_country, 'AR')
      when 'AR' then 10
      when 'ES' then 9
      else 10
    end;
    if new.whatsapp !~ ('^\d{' || v_expected_length || '}$') then
      raise exception 'El WhatsApp debe tener % números para el país seleccionado.', v_expected_length;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.book_appointment(
  p_professional_id uuid,
  p_date date,
  p_start_time time,
  p_first_name text,
  p_last_name text,
  p_whatsapp text,
  p_whatsapp_country text default 'AR'
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
begin
  if trim(coalesce(p_first_name, '')) = '' or trim(coalesce(p_last_name, '')) = ''
     or trim(coalesce(p_whatsapp, '')) = '' then
    raise exception 'Nombre, apellido y WhatsApp son obligatorios.';
  end if;

  v_expected_length := case coalesce(p_whatsapp_country, 'AR')
    when 'AR' then 10
    when 'ES' then 9
    else 10
  end;
  if trim(p_whatsapp) !~ ('^\d{' || v_expected_length || '}$') then
    raise exception 'El WhatsApp debe tener % números para el país seleccionado.', v_expected_length;
  end if;

  select exists (
    select 1
    from public.get_available_slots(p_professional_id, p_date) s
    where s.start_time = p_start_time
  ) into v_slot_available;

  if not v_slot_available then
    raise exception 'El horario seleccionado ya no está disponible.';
  end if;

  v_end_time := p_start_time + interval '1 hour';

  begin
    insert into public.appointments (
      professional_id, appointment_date, start_time, end_time,
      patient_first_name, patient_last_name, patient_whatsapp, patient_whatsapp_country
    ) values (
      p_professional_id, p_date, p_start_time, v_end_time,
      trim(p_first_name), trim(p_last_name), trim(p_whatsapp), coalesce(p_whatsapp_country, 'AR')
    )
    returning id into v_appointment_id;
  exception when unique_violation then
    raise exception 'Ese horario ya fue reservado por otra persona. Elegí otro horario.';
  end;

  return v_appointment_id;
end;
$$;
