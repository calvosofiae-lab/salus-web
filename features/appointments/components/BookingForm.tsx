"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isValidWhatsappNumber,
  sanitizeWhatsappDigits,
  WHATSAPP_NUMBER_LENGTH,
} from "@/lib/whatsapp";

export function BookingForm({
  onSubmit,
  isLoading,
  error,
}: {
  onSubmit: (values: { firstName: string; lastName: string; whatsapp: string }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidWhatsappNumber(whatsapp)) {
      setWhatsappError(
        `Ingresá tu WhatsApp sin 0 ni 15 (${WHATSAPP_NUMBER_LENGTH} números, código de área + línea).`,
      );
      return;
    }
    await onSubmit({ firstName, lastName, whatsapp });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div className="grid gap-2">
        <Label htmlFor="firstName">Nombre</Label>
        <Input
          id="firstName"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lastName">Apellido</Label>
        <Input
          id="lastName"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          required
          inputMode="numeric"
          maxLength={WHATSAPP_NUMBER_LENGTH}
          placeholder="Ej: 3411234567"
          value={whatsapp}
          onChange={(e) => {
            setWhatsapp(sanitizeWhatsappDigits(e.target.value));
            setWhatsappError(null);
          }}
        />
        <p className="text-xs text-muted-foreground">Solo números, sin 0 ni 15.</p>
        {whatsappError && <p className="text-sm text-red-500">{whatsappError}</p>}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Reservando..." : "Confirmar reserva"}
      </Button>
    </form>
  );
}
