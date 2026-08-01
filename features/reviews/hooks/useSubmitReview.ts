"use client";

import { useState } from "react";
import { submitReview } from "@/repositories/reviewsRepository";
import { getErrorMessage } from "@/lib/errors";

export function useSubmitReview() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(token: string, rating: number, comment: string) {
    setIsLoading(true);
    setError(null);

    try {
      await submitReview(token, rating, comment);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al enviar tu calificación"));
    } finally {
      setIsLoading(false);
    }
  }

  return { submit, error, success, isLoading };
}
