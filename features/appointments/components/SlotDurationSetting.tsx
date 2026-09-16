"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateSlotDuration } from "@/repositories/professionalsRepository";
import { getErrorMessage } from "@/lib/errors";

const OPTIONS: Array<45 | 60> = [45, 60];

export function SlotDurationSetting({
  professionalId,
  minutes,
  onChanged,
}: {
  professionalId: string;
  minutes: 45 | 60;
  onChanged?: (minutes: 45 | 60) => void;
}) {
  const [current, setCurrent] = useState(minutes);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(value: 45 | 60) {
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

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-brand-navy">Duración del turno</CardTitle>
        <p className="text-sm text-muted-foreground">
          Los turnos ya reservados a futuro se ajustan solos a la nueva duración. Si dos quedan
          superpuestos, te lo avisamos arriba para que reprogrames uno de los dos.
        </p>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        {OPTIONS.map((opt) => (
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
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
