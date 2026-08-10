-- Convierte availability_blocks de un solo día (blocked_date) a un rango [start_date,
-- end_date]. Un rango de 1 día (start_date = end_date) sigue siendo válido, así que bloquear
-- un solo día no cambia de flujo para quien lo usa -- solo se puede además elegir un "hasta".

alter table public.availability_blocks rename column blocked_date to start_date;
alter table public.availability_blocks add column end_date date;
update public.availability_blocks set end_date = start_date where end_date is null;
alter table public.availability_blocks alter column end_date set not null;

alter table public.availability_blocks
  add constraint availability_blocks_end_after_start_check check (end_date >= start_date);

-- La unicidad por (professional_id, blocked_date) ya no representa la regla que hace falta:
-- dos rangos que se pisan tienen que rechazarse aunque no arranquen el mismo día. La
-- reemplaza el trigger de abajo -- mismo patrón que prevent_overlapping_availability_rules
-- (trigger en vez de `exclude using gist` para no depender de la extensión btree_gist).
alter table public.availability_blocks
  drop constraint if exists availability_blocks_professional_id_blocked_date_key;

create function public.prevent_overlapping_availability_blocks()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.availability_blocks ab
    where ab.professional_id = new.professional_id
      and ab.id is distinct from new.id
      and new.start_date <= ab.end_date
      and new.end_date >= ab.start_date
  ) then
    raise exception 'Ese rango se superpone con un bloqueo que ya tenés cargado.';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_overlapping_availability_blocks
  before insert or update on public.availability_blocks
  for each row execute function public.prevent_overlapping_availability_blocks();

-- get_available_slots: un día bloqueado ahora es "cae dentro de algún rango [start_date,
-- end_date]" en vez de la igualdad anterior contra blocked_date.
create or replace function public.get_available_slots(p_professional_id uuid, p_date date)
returns table (start_time time)
language sql
stable
security definer
set search_path = public
as $$
  with day_rules as (
    select ar.start_time, ar.end_time
    from public.availability_rules ar
    where ar.professional_id = p_professional_id
      and ar.day_of_week = extract(dow from p_date)::smallint
  ),
  is_blocked as (
    select exists (
      select 1 from public.availability_blocks ab
      where ab.professional_id = p_professional_id
        and p_date between ab.start_date and ab.end_date
    ) as blocked
  ),
  slots as (
    select (dr.start_time + (n || ' hour')::interval)::time as start_time
    from day_rules dr,
      lateral generate_series(
        0,
        (extract(epoch from (dr.end_time - dr.start_time)) / 3600)::int - 1
      ) as n
  ),
  booked as (
    select a.start_time
    from public.appointments a
    where a.professional_id = p_professional_id
      and a.appointment_date = p_date
      and a.status in ('reservado', 'realizado')
  )
  select distinct s.start_time
  from slots s
  where not (select blocked from is_blocked)
    and p_date >= current_date
    and (p_date > current_date or s.start_time > current_time)
    and s.start_time not in (select start_time from booked)
  order by s.start_time;
$$;
