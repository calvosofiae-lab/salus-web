import { createClient } from "@/lib/supabase/client";
import type { Appointment, AppointmentStatus } from "@/features/appointments/types";

export interface BookAppointmentInput {
  professionalId: string;
  date: string;
  startTime: string;
  firstName: string;
  lastName: string;
  whatsapp: string;
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
  });

  if (error) throw error;
  return data;
}
