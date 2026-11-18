import { createClient } from "@/lib/supabase/server";
import { getOwnProfessionalCached } from "@/features/professionals/services/getOwnProfessionalCached";
import { AppointmentsView } from "@/features/appointments/components/AppointmentsView";
import { toBreakMinutes, toSlotDuration } from "@/features/appointments/lib/sessionTime";

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
        slotDurationMinutes={toSlotDuration(professional.slot_duration_minutes)}
        breakMinutes={toBreakMinutes(professional.break_minutes)}
      />
    </div>
  );
}
