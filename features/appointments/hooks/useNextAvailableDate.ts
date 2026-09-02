"use client";

import { useEffect, useState } from "react";
import { getNextAvailableDate } from "@/repositories/availabilityRepository";

/** Busca la próxima fecha con horarios libres a partir de `fromDate` (excluyéndola). Se usa
 * cuando el día elegido en `SlotPicker` no tiene horarios, para poder avisar "agenda completa"
 * u ofrecer saltar directo a esa fecha. `fromDate` en null deja el hook inactivo. */
export function useNextAvailableDate(professionalId: string, fromDate: string | null) {
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (!fromDate) {
      setNextDate(null);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    const searchFrom = new Date(`${fromDate}T00:00:00`);
    searchFrom.setDate(searchFrom.getDate() + 1);
    const isoSearchFrom = searchFrom.toISOString().slice(0, 10);

    getNextAvailableDate(professionalId, isoSearchFrom)
      .then((date) => {
        if (cancelled) return;
        setNextDate(date);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error al buscar la próxima fecha disponible:", err);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [professionalId, fromDate]);

  return { nextDate, status };
}
