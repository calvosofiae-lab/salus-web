-- Agrega 'appointment_reminder': mail automático al paciente el día anterior a su turno, para
-- bajar olvidos y ausencias. A diferencia del resto de las notificaciones no lo dispara una
-- acción de nadie sino un cron diario (app/api/cron/appointment-reminders/route.ts).
--
-- Usa event_key con la fecha+hora del turno ('2026-10-16T15:30'), igual que
-- appointment_rescheduled:
--   - si el cron corre dos veces el mismo día      -> mismo event_key -> dedupe
--   - si el turno se reprograma a otro día después
--     de haber recibido el recordatorio             -> event_key nuevo -> otro recordatorio
--                                                      la víspera de la fecha nueva

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
    'appointment_cancelled',
    'appointment_survey',
    'appointment_reminder'
  ));
