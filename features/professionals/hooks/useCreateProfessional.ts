"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateProfessional } from "@/features/professionals/services/adminCreateProfessional";
import type { ProfessionalCreateInput } from "@/features/professionals/types";

export function useCreateProfessional() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function create(input: ProfessionalCreateInput) {
    setIsLoading(true);
    setError(null);

    try {
      await adminCreateProfessional(input);
      router.push("/admin/profesionales");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al crear el profesional");
    } finally {
      setIsLoading(false);
    }
  }

  return { create, error, isLoading };
}
