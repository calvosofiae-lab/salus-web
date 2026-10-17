import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database, ReviewCommentStatus } from "@/types/database";
import type { PublishedReviewComment, Review } from "@/features/reviews/types";

// Comentarios aprobados por el admin, para el perfil público. La columna `comment` no es
// legible para anon/authenticated (20261017010000): el texto solo sale por estas RPCs.
export async function getPublishedReviewComments(
  professionalId: string,
): Promise<PublishedReviewComment[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_published_review_comments", {
    p_professional_id: professionalId,
  });

  if (error) throw error;
  return data ?? [];
}

// Para el panel de admin: todas las reviews con comentario, en cualquier estado de moderación.
// La RPC rechaza a quien no sea admin.
export async function getProfessionalReviewComments(
  supabase: SupabaseClient<Database>,
  professionalId: string,
): Promise<Review[]> {
  const { data, error } = await supabase.rpc("get_admin_review_comments", {
    p_professional_id: professionalId,
  });

  if (error) throw error;
  return data ?? [];
}

export async function setReviewCommentStatus(
  reviewId: string,
  status: ReviewCommentStatus,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc("set_review_comment_status", {
    p_review_id: reviewId,
    p_status: status,
  });

  if (error) throw error;
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
