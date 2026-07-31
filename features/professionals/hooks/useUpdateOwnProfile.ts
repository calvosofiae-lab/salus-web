"use client";

import { useState } from "react";
import { updateProfessional } from "@/repositories/professionalsRepository";
import type { ProfessionalFormValues } from "@/features/professionals/types";

export function useUpdateOwnProfile(id: string) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function update(values: ProfessionalFormValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfessional(id, values);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error al actualizar tu perfil",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return { update, error, success, isLoading };
}
