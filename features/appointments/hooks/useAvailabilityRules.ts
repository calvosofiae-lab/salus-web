"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAvailabilityRule,
  deleteAvailabilityRule,
  getOwnAvailabilityRules,
} from "@/repositories/availabilityRepository";
import type { AvailabilityRule } from "@/features/appointments/types";

export function useAvailabilityRules(professionalId: string) {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getOwnAvailabilityRules(professionalId);
      setRules(data);
      setStatus("ready");
    } catch (err) {
      console.error("Error al cargar disponibilidad:", err);
      setStatus("error");
    }
  }, [professionalId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addRule(dayOfWeek: number, startTime: string, endTime: string) {
    setIsSaving(true);
    setError(null);
    try {
      await createAvailabilityRule({
        professional_id: professionalId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
      });
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al agregar el horario");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function removeRule(id: string) {
    setIsSaving(true);
    setError(null);
    try {
      await deleteAvailabilityRule(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al quitar el horario");
    } finally {
      setIsSaving(false);
    }
  }

  return { rules, status, error, isSaving, addRule, removeRule };
}
