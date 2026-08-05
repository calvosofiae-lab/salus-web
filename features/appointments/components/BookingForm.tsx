"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PHONE_COUNTRY,
  getPhoneCountry,
  isValidPhoneNumber,
  PHONE_COUNTRIES,
  sanitizePhoneDigits,
} from "@/lib/whatsapp";

const selectClassName =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function BookingForm({
  onSubmit,
  isLoading,
  error,
}: {
  onSubmit: (values: {
    firstName: string;
    lastName: string;
    whatsapp: string;
    whatsappCountry: string;
  }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappCountry, setWhatsappCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhoneNumber(whatsapp, whatsappCountry)) {
      const country = getPhoneCountry(whatsappCountry);
      setWhatsappError(`Ingresá tu WhatsApp (${country.numberLength} números para ${country.label}).`);
      return;
    }
    await onSubmit({ firstName, lastName, whatsapp, whatsappCountry });
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
        <div className="flex gap-2">
          <select
            id="whatsapp_country"
            className={cn(selectClassName, "w-40 shrink-0")}
            value={whatsappCountry}
            onChange={(e) => {
              setWhatsappCountry(e.target.value);
              setWhatsapp((current) => sanitizePhoneDigits(current, e.target.value));
              setWhatsappError(null);
            }}
          >
            {PHONE_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <Input
            id="whatsapp"
            required
            inputMode="numeric"
            maxLength={getPhoneCountry(whatsappCountry).numberLength}
            placeholder={whatsappCountry === "AR" ? "Ej: 3411234567" : "Ej: 666155767"}
            value={whatsapp}
            onChange={(e) => {
              setWhatsapp(sanitizePhoneDigits(e.target.value, whatsappCountry));
              setWhatsappError(null);
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {whatsappCountry === "AR" ? "Solo números, sin 0 ni 15." : "Solo números."}
        </p>
        {whatsappError && <p className="text-sm text-red-500">{whatsappError}</p>}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isLoading}>
        <CalendarCheck className="size-4" />
        {isLoading ? "Reservando..." : "Confirmar reserva"}
      </Button>
    </form>
  );
}
