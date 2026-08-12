-- Notificaciones de WhatsApp al confirmarse una reserva (paciente + profesional).
--
-- No se envía nada desde el frontend ni desde una policy: el único escritor es el
-- flujo interno server-side (services/whatsappNotificationService.ts) usando el
-- cliente admin (service role), que bypassa RLS. Por eso esta tabla no tiene
-- policies de insert/update/delete para authenticated/anon: ni un profesional ni
-- un admin pueden alterar manualmente el estado de un envío.
--
-- notification_type queda como text + check en lugar de enum porque es el campo
-- con más chances de crecer (recordatorios, cancelaciones, etc. a futuro) y los
-- enums de Postgres son incómodos de extender (ALTER TYPE ... ADD VALUE no puede
-- correr dentro de una transacción). recipient_type y status sí son enum porque
-- son cerrados y estables, igual que appointment_status.
--
-- El unique (appointment_id, recipient_type, notification_type) es la garantía de
-- idempotencia: como máximo una fila por turno+destinatario+tipo de notificación.

create type public.whatsapp_recipient_type as enum ('patient', 'professional');
create type public.whatsapp_notification_status as enum ('pending', 'sent', 'failed');

create table public.whatsapp_notifications (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  recipient_type public.whatsapp_recipient_type not null,
  recipient_phone text not null,
  notification_type text not null check (notification_type in ('appointment_confirmation')),
  template_name text not null,
  status public.whatsapp_notification_status not null default 'pending',
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (appointment_id, recipient_type, notification_type)
);

alter table public.whatsapp_notifications enable row level security;

create policy "whatsapp_notifications_select_own"
  on public.whatsapp_notifications
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.appointments a
      where a.id = whatsapp_notifications.appointment_id
        and public.owns_professional(a.professional_id)
    )
  );
