"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMyAppointments } from "@/features/appointments/hooks/useMyAppointments";
import { MAX_RANGE_DAYS, useDateRange } from "@/features/appointments/hooks/useDateRange";
import { AppointmentListItem } from "@/features/appointments/components/AppointmentListItem";
import { formatLongDate } from "@/features/appointments/lib/date";
import type { Appointment } from "@/features/appointments/types";

// Con el rango de hasta 31 días (antes 21) un mes completo puede traer bastantes días con
// turnos; se pagina de a semanas para no tirar todo el mes en una sola pantalla.
const DAYS_PER_PAGE = 7;

export function ProfessionalCalendar({ professionalId }: { professionalId: string }) {
  const { from, to, setFrom, setTo } = useDateRange();
  const { appointments, status, changeStatus, reschedule } = useMyAppointments(
    professionalId,
    from,
    to,
  );
  // Al reprogramar, el turno cambia de fecha y su fila se re-monta bajo otro encabezado de
  // día -- se guarda acá (por id) para que la confirmación sobreviva ese re-montaje.
  const [justRescheduled, setJustRescheduled] = useState<
    Record<string, { date: string; time: string }>
  >({});
  const [page, setPage] = useState(0);

  // Cambiar el rango de fechas puede dejar la página actual fuera de rango (ej. estar en la
  // página 3 y acotar a un rango con una sola semana de turnos).
  useEffect(() => {
    setPage(0);
  }, [from, to]);

  const byDate = appointments.reduce<Record<string, Appointment[]>>((acc, appt) => {
    (acc[appt.appointment_date] ??= []).push(appt);
    return acc;
  }, {});

  const sortedDates = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
  const pageCount = Math.max(1, Math.ceil(sortedDates.length / DAYS_PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const paginatedDates = sortedDates.slice(
    currentPage * DAYS_PER_PAGE,
    currentPage * DAYS_PER_PAGE + DAYS_PER_PAGE,
  );

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
        paginatedDates.map(([date, items]) => (
          <div key={date} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{formatLongDate(date)}</h3>
            <div className="flex flex-col gap-2">
              {items.map((appt) => (
                <AppointmentListItem
                  key={appt.id}
                  appointment={appt}
                  professionalId={professionalId}
                  onChangeStatus={(newStatus) => changeStatus(appt.id, newStatus)}
                  onReschedule={(newDate, newStartTime) =>
                    reschedule(appt.id, newDate, newStartTime)
                  }
                  justRescheduledTo={justRescheduled[appt.id] ?? null}
                  onRescheduled={(slot) =>
                    setJustRescheduled((prev) => ({ ...prev, [appt.id]: slot }))
                  }
                />
              ))}
            </div>
          </div>
        ))}

      {status === "ready" && pageCount > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={currentPage === 0}
            onClick={() => setPage(Math.max(0, currentPage - 1))}
          >
            Anterior
          </Button>
          <span className="text-muted-foreground">
            Página {currentPage + 1} de {pageCount}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage(Math.min(pageCount - 1, currentPage + 1))}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
