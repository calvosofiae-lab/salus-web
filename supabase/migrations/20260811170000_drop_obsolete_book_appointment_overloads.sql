-- Cada cambio de firma de book_appointment (20260804010000: agrega p_whatsapp_country,
-- 20260811140000: agrega p_patient_email) usó "create or replace function", pero Postgres
-- identifica las funciones por nombre + cantidad/tipo de parámetros: como la cantidad de
-- parámetros cambió, cada migración creó una función nueva superpuesta en vez de reemplazar
-- la anterior. Quedaron 3 versiones de public.book_appointment conviviendo (6, 7 y 8
-- parámetros, las últimas dos con defaults al final). Cualquier llamado que mande solo los
-- primeros 6 u 7 argumentos (por ejemplo un bundle del frontend cacheado desde antes de
-- 20260811140000) matchea más de un candidato a la vez y Postgres responde "could not choose
-- the best candidate function" en vez de reservar el turno.
--
-- Se eliminan las firmas viejas y se re-otorga el execute sobre la única que queda (8
-- parámetros), ya que ninguna de las dos migraciones que agregaron parámetros incluyó su
-- propio grant.

drop function if exists public.book_appointment(uuid, date, time, text, text, text);
drop function if exists public.book_appointment(uuid, date, time, text, text, text, text);

grant execute on function public.book_appointment(uuid, date, time, text, text, text, text, text)
  to anon, authenticated;
