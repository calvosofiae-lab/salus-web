import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { Review } from "@/features/reviews/types";

export async function getReviewsForProfessional(professionalId: string): Promise<Review[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Para el panel de admin: solo las reviews que tienen comentario (rating solo no alcanza para
// mostrar nada útil acá). reviews es de lectura pública, así que no hace falta ningún chequeo de
// admin extra -- RLS ya lo permite igual que en la vista pública del perfil.
export async function getProfessionalReviewComments(
  supabase: SupabaseClient<Database>,
  professionalId: string,
): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("professional_id", professionalId)
    .not("comment", "is", null)
    .neq("comment", "")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function submitReview(
  token: string,
  rating: number,
  comment: string,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc("submit_review", {
    p_token: token,
    p_rating: rating,
    p_comment: comment || null,
  });

  if (error) throw error;
}
