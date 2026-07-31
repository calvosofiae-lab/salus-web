"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfessional } from "@/repositories/professionalsRepository";
import type { ProfessionalFormValues } from "@/features/professionals/types";

export function useUpdateProfessional(id: string) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function update(values: ProfessionalFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      await updateProfessional(id, values);
      router.push("/admin/profesionales");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error al actualizar el profesional",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return { update, error, isLoading };
}
