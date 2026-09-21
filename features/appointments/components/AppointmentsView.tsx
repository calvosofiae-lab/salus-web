"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfessionalCalendar } from "@/features/appointments/components/ProfessionalCalendar";
import { MyAppointmentsList } from "@/features/appointments/components/MyAppointmentsList";

type View = "calendario" | "listado";

// Toggle simple entre el calendario ("Agenda", unificado con Disponibilidad) y un listado plano
// como el que ya tiene el admin, para poder ir viendo todos los turnos juntos sin navegar día
// por día.
export function AppointmentsView({
  professionalId,
  slotDurationMinutes,
}: {
  professionalId: string;
  slotDurationMinutes: 45 | 60;
}) {
  const [view, setView] = useState<View>("calendario");

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
        />
      ) : (
        <MyAppointmentsList professionalId={professionalId} />
      )}
    </div>
  );
}
