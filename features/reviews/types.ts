import type { Database } from "@/types/database";

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type PublishedReviewComment =
  Database["public"]["Functions"]["get_published_review_comments"]["Returns"][number];
export type ReviewContext = Database["public"]["Functions"]["get_review_context"]["Returns"][number];
