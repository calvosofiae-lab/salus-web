"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateProfessional } from "@/features/professionals/services/adminCreateProfessional";
import {
  updateProfessional,
  uploadProfessionalPhoto,
} from "@/repositories/professionalsRepository";
import type { ProfessionalCreateInput } from "@/features/professionals/types";

export function useCreateProfessional() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function create(input: ProfessionalCreateInput & { photoFile?: File | null }) {
    setIsLoading(true);
    setError(null);

    try {
      const { photoFile, ...rest } = input;
      const { id } = await adminCreateProfessional(rest);
      if (photoFile) {
        const photo_url = await uploadProfessionalPhoto(id, photoFile);
        await updateProfessional(id, { photo_url });
      }
      router.push("/admin/profesionales");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al crear el profesional");
    } finally {
      setIsLoading(false);
    }
  }

  return { create, error, isLoading };
}
