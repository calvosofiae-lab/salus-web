"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfessionalCalendar } from "@/features/appointments/components/ProfessionalCalendar";
import { MyAppointmentsList } from "@/features/appointments/components/MyAppointmentsList";
import {
  sessionMinutes,
  type BreakMinutes,
  type SlotDurationMinutes,
} from "@/features/appointments/lib/sessionTime";

type View = "calendario" | "listado";

// Toggle simple entre el calendario ("Agenda", unificado con Disponibilidad) y un listado plano
// como el que ya tiene el admin, para poder ir viendo todos los turnos juntos sin navegar día
// por día.
//
// La duración del turno y el descanso viven acá (no en ProfessionalCalendar) para que el
// listado también muestre el horario de la sesión actualizado si se cambian en el calendario y
// después se pasa a "Mis turnos" (cada vista se desmonta al cambiar).
export function AppointmentsView({
  professionalId,
  slotDurationMinutes: initialSlotDurationMinutes,
  breakMinutes: initialBreakMinutes,
}: {
  professionalId: string;
  slotDurationMinutes: SlotDurationMinutes;
  breakMinutes: BreakMinutes;
}) {
  const [view, setView] = useState<View>("calendario");
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(initialSlotDurationMinutes);
  const [breakMinutes, setBreakMinutes] = useState(initialBreakMinutes);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={view === "calendario" ? "default" : "outline"}
          onClick={() => setView("calendario")}
        >
          Calendario
        </Button>
        <Button
          type="button"
          size="sm"
          variant={view === "listado" ? "default" : "outline"}
          onClick={() => setView("listado")}
        >
          Mis turnos
        </Button>
      </div>

      {view === "calendario" ? (
        <ProfessionalCalendar
          professionalId={professionalId}
          slotDurationMinutes={slotDurationMinutes}
          breakMinutes={breakMinutes}
          onSlotDurationChanged={setSlotDurationMinutes}
          onBreakChanged={setBreakMinutes}
        />
      ) : (
        <MyAppointmentsList
          professionalId={professionalId}
          sessionMinutes={sessionMinutes(slotDurationMinutes, breakMinutes)}
        />
      )}
    </div>
  );
}
