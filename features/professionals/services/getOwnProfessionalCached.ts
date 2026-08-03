import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getOwnProfessional } from "@/repositories/professionalsRepository";

/**
 * Memoizado por request: el layout de /profesional y cada page.tsx hijo llaman a esto
 * con el mismo cliente de servidor, y React dedupe la llamada a Supabase en vez de repetirla.
 */
export const getOwnProfessionalCached = cache((supabase: SupabaseClient<Database>) =>
  getOwnProfessional(supabase),
);
