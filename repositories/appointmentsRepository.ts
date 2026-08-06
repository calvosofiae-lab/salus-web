import { createClient } from "@/lib/supabase/client";
import type { Appointment, AppointmentStatus } from "@/features/appointments/types";

export interface BookAppointmentInput {
  professionalId: string;
  date: string;
  startTime: string;
  firstName: string;
  lastName: string;
  whatsapp: string;
  whatsappCountry: string;
}

export async function getOwnAppointments(
  professionalId: string,
  from: string,
  to: string,
): Promise<Appointment[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("professional_id", professionalId)
    .gte("appointment_date", from)
    .lte("appointment_date", to)
    .order("appointment_date")
    .order("start_time");

  if (error) throw error;
  return data ?? [];
}

export async function rescheduleAppointment(
  appointmentId: string,
  date: string,
  startTime: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("reschedule_appointment", {
    p_appointment_id: appointmentId,
    p_new_date: date,
    p_new_start_time: startTime,
  });
  if (error) throw error;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function bookAppointment(input: BookAppointmentInput): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("book_appointment", {
    p_professional_id: input.professionalId,
    p_date: input.date,
    p_start_time: input.startTime,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_whatsapp: input.whatsapp,
    p_whatsapp_country: input.whatsappCountry,
  });

  if (error) throw error;
  return data;
}
