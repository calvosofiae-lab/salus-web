"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAvailableSlots } from "@/features/appointments/hooks/useAvailableSlots";

function isWeekend(dateStr: string) {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

export interface SlotPickerHandle {
  /** Re-consulta los horarios disponibles del día elegido (ej. después de que una reserva
   * falla porque otra persona se adelantó con el mismo horario). */
  reload: () => void;
}

export const SlotPicker = forwardRef<
  SlotPickerHandle,
  {
    professionalId: string;
    selectedSlot: { date: string; time: string } | null;
    onSelectSlot: (date: string, startTime: string) => void;
  }
>(function SlotPicker({ professionalId, selectedSlot, onSelectSlot }, ref) {
  const [date, setDate] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  const { slots, status, reload } = useAvailableSlots(professionalId, date || null);

  useImperativeHandle(ref, () => ({ reload }), [reload]);

  function handleDateChange(value: string) {
    if (value && isWeekend(value)) {
      setDateError("Solo se puede reservar de lunes a viernes.");
      setDate("");
      return;
    }
    setDateError(null);
    setDate(value);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 max-w-xs">
        <Label htmlFor="appointment_date">Elegí una fecha (lunes a viernes)</Label>
        <Input
          id="appointment_date"
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
        />
        {dateError && <p className="text-sm text-red-500">{dateError}</p>}
      </div>

      {status === "loading" && (
        <p className="text-sm text-muted-foreground">Buscando horarios...</p>
      )}
      {status === "error" && <p className="text-sm text-red-500">Error al buscar horarios.</p>}
      {status === "ready" && slots.length === 0 && (
        <p className="text-sm text-muted-foreground">No hay horarios disponibles ese día.</p>
      )}
      {status === "ready" && slots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <Button
              key={slot}
              type="button"
              variant={
                selectedSlot?.date === date && selectedSlot?.time === slot ? "default" : "outline"
              }
              size="sm"
              onClick={() => onSelectSlot(date, slot)}
            >
              {slot.slice(0, 5)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
});
