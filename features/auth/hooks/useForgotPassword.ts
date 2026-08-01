"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";

export function useForgotPassword() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function sendResetEmail(email: string) {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error"));
    } finally {
      setIsLoading(false);
    }
  }

  return { sendResetEmail, error, success, isLoading };
}
