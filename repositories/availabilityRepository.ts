import { createClient } from "@/lib/supabase/client";
import type {
  AvailabilityBlock,
  AvailabilityBlockInput,
  AvailabilityRule,
  AvailabilityRuleInput,
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

/** Primera fecha (>= fromDate) con al menos un horario libre, o null si no hay ninguna dentro
 * del horizonte de búsqueda por default de `get_next_available_date` (90 días). */
export async function getNextAvailableDate(
  professionalId: string,
  fromDate: string,
): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_next_available_date", {
    p_professional_id: professionalId,
    p_from_date: fromDate,
  });

  if (error) throw error;
  return data;
}
