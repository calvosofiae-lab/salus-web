-- Pedido explícito del usuario 2026-08-15: una vez que un turno pasa a 'cancelado',
-- 'realizado' o 'no_asistio', su estado queda fijo -- no se puede volver a cambiar (ni siquiera
-- a 'reservado'). Antes cualquier cambio de estado era un update directo sin validar el estado
-- anterior.
--
-- Se aplica a nivel de trigger (no solo en la UI) para que valga sin importar el camino del
-- update, igual que el trigger de rating_token (20260731090002) con el que convive en la misma
-- tabla. No bloquea otros updates sobre un turno ya terminal que no cambian el status (ej.
-- submit_review marcando reviewed = true sobre un turno 'realizado'), solo un NEW.status
-- distinto al OLD.status cuando el OLD.status ya era terminal.

create function public.prevent_status_change_from_terminal()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('cancelado', 'realizado', 'no_asistio')
     and new.status is distinct from old.status then
    raise exception 'No se puede cambiar el estado de un turno % (%).', old.status,
      case old.status
        when 'cancelado' then 'ya fue cancelado'
        when 'realizado' then 'ya fue marcado como realizado'
        else 'ya fue marcado como no asistió'
      end;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_status_change_from_terminal
  before update on public.appointments
  for each row execute function public.prevent_status_change_from_terminal();
