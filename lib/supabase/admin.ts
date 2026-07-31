import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente con la secret key de Supabase (bypassa RLS, puede administrar usuarios
 * de auth). Nunca importar desde un Client Component: "server-only" hace fallar
 * el build si eso pasa. Usar solo desde Server Actions / Route Handlers, y solo
 * después de verificar el rol del que llama (getServerSession).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
