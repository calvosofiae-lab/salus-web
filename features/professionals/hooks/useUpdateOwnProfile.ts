"use client";

import { useState } from "react";
import {
  updateProfessional,
  uploadProfessionalPhoto,
} from "@/repositories/professionalsRepository";
import type { ProfessionalFormSubmitValues } from "@/features/professionals/components/ProfessionalForm";

export function useUpdateOwnProfile(id: string) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function update({ photoFile, ...values }: ProfessionalFormSubmitValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const photo_url = photoFile ? await uploadProfessionalPhoto(id, photoFile) : values.photo_url;
      await updateProfessional(id, { ...values, photo_url });
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
