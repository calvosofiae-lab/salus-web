-- E2-1: Funciones helper de rol, reutilizables en políticas RLS y desde el código
-- (docs/backlog/02-roles.md)
--
-- SECURITY DEFINER + search_path fijo para evitar hijacking y para que puedan
-- leer profiles/professionals sin depender de qué políticas RLS existan en
-- ese momento sobre esas tablas.

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create function public.owns_professional(p_professional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.professionals
    where id = p_professional_id and profile_id = auth.uid()
  );
$$;
