"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMyAppointments } from "@/features/appointments/hooks/useMyAppointments";
import { AppointmentListItem } from "@/features/appointments/components/AppointmentListItem";
import { formatLongDate } from "@/features/appointments/lib/date";
import type { Appointment } from "@/features/appointments/types";

const MAX_RANGE_DAYS = 21;

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  const fromDate = new Date(fy, fm - 1, fd);
  const toDate = new Date(ty, tm - 1, td);
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86400000);
}

const TODAY = toISODate(new Date());
const DEFAULT_FROM = addDays(TODAY, -7);
const DEFAULT_TO = addDays(TODAY, MAX_RANGE_DAYS - 8);

export function ProfessionalCalendar({ professionalId }: { professionalId: string }) {
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
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

  function handleFromChange(value: string) {
    if (!value) return;
    let nextTo = to < value ? value : to;
    if (daysBetween(value, nextTo) > MAX_RANGE_DAYS - 1) {
      nextTo = addDays(value, MAX_RANGE_DAYS - 1);
    }
    setFrom(value);
    setTo(nextTo);
  }

  function handleToChange(value: string) {
    if (!value) return;
    let nextFrom = from > value ? value : from;
    if (daysBetween(nextFrom, value) > MAX_RANGE_DAYS - 1) {
      nextFrom = addDays(value, -(MAX_RANGE_DAYS - 1));
    }
    setFrom(nextFrom);
    setTo(value);
  }

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
            onChange={(e) => handleFromChange(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="range_to">Hasta</Label>
          <Input
            id="range_to"
            type="date"
            value={to}
            min={from}
            onChange={(e) => handleToChange(e.target.value)}
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
    </div>
  );
}
