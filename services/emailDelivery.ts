import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Professional } from "@/features/professionals/types";
import {
  createPendingEmailNotification,
  markEmailNotificationSent,
  markEmailNotificationFailed,
  type EmailRecipientType,
  type EmailNotificationType,
} from "@/repositories/emailNotificationsRepository";
import { htmlToPlainText, type EmailMessage, type ContactInfo } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/resendClient";
import { buildWhatsappLink } from "@/lib/whatsapp";

// Piezas de envío compartidas entre las Server Actions de emailNotificationService.ts y el
// cron de recordatorios (appointmentReminderService.ts). Viven acá y no en
// emailNotificationService.ts porque ese archivo es "use server": todo lo que exporta queda
// expuesto como endpoint POST público, y attemptSend no valida quién la llama.

// Mensaje prellenado del link de wa.me: da contexto sin obligar al paciente a escribirlo.
export const WHATSAPP_CONTACT_MESSAGE = "Hola, te escribo por mi turno en SALUS";

export interface AttemptSendInput {
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
//
// Devuelve si efectivamente salió un mail, para que quien recorre varios turnos (el cron)
// pueda informar cuántos mandó.
export async function attemptSend(
  admin: SupabaseClient<Database>,
  input: AttemptSendInput,
): Promise<boolean> {
  if (!input.recipientEmail) return false; // turnos viejos sin email, o profesional sin cuenta de auth

  const pending = await createPendingEmailNotification(admin, {
    appointmentId: input.appointmentId,
    recipientType: input.recipientType,
    recipientEmail: input.recipientEmail,
    notificationType: input.notificationType,
    eventKey: input.eventKey,
  });
  if (!pending) return false; // ya se había procesado esta notificación (idempotencia)

  try {
    const { providerMessageId } = await sendTransactionalEmail({
      to: input.recipientEmail,
      subject: input.message.subject,
      html: input.message.html,
      text: htmlToPlainText(input.message.html),
      replyTo: input.message.replyTo,
    });
    await markEmailNotificationSent(admin, pending.id, providerMessageId);
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await markEmailNotificationFailed(admin, pending.id, errorMessage);
    console.error(
      `emailDelivery: fallo al enviar ${input.notificationType} (${input.recipientType}) del turno ${input.appointmentId}: ${errorMessage}`,
    );
    return false;
  }
}

export function timeLabelOf(startTime: string): string {
  return startTime.slice(0, 5);
}

// El profesional no tiene columna de email propia: su email es el de su cuenta de auth,
// vinculada por profile_id. Si todavía no completó el alta de cuenta (profile_id null), no hay
// a quién mandarle -- attemptSend lo salta.
export async function resolveProfessionalEmail(
  admin: SupabaseClient<Database>,
  professional: Professional,
): Promise<string | null> {
  if (!professional.profile_id) return null;
  const { data } = await admin.auth.admin.getUserById(professional.profile_id);
  return data.user?.email ?? null;
}

// Datos de contacto para que el paciente pueda escribirle al profesional directamente desde
// el mail, sin tener que volver al sitio.
export async function resolveProfessionalContact(
  admin: SupabaseClient<Database>,
  professional: Professional,
): Promise<ContactInfo> {
  return {
    email: await resolveProfessionalEmail(admin, professional),
    whatsappLink: professional.whatsapp
      ? buildWhatsappLink(professional.whatsapp, professional.whatsapp_country, WHATSAPP_CONTACT_MESSAGE)
      : null,
  };
}
