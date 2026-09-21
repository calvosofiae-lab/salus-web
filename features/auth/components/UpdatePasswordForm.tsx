"use client";

import { AlertCircle, KeyRound, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUpdatePassword } from "@/features/auth/hooks/useUpdatePassword";

// Cuando el link de recupero es inválido, ya fue usado, o expiró, Supabase no deja llegar al
// usuario a esta página con una sesión válida: redirige acá igual pero agrega `error`/
// `error_description` en el query string y en el hash (`#error=...`). Sin este chequeo, el
// formulario se mostraba igual y el usuario recién se enteraba de que el link no servía al
// intentar guardar la contraseña, con un mensaje genérico que no explicaba nada.
function hasLinkError(): boolean {
  const fromQuery = new URLSearchParams(window.location.search);
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return Boolean(fromQuery.get("error") ?? fromHash.get("error"));
}

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [linkError, setLinkError] = useState(false);
  const { updatePassword, error, isLoading } = useUpdatePassword();
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setLinkError(hasLinkError());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;
    try {
      await updatePassword(password);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  if (linkError) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="border-t-4 border-t-destructive">
          <CardHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl text-brand-navy">Link inválido o expirado</CardTitle>
            <CardDescription>
              Este link de recupero ya no es válido. Puede haber expirado o haber sido usado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pedí un nuevo email para restablecer tu contraseña.
            </p>
            <Link
              href="/auth/forgot-password"
              className="mt-4 inline-block text-sm text-brand-teal-dark underline-offset-4 hover:underline"
            >
              Solicitar nuevo link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-t-4 border-t-brand-teal">
        <CardHeader>
          <CardTitle className="text-2xl text-brand-navy">Restablecer contraseña</CardTitle>
          <CardDescription>Ingresá tu nueva contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
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
              <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
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
    </div>
  );
}
