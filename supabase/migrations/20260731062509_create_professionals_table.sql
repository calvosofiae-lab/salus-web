-- E0-4: Crear tabla nueva `professionals` (docs/backlog/00-fundamentos.md)
--
-- Esquema limpio, en paralelo a la tabla legacy `profesionales`. Esta migración
-- NO toca `profesionales` de ninguna forma (ni lectura, ni escritura, ni referencias).
-- La migración de datos legacy -> professionals es la siguiente tarea (E0-5).
--
-- Habilita RLS desde el inicio con una política mínima de lectura pública de
-- profesionales activos (adelanto parcial de E7-2). Sin políticas de escritura
-- todavía: hasta que E3-2/E7-2 las agreguen, nadie puede insertar/editar/borrar
-- filas ni siquiera con la anon key.

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  full_name text not null,
  profession text not null,
  license_number text,
  gender text,
  description text,
  photo_url text,
  whatsapp text,
  coverage text[] not null default '{}',
  modality text[] not null default '{}',
  consultation_reasons text[] not null default '{}',
  location text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  average_rating numeric,
  created_at timestamptz not null default now()
);

alter table public.professionals enable row level security;

create policy "professionals_select_active_public"
  on public.professionals
  for select
  to anon, authenticated
  using (is_active = true);
