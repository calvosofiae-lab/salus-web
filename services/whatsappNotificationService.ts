"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { getAppointmentByIdInternal } from "@/repositories/appointmentsRepository";
import { getProfessionalByIdAdmin } from "@/repositories/professionalsRepository";
import {
  createPendingNotification,
  markNotificationSent,
  markNotificationFailed,
  type WhatsAppRecipientType,
} from "@/repositories/whatsappNotificationsRepository";
import { formatLongDate } from "@/features/appointments/lib/date";
import { toWhatsAppE164, formatPhoneForDisplay } from "@/lib/whatsapp/phone";
import {
  buildPatientConfirmationMessage,
  buildProfessionalConfirmationMessage,
  type TemplateMessage,
} from "@/lib/whatsapp/templates";
import { sendWhatsAppTemplateMessage } from "@/lib/whatsapp/cloudApiClient";

const APPOINTMENT_CONFIRMATION = "appointment_confirmation";

// Nunca lanza: un fallo acá no debe poder afectar la reserva, que ya está
// confirmada en la base antes de que esta función se llame. Los errores quedan
// registrados en whatsapp_notifications (status='failed') y en consola.
async function attemptSend(
  admin: SupabaseClient<Database>,
  appointmentId: string,
  recipientType: WhatsAppRecipientType,
  rawPhone: string | null,
  countryCode: string,
  message: TemplateMessage,
): Promise<void> {
  if (!rawPhone) return; // el profesional puede no tener whatsapp cargado

  const pending = await createPendingNotification(admin, {
    appointmentId,
    recipientType,
    recipientPhone: rawPhone,
    notificationType: APPOINTMENT_CONFIRMATION,
    templateName: message.templateName,
  });
  if (!pending) return; // ya se había procesado esta notificación (idempotencia)

  try {
    const to = toWhatsAppE164(rawPhone, countryCode);
    const { providerMessageId } = await sendWhatsAppTemplateMessage({
      to,
      templateName: message.templateName,
      languageCode: message.languageCode,
      bodyParams: message.bodyParams,
    });
    await markNotificationSent(admin, pending.id, providerMessageId);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await markNotificationFailed(admin, pending.id, errorMessage);
    console.error(
      `notifyAppointmentBooked: fallo al enviar WhatsApp (${recipientType}) del turno ${appointmentId}: ${errorMessage}`,
    );
  }
}

// Se llama después de que book_appointment ya confirmó la reserva (ver
// features/appointments/hooks/useBookAppointment.ts). El turno ya existe: acá solo
// se intenta notificar, nunca se decide si la reserva es válida.
export async function notifyAppointmentBooked(appointmentId: string): Promise<void> {
  const admin = createAdminClient();

  const appointment = await getAppointmentByIdInternal(admin, appointmentId);
  if (!appointment) {
    console.error(`notifyAppointmentBooked: turno ${appointmentId} no encontrado.`);
    return;
  }

  const professional = await getProfessionalByIdAdmin(admin, appointment.professional_id);
  if (!professional) {
    console.error(`notifyAppointmentBooked: profesional ${appointment.professional_id} no encontrado.`);
    return;
  }

  const dateLabel = formatLongDate(appointment.appointment_date);
  const timeLabel = appointment.start_time.slice(0, 5);
  const patientFullName = `${appointment.patient_first_name} ${appointment.patient_last_name}`.trim();

  const patientPhoneDisplay = formatPhoneForDisplay(
    appointment.patient_whatsapp,
    appointment.patient_whatsapp_country,
  );
  // El profesional puede no tener whatsapp cargado en su perfil (campo opcional).
  const professionalPhoneDisplay = professional.whatsapp
    ? formatPhoneForDisplay(professional.whatsapp, professional.whatsapp_country)
    : null;

  await attemptSend(
    admin,
    appointmentId,
    "patient",
    appointment.patient_whatsapp,
    appointment.patient_whatsapp_country,
    buildPatientConfirmationMessage({
      patientFirstName: appointment.patient_first_name,
      professionalFullName: professional.full_name,
      dateLabel,
      timeLabel,
      professionalPhoneDisplay,
    }),
  );

  await attemptSend(
    admin,
    appointmentId,
    "professional",
    professional.whatsapp,
    professional.whatsapp_country,
    buildProfessionalConfirmationMessage({
      professionalFullName: professional.full_name,
      patientFullName,
      dateLabel,
      timeLabel,
      patientPhoneDisplay,
    }),
  );
}
