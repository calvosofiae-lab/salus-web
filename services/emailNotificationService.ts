"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { getServerSession } from "@/features/auth/services/sessionService";
import { getAppointmentByIdInternal } from "@/repositories/appointmentsRepository";
import { getProfessionalByIdAdmin } from "@/repositories/professionalsRepository";
import type { Appointment } from "@/features/appointments/types";
import type { Professional } from "@/features/professionals/types";
import {
  createPendingEmailNotification,
  markEmailNotificationSent,
  markEmailNotificationFailed,
  type EmailRecipientType,
  type EmailNotificationType,
} from "@/repositories/emailNotificationsRepository";
import { formatLongDate } from "@/features/appointments/lib/date";
import {
  buildPatientConfirmationEmail,
  buildProfessionalConfirmationEmail,
  buildPatientCreatedByProfessionalEmail,
  buildPatientRescheduledEmail,
  buildPatientCancelledEmail,
  buildPatientSurveyEmail,
  type EmailMessage,
  type ProfessionalContact,
} from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/resendClient";
import { buildWhatsappLink } from "@/lib/whatsapp";

// Mensaje prellenado del link de wa.me: da contexto sin obligar al paciente a escribirlo.
const WHATSAPP_CONTACT_MESSAGE = "Hola, te escribo por mi turno en SALUS";

// Server Action: no hay `window` para armar el link absoluto de la encuesta (a diferencia del
// mismo link armado client-side en AppointmentListItem.tsx para el envío manual por WhatsApp).
// Mismo fallback que app/layout.tsx.
function getSiteUrl(): string {
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
}

// create_appointment_as_professional no deja crear más de 52 turnos de una (20260905010000).
// El mismo tope acá evita que una llamada armada a mano pida notificar una lista enorme.
const MAX_APPOINTMENTS_PER_CALL = 52;

interface AttemptSendInput {
  appointmentId: string;
  recipientType: EmailRecipientType;
  recipientEmail: string | null;
  notificationType: EmailNotificationType;
  eventKey?: string;
  message: EmailMessage;
}

// Nunca lanza: un fallo acá no debe poder afectar la operación sobre el turno, que ya quedó
// hecha en la base antes de que esta función se llame. Los errores quedan registrados en
// email_notifications (status='failed') y en consola.
async function attemptSend(
  admin: SupabaseClient<Database>,
  input: AttemptSendInput,
): Promise<void> {
  if (!input.recipientEmail) return; // turnos viejos sin email, o profesional sin cuenta de auth

  const pending = await createPendingEmailNotification(admin, {
    appointmentId: input.appointmentId,
    recipientType: input.recipientType,
    recipientEmail: input.recipientEmail,
    notificationType: input.notificationType,
    eventKey: input.eventKey,
  });
  if (!pending) return; // ya se había procesado esta notificación (idempotencia)

  try {
    const { providerMessageId } = await sendTransactionalEmail({
      to: input.recipientEmail,
      subject: input.message.subject,
      html: input.message.html,
    });
    await markEmailNotificationSent(admin, pending.id, providerMessageId);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await markEmailNotificationFailed(admin, pending.id, errorMessage);
    console.error(
      `emailNotificationService: fallo al enviar ${input.notificationType} (${input.recipientType}) del turno ${input.appointmentId}: ${errorMessage}`,
    );
  }
}

function timeLabelOf(startTime: string): string {
  return startTime.slice(0, 5);
}

// El profesional no tiene columna de email propia: su email es el de su cuenta de auth,
// vinculada por profile_id. Si todavía no completó el alta de cuenta (profile_id null), no hay
// a quién mandarle -- attemptSend lo salta.
async function resolveProfessionalEmail(
  admin: SupabaseClient<Database>,
  professional: Professional,
): Promise<string | null> {
  if (!professional.profile_id) return null;
  const { data } = await admin.auth.admin.getUserById(professional.profile_id);
  return data.user?.email ?? null;
}

// Datos de contacto para que el paciente pueda escribirle al profesional directamente desde
// el mail, sin tener que volver al sitio.
async function resolveProfessionalContact(
  admin: SupabaseClient<Database>,
  professional: Professional,
): Promise<ProfessionalContact> {
  return {
    email: await resolveProfessionalEmail(admin, professional),
    whatsappLink: professional.whatsapp
      ? buildWhatsappLink(professional.whatsapp, professional.whatsapp_country, WHATSAPP_CONTACT_MESSAGE)
      : null,
  };
}

// ---------------------------------------------------------------------------------------
// Reserva pública (el paciente reserva desde el perfil del profesional)
// ---------------------------------------------------------------------------------------

