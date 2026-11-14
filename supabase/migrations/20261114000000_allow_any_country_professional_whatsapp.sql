-- El WhatsApp del profesional pasa a cargarse igual que el del paciente al reservar un turno:
-- cualquier país (no solo Argentina, España y Brasil), con código de área y número por separado
-- y validado con libphonenumber en el cliente (features/appointments/lib/phone.ts). En la base
-- se sigue guardando como dígitos locales (área + número) en `whatsapp` + el país en
-- `whatsapp_country`.
--
-- Se alinea validate_professional_whatsapp() con la validación de book_appointment: Argentina
-- (10) y España (9) mantienen su largo exacto; cualquier otro país admite entre 4 y 14 dígitos.
-- Brasil deja de exigir 11 exactos (los fijos tienen 10), igual que para los pacientes.

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
      else null
    end;

    if v_expected_length is not null then
      if new.whatsapp !~ ('^\d{' || v_expected_length || '}$') then
        raise exception 'El WhatsApp debe tener % números para el país seleccionado.', v_expected_length;
      end if;
    elsif new.whatsapp !~ '^\d{4,14}$' then
      raise exception 'El WhatsApp debe tener entre 4 y 14 números.';
    end if;
  end if;
  return new;
end;
$$;
