"use client";

import { useCallback, useEffect, useState } from "react";
import { getAvailableSlots } from "@/repositories/availabilityRepository";

export function useAvailableSlots(professionalId: string, date: string | null) {
  const [slots, setSlots] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const load = useCallback(async () => {
    if (!date) {
      setSlots([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    try {
      const data = await getAvailableSlots(professionalId, date);
      setSlots(data);
      setStatus("ready");
    } catch (err) {
      console.error("Error al cargar horarios disponibles:", err);
      setStatus("error");
    }
  }, [professionalId, date]);

  useEffect(() => {
    load();
  }, [load]);

  return { slots, status, reload: load };
}
