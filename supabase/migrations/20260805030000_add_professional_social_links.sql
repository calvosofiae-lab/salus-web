-- Pedido de negocio (2026-08-05): sumar redes sociales al perfil del profesional (Instagram y
-- LinkedIn), para mostrarlas junto al botón de WhatsApp en la card de la home. Se guardan como
-- URL completa igual que el resto de los campos de contacto de texto libre (photo_url,
-- description); sin constraint de formato porque LinkedIn no tiene un patrón de URL único
-- (/in/, /company/, dominios regionales, etc).
--
-- No se agregan a protect_professional_admin_fields: son datos de contacto que el profesional
-- edita legítimamente desde "Mi perfil", igual que whatsapp.

alter table public.professionals
  add column instagram_url text,
  add column linkedin_url text;
