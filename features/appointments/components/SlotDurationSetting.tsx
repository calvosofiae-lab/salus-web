"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateBreakMinutes, updateSlotDuration } from "@/repositories/professionalsRepository";
import { getErrorMessage } from "@/lib/errors";
import {
  BREAK_OPTIONS,
  sessionMinutes,
  type BreakMinutes,
  type SlotDurationMinutes,
} from "@/features/appointments/lib/sessionTime";

const SLOT_OPTIONS: SlotDurationMinutes[] = [45, 60];

export function SlotDurationSetting({
  professionalId,
  minutes,
  breakMinutes,
  onChanged,
  onBreakChanged,
}: {
  professionalId: string;
  minutes: SlotDurationMinutes;
  breakMinutes: BreakMinutes;
  onChanged?: (minutes: SlotDurationMinutes) => void;
  onBreakChanged?: (minutes: BreakMinutes) => void;
}) {
  const [current, setCurrent] = useState(minutes);
  const [currentBreak, setCurrentBreak] = useState(breakMinutes);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(value: SlotDurationMinutes) {
    if (value === current || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateSlotDuration(professionalId, value);
      setCurrent(value);
      onChanged?.(value);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cambiar la duración del turno"));
    } finally {
      setIsSaving(false);
    }
  }

  // El descanso va dentro del turno: no cambia la grilla de horarios (no hace falta recargar
  // get_day_schedule), solo dónde se muestra que termina cada sesión.
  async function handleSelectBreak(value: BreakMinutes) {
    if (value === currentBreak || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateBreakMinutes(professionalId, value);
      setCurrentBreak(value);
      onBreakChanged?.(value);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cambiar el descanso entre sesiones"));
    } finally {
      setIsSaving(false);
    }
  }

  const session = sessionMinutes(current, currentBreak);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-brand-navy">Duración del turno</CardTitle>
        <p className="text-sm text-muted-foreground">
          Los turnos ya reservados a futuro se ajustan solos a la nueva duración. Si dos quedan
          superpuestos, te lo avisamos arriba para que reprogrames uno de los dos.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          {SLOT_OPTIONS.map((opt) => (
            <Button
              key={opt}
              type="button"
              size="sm"
              variant={current === opt ? "default" : "outline"}
              disabled={isSaving}
              onClick={() => handleSelect(opt)}
            >
              {opt} minutos
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-brand-navy">Descanso dentro del turno</p>
          <p className="text-sm text-muted-foreground">
            Parte del turno que queda libre después de la sesión. No cambia tus horarios ni los
            turnos ya reservados.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {BREAK_OPTIONS.map((opt) => (
              <Button
                key={opt}
                type="button"
                size="sm"
                variant={currentBreak === opt ? "default" : "outline"}
                disabled={isSaving}
                onClick={() => handleSelectBreak(opt)}
              >
                {opt === 0 ? "Sin descanso" : `${opt} minutos`}
              </Button>
            ))}
          </div>
          <p className="text-sm text-brand-navy">
            {currentBreak === 0
              ? `Sesión de ${session} minutos, sin descanso entre turnos.`
              : `Sesión de ${session} minutos + ${currentBreak} de descanso (turno de ${current}).`}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
