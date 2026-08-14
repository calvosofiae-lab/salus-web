"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMyAppointments } from "@/features/appointments/hooks/useMyAppointments";
import { useScheduleConflicts } from "@/features/appointments/hooks/useScheduleConflicts";
import { MAX_RANGE_DAYS, useDateRange } from "@/features/appointments/hooks/useDateRange";
import { AppointmentListItem } from "@/features/appointments/components/AppointmentListItem";
import { formatLongDate } from "@/features/appointments/lib/date";
import type { Appointment } from "@/features/appointments/types";

export function ProfessionalCalendar({ professionalId }: { professionalId: string }) {
  const { from, to, setFrom, setTo } = useDateRange();
  const { appointments, status, changeStatus, reschedule } = useMyAppointments(
    professionalId,
    from,
    to,
  );
  const { conflictIds, reload: reloadConflicts } = useScheduleConflicts(professionalId);
  // Al reprogramar, el turno cambia de fecha y su fila se re-monta bajo otro encabezado de
  // día -- se guarda acá (por id) para que la confirmación sobreviva ese re-montaje.
  const [justRescheduled, setJustRescheduled] = useState<
    Record<string, { date: string; time: string }>
  >({});

  const byDate = appointments.reduce<Record<string, Appointment[]>>((acc, appt) => {
    (acc[appt.appointment_date] ??= []).push(appt);
    return acc;
  }, {});

  const sortedDates = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="range_from">Desde</Label>
          <Input
            id="range_from"
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="range_to">Hasta</Label>
          <Input
            id="range_to"
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground pb-2">
          El rango no puede superar los {MAX_RANGE_DAYS} días.
        </p>
      </div>

      {status === "loading" && (
        <p className="text-sm text-muted-foreground">Cargando turnos...</p>
      )}
      {status === "error" && <p className="text-sm text-red-500">Error al cargar los turnos.</p>}
      {status === "ready" && appointments.length === 0 && (
        <p className="text-sm text-muted-foreground">No tenés turnos en este rango de fechas.</p>
      )}
      {status === "ready" &&
        sortedDates.map(([date, items]) => (
          <div key={date} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{formatLongDate(date)}</h3>
            <div className="flex flex-col gap-2">
              {items.map((appt) => (
                <AppointmentListItem
                  key={appt.id}
                  appointment={appt}
                  professionalId={professionalId}
                  onChangeStatus={(newStatus) => changeStatus(appt.id, newStatus)}
                  onReschedule={async (newDate, newStartTime) => {
                    const result = await reschedule(appt.id, newDate, newStartTime);
                    if (result.success) reloadConflicts();
                    return result;
                  }}
                  justRescheduledTo={justRescheduled[appt.id] ?? null}
                  onRescheduled={(slot) =>
                    setJustRescheduled((prev) => ({ ...prev, [appt.id]: slot }))
                  }
                  isOutOfSchedule={conflictIds.has(appt.id)}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
