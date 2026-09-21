"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAppointmentsForProfessional,
  rescheduleAppointment,
  updateAppointmentStatus,
} from "@/repositories/appointmentsRepository";
import {
  notifyAppointmentCancelledEmail,
  notifyAppointmentRescheduledEmail,
} from "@/services/emailNotificationService";
import { getErrorMessage } from "@/lib/errors";
import type { Appointment, AppointmentStatus } from "@/features/appointments/types";

export function useMyAppointments(professionalId: string, from: string, to: string) {
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

  async function changeStatus(
    id: string,
    newStatus: AppointmentStatus,
  ): Promise<{ success: true } | { success: false; error: string }> {
    try {
      await updateAppointmentStatus(id, newStatus);
      // Solo la cancelación le cambia el plan al paciente: 'realizado' y 'no_asistio' son
      // registro interno del profesional y no ameritan un mail. El cambio ya quedó guardado,
      // así que un fallo del aviso no se propaga ni demora el refresco de la lista.
      if (newStatus === "cancelado") {
        notifyAppointmentCancelledEmail(id).catch(() => {});
      }
      await load();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: getErrorMessage(err, "No se pudo cambiar el estado del turno"),
      };
    }
  }

  async function reschedule(
    id: string,
    date: string,
    startTime: string,
  ): Promise<{ success: true } | { success: false; error: string }> {
    // La fecha/hora vieja solo existe en la lista ya cargada: hay que leerla antes de
    // reprogramar, porque después el turno queda con la nueva y se pierde la anterior.
    const previous = appointments.find((a) => a.id === id);

    try {
      await rescheduleAppointment(id, date, startTime);
      if (previous) {
        notifyAppointmentRescheduledEmail(id, previous.appointment_date, previous.start_time).catch(
          () => {},
        );
      }
      await load();
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, "No se pudo reprogramar el turno") };
    }
  }

  return { appointments, status, changeStatus, reschedule, reload: load };
}
