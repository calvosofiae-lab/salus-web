"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAvailabilityCalendar } from "@/features/appointments/hooks/useAvailabilityCalendar";
import type { DaySlot } from "@/features/appointments/types";

const STATUS_STYLES: Record<DaySlot["status"], string> = {
  disponible: "border-green-300 bg-green-50 text-green-800 hover:bg-green-100",
  bloqueado: "border-red-300 bg-red-50 text-red-800 hover:bg-red-100",
  reservado: "border-yellow-300 bg-yellow-50 text-yellow-800",
};

function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AvailabilityCalendar({ professionalId }: { professionalId: string }) {
  const { date, setDate, slots, status, error, isSaving, toggleSlot } =
    useAvailabilityCalendar(professionalId);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-brand-navy">Calendario de turnos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Elegí un día para ver sus horarios. Verde: disponible. Rojo: bloqueado, hacé click
          para liberarlo. Amarillo: ya reservado.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid max-w-[220px] gap-1.5">
          <Label htmlFor="calendar_date">Fecha</Label>
          <Input
            id="calendar_date"
            type="date"
            className="h-9"
            min={todayIso()}
            value={date}
            onChange={(e) => {
              // Mientras se completan los segmentos del input nativo (día/mes/año) a mano,
              // el navegador dispara onChange con value="" en los estados intermedios --
              // ignorarlos evita una consulta con fecha inválida contra get_day_schedule.
              if (e.target.value) setDate(e.target.value);
            }}
          />
        </div>

        {status === "loading" && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            Error al cargar el calendario de ese día.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {status === "ready" && slots.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No trabajás ese día: no tenés horario configurado arriba.
          </p>
        )}

        {slots.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((slot) => (
              <button
                key={slot.startTime}
                type="button"
                disabled={isSaving || slot.status === "reservado"}
                title={
                  slot.status === "reservado" && slot.appointment
                    ? `${slot.appointment.patient_first_name} ${slot.appointment.patient_last_name}`
                    : undefined
                }
                className={`rounded-md border px-2 py-1.5 text-xs font-medium transition disabled:opacity-70 disabled:cursor-not-allowed ${STATUS_STYLES[slot.status]}`}
                onClick={() => toggleSlot(slot)}
              >
                {slot.startTime.slice(0, 5)}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
