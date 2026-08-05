-- Plan pago para profesionales (E?-?, pedido de negocio 2026-08-05): se agrega el flag
-- `is_premium`. Solo lo puede tocar un admin -- igual que is_active/profile_id/average_rating/
-- consultation_fee/gender_trained, se protege en protect_professional_admin_fields
-- (20260801090000_protect_more_professional_fields) revirtiéndolo a su valor anterior cuando
-- quien actualiza no es admin. La policy professionals_update_own (20260731082025) solo
-- restringe FILA, no columna, así que sin esto un profesional podría auto-otorgarse el plan
-- premium con un update directo.
--
-- Todos arrancan en `false` (plan estándar) por default; después de agregar la columna se
-- marca en `true` a los profesionales que ya tienen el plan premium pago hoy.

alter table public.professionals
  add column is_premium boolean not null default false;

create or replace function public.protect_professional_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.is_active := old.is_active;
    new.profile_id := old.profile_id;
    new.average_rating := old.average_rating;
    new.consultation_fee := old.consultation_fee;
    new.gender_trained := old.gender_trained;
    new.is_premium := old.is_premium;
  end if;
  return new;
end;
$$;

update public.professionals
set is_premium = true
where full_name in (
  'Ana Paula Parizzia Graziani',
  'Daniela Mazzoni',
  'María Soledad Ardiles',
  'Micaela Badaloni'
);
