import { createClient } from "@/lib/supabase/client";
import type {
  AvailabilityBlock,
  AvailabilityBlockInput,
  AvailabilityDateBlock,
  AvailabilityDateBlockInput,
  AvailabilityRule,
  AvailabilityRuleInput,
  DaySlot,
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

export async function updateAvailabilityRule(
  id: string,
  startTime: string,
  endTime: string,
): Promise<AvailabilityRule> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("availability_rules")
    .update({ start_time: startTime, end_time: endTime })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
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

// month es 0-11 (como Date), no 1-12 -- se convierte acá para llamar a la RPC (que usa
// make_date y espera 1-12). Devuelve las fechas ISO del mes que NO tienen ningún horario
// disponible (sin regla semanal ese día, completo de turnos, o todo bloqueado).
export async function getMonthDatesWithoutAvailability(
  professionalId: string,
  year: number,
  month: number,
): Promise<Set<string>> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_month_availability", {
    p_professional_id: professionalId,
    p_year: year,
    p_month: month + 1,
  });

  if (error) throw error;
  return new Set((data ?? []).filter((row) => !row.has_available).map((row) => row.day));
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
