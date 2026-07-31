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
    await createAvailabilityRule({
      professional_id: professionalId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
    await load();
  }

  async function removeRule(id: string) {
    await deleteAvailabilityRule(id);
    await load();
  }

  return { rules, status, addRule, removeRule };
}
