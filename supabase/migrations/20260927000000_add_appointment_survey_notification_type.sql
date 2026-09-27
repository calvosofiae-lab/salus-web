-- Agrega 'appointment_survey': mail automático al paciente cuando el profesional marca el
-- turno como "realizado" (generate_rating_token ya le asigna el rating_token en ese momento,
-- 20260731090002), pidiéndole que complete la encuesta de satisfacción en /valoracion/{token}.
-- Hasta ahora ese aviso solo existía manual, por WhatsApp (botón "Enviar encuesta" en
-- AppointmentListItem.tsx).
--
-- Va sin event_key: al igual que appointment_cancelled, "realizado" es terminal para este
-- propósito -- reviewed pasa a true apenas se califica y no hay forma de volver a generar
-- un rating_token nuevo para el mismo turno, así que el dedupe por (appointment_id,
-- recipient_type, notification_type) alcanza.

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
    'appointment_survey'
  ));
