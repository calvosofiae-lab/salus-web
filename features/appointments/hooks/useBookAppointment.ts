"use client";

import { useState } from "react";
import { bookAppointment } from "@/repositories/appointmentsRepository";
import { notifyAppointmentBookedByEmail } from "@/services/emailNotificationService";
import { getErrorMessage } from "@/lib/errors";

export function useBookAppointment() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  async function book(params: {
    professionalId: string;
    date: string;
    startTime: string;
    firstName: string;
    lastName: string;
    email: string;
    whatsapp: string;
    whatsappCountry: string;
  }) {
    setIsLoading(true);
    setError(null);

    try {
      const id = await bookAppointment(params);
      setConfirmedId(id);
      // La reserva ya quedó confirmada arriba: un fallo acá nunca debe afectarla. No se
      // espera esta llamada para no extender el estado de carga.
      notifyAppointmentBookedByEmail(id).catch(() => {});
      return id;
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al reservar el turno"));
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { book, error, isLoading, confirmedId };
}
