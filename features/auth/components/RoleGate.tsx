"use client";

import { useSession } from "@/features/auth/hooks/useSession";
import type { Role } from "@/features/auth/types";

export function RoleGate({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { session } = useSession();

  if (!session || !roles.includes(session.role)) return null;
  return <>{children}</>;
}
