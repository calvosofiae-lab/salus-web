"use client";

import { createContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOwnProfile } from "@/repositories/profilesRepository";
import type { Session } from "@/features/auth/types";

export interface SessionContextValue {
  session: Session | null;
  loading: boolean;
}

export const SessionContext = createContext<SessionContextValue>({
  session: null,
  loading: true,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<SessionContextValue>({
    session: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function resolveSession(userId: string | undefined) {
      if (!userId) {
        if (!cancelled) setValue({ session: null, loading: false });
        return;
      }

      const profile = await getOwnProfile(supabase);
      if (cancelled) return;

      if (!profile) {
        setValue({ session: null, loading: false });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      setValue({
        session: {
          user: { id: userId, email: user?.email ?? null },
          profile,
          role: profile.role,
        },
        loading: false,
      });
    }

    supabase.auth.getUser().then(({ data }) => resolveSession(data.user?.id));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      resolveSession(authSession?.user?.id);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
