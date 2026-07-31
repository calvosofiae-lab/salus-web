-- E5-1: Modelo de turnos (docs/backlog/05-reserva-turnos.md)
--
-- Constraint único (professional_id, appointment_date, start_time) como primera
-- barrera anti doble-reserva a nivel de base de datos (la RPC book_appointment de
-- E5-4 agrega la verificación transaccional completa).
--
-- Sin política de SELECT/INSERT pública: la reserva (insert) pasa por la RPC
-- book_appointment (E5-4, SECURITY DEFINER). El cambio de estado sí se hace con
-- update directo (con RLS acotada al dueño/admin): el trigger que genera el
-- rating_token (E6-2) se dispara igual sin importar el camino del update.

create type public.appointment_status as enum (
  'reservado',
  'realizado',
  'cancelado',
  'no_asistio'
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals (id) on delete cascade,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status public.appointment_status not null default 'reservado',
  patient_first_name text not null,
  patient_last_name text not null,
  patient_whatsapp text not null,
  rating_token uuid unique,
  reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (professional_id, appointment_date, start_time)
);

alter table public.appointments enable row level security;

create policy "appointments_select_own"
  on public.appointments
  for select
  to authenticated
  using (public.owns_professional(professional_id) or public.is_admin());

create policy "appointments_update_own_status"
  on public.appointments
  for update
  to authenticated
  using (public.owns_professional(professional_id) or public.is_admin())
  with check (public.owns_professional(professional_id) or public.is_admin());
