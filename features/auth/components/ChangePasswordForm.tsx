"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRef, useState } from "react";
import { useChangePassword } from "@/features/auth/hooks/useChangePassword";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const { changePassword, error, success, isLoading } = useChangePassword();
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;
    try {
      await changePassword(password);
      setPassword("");
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-brand-navy">Cambiar contraseña</CardTitle>
        <CardDescription>Elegí una nueva contraseña para tu cuenta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="Nueva contraseña"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            {success && (
              <p role="status" className="text-sm text-green-600">
                Contraseña actualizada correctamente.
              </p>
            )}
            <Button type="submit" className="w-fit" disabled={isLoading} aria-busy={isLoading}>
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound className="size-4" aria-hidden="true" />
              )}
              {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
