-- Reemplaza las constantes hardcodeadas PROVINCIAS / CIUDADES_POR_PROVINCIA
-- (features/professionals/constants.ts) por dos tablas de referencia,
-- alimentadas con datos oficiales (ver migración siguiente). Lectura
-- pública para todos (buscador de pacientes + formularios de
-- admin/profesional); sin escritura desde la app, se cargan solo por
-- migración.
--
-- `provinces.id` usa el nombre de la provincia como clave (en vez de un
-- código numérico) para que coincida exactamente con los valores ya
-- guardados en professionals.province ("CABA", "Santa Fe", etc.) y se
-- pueda agregar un FK real sin migrar esos datos de nuevo.

create table public.provinces (
  id text primary key,
  created_at timestamptz not null default now()
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  province_id text not null references public.provinces (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (province_id, name)
);

alter table public.provinces enable row level security;
alter table public.cities enable row level security;

create policy "provinces_select_public"
  on public.provinces
  for select
  to anon, authenticated
  using (true);

create policy "cities_select_public"
  on public.cities
  for select
  to anon, authenticated
  using (true);

-- El FK de professionals.province -> provinces.id se agrega en la migración
-- siguiente (seed_provinces_and_cities_data), después de insertar las 24
-- provincias: si se agregara acá, con la tabla todavía vacía, la validación
-- del constraint fallaría contra los valores ya cargados en professionals
-- (ej. "Santa Fe").
