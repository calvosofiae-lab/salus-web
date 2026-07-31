-- E6-2: Genera el rating_token cuando un turno pasa a "realizado"
-- (docs/backlog/06-calificaciones.md)
--
-- Solo la primera vez que llega a "realizado" (no pisa un token ya generado).
-- Cancelado/no_asistio nunca generan token. No necesita SECURITY DEFINER: se
-- ejecuta como parte del UPDATE que ya hace el profesional/admin dueño del
-- turno (permitido por appointments_update_own_status, E5-1).

create function public.generate_rating_token()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'realizado'
     and old.status is distinct from 'realizado'
     and new.rating_token is null then
    new.rating_token := gen_random_uuid();
  end if;
  return new;
end;
$$;

create trigger trg_generate_rating_token
  before update on public.appointments
  for each row execute function public.generate_rating_token();
