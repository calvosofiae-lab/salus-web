"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getOwnAppointments,
  updateAppointmentStatus,
} from "@/repositories/appointmentsRepository";
import type { Appointment, AppointmentStatus } from "@/features/appointments/types";

export function useMyAppointments(professionalId: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getOwnAppointments(professionalId);
      setAppointments(data);
      setStatus("ready");
    } catch (err) {
      console.error("Error al cargar turnos:", err);
      setStatus("error");
    }
  }, [professionalId]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(id: string, newStatus: AppointmentStatus) {
    await updateAppointmentStatus(id, newStatus);
    await load();
  }

  return { appointments, status, changeStatus };
}
