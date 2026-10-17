import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getReservedAppointmentsForDate } from "@/repositories/appointmentsRepository";
import { getProfessionalByIdAdmin } from "@/repositories/professionalsRepository";
import type { Professional } from "@/features/professionals/types";
import type { ContactInfo } from "@/lib/email/templates";
import { buildPatientReminderEmail } from "@/lib/email/templates";
import {
  addDaysIso,
  formatLongDate,
  isoDateInArgentina,
} from "@/features/appointments/lib/date";
import { attemptSend, resolveProfessionalContact, timeLabelOf } from "@/services/emailDelivery";

export interface ReminderRunResult {
  date: string;
  candidates: number;
  sent: number;
  skippedBookedToday: number;
}

// Recordatorio de la víspera: a cada paciente con turno 'reservado' para mañana le manda un
// mail. No es una Server Action (no lleva "use server"): solo la llama el route handler del
// cron, que ya validó CRON_SECRET.
//
// Se saltean los turnos creados hoy (reserva pública o carga del profesional): el paciente
// recibió el mail de alta hace unas horas y un recordatorio encima es redundante. Los turnos
// que se crean para mañana después de que corrió el cron tampoco lo reciben, por el mismo
// motivo.
export async function sendAppointmentReminders(now: Date = new Date()): Promise<ReminderRunResult> {
  const admin = createAdminClient();
  const today = isoDateInArgentina(now);
  const tomorrow = addDaysIso(today, 1);

  const appointments = await getReservedAppointmentsForDate(admin, tomorrow);

  // Varios turnos del mismo profesional en el mismo día: se resuelve su contacto una sola vez
  // (implica una llamada a auth.admin por profesional).
  const professionals = new Map<string, { professional: Professional; contact: ContactInfo } | null>();

  let sent = 0;
  let skippedBookedToday = 0;

  for (const appointment of appointments) {
    if (isoDateInArgentina(new Date(appointment.created_at)) === today) {
      skippedBookedToday++;
      continue;
    }

    if (!professionals.has(appointment.professional_id)) {
      const professional = await getProfessionalByIdAdmin(admin, appointment.professional_id);
      professionals.set(
        appointment.professional_id,
        professional
          ? { professional, contact: await resolveProfessionalContact(admin, professional) }
          : null,
      );
    }
    const resolved = professionals.get(appointment.professional_id);
    if (!resolved) {
      console.error(
        `sendAppointmentReminders: profesional ${appointment.professional_id} no encontrado (turno ${appointment.id}).`,
      );
      continue;
    }

    const timeLabel = timeLabelOf(appointment.start_time);
    const delivered = await attemptSend(admin, {
      appointmentId: appointment.id,
      recipientType: "patient",
      recipientEmail: appointment.patient_email,
      notificationType: "appointment_reminder",
      // Fecha+hora del turno: un reintento del cron no duplica, y si el turno se reprograma a
      // otro día recibe un recordatorio nuevo (ver migración 20261015000000).
      eventKey: `${appointment.appointment_date}T${timeLabel}`,
      message: buildPatientReminderEmail({
        patientFirstName: appointment.patient_first_name,
        professionalFullName: resolved.professional.full_name,
        dateLabel: formatLongDate(appointment.appointment_date),
        timeLabel,
        professionalContact: resolved.contact,
      }),
    });
    if (delivered) sent++;
  }

  return { date: tomorrow, candidates: appointments.length, sent, skippedBookedToday };
}
