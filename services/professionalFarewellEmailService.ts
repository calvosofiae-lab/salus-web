"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/features/auth/services/sessionService";
import { getProfessionalByIdAdmin } from "@/repositories/professionalsRepository";
import { buildProfessionalFarewellEmail, htmlToPlainText } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/resendClient";
import { resolveProfessionalEmail } from "@/services/emailDelivery";

// Mail de despedida al profesional que el admin acaba de dar de baja. Se llama después de que
// is_active ya quedó en false (ver useAdminProfessionalsList.deactivate): la baja ya está hecha
// y esto solo intenta avisar, así que nunca lanza.
//
// Es una Server Action (endpoint POST público): se revalida que quien llama sea admin y que el
// profesional esté efectivamente inactivo, en vez de confiar en la UI.
//
// No pasa por email_notifications: esa tabla está atada a un turno (appointment_id) y sumar
// este caso pide una migración. Mientras se prueba en develop, el resultado queda solo en
// consola. Sin ese registro no hay idempotencia: dar de baja, reactivar y volver a dar de baja
// manda el mail de nuevo.
export async function notifyProfessionalDeactivatedEmail(professionalId: string): Promise<void> {
  const context = "notifyProfessionalDeactivatedEmail";

  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    console.error(`${context}: llamada sin sesión de admin, se ignora.`);
    return;
  }

  const admin = createAdminClient();
  const professional = await getProfessionalByIdAdmin(admin, professionalId);
  if (!professional) {
    console.error(`${context}: profesional ${professionalId} no encontrado.`);
    return;
  }
  if (professional.is_active) {
    console.error(`${context}: el profesional ${professionalId} sigue activo, no se manda.`);
    return;
  }

  try {
    const email = await resolveProfessionalEmail(admin, professional);
    if (!email) return; // sin cuenta de auth vinculada, no hay a quién mandarle

    const message = buildProfessionalFarewellEmail({
      professionalFullName: professional.full_name,
    });
    await sendTransactionalEmail({
      to: email,
      subject: message.subject,
      html: message.html,
      text: htmlToPlainText(message.html),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`${context}: fallo al enviar al profesional ${professionalId}: ${errorMessage}`);
  }
}
