"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLongDate } from "@/features/appointments/lib/date";
import { useAvailableSlots } from "@/features/appointments/hooks/useAvailableSlots";
import { useNextAvailableDate } from "@/features/appointments/hooks/useNextAvailableDate";
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
  // `date`: fecha confirmada (dispara la búsqueda de horarios y, en el paso no-compact,
  // colapsa el input a "Fecha: ...  Cambiar fecha"). `draftDate`: lo que el input muestra
  // mientras se está eligiendo, sin confirmar todavía.
  //
  // En iOS, la rueda nativa del input de fecha dispara onChange en cada tick de scroll (no
  // solo al terminar de elegir), y esos valores intermedios son casi siempre un día hábil. Si
  // `date` se actualizara directamente en cada onChange, ese primer tick ya alcanzaría para
  // desmontar el <Input> (el paso no-compact lo reemplaza por el resumen "Fecha: ...") con el
  // picker nativo todavía abierto, cerrándolo de golpe -- eso es lo que se reportó como "se
  // cierra el calendario solo" en Safari y Chrome de iPhone (no pasa en Android/desktop porque
  // ahí el evento se dispara una sola vez, al confirmar). Por eso `date` solo se fija al
  // confirmar explícitamente (botón "Continuar" acá, o directo en modo `compact`, que nunca
  // desmonta el input): el <Input> nunca desaparece mientras el usuario puede seguir
  // interactuando con el picker.
  const [date, setDate] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  // Fuerza el remount del <Input> de fecha en modo `compact` cuando la fecha cambia por código
  // (botón "próxima fecha disponible") en vez de por el usuario tipeando/eligiendo -- ese input
  // es no controlado (`defaultValue`), así que un cambio programático de `date` no movería lo
  // que se ve en pantalla sin este remount.
  const [inputKey, setInputKey] = useState(0);
  const { slots, status, reload } = useAvailableSlots(professionalId, date || null);
  // Se dispara solo cuando el día elegido no tiene horarios, para avisar "agenda completa" y
  // ofrecer saltar directo a la próxima fecha con disponibilidad.
  const { nextDate, status: nextDateStatus } = useNextAvailableDate(
    professionalId,
    status === "ready" && slots.length === 0 ? date : null,
  );

  useImperativeHandle(ref, () => ({ reload }), [reload]);

  function handleJumpToNextDate() {
    if (!nextDate) return;
    setDraftDate(nextDate);
    setDateError(null);
    setDate(nextDate);
    setInputKey((k) => k + 1);
  }

  // Modo compact: el input nunca se desmonta, así que confirmar en cada onChange es seguro.
  function handleDateChange(value: string) {
    if (value && isSunday(value)) {
      setDateError("Solo se puede reservar de lunes a sábado.");
      setDate("");
      return;
    }
    setDateError(null);
    setDate(value);
  }

  function handleDraftDateChange(value: string) {
    setDraftDate(value);
    setDateError(null);
  }

  function handleConfirmDate() {
    if (!draftDate) return;
    if (isSunday(draftDate)) {
      setDateError("Solo se puede reservar de lunes a sábado.");
      return;
    }
    setDateError(null);
    setDate(draftDate);
  }

  function handleChangeDate() {
    setDate("");
    setDraftDate("");
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
            key={inputKey}
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
          <div className="flex flex-col gap-2">
            {nextDateStatus === "ready" && nextDate === null ? (
              <p className="text-sm text-muted-foreground">
                No hay turnos disponibles en los próximos meses. Agenda completa.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  No hay horarios disponibles ese día.
                </p>
                {nextDateStatus === "ready" && nextDate && (
                  <Button type="button" size="sm" variant="outline" onClick={handleJumpToNextDate}>
                    Ver próxima fecha disponible: {formatLongDate(nextDate)}
                  </Button>
                )}
              </>
            )}
          </div>
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
      {date ? (
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
              defaultValue={draftDate}
              aria-invalid={!!dateError}
              aria-describedby={dateError ? "appointment_date-error" : undefined}
              onChange={(e) => handleDraftDateChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Turnos de lunes a sábado.</p>
            {dateError && (
              <p id="appointment_date-error" role="alert" className="text-sm text-red-600">
                {dateError}
              </p>
            )}
            <Button
              type="button"
              size="sm"
              className="self-start"
              disabled={!draftDate}
              onClick={handleConfirmDate}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {date &&
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
                <div className="flex flex-col gap-2">
                  {nextDateStatus === "ready" && nextDate === null ? (
                    <p className="text-sm text-muted-foreground">
                      No hay turnos disponibles en los próximos meses. Agenda completa.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        No hay horarios disponibles ese día. Probá con otra fecha.
                      </p>
                      {nextDateStatus === "ready" && nextDate && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="self-start"
                          onClick={handleJumpToNextDate}
                        >
                          Ver próxima fecha disponible: {formatLongDate(nextDate)}
                        </Button>
                      )}
                    </>
                  )}
                </div>
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
