"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { getAppointmentByIdInternal } from "@/repositories/appointmentsRepository";
import { getProfessionalByIdAdmin } from "@/repositories/professionalsRepository";
import {
  createPendingEmailNotification,
  markEmailNotificationSent,
  markEmailNotificationFailed,
  type EmailRecipientType,
} from "@/repositories/emailNotificationsRepository";
import { formatLongDate } from "@/features/appointments/lib/date";
import {
  buildPatientConfirmationEmail,
  buildProfessionalConfirmationEmail,
  type EmailMessage,
} from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/resendClient";

const APPOINTMENT_CONFIRMATION = "appointment_confirmation";

// Nunca lanza: un fallo acá no debe poder afectar la reserva, que ya está confirmada en la
// base antes de que esta función se llame. Los errores quedan registrados en
// email_notifications (status='failed') y en consola.
async function attemptSend(
  admin: SupabaseClient<Database>,
  appointmentId: string,
  recipientType: EmailRecipientType,
  recipientEmail: string | null,
  message: EmailMessage,
): Promise<void> {
  if (!recipientEmail) return; // el profesional puede no tener cuenta de auth vinculada todavía

  const pending = await createPendingEmailNotification(admin, {
    appointmentId,
    recipientType,
    recipientEmail,
    notificationType: APPOINTMENT_CONFIRMATION,
  });
  if (!pending) return; // ya se había procesado esta notificación (idempotencia)

  try {
    const { providerMessageId } = await sendTransactionalEmail({
      to: recipientEmail,
      subject: message.subject,
      html: message.html,
    });
    await markEmailNotificationSent(admin, pending.id, providerMessageId);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await markEmailNotificationFailed(admin, pending.id, errorMessage);
    console.error(
      `notifyAppointmentBookedByEmail: fallo al enviar email (${recipientType}) del turno ${appointmentId}: ${errorMessage}`,
    );
  }
}

// Se llama después de que book_appointment ya confirmó la reserva (ver
// features/appointments/hooks/useBookAppointment.ts). El turno ya existe: acá solo se intenta
// notificar, nunca se decide si la reserva es válida.
export async function notifyAppointmentBookedByEmail(appointmentId: string): Promise<void> {
  const admin = createAdminClient();

  const appointment = await getAppointmentByIdInternal(admin, appointmentId);
  if (!appointment) {
    console.error(`notifyAppointmentBookedByEmail: turno ${appointmentId} no encontrado.`);
    return;
  }

  const professional = await getProfessionalByIdAdmin(admin, appointment.professional_id);
  if (!professional) {
    console.error(`notifyAppointmentBookedByEmail: profesional ${appointment.professional_id} no encontrado.`);
    return;
  }

  const dateLabel = formatLongDate(appointment.appointment_date);
  const timeLabel = appointment.start_time.slice(0, 5);
  const patientFullName = `${appointment.patient_first_name} ${appointment.patient_last_name}`.trim();

  // El profesional no tiene columna de email propia (professionals no la tiene): su email es
  // el de su cuenta de auth, vinculada por profile_id. Si todavía no completó el alta de
  // cuenta (profile_id null), no hay a quién mandarle -- attemptSend lo salta.
  let professionalEmail: string | null = null;
  if (professional.profile_id) {
    const { data } = await admin.auth.admin.getUserById(professional.profile_id);
    professionalEmail = data.user?.email ?? null;
  }

  await attemptSend(
    admin,
    appointmentId,
    "patient",
    appointment.patient_email,
    buildPatientConfirmationEmail({
      patientFirstName: appointment.patient_first_name,
      professionalFullName: professional.full_name,
      dateLabel,
      timeLabel,
    }),
  );

  await attemptSend(
    admin,
    appointmentId,
    "professional",
    professionalEmail,
    buildProfessionalConfirmationEmail({
      professionalFullName: professional.full_name,
      patientFullName,
      dateLabel,
      timeLabel,
    }),
  );
}
