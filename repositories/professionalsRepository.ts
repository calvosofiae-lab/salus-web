import { createClient } from "@/lib/supabase/client";
import type { Professional, ProfessionalFilters } from "@/features/professionals/types";

const FEATURED_FALLBACK_LIMIT = 3;

export async function getFeaturedProfessionals(): Promise<Professional[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true);

  if (error) throw error;
  if (data && data.length > 0) return data;

  const { data: fallback, error: fallbackError } = await supabase
    .from("professionals")
    .select("*")
    .eq("is_active", true)
    .limit(FEATURED_FALLBACK_LIMIT);

  if (fallbackError) throw fallbackError;
  return fallback ?? [];
}

export async function searchProfessionals(
  filters: ProfessionalFilters,
): Promise<Professional[]> {
  const supabase = createClient();

  let query = supabase.from("professionals").select("*").eq("is_active", true);

  if (filters.profession) {
    query = query.eq("profession", filters.profession);
  }
  if (filters.consultationReason) {
    query = query.contains("consultation_reasons", [filters.consultationReason]);
  }
  if (filters.gender) {
    query = query.ilike("gender", `%${filters.gender}%`);
  }
  if (filters.coverage) {
    query = query.contains("coverage", [filters.coverage]);
  }
  if (filters.modality) {
    query = query.contains("modality", [filters.modality]);
  }
  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
