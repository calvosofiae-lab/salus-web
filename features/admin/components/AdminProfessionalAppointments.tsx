"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfessionalAppointmentsReadOnly } from "@/features/admin/hooks/useProfessionalAppointmentsReadOnly";
import { MAX_RANGE_DAYS, useDateRange } from "@/features/appointments/hooks/useDateRange";
import { STATUS_LABELS, STATUS_VARIANT } from "@/features/appointments/constants";
import { formatLongDate } from "@/features/appointments/lib/date";
import type { Appointment } from "@/features/appointments/types";

export function AdminProfessionalAppointments({ professionalId }: { professionalId: string }) {
  const { from, to, setFrom, setTo } = useDateRange();
  const { appointments, status } = useProfessionalAppointmentsReadOnly(professionalId, from, to);

  const byDate = appointments.reduce<Record<string, Appointment[]>>((acc, appt) => {
    (acc[appt.appointment_date] ??= []).push(appt);
    return acc;
  }, {});

  const sortedDates = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="admin_range_from">Desde</Label>
          <Input
            id="admin_range_from"
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="admin_range_to">Hasta</Label>
          <Input
            id="admin_range_to"
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
            <div className="flex flex-col divide-y rounded-md border">
              {items.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {appt.start_time.slice(0, 5)} · {appt.patient_first_name}{" "}
                      {appt.patient_last_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      WhatsApp: {appt.patient_whatsapp}
                    </span>
                  </div>
                  <Badge variant={STATUS_VARIANT[appt.status]}>
                    {STATUS_LABELS[appt.status]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
