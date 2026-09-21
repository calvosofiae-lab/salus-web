"use client";

import { useState } from "react";
import {
  createAppointmentAsProfessional,
  type CreateAppointmentAsProfessionalInput,
  type CreatedAppointmentResult,
} from "@/repositories/appointmentsRepository";
import { getErrorMessage } from "@/lib/errors";

export function useCreateAppointment() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CreatedAppointmentResult[] | null>(null);

  async function create(input: CreateAppointmentAsProfessionalInput) {
    setIsLoading(true);
    setError(null);

    try {
      const created = await createAppointmentAsProfessional(input);
      setResults(created);
      return created;
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al crear el turno"));
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  const created = results?.length ?? 0;
  const withConflict = results?.filter((r) => r.conflictCount > 0).length ?? 0;

  return { create, error, isLoading, results, created, withConflict };
}
