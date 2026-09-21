"use client";

import { useCallback, useEffect, useState } from "react";
import { getMonthDatesWithoutAvailability } from "@/repositories/availabilityRepository";

// month es 0-11 (como Date). Fechas del mes visible sin ningún horario disponible -- para
// pintarlas de amarillo en el almanaque.
export function useMonthAvailability(professionalId: string, year: number, month: number) {
  const [datesWithoutAvailability, setDatesWithoutAvailability] = useState<Set<string>>(
    new Set(),
  );
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      const dates = await getMonthDatesWithoutAvailability(professionalId, year, month);
      setDatesWithoutAvailability(dates);
      setStatus("ready");
    } catch (err) {
      console.error("Error al cargar la disponibilidad del mes:", err);
      setStatus("error");
    }
  }, [professionalId, year, month]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { datesWithoutAvailability, status, reload };
}
