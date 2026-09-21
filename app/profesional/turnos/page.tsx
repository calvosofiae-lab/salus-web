import { createClient } from "@/lib/supabase/server";
import { getOwnProfessionalCached } from "@/features/professionals/services/getOwnProfessionalCached";
import { AppointmentsView } from "@/features/appointments/components/AppointmentsView";

export default async function AppointmentsPage() {
  const supabase = await createClient();
  const professional = await getOwnProfessionalCached(supabase);

  // El layout ya filtra este caso y no renderiza children sin perfil; esto es solo para TS.
  if (!professional) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-navy">Agenda</h1>
      <AppointmentsView
        professionalId={professional.id}
        slotDurationMinutes={professional.slot_duration_minutes === 45 ? 45 : 60}
      />
    </div>
  );
}
