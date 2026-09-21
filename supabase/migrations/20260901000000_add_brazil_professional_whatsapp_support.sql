-- El intake real de profesionales trajo un caso con WhatsApp de Brasil (formato +55, DDD de
-- 2 dígitos + número de 9 -- 11 dígitos en total, ya que el 9 forma parte del número y no es
-- un prefijo aparte como en Argentina). validate_professional_whatsapp() solo admitía
-- Argentina (10) y España (9) -- se agrega Brasil (11) a la misma validación.
-- Ver lib/whatsapp.ts (PHONE_COUNTRIES) para el cambio equivalente del lado del cliente.

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
      when 'BR' then 11
      else 10
    end;
    if new.whatsapp !~ ('^\d{' || v_expected_length || '}$') then
      raise exception 'El WhatsApp debe tener % números para el país seleccionado.', v_expected_length;
    end if;
  end if;
  return new;
end;
$$;
