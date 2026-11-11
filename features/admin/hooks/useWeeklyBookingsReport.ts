"use client";

import { useCallback, useEffect, useState } from "react";
import { getWeeklyBookingsReport } from "@/repositories/professionalsRepository";
import type { WeeklyBookingsRow } from "@/features/admin/types";

type Status = "loading" | "error" | "ready";

// startWeek: lunes de la primera semana del rango, "YYYY-MM-DD".
export function useWeeklyBookingsReport(startWeek: string, weeks: number) {
  const [status, setStatus] = useState<Status>("loading");
  const [rows, setRows] = useState<WeeklyBookingsRow[]>([]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getWeeklyBookingsReport(startWeek, weeks);
      setRows(data);
      setStatus("ready");
    } catch (err) {
      console.error("Error al cargar el reporte semanal de sesiones:", err);
      setStatus("error");
    }
  }, [startWeek, weeks]);

  useEffect(() => {
    load();
  }, [load]);

  return { status, rows, reload: load };
}
