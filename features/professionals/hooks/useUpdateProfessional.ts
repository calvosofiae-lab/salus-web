"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateProfessional,
  uploadProfessionalPhoto,
} from "@/repositories/professionalsRepository";
import type { ProfessionalFormSubmitValues } from "@/features/professionals/components/ProfessionalForm";

export function useUpdateProfessional(id: string) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function update({ photoFile, ...values }: ProfessionalFormSubmitValues) {
    setIsLoading(true);
    setError(null);

    try {
      const photo_url = photoFile ? await uploadProfessionalPhoto(id, photoFile) : values.photo_url;
      await updateProfessional(id, { ...values, photo_url });
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
