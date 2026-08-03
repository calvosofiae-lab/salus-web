import { createClient } from "@/lib/supabase/server";
import { getProfessionalByIdAdmin } from "@/repositories/professionalsRepository";
import { EditProfessionalForm } from "@/features/professionals/components/EditProfessionalForm";

export async function EditProfessionalServer({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const professional = await getProfessionalByIdAdmin(supabase, id);

  if (!professional) {
    return <p className="text-sm text-red-500">Profesional no encontrado.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-navy">Editar profesional</h1>
      <EditProfessionalForm professional={professional} />
    </div>
  );
}
