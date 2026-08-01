import { createClient } from "@/lib/supabase/client";
import type {
  Professional,
  ProfessionalFilters,
  ProfessionalInput,
} from "@/features/professionals/types";

const TOP_RATED_LIMIT = 4;

export async function getFeaturedProfessionals(): Promise<Professional[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_top_rated_professionals", {
    p_limit: TOP_RATED_LIMIT,
  });

  if (error) throw error;
  return data ?? [];
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
  if (filters.province) {
    query = query.eq("province", filters.province);
  }
  if (filters.city && filters.city !== "General") {
    query = query.eq("city", filters.city);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getAllProfessionalsAdmin(): Promise<Professional[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .order("full_name");

  if (error) throw error;
  return data ?? [];
}

export async function getProfessionalByIdAdmin(id: string): Promise<Professional | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createProfessional(input: ProfessionalInput): Promise<Professional> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("professionals")
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfessional(
  id: string,
  input: Partial<ProfessionalInput>,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("professionals").update(input).eq("id", id);
  if (error) throw error;
}

export async function deactivateProfessional(id: string): Promise<void> {
  await updateProfessional(id, { is_active: false });
}

export async function activateProfessional(id: string): Promise<void> {
  await updateProfessional(id, { is_active: true });
}

export async function getPublicProfessionalById(id: string): Promise<Professional | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data;
}

const PHOTOS_BUCKET = "professional-photos";

export async function uploadProfessionalPhoto(
  professionalId: string,
  file: File,
): Promise<string> {
  const supabase = createClient();

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${professionalId}/photo.${ext}`;

  const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);

  return `${publicUrl}?v=${Date.now()}`;
}

export async function getOwnProfessional(): Promise<Professional | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (error) return null;
  return data;
}
