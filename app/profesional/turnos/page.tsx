import { createClient } from "@/lib/supabase/server";
import { getOwnProfessionalCached } from "@/features/professionals/services/getOwnProfessionalCached";
import { ProfessionalCalendar } from "@/features/appointments/components/ProfessionalCalendar";

export default async function AppointmentsPage() {
  const supabase = await createClient();
  const professional = await getOwnProfessionalCached(supabase);

  // El layout ya filtra este caso y no renderiza children sin perfil; esto es solo para TS.
  if (!professional) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-navy">Mis turnos</h1>
      <ProfessionalCalendar professionalId={professional.id} />
    </div>
  );
}
