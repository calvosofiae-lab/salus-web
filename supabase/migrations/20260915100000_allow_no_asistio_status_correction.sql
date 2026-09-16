-- Pedido del usuario 2026-09-15: una profesional marcó por error un turno como 'no_asistio'
-- antes de que pasara la fecha, y el trigger de 20260815020000 (bloquea cualquier cambio de
-- estado una vez terminal) no la dejaba corregirlo -- ni siquiera volver a 'reservado'.
--
-- Se relaja el trigger solo para el caso 'no_asistio' -> ('reservado' | 'cancelado'), que es una
-- corrección del estado, no una reversión real del historial clínico/operativo (a diferencia de
-- deshacer un 'cancelado' o un 'realizado', que sí siguen bloqueados). El resto de las
-- transiciones terminales ('cancelado' y 'realizado') no cambian.

create or replace function public.prevent_status_change_from_terminal()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'no_asistio' and new.status in ('reservado', 'cancelado') then
    return new;
  end if;

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
