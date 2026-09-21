-- Propuesta alternativa de agenda: bloqueo de horarios puntuales por fecha, sin recurrencia
-- (decisión del usuario 2026-08-14: cada bloqueo es por día suelto, sin patrón semanal). Es
-- el único mecanismo de bloqueo de horarios individuales de esta propuesta -- lo consume el
-- calendario de colores rojo/verde/amarillo en /profesional/disponibilidad.
--
-- Simplemente "existe una fila" = ese horario está bloqueado esa fecha. Sin columna `action`
-- (a diferencia de availability_date_slot_overrides en feature/agenda-disponibilidad-v2): acá
-- no hay bloqueos recurrentes que "desbloquear", así que no hace falta esa distinción.

create table public.availability_date_blocks (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals (id) on delete cascade,
  date date not null,
  start_time time not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (professional_id, date, start_time)
);

alter table public.availability_date_blocks enable row level security;

create policy "availability_date_blocks_owner_full_access"
  on public.availability_date_blocks
  for all
  to authenticated
  using (public.owns_professional(professional_id) or public.is_admin())
  with check (public.owns_professional(professional_id) or public.is_admin());
