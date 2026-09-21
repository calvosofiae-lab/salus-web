"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResetProfessionalPassword } from "@/features/professionals/hooks/useResetProfessionalPassword";

// Hexadecimal generado con la Web Crypto API: suficiente entropía para una contraseña
// provisoria y sin caracteres ambiguos (O/0, l/1) al pasarla por WhatsApp de un vistazo.
function generateRandomPassword(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function ResetProfessionalPasswordForm({ professionalId }: { professionalId: string }) {
  const [password, setPassword] = useState("");
  const { resetPassword, error, isLoading, success } =
    useResetProfessionalPassword(professionalId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await resetPassword(password);
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-brand-navy">Restablecer contraseña</CardTitle>
        <p className="text-sm text-muted-foreground">
          Define una nueva contraseña de acceso para este profesional. No se le avisa
          automáticamente: hay que compartírsela por otro medio (WhatsApp, email).
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid max-w-xs gap-1.5">
            <Label htmlFor="new_password">Nueva contraseña</Label>
            <div className="flex gap-2">
              {/* En texto plano a propósito: el admin la define/genera para pasarla al
                  profesional, no la está tipeando para autenticarse. */}
              <Input
                id="new_password"
                type="text"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setPassword(generateRandomPassword())}
              >
                Generar
              </Button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="text-sm text-green-700">
              Contraseña actualizada correctamente.
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading || password.length < 6}
            aria-busy={isLoading}
            className="self-start"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              "Guardar contraseña"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
