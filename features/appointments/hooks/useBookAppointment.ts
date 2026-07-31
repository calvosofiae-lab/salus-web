"use client";

import { useState } from "react";
import { bookAppointment } from "@/repositories/appointmentsRepository";

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
    whatsapp: string;
  }) {
    setIsLoading(true);
    setError(null);

    try {
      const id = await bookAppointment(params);
      setConfirmedId(id);
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al reservar el turno");
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { book, error, isLoading, confirmedId };
}
