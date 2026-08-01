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

  async function create(
    input: ProfessionalCreateInput & { photoFile?: File | null; photoRemoved?: boolean },
  ) {
    setIsLoading(true);
    setError(null);

    try {
      const { photoFile, ...rest } = input;
      const { id } = await adminCreateProfessional(rest);

      if (photoFile) {
        try {
          const photo_url = await uploadProfessionalPhoto(id, photoFile);
          await updateProfessional(id, { photo_url });
        } catch (photoErr) {
          // El profesional ya quedó creado: no reintentar el alta completa (duplicaría el
          // usuario de auth). Se manda a editar para que puedan subir la foto de nuevo.
          console.error("No se pudo subir la foto del profesional recién creado:", photoErr);
          router.push(`/admin/profesionales/${id}/editar`);
          return;
        }
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