// Se llama después de que book_appointment ya confirmó la reserva (ver
// features/appointments/hooks/useBookAppointment.ts). El turno ya existe: acá solo se intenta
// notificar, nunca se decide si la reserva es válida.
//
// A diferencia de las acciones de más abajo, esta no puede exigir sesión: el flujo de reserva
// es público y anónimo por diseño (EPIC 5). Lo que la protege de servir como disparador de
// mails a pedido es la idempotencia -- existe como mucho una notificación
// appointment_confirmation por turno y destinatario, así que reenviar el mismo id no vuelve a
// mandar nada.
export async function notifyAppointmentBookedByEmail(appointmentId: string): Promise<void> {
  const admin = createAdminClient();

  const appointment = await getAppointmentByIdInternal(admin, appointmentId);
  if (!appointment) {
    console.error(`notifyAppointmentBookedByEmail: turno ${appointmentId} no encontrado.`);
    return;
  }

  const professional = await getProfessionalByIdAdmin(admin, appointment.professional_id);
  if (!professional) {
    console.error(
      `notifyAppointmentBookedByEmail: profesional ${appointment.professional_id} no encontrado.`,
    );
    return;
  }

  const dateLabel = formatLongDate(appointment.appointment_date);
  const timeLabel = timeLabelOf(appointment.start_time);
  const patientFullName =
    `${appointment.patient_first_name} ${appointment.patient_last_name}`.trim();
  const professionalContact = await resolveProfessionalContact(admin, professional);

  await attemptSend(admin, {
    appointmentId,
    recipientType: "patient",
    recipientEmail: appointment.patient_email,
    notificationType: "appointment_confirmation",
    message: buildPatientConfirmationEmail({
      patientFirstName: appointment.patient_first_name,
      professionalFullName: professional.full_name,
      dateLabel,
      timeLabel,
      professionalContact,
    }),
  });

  await attemptSend(admin, {
    appointmentId,
    recipientType: "professional",
    recipientEmail: professionalContact.email,
    notificationType: "appointment_confirmation",
    message: buildProfessionalConfirmationEmail({
      professionalFullName: professional.full_name,
      patientFullName,
      dateLabel,
      timeLabel,
    }),
  });
}

// ---------------------------------------------------------------------------------------
// Acciones del profesional sobre un turno existente
// ---------------------------------------------------------------------------------------

// Una Server Action es un endpoint POST público: cualquiera puede mandarle el id de turno que
// quiera. Estas tres mandan mail a partir de una acción autenticada, así que se revalida
// sesión y propiedad server-side en vez de confiar en que la UI solo se le muestra al dueño.
// Devuelve el turno + el profesional solo si el que llama puede operar sobre ese turno.
async function loadAuthorizedAppointment(
  admin: SupabaseClient<Database>,
  appointmentId: string,
  context: string,
): Promise<{ appointment: Appointment; professional: Professional } | null> {
  const session = await getServerSession();
  if (!session) {
    console.error(`${context}: llamada sin sesión, se ignora.`);
    return null;
  }

  const appointment = await getAppointmentByIdInternal(admin, appointmentId);
  if (!appointment) {
    console.error(`${context}: turno ${appointmentId} no encontrado.`);
    return null;
  }

  const professional = await getProfessionalByIdAdmin(admin, appointment.professional_id);
  if (!professional) {
    console.error(`${context}: profesional ${appointment.professional_id} no encontrado.`);
    return null;
  }

  const isOwner = professional.profile_id === session.user.id;
  if (session.role !== "admin" && !isOwner) {
    console.error(
      `${context}: ${session.user.id} no puede operar sobre el turno ${appointmentId}.`,
    );
    return null;
  }

  return { appointment, professional };
}

// Turno cargado por el profesional desde su agenda. Recibe la lista completa porque
// create_appointment_as_professional puede crear una serie repetida de una sola vez, y Next.js
// despacha las Server Actions de un cliente de a una: mandar N llamadas sueltas las pondría en
// fila una atrás de la otra (ver node_modules/next/dist/docs/01-app/02-guides/server-actions.md,
// "Sequential dispatch on the client").
export async function notifyAppointmentsCreatedByProfessionalEmail(
  appointmentIds: string[],
): Promise<void> {
  const context = "notifyAppointmentsCreatedByProfessionalEmail";
  const admin = createAdminClient();

  for (const appointmentId of appointmentIds.slice(0, MAX_APPOINTMENTS_PER_CALL)) {
    const authorized = await loadAuthorizedAppointment(admin, appointmentId, context);
    if (!authorized) continue;
    const { appointment, professional } = authorized;

    await attemptSend(admin, {
      appointmentId,
      recipientType: "patient",
      recipientEmail: appointment.patient_email,
      notificationType: "appointment_created_by_professional",
      message: buildPatientCreatedByProfessionalEmail({
        patientFirstName: appointment.patient_first_name,
        professionalFullName: professional.full_name,
        dateLabel: formatLongDate(appointment.appointment_date),
        timeLabel: timeLabelOf(appointment.start_time),
        professionalContact: await resolveProfessionalContact(admin, professional),
      }),
    });
  }
}

