-- E4-2: Bloqueo de fechas específicas (docs/backlog/04-agenda-profesional.md)

create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals (id) on delete cascade,
  blocked_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (professional_id, blocked_date)
);

alter table public.availability_blocks enable row level security;

create policy "availability_blocks_owner_full_access"
  on public.availability_blocks
  for all
  to authenticated
  using (public.owns_professional(professional_id) or public.is_admin())
  with check (public.owns_professional(professional_id) or public.is_admin());
