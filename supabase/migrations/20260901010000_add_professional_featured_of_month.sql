-- Pedido de negocio (2026-09-01): "Profesional destacado del mes" vuelve a ser una selección
-- manual del admin (hasta 2 a la vez), reemplazando el cálculo automático por rating de E6-5
-- (20260731090202_create_featured_professional_of_month_function.sql). Con el volumen real de
-- reviews casi nunca se alcanzaba el mínimo de 3 en el mes, así que la sección terminaba
-- vacía casi siempre; el admin prefiere elegir directamente desde el listado de profesionales.
--
-- new.is_featured_of_month se protege en protect_professional_admin_fields igual que el
-- resto de los campos "solo admin" (is_active/profile_id/average_rating/gender_trained/
-- is_premium). De paso se repone la protección de is_premium: 20260807040000 la sacó de la
-- lista sin querer al simplificar la función para permitir auto-edición de consultation_fee,
-- dejando desde entonces que un profesional pudiera auto-otorgarse el plan premium con un
-- update directo.
--
-- El límite de 2 destacados simultáneos no se puede expresar con un check constraint (necesita
-- contar filas de OTRAS filas de la misma tabla), así que se aplica con un trigger aparte.

alter table public.professionals
  add column is_featured_of_month boolean not null default false;

create or replace function public.protect_professional_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and pg_trigger_depth() <= 1 then
    new.is_active := old.is_active;
    new.profile_id := old.profile_id;
    new.average_rating := old.average_rating;
    new.gender_trained := old.gender_trained;
    new.is_premium := old.is_premium;
    new.is_featured_of_month := old.is_featured_of_month;
  end if;
  return new;
end;
$$;

create function public.enforce_featured_of_month_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  was_featured boolean := false;
begin
  if tg_op = 'UPDATE' then
    was_featured := old.is_featured_of_month;
  end if;

  if new.is_featured_of_month and not was_featured then
    if (select count(*) from public.professionals where is_featured_of_month = true) >= 2 then
      raise exception 'Ya hay 2 profesionales marcados como destacado del mes. Sacá uno antes de marcar otro.';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_featured_of_month_limit
  before insert or update of is_featured_of_month on public.professionals
  for each row execute function public.enforce_featured_of_month_limit();

-- Sin lector ni escritor desde ahora: FeaturedOfMonthBanner pasa a leer
-- professionals.is_featured_of_month directo (getFeaturedProfessionalsOfMonth) en vez de
-- llamar esta RPC.
drop function if exists public.get_featured_professional_of_month();
