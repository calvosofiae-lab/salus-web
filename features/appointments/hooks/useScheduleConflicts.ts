"use client";

import { useCallback, useEffect, useState } from "react";
import { getScheduleConflicts } from "@/repositories/appointmentsRepository";

export function useScheduleConflicts(professionalId: string) {
  const [conflictIds, setConflictIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      const ids = await getScheduleConflicts(professionalId);
      setConflictIds(new Set(ids));
      setStatus("ready");
    } catch (err) {
      console.error("Error al cargar conflictos de horario:", err);
      setStatus("error");
    }
  }, [professionalId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { conflictIds, status, reload };
}
