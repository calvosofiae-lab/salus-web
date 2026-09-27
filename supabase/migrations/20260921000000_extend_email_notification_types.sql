-- Extiende las notificaciones por email más allá de la reserva pública (20260812010000), que
-- era el único flujo que existía cuando se escribió esa migración. Desde entonces se sumaron
-- tres caminos por los que el turno de un paciente cambia sin que él lo haya pedido, y en
-- todos conviene avisarle por mail:
--
--   appointment_created_by_professional -- el profesional le carga el turno desde su agenda
--                                          (create_appointment_as_professional, 20260905010000),
--                                          incluida la serie de turnos repetidos
--   appointment_rescheduled             -- se le cambia fecha/hora (reschedule_appointment)
--   appointment_cancelled               -- se cancela el turno
--
-- Estos tres van solo al paciente: el profesional es quien dispara la acción, no necesita que
-- le avisemos de algo que acaba de hacer él mismo. La fila igual guarda recipient_type para
-- no tener que adivinarlo al leer la tabla.
--
-- ---------------------------------------------------------------------------------------
-- Por qué aparece event_key
--
-- El unique (appointment_id, recipient_type, notification_type) original alcanzaba cuando
-- cada tipo ocurría una sola vez por turno. Con las reprogramaciones deja de alcanzar: un
-- mismo turno se puede reprogramar varias veces y cada vez hay que mandar un mail nuevo, pero
-- el unique bloquearía el segundo insert y el paciente se quedaría sin enterarse.
--
-- event_key desambigua la ocurrencia dentro del mismo tipo. Para appointment_rescheduled se
-- usa la fecha+hora destino ('2026-10-02T15:30'), así que:
--   - reprogramar a un horario distinto  -> event_key distinto  -> mail nuevo
--   - reintentar la misma reprogramación -> mismo event_key     -> dedupe (correcto: nada cambió)
-- El resto de los tipos deja event_key en null y se comporta igual que antes.
--
-- 'appointment_cancelled' no necesita event_key: el trigger de 20260815020000/20260915100000
-- deja 'cancelado' como estado terminal, así que un turno se puede cancelar una sola vez.
-- ---------------------------------------------------------------------------------------

-- Los dos constraints que se reemplazan abajo quedaron con el nombre que les puso Postgres al
-- crear la tabla. En vez de hardcodear esos nombres (el del unique llega al límite de 63
-- caracteres y queda truncado a mitad de palabra), se los busca en el catálogo por la columna
-- que tocan, que es lo que realmente los identifica.
do $$
declare
  v_name text;
begin
  select conname into v_name
  from pg_constraint
  where conrelid = 'public.email_notifications'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%notification_type%';

  if v_name is null then
    raise exception 'No se encontró el check de notification_type en email_notifications.';
  end if;

  execute format('alter table public.email_notifications drop constraint %I', v_name);
end;
$$;

alter table public.email_notifications
  add constraint email_notifications_notification_type_check
  check (notification_type in (
    'appointment_confirmation',
    'appointment_created_by_professional',
    'appointment_rescheduled',
    'appointment_cancelled'
  ));

alter table public.email_notifications
  add column event_key text;

-- El reemplazo tiene que ser un índice y no una constraint porque incluye una expresión:
-- coalesce(event_key, '') hace que las filas con event_key null sigan deduplicándose entre sí
-- (en un unique común, null != null y no deduplicarían nada).
do $$
declare
  v_name text;
begin
  select conname into v_name
  from pg_constraint
  where conrelid = 'public.email_notifications'::regclass
    and contype = 'u'
    and pg_get_constraintdef(oid) like '%appointment_id%recipient_type%notification_type%';

  if v_name is null then
    raise exception 'No se encontró el unique de idempotencia en email_notifications.';
  end if;

  execute format('alter table public.email_notifications drop constraint %I', v_name);
end;
$$;

create unique index email_notifications_dedupe_key
  on public.email_notifications (
    appointment_id,
    recipient_type,
    notification_type,
    (coalesce(event_key, ''))
  );
