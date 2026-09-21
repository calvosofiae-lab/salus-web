-- Buscador por nombre insensible a tildes: "Sofia" y "Sofía" deben traer los mismos
-- resultados. unaccent() de por sí es STABLE (depende del search_path), lo que impide
-- usarla en una columna generada; se envuelve en una función IMMUTABLE que fija el
-- diccionario explícitamente (receta estándar de Postgres para este caso).
create extension if not exists unaccent;

create or replace function public.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
as $$
  select public.unaccent('public.unaccent', $1)
$$;

alter table public.professionals
  add column full_name_normalized text
  generated always as (lower(public.immutable_unaccent(full_name))) stored;

-- gin_trgm_ops en vez de un índice de prefijo porque la búsqueda es "contains" (%term%),
-- no solo "empieza con".
create extension if not exists pg_trgm;

create index idx_professionals_full_name_normalized
  on public.professionals using gin (full_name_normalized gin_trgm_ops);
