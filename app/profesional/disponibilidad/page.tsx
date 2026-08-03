import { createClient } from "@/lib/supabase/server";
import { getOwnProfessionalCached } from "@/features/professionals/services/getOwnProfessionalCached";
import { WeeklyAvailabilityForm } from "@/features/appointments/components/WeeklyAvailabilityForm";
import { BlockDateForm } from "@/features/appointments/components/BlockDateForm";

export default async function AvailabilityPage() {
  const supabase = await createClient();
  const professional = await getOwnProfessionalCached(supabase);

  // El layout ya filtra este caso y no renderiza children sin perfil; esto es solo para TS.
  if (!professional) return null;

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-semibold text-brand-navy">Disponibilidad</h1>
      <WeeklyAvailabilityForm professionalId={professional.id} />
      <BlockDateForm professionalId={professional.id} />
    </div>
  );
}
