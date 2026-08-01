"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getOwnProfile } from "@/repositories/profilesRepository";
import { getErrorMessage } from "@/lib/errors";

export function useUpdatePassword() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function updatePassword(password: string) {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      const profile = await getOwnProfile(supabase);
      router.push(profile?.role === "admin" ? "/admin" : "/profesional");
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error"));
    } finally {
      setIsLoading(false);
    }
  }

  return { updatePassword, error, isLoading };
}
