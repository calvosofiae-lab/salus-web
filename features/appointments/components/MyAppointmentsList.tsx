"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppointmentListItem } from "@/features/appointments/components/AppointmentListItem";
import { ScheduleConflictsBanner } from "@/features/appointments/components/ScheduleConflictsBanner";
import { useMyAppointments } from "@/features/appointments/hooks/useMyAppointments";
import { useScheduleConflicts } from "@/features/appointments/hooks/useScheduleConflicts";
import { MAX_RANGE_DAYS, useDateRange } from "@/features/appointments/hooks/useDateRange";
import { formatLongDate } from "@/features/appointments/lib/date";
import type { Appointment } from "@/features/appointments/types";

// Listado plano de "mis turnos" agrupado por fecha, análogo al que ya tiene el admin para ver
// los turnos de un profesional (AdminProfessionalAppointments) pero acá con las mutaciones
// habilitadas (cambio de estado, reprogramar) porque es el propio profesional viendo su agenda.
export function MyAppointmentsList({ professionalId }: { professionalId: string }) {
  const { from, to, setFrom, setTo } = useDateRange();
  const { appointments, status, changeStatus, reschedule } = useMyAppointments(
    professionalId,
    from,
    to,
  );
  // Mismo aviso que en el calendario (ProfessionalCalendar/DayPanel): turnos reservados que
  // quedaron fuera de la disponibilidad vigente (cambio de horario/duración, bloqueo nuevo,
  // etc.) o superpuestos entre sí.
  const { conflictIds, reload: reloadConflicts } = useScheduleConflicts(professionalId);
  // Igual que en DayPanel: se guarda por id para que la confirmación de "turno reprogramado"
  // sobreviva el re-render cuando el turno cambia de fecha.
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
          <Label htmlFor="my_range_from">Desde</Label>
          <Input
            id="my_range_from"
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="my_range_to">Hasta</Label>
          <Input
            id="my_range_to"
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

      <ScheduleConflictsBanner conflictCount={conflictIds.size} status={status} />

      {status === "loading" && (
        <p className="text-sm text-muted-foreground">Cargando turnos...</p>
      )}
      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          Error al cargar los turnos.
        </p>
      )}
      {status === "ready" && appointments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay turnos reservados en este rango de fechas.
        </p>
      )}
      {status === "ready" &&
        sortedDates.map(([date, items]) => (
          <div key={date} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{formatLongDate(date)}</h3>
            <div className="flex flex-col gap-2">
              {[...items]
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((appt) => (
                  <AppointmentListItem
                    key={appt.id}
                    appointment={appt}
                    professionalId={professionalId}
                    onChangeStatus={async (newStatus) => {
                      const result = await changeStatus(appt.id, newStatus);
                      if (result.success) reloadConflicts();
                      return result;
                    }}
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
