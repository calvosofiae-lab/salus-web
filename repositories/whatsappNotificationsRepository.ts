import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type WhatsAppNotification = Database["public"]["Tables"]["whatsapp_notifications"]["Row"];
export type WhatsAppRecipientType = Database["public"]["Enums"]["whatsapp_recipient_type"];

const UNIQUE_VIOLATION = "23505";

export interface CreatePendingNotificationInput {
  appointmentId: string;
  recipientType: WhatsAppRecipientType;
  recipientPhone: string;
  notificationType: string;
  templateName: string;
}

// Devuelve null si ya existía una fila para el mismo (appointment_id, recipient_type,
// notification_type): esa es la garantía de idempotencia, no un error a propagar.
export async function createPendingNotification(
  supabase: SupabaseClient<Database>,
  input: CreatePendingNotificationInput,
): Promise<WhatsAppNotification | null> {
  const { data, error } = await supabase
    .from("whatsapp_notifications")
    .insert({
      appointment_id: input.appointmentId,
      recipient_type: input.recipientType,
      recipient_phone: input.recipientPhone,
      notification_type: input.notificationType,
      template_name: input.templateName,
    })
    .select("*")
    .single();

  if (error) {
    if ((error as PostgrestError).code === UNIQUE_VIOLATION) return null;
    throw error;
  }
  return data;
}

export async function markNotificationSent(
  supabase: SupabaseClient<Database>,
  id: string,
  providerMessageId: string,
): Promise<void> {
  const { error } = await supabase
    .from("whatsapp_notifications")
    .update({ status: "sent", provider_message_id: providerMessageId, sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markNotificationFailed(
  supabase: SupabaseClient<Database>,
  id: string,
  errorMessage: string,
): Promise<void> {
  const { error } = await supabase
    .from("whatsapp_notifications")
    .update({ status: "failed", error_message: errorMessage.slice(0, 2000) })
    .eq("id", id);
  if (error) throw error;
}
