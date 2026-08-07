"use client";

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
import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useForgotPassword } from "@/features/auth/hooks/useForgotPassword";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const { sendResetEmail, error, success, isLoading } = useForgotPassword();
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;
    try {
      await sendResetEmail(email);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card
          role="status"
          aria-live="polite"
          className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200 border-t-4 border-t-brand-teal"
        >
          <CardHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-brand-teal/10">
              <CheckCircle2 className="size-5 text-brand-teal" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl text-brand-navy">Revisá tu email</CardTitle>
            <CardDescription>Te enviamos instrucciones para restablecer la contraseña</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Si el email corresponde a una cuenta registrada, vas a recibir un correo para
              restablecer tu contraseña.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-t-4 border-t-brand-teal">
          <CardHeader>
            <CardTitle className="text-2xl text-brand-navy">Restablecer contraseña</CardTitle>
            <CardDescription>
              Ingresá tu email y te enviamos un link para restablecer tu contraseña
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    <Send className="size-4" aria-hidden="true" />
                  )}
                  {isLoading ? "Enviando..." : "Enviar email de recupero"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                ¿Ya tenés cuenta?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Iniciar sesión
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
