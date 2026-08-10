"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLongDate } from "@/features/appointments/lib/date";
import { useAvailableSlots } from "@/features/appointments/hooks/useAvailableSlots";
import { BookingStepDone, BookingStepHeading } from "@/features/appointments/components/BookingStep";

function isSunday(dateStr: string) {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day === 0;
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
    /** El paso de horario (y de fecha, si corresponde) vuelve a mostrarse para elegir de nuevo.
     * No hace falta en modo `compact`, que no tiene pasos colapsables. */
    onClearSelection?: () => void;
    /** Variante reducida (sin numeración de pasos ni colapso "✓ completado") usada en paneles
     * angostos como la reprogramación de turnos del profesional. */
    compact?: boolean;
  }
>(function SlotPicker(
  { professionalId, selectedSlot, onSelectSlot, onClearSelection = () => {}, compact = false },
  ref,
) {
  const [date, setDate] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  // En iOS (Safari y Chrome, ambos sobre WebKit), si el input de fecha es un componente
  // controlado, React vuelve a asignarle `.value` en cada render -- y WebKit interpreta esa
  // asignación programática como un cambio externo mientras el popover de selección está
  // abierto, cerrándolo solo. Por eso el input usa `defaultValue` (no controlado): el DOM
  // maneja su propio valor y React solo lee `date` a través de `onChange`. Ver los <Input
  // type="date"> más abajo.
  //
  // Además, la rueda nativa dispara onChange en cada tick de scroll (no solo al terminar de
  // elegir), pasando por valores intermedios antes de llegar al elegido. Por eso `date` nunca
  // se fuerza a "" acá: si se vaciara al pasar por un domingo intermedio, se perdería la
  // selección en curso. En cambio, mientras la fecha elegida sea domingo, se bloquea el paso 2
  // (no se busca horarios) mostrando el error, sin tocar el input.
  const isDateSunday = date !== "" && isSunday(date);
  const { slots, status, reload } = useAvailableSlots(
    professionalId,
    date && !isDateSunday ? date : null,
  );

  useImperativeHandle(ref, () => ({ reload }), [reload]);

  function handleDateChange(value: string) {
    setDate(value);
    setDateError(value && isSunday(value) ? "Solo se puede reservar de lunes a sábado." : null);
  }

  function handleChangeDate() {
    setDate("");
    setDateError(null);
    onClearSelection?.();
  }

  const selectedTime = selectedSlot?.date === date ? selectedSlot?.time ?? null : null;

  if (compact) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-2 max-w-xs">
          <Label htmlFor="appointment_date">Elegí una fecha (lunes a sábado)</Label>
          <Input
            id="appointment_date"
            type="date"
            defaultValue={date}
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
                  selectedSlot?.date === date && selectedSlot?.time === slot
                    ? "default"
                    : "outline"
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
  }

  return (
    <div className="flex flex-col gap-4">
      {date && !isDateSunday ? (
        <BookingStepDone
          label="Fecha"
          value={formatLongDate(date)}
          changeLabel="Cambiar fecha"
          onChange={handleChangeDate}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <BookingStepHeading step={1} title="Elegí una fecha" />
          <div className="grid max-w-[220px] gap-1.5 pl-8">
            <Label htmlFor="appointment_date" className="sr-only">
              Fecha (lunes a sábado)
            </Label>
            <Input
              id="appointment_date"
              type="date"
              defaultValue={date}
              aria-invalid={!!dateError}
              aria-describedby={dateError ? "appointment_date-error" : undefined}
              onChange={(e) => handleDateChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Turnos de lunes a sábado.</p>
            {dateError && (
              <p id="appointment_date-error" role="alert" className="text-sm text-red-600">
                {dateError}
              </p>
            )}
          </div>
        </div>
      )}

      {date &&
        !isDateSunday &&
        (selectedTime ? (
          <BookingStepDone
            label="Horario"
            value={`${selectedTime.slice(0, 5)} hs`}
            changeLabel="Cambiar horario"
            onChange={onClearSelection}
          />
        ) : (
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200 flex flex-col gap-2">
            <BookingStepHeading step={2} title="Elegí un horario" />
            <div className="pl-8" aria-live="polite">
              {status === "loading" && (
                <p className="text-sm text-muted-foreground">Buscando horarios...</p>
              )}
              {status === "error" && (
                <p role="alert" className="text-sm text-red-600">
                  Error al buscar horarios.
                </p>
              )}
              {status === "ready" && slots.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay horarios disponibles ese día. Probá con otra fecha.
                </p>
              )}
              {status === "ready" && slots.length > 0 && (
                <div
                  role="group"
                  aria-label="Horarios disponibles"
                  className="grid grid-cols-3 gap-2 sm:grid-cols-4"
                >
                  {slots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant="outline"
                      className="border-brand-teal/40 hover:border-brand-teal hover:bg-brand-teal/10 hover:text-primary"
                      onClick={() => onSelectSlot(date, slot)}
                    >
                      {slot.slice(0, 5)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
});
