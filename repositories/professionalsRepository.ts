import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type {
  Professional,
  ProfessionalFilters,
  ProfessionalInput,
} from "@/features/professionals/types";

export async function getFeaturedProfessionals(): Promise<Professional[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_premium_professionals");

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

export interface PaginatedProfessionals {
  data: Professional[];
  count: number;
}

export async function getAllProfessionalsAdmin(
  page: number,
  pageSize: number,
): Promise<PaginatedProfessionals> {
  const supabase = createClient();

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("professionals")
    .select("*", { count: "exact" })
    .order("full_name")
    .range(from, to);

  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function getProfessionalByIdAdmin(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<Professional | null> {
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

// is_premium solo lo puede escribir un admin (protect_professional_admin_fields en la base lo
// revierte si no lo es), así que esta función solo tiene sentido llamada desde el panel admin.
export async function setProfessionalPremium(id: string, isPremium: boolean): Promise<void> {
  await updateProfessional(id, { is_premium: isPremium });
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

async function removeStalePhotos(
  professionalId: string,
  keepFileName?: string,
): Promise<void> {
  const supabase = createClient();

  const { data: existing } = await supabase.storage.from(PHOTOS_BUCKET).list(professionalId);
  const stale = (existing ?? [])
    .filter((f) => f.name !== keepFileName)
    .map((f) => `${professionalId}/${f.name}`);

  if (stale.length > 0) {
    await supabase.storage.from(PHOTOS_BUCKET).remove(stale);
  }
}

export async function uploadProfessionalPhoto(
  professionalId: string,
  file: File,
): Promise<string> {
  const supabase = createClient();

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `photo.${ext}`;
  const path = `${professionalId}/${fileName}`;

  // Si la foto anterior tenía otra extensión, upsert no la pisa: queda huérfana.
  await removeStalePhotos(professionalId, fileName);

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

export async function removeProfessionalPhoto(professionalId: string): Promise<void> {
  await removeStalePhotos(professionalId);
}

export async function getOwnProfessional(
  supabase: SupabaseClient<Database>,
): Promise<Professional | null> {
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
