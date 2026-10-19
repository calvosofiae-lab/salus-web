import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type EmailNotification = Database["public"]["Tables"]["email_notifications"]["Row"];
export type EmailRecipientType = Database["public"]["Enums"]["email_recipient_type"];
export type EmailNotificationType =
  Database["public"]["Tables"]["email_notifications"]["Row"]["notification_type"];

const UNIQUE_VIOLATION = "23505";

export interface CreatePendingEmailNotificationInput {
  appointmentId: string;
  recipientType: EmailRecipientType;
  recipientEmail: string;
  notificationType: EmailNotificationType;
  // Distingue dos ocurrencias del mismo tipo sobre el mismo turno (ver la migración
  // 20260921000000). Solo lo usa la reprogramación, que puede repetirse; el resto lo deja
  // sin definir y dedupea por turno+destinatario+tipo como antes.
  eventKey?: string;
}

// Devuelve null si ya existía una fila para el mismo (appointment_id, recipient_type,
// notification_type, event_key): esa es la garantía de idempotencia, no un error a propagar.
export async function createPendingEmailNotification(
  supabase: SupabaseClient<Database>,
  input: CreatePendingEmailNotificationInput,
): Promise<EmailNotification | null> {
  const { data, error } = await supabase
    .from("email_notifications")
    .insert({
      appointment_id: input.appointmentId,
      recipient_type: input.recipientType,
      recipient_email: input.recipientEmail,
      notification_type: input.notificationType,
      event_key: input.eventKey ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if ((error as PostgrestError).code === UNIQUE_VIOLATION) return null;
    throw error;
  }
  return data;
}

export async function markEmailNotificationSent(
  supabase: SupabaseClient<Database>,
  id: string,
  providerMessageId: string,
): Promise<void> {
  const { error } = await supabase
    .from("email_notifications")
    .update({ status: "sent", provider_message_id: providerMessageId, sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markEmailNotificationFailed(
  supabase: SupabaseClient<Database>,
  id: string,
  errorMessage: string,
): Promise<void> {
  const { error } = await supabase
    .from("email_notifications")
    .update({ status: "failed", error_message: errorMessage.slice(0, 2000) })
    .eq("id", id);
  if (error) throw error;
}

export interface PatientMonthlySurveyInput {
  appointmentId: string;
  professionalId: string;
  patientEmail: string;
  appointmentDate: string; // YYYY-MM-DD
}

// Encuesta de satisfacción: como mucho una por mes calendario por paciente y profesional, la
// del primer turno realizado del mes. Si el paciente se atiende varias veces en el mes, las
// demás serían redundantes. Al paciente lo identifica el email (no hay cuenta de paciente).
// Un envío fallido no cuenta, así que el próximo turno del mes vuelve a intentarlo.
export async function hasPatientSurveyInMonth(
  supabase: SupabaseClient<Database>,
  input: PatientMonthlySurveyInput,
): Promise<boolean> {
  const [year, month] = input.appointmentDate.split("-").map(Number);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonthStart =
    month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("id, patient_email")
    .eq("professional_id", input.professionalId)
    .gte("appointment_date", monthStart)
    .lt("appointment_date", nextMonthStart)
    .neq("id", input.appointmentId);
  if (appointmentsError) throw appointmentsError;

  const patientEmail = input.patientEmail.trim().toLowerCase();
  const sameMonthIds = (appointments ?? [])
    .filter((a) => a.patient_email?.trim().toLowerCase() === patientEmail)
    .map((a) => a.id);
  if (sameMonthIds.length === 0) return false;

  const { count, error } = await supabase
    .from("email_notifications")
    .select("id", { count: "exact", head: true })
    .in("appointment_id", sameMonthIds)
    .eq("recipient_type", "patient")
    .eq("notification_type", "appointment_survey")
    .in("status", ["pending", "sent"]);
  if (error) throw error;
  return (count ?? 0) > 0;
}
