import { createClient } from "@/lib/supabase/client";
import type {
  AvailabilityBlock,
  AvailabilityBlockInput,
  AvailabilityDateBlock,
  AvailabilityDateBlockInput,
  AvailabilityRule,
  AvailabilityRuleInput,
  DaySlot,
  SlotDuration,
} from "@/features/appointments/types";

export async function getOwnAvailabilityRules(
  professionalId: string,
): Promise<AvailabilityRule[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("professional_id", professionalId)
    .order("day_of_week")
    .order("start_time");

  if (error) throw error;
  return data ?? [];
}

export async function createAvailabilityRule(
  input: AvailabilityRuleInput,
): Promise<AvailabilityRule> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("availability_rules")
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAvailabilityRule(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("availability_rules").delete().eq("id", id);
  if (error) throw error;
}

export async function getOwnAvailabilityBlocks(
  professionalId: string,
): Promise<AvailabilityBlock[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("availability_blocks")
    .select("*")
    .eq("professional_id", professionalId)
    .order("start_date");

  if (error) throw error;
  return data ?? [];
}

export async function createAvailabilityBlock(
  input: AvailabilityBlockInput,
): Promise<AvailabilityBlock> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("availability_blocks")
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAvailabilityBlock(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("availability_blocks").delete().eq("id", id);
  if (error) throw error;
}

export async function getOwnDateBlocks(professionalId: string): Promise<AvailabilityDateBlock[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("availability_date_blocks")
    .select("*")
    .eq("professional_id", professionalId)
    .order("date")
    .order("start_time");

  if (error) throw error;
  return data ?? [];
}

export async function createDateBlock(
  input: AvailabilityDateBlockInput,
): Promise<AvailabilityDateBlock> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("availability_date_blocks")
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDateBlock(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("availability_date_blocks").delete().eq("id", id);
  if (error) throw error;
}

// Todos los horarios candidatos de un día, con su estado (disponible/bloqueado/reservado) --
// alimenta el calendario de colores en /profesional/disponibilidad.
export async function getDaySchedule(professionalId: string, date: string): Promise<DaySlot[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_day_schedule", {
    p_professional_id: professionalId,
    p_date: date,
  });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    startTime: row.start_time,
    status: row.status as DaySlot["status"],
    appointment:
      row.appointment_id && row.patient_first_name && row.patient_last_name
        ? {
            id: row.appointment_id,
            patient_first_name: row.patient_first_name,
            patient_last_name: row.patient_last_name,
          }
        : undefined,
  }));
}

export async function getSlotDuration(professionalId: string): Promise<SlotDuration> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("professionals")
    .select("slot_duration_minutes")
    .eq("id", professionalId)
    .single();

  if (error) throw error;
  return data.slot_duration_minutes as SlotDuration;
}

export async function updateSlotDuration(
  professionalId: string,
  minutes: SlotDuration,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("professionals")
    .update({ slot_duration_minutes: minutes })
    .eq("id", professionalId);

  if (error) throw error;
}

export async function getAvailableSlots(
  professionalId: string,
  date: string,
): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_available_slots", {
    p_professional_id: professionalId,
    p_date: date,
  });

  if (error) throw error;
  return (data ?? []).map((row) => row.start_time);
}
