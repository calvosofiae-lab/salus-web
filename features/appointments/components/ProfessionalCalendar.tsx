"use client";

import { useMyAppointments } from "@/features/appointments/hooks/useMyAppointments";
import { AppointmentListItem } from "@/features/appointments/components/AppointmentListItem";
import type { Appointment } from "@/features/appointments/types";

export function ProfessionalCalendar({ professionalId }: { professionalId: string }) {
  const { appointments, status, changeStatus } = useMyAppointments(professionalId);

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Cargando turnos...</p>;
  }
  if (status === "error") {
    return <p className="text-sm text-red-500">Error al cargar los turnos.</p>;
  }
  if (appointments.length === 0) {
    return <p className="text-sm text-muted-foreground">No tenés turnos todavía.</p>;
  }

  const byDate = appointments.reduce<Record<string, Appointment[]>>((acc, appt) => {
    (acc[appt.appointment_date] ??= []).push(appt);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(byDate).map(([date, items]) => (
        <div key={date} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{date}</h3>
          <div className="flex flex-col gap-2">
            {items.map((appt) => (
              <AppointmentListItem
                key={appt.id}
                appointment={appt}
                onChangeStatus={(newStatus) => changeStatus(appt.id, newStatus)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
