"use client";

import { useState } from "react";
import {
  bookAppointmentAction,
  type BookAppointmentParams,
} from "@/features/appointments/services/bookAppointmentAction";

export function useBookAppointment() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  // La reserva, la validación del captcha y los mails de confirmación pasan todos por el
  // servidor (bookAppointmentAction).
  async function book(params: BookAppointmentParams, captchaToken: string | null) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await bookAppointmentAction(params, captchaToken);
      if (!result.ok) {
        setError(result.error);
        return null;
      }
      setConfirmedId(result.id);
      return result.id;
    } catch {
      setError("Ocurrió un error al reservar el turno. Probá de nuevo en unos minutos.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { book, error, isLoading, confirmedId };
}
