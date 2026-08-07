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
import { Loader2, LogIn } from "lucide-react";
import { useLogin } from "@/features/auth/hooks/useLogin";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, isLoading } = useLogin();
  const isSubmittingRef = useRef(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;
    try {
      await login(email, password);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Link href="/" className="mx-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-salus.png"
          alt="SALUS - Red de Profesionales"
          className="h-28 w-28 rounded-full border-2 border-brand-teal object-cover"
        />
      </Link>
      <Card className="border-t-4 border-t-brand-teal">
        <CardHeader>
          <CardTitle className="text-2xl text-brand-navy">Iniciar sesión</CardTitle>
          <CardDescription>
            Acceso para administradores y profesionales de SALUS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
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
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm text-brand-teal-dark underline-offset-4 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
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
                  <LogIn className="size-4" aria-hidden="true" />
                )}
                {isLoading ? "Ingresando..." : "Ingresar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
