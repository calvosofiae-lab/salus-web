"use client";

import { useCallback, useEffect, useState } from "react";
import { getAppointmentsForProfessional } from "@/repositories/appointmentsRepository";
import type { Appointment } from "@/features/appointments/types";

// Vista de solo lectura para el admin: sin mutaciones (a diferencia de
// useMyAppointments), a propósito -- el admin puede ver los turnos de cualquier
// profesional (RLS lo permite vía is_admin()) pero no debe poder modificarlos acá.
export function useProfessionalAppointmentsReadOnly(
  professionalId: string,
  from: string,
  to: string,
) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getAppointmentsForProfessional(professionalId, from, to);
      setAppointments(data);
      setStatus("ready");
    } catch (err) {
      console.error("Error al cargar turnos:", err);
      setStatus("error");
    }
  }, [professionalId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return { appointments, status };
}
