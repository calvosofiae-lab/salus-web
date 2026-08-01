"use client";

import { useState } from "react";
import {
  removeProfessionalPhoto,
  updateProfessional,
  uploadProfessionalPhoto,
} from "@/repositories/professionalsRepository";
import { getErrorMessage } from "@/lib/errors";
import type { ProfessionalFormSubmitValues } from "@/features/professionals/components/ProfessionalForm";

export function useUpdateOwnProfile(id: string) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function update({ photoFile, photoRemoved, ...values }: ProfessionalFormSubmitValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let photo_url = values.photo_url;
      if (photoFile) {
        photo_url = await uploadProfessionalPhoto(id, photoFile);
      } else if (photoRemoved) {
        await removeProfessionalPhoto(id);
      }
      await updateProfessional(id, { ...values, photo_url });
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al actualizar tu perfil"));
    } finally {
      setIsLoading(false);
    }
  }

  return { update, error, success, isLoading };
}