// Se llama después de reschedule_appointment, así que el turno ya tiene la fecha/hora nueva.
// La anterior no queda registrada en ninguna parte, por eso la manda el cliente: es solo texto
// del mail ("pasó del X al Y"), no decide nada ni toca la base.
export async function notifyAppointmentRescheduledEmail(
  appointmentId: string,
  previousDate: string,
  previousStartTime: string,
): Promise<void> {
  const context = "notifyAppointmentRescheduledEmail";
  const admin = createAdminClient();

  const authorized = await loadAuthorizedAppointment(admin, appointmentId, context);
  if (!authorized) return;
  const { appointment, professional } = authorized;

  await attemptSend(admin, {
    appointmentId,
    recipientType: "patient",
    recipientEmail: appointment.patient_email,
    notificationType: "appointment_rescheduled",
    // Un turno se puede reprogramar muchas veces y cada una merece su mail: el destino es lo
    // que distingue una reprogramación de la siguiente (ver migración 20260921000000).
    eventKey: `${appointment.appointment_date}T${timeLabelOf(appointment.start_time)}`,
    message: buildPatientRescheduledEmail({
      patientFirstName: appointment.patient_first_name,
      professionalFullName: professional.full_name,
      previousDateLabel: formatLongDate(previousDate),
      previousTimeLabel: timeLabelOf(previousStartTime),
      dateLabel: formatLongDate(appointment.appointment_date),
      timeLabel: timeLabelOf(appointment.start_time),
      professionalContact: await resolveProfessionalContact(admin, professional),
    }),
  });
}

// Se llama después de que el status ya pasó a 'cancelado'. Se revalida contra la base en vez
// de confiar en el estado que dice el cliente: un turno que no quedó cancelado no genera mail.
export async function notifyAppointmentCancelledEmail(appointmentId: string): Promise<void> {
  const context = "notifyAppointmentCancelledEmail";
  const admin = createAdminClient();

  const authorized = await loadAuthorizedAppointment(admin, appointmentId, context);
  if (!authorized) return;
  const { appointment, professional } = authorized;

  if (appointment.status !== "cancelado") {
    console.error(
      `${context}: el turno ${appointmentId} no está cancelado (${appointment.status}).`,
    );
    return;
  }

  await attemptSend(admin, {
    appointmentId,
    recipientType: "patient",
    recipientEmail: appointment.patient_email,
    notificationType: "appointment_cancelled",
    message: buildPatientCancelledEmail({
      patientFirstName: appointment.patient_first_name,
      professionalFullName: professional.full_name,
      dateLabel: formatLongDate(appointment.appointment_date),
      timeLabel: timeLabelOf(appointment.start_time),
      professionalProfileLink: `${getSiteUrl()}/profesionales/${professional.id}`,
      professionalContact: await resolveProfessionalContact(admin, professional),
    }),
  });
}

// Se llama después de marcar el turno como "realizado" (generate_rating_token ya le asignó
// el rating_token en ese update, 20260731090002). Reemplaza al envío manual por WhatsApp para
// quien prefiera que salga solo, sin sacarle a AppointmentListItem el botón existente.
export async function notifyAppointmentSurveyEmail(appointmentId: string): Promise<void> {
  const context = "notifyAppointmentSurveyEmail";
  const admin = createAdminClient();

  const authorized = await loadAuthorizedAppointment(admin, appointmentId, context);
  if (!authorized) return;
  const { appointment, professional } = authorized;

  if (appointment.status !== "realizado" || !appointment.rating_token) {
    console.error(
      `${context}: el turno ${appointmentId} no está realizado o no tiene rating_token.`,
    );
    return;
  }

  await attemptSend(admin, {
    appointmentId,
    recipientType: "patient",
    recipientEmail: appointment.patient_email,
    notificationType: "appointment_survey",
    message: buildPatientSurveyEmail({
      patientFirstName: appointment.patient_first_name,
      professionalFullName: professional.full_name,
      surveyLink: `${getSiteUrl()}/valoracion/${appointment.rating_token}`,
      professionalContact: await resolveProfessionalContact(admin, professional),
    }),
  });
}
