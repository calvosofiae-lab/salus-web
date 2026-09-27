-- Notificaciones por email al confirmarse una reserva (paciente + profesional), análogo al
-- diseño de whatsapp_notifications (rama feature/whatsapp-notifications, todavía sin mergear
-- a la espera del número oficial de WhatsApp de SALUS). El envío real usa Resend.
--
-- El único escritor es el flujo interno server-side (services/emailNotificationService.ts)
-- con el cliente admin (service role), que bypassa RLS -- por eso no hay policies de
-- insert/update/delete para authenticated/anon: nadie puede alterar manualmente el estado
-- de un envío.
--
-- notification_type queda como text + check (no enum) por lo mismo que en
-- whatsapp_notifications: es el campo con más chances de crecer (recordatorios,
-- cancelaciones, etc.) y los enums de Postgres son incómodos de extender.
--
-- El unique (appointment_id, recipient_type, notification_type) es la garantía de
-- idempotencia: como máximo una fila por turno+destinatario+tipo de notificación.

create type public.email_recipient_type as enum ('patient', 'professional');
create type public.email_notification_status as enum ('pending', 'sent', 'failed');

create table public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  recipient_type public.email_recipient_type not null,
  recipient_email text not null,
  notification_type text not null check (notification_type in ('appointment_confirmation')),
  status public.email_notification_status not null default 'pending',
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (appointment_id, recipient_type, notification_type)
);

alter table public.email_notifications enable row level security;

create policy "email_notifications_select_own"
  on public.email_notifications
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.appointments a
      where a.id = email_notifications.appointment_id
        and public.owns_professional(a.professional_id)
    )
  );
