"use client";

import { useState } from "react";
import { adminResetProfessionalPassword } from "@/features/professionals/services/adminResetProfessionalPassword";
import { getErrorMessage } from "@/lib/errors";

export function useResetProfessionalPassword(professionalId: string) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function resetPassword(newPassword: string) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await adminResetProfessionalPassword(professionalId, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al restablecer la contraseña."));
    } finally {
      setIsLoading(false);
    }
  }

  return { resetPassword, error, isLoading, success };
}
