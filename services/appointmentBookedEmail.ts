import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Appointment } from "@/features/appointments/types";
import type { ContactInfo } from "@/lib/email/templates";
import {
  buildPatientConfirmationEmail,
  buildProfessionalConfirmationEmail,
} from "@/lib/email/templates";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { formatLongDate } from "@/features/appointments/lib/date";
import { getAppointmentByIdInternal } from "@/repositories/appointmentsRepository";
import { getProfessionalByIdAdmin } from "@/repositories/professionalsRepository";
import {
  attemptSend,
  resolveProfessionalContact,
  timeLabelOf,
  WHATSAPP_CONTACT_MESSAGE,
} from "@/services/emailDelivery";

// Mails de una reserva pública recién confirmada (al paciente y al profesional). No es una
// Server Action: la llama solo bookAppointmentAction, en el servidor, después de que
// book_appointment creó el turno. Antes era una Server Action propia que el navegador llamaba
// con el id del turno, o sea un endpoint público más.

// Análogo a resolveProfessionalContact (emailDelivery.ts), para que el profesional pueda
// escribirle al paciente desde el mail de nueva reserva.
function resolvePatientContact(appointment: Appointment): ContactInfo {
  return {
    email: appointment.patient_email,
    whatsappLink: appointment.patient_whatsapp
      ? buildWhatsappLink(
          appointment.patient_whatsapp,
          appointment.patient_whatsapp_country,
          WHATSAPP_CONTACT_MESSAGE,
        )
      : null,
  };
}

// Nunca lanza (attemptSend tampoco): la reserva ya quedó hecha.
export async function sendAppointmentBookedEmails(
  admin: SupabaseClient<Database>,
  appointmentId: string,
): Promise<void> {
  const appointment = await getAppointmentByIdInternal(admin, appointmentId);
  if (!appointment) {
    console.error(`sendAppointmentBookedEmails: turno ${appointmentId} no encontrado.`);
    return;
  }

  const professional = await getProfessionalByIdAdmin(admin, appointment.professional_id);
  if (!professional) {
    console.error(
      `sendAppointmentBookedEmails: profesional ${appointment.professional_id} no encontrado.`,
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
      patientContact: resolvePatientContact(appointment),
    }),
  });
}
