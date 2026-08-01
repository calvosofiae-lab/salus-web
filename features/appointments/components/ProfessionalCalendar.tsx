"use client";

import { useMyAppointments } from "@/features/appointments/hooks/useMyAppointments";
import { AppointmentListItem } from "@/features/appointments/components/AppointmentListItem";
import type { Appointment } from "@/features/appointments/types";

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = capitalize(date.toLocaleDateString("es-AR", { weekday: "long" }));
  const monthName = capitalize(date.toLocaleDateString("es-AR", { month: "long" }));
  return `${weekday} ${String(day).padStart(2, "0")} ${monthName} ${year}`;
}

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

  const sortedDates = Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a));

  return (
    <div className="flex flex-col gap-6">
      {sortedDates.map(([date, items]) => (
        <div key={date} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{formatLongDate(date)}</h3>
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
