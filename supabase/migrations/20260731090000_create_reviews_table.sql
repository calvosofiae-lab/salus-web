-- E6-1: Modelo de reviews (docs/backlog/06-calificaciones.md)
--
-- appointment_id único: un turno solo puede calificarse una vez. Lectura
-- pública (testimonios en la landing / perfil); sin política de insert para
-- nadie -- la única forma de insertar es la RPC submit_review (E6-3),
-- SECURITY DEFINER, que valida el token antes de escribir.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  professional_id uuid not null references public.professionals (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "reviews_select_public"
  on public.reviews
  for select
  to anon, authenticated
  using (true);
