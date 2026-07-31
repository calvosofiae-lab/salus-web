"use client";

import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/hooks/useLogout";

export function LogoutButton() {
  const { logout } = useLogout();

  return <Button onClick={logout}>Cerrar sesión</Button>;
}
