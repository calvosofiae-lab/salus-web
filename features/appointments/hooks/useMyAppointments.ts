"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getOwnAppointments,
  updateAppointmentStatus,
} from "@/repositories/appointmentsRepository";
import type { Appointment, AppointmentStatus } from "@/features/appointments/types";

export function useMyAppointments(professionalId: string, from: string, to: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getOwnAppointments(professionalId, from, to);
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

  async function changeStatus(id: string, newStatus: AppointmentStatus) {
    await updateAppointmentStatus(id, newStatus);
    await load();
  }

  return { appointments, status, changeStatus };
}
