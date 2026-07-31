-- E4-1: Disponibilidad semanal del profesional (docs/backlog/04-agenda-profesional.md)
--
-- day_of_week: 0=domingo .. 6=sábado (convención de JS Date.getDay()).
-- Lectura pública NO habilitada acá a propósito: el cálculo de slots libres
-- (E4-3) se hace vía RPC SECURITY DEFINER, que no depende de RLS para leer estas
-- tablas. Solo el dueño y el admin acceden directo.

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table public.availability_rules enable row level security;

create policy "availability_rules_owner_full_access"
  on public.availability_rules
  for all
  to authenticated
  using (public.owns_professional(professional_id) or public.is_admin())
  with check (public.owns_professional(professional_id) or public.is_admin());
