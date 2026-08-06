import { createClient } from "@/lib/supabase/server";
import { getProfessionalByIdAdmin } from "@/repositories/professionalsRepository";
import { AdminProfessionalAppointments } from "@/features/admin/components/AdminProfessionalAppointments";

export async function ProfessionalAppointmentsServer({
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
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">
          Turnos de {professional.full_name}
        </h1>
        <p className="text-sm text-muted-foreground">Vista de solo lectura.</p>
      </div>
      <AdminProfessionalAppointments professionalId={professional.id} />
    </div>
  );
}
