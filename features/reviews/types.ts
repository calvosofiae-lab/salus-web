import type { Database } from "@/types/database";

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewContext = Database["public"]["Functions"]["get_review_context"]["Returns"][number];
