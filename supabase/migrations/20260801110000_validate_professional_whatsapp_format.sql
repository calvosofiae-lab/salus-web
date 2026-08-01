-- Revisión de seguridad (2026-08-01), continuación de E7-7: professionals.whatsapp (el
-- número del profesional, usado para armar el botón "Contactar por WhatsApp" en
-- professional-card.tsx) no tenía ninguna validación server-side -- mismo hueco que
-- book_appointment tenía para el WhatsApp del paciente (ya resuelto en
-- 20260801092000_validate_whatsapp_format_in_book_appointment.sql). RLS
-- (professionals_update_own) solo restringe qué fila se puede tocar, no el formato.
--
-- Se usa un trigger en vez de un `check` constraint porque hay datos legacy migrados con
-- formatos viejos (ej. con el 0 y el 15 adelante, ver docs/backups/profesionales_backup_...).
-- Un `check` constraint validaría esas filas en cada UPDATE futuro aunque no se toque
-- whatsapp, bloqueando ediciones de cualquier otro campo hasta corregirlo. El trigger solo
-- exige el formato nuevo (10 dígitos) cuando el valor realmente cambia (o se inserta desde
-- cero), dejando en paz las filas viejas mientras nadie les toque ese campo.

create function public.validate_professional_whatsapp()
returns trigger
language plpgsql
as $$
begin
  if new.whatsapp is not null
     and (tg_op = 'INSERT' or new.whatsapp is distinct from old.whatsapp)
     and new.whatsapp !~ '^\d{10}$' then
    raise exception 'El WhatsApp debe tener 10 números (código de área + línea, sin 0 ni 15).';
  end if;
  return new;
end;
$$;

create trigger trg_validate_professional_whatsapp
  before insert or update on public.professionals
  for each row execute function public.validate_professional_whatsapp();
