import { createClient } from "@/lib/supabase/server";
import { getOwnProfessionalCached } from "@/features/professionals/services/getOwnProfessionalCached";

export async function ProfessionalGate({ children }: { children: React.ReactNode }) {
  // El proxy (lib/supabase/proxy.ts) ya garantiza usuario autenticado con rol "professional"
  // para cualquier ruta bajo /profesional. Acá solo falta cubrir el caso de que ese usuario
  // todavía no tenga una fila en `professionals` asociada (profile_id sin vincular).
  const supabase = await createClient();
  const professional = await getOwnProfessionalCached(supabase);

  if (!professional) {
    return (
      <p className="text-sm text-red-500">
        No encontramos un perfil de profesional asociado a tu cuenta.
      </p>
    );
  }

  return <>{children}</>;
}
