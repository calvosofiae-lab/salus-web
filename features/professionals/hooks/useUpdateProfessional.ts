"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  removeProfessionalPhoto,
  updateProfessional,
  uploadProfessionalPhoto,
} from "@/repositories/professionalsRepository";
import { getErrorMessage } from "@/lib/errors";
import type { ProfessionalFormSubmitValues } from "@/features/professionals/components/ProfessionalForm";

export function useUpdateProfessional(id: string) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function update({ photoFile, photoRemoved, ...values }: ProfessionalFormSubmitValues) {
    setIsLoading(true);
    setError(null);

    try {
      let photo_url = values.photo_url;
      if (photoFile) {
        photo_url = await uploadProfessionalPhoto(id, photoFile);
      } else if (photoRemoved) {
        await removeProfessionalPhoto(id);
      }
      await updateProfessional(id, { ...values, photo_url });
      router.push("/admin/profesionales");
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al actualizar el profesional"));
    } finally {
      setIsLoading(false);
    }
  }

  return { update, error, isLoading };
}
