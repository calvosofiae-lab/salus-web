"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { getErrorMessage } from "@/lib/errors";
import { sendAppointmentBookedEmails } from "@/services/appointmentBookedEmail";

// Reserva pública de un turno. Antes el navegador llamaba directo a la RPC book_appointment
// con la clave pública y después a una Server Action que mandaba los mails. Ahora todo pasa
// por acá: se valida el captcha (Turnstile) y los datos, y recién entonces se llama a
// book_appointment con la clave secreta. La migración 20261128000000 le saca a anon el
// permiso de llamar a esa RPC, así que este es el único camino para reservar.
//
// Los errores se devuelven como valor y no con throw: en producción Next.js oculta el mensaje
// de un error lanzado desde una Server Action, y la persona tiene que ver por qué no pudo
// reservar ("ese horario ya fue reservado", etc.).

const bookingSchema = z.object({
  professionalId: z.string().regex(/^[0-9a-f-]{36}$/i),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().min(3).max(254),
  whatsapp: z.string().trim().regex(/^\d{4,14}$/),
  whatsappCountry: z.string().regex(/^[A-Z]{2}$/),
});

export type BookAppointmentParams = z.input<typeof bookingSchema>;

export type BookAppointmentResult = { ok: true; id: string } | { ok: false; error: string };

const GENERIC_ERROR = "Ocurrió un error al reservar el turno. Probá de nuevo en unos minutos.";

export async function bookAppointmentAction(
  params: BookAppointmentParams,
  captchaToken: string | null,
): Promise<BookAppointmentResult> {
  const parsed = bookingSchema.safeParse(params);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los datos: hay algún campo vacío o demasiado largo." };
  }
  const input = parsed.data;

  const requestHeaders = await headers();
  const remoteIp = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!(await verifyTurnstileToken(captchaToken, remoteIp))) {
    return {
      ok: false,
      error: "No pudimos verificar que no seas un robot. Esperá unos segundos y probá de nuevo.",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("book_appointment", {
    p_professional_id: input.professionalId,
    p_date: input.date,
    p_start_time: input.startTime,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_whatsapp: input.whatsapp,
    p_whatsapp_country: input.whatsappCountry,
    p_patient_email: input.email,
  });

  if (error || !data) {
    if (error) console.error("bookAppointmentAction:", error.code, error.message);
    // getErrorMessage solo deja pasar los `raise exception` de la función (mensajes pensados
    // para la persona); cualquier otro error queda en el genérico.
    return { ok: false, error: getErrorMessage(error, GENERIC_ERROR) };
  }

  // Los mails salen después de responder, para no demorar la confirmación en pantalla.
  // sendAppointmentBookedEmails nunca lanza: un fallo ahí no afecta la reserva.
  const appointmentId = data;
  after(() => sendAppointmentBookedEmails(admin, appointmentId));

  return { ok: true, id: appointmentId };
}
