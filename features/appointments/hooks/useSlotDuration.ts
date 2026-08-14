"use client";

import { useCallback, useEffect, useState } from "react";
import { getSlotDuration, updateSlotDuration } from "@/repositories/availabilityRepository";
import { getErrorMessage } from "@/lib/errors";
import type { SlotDuration } from "@/features/appointments/types";

export function useSlotDuration(professionalId: string) {
  const [duration, setDuration] = useState<SlotDuration>(60);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getSlotDuration(professionalId);
      setDuration(data);
      setStatus("ready");
    } catch (err) {
      console.error("Error al cargar la duración del turno:", err);
      setStatus("error");
    }
  }, [professionalId]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeDuration(minutes: SlotDuration) {
    setIsSaving(true);
    setError(null);
    try {
      await updateSlotDuration(professionalId, minutes);
      setDuration(minutes);
      return true;
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al actualizar la duración del turno"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return { duration, status, error, isSaving, changeDuration };
}
