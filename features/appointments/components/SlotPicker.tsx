"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAvailableSlots } from "@/features/appointments/hooks/useAvailableSlots";

export function SlotPicker({
  professionalId,
  onSelectSlot,
}: {
  professionalId: string;
  onSelectSlot: (date: string, startTime: string) => void;
}) {
  const [date, setDate] = useState("");
  const { slots, status } = useAvailableSlots(professionalId, date || null);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 max-w-xs">
        <Label htmlFor="appointment_date">Elegí una fecha</Label>
        <Input
          id="appointment_date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
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
              variant="outline"
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
}
