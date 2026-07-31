import { createClient } from "@/lib/supabase/client";
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

export async function getFeaturedProfessionalOfMonth(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_featured_professional_of_month");
  if (error) throw error;
  return data;
}
