"use client";

import { useRef, useState } from "react";
import { CalendarCheck, CalendarDays, Clock, Loader2, MapPin, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatLongDate } from "@/features/appointments/lib/date";
import { BookingStepHeading } from "@/features/appointments/components/BookingStep";
import {
  getPhoneCountry,
  isValidPhoneNumber,
  PHONE_COUNTRIES,
  sanitizePhoneDigits,
} from "@/lib/whatsapp";

const selectClassName =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export interface PatientValues {
  firstName: string;
  lastName: string;
  whatsapp: string;
  whatsappCountry: string;
}

export function BookingForm({
  date,
  time,
  professionalName,
  modalityLabel,
  values,
  onValuesChange,
  onSubmit,
  isLoading,
  error,
}: {
  date: string;
  time: string;
  professionalName: string;
  modalityLabel: string;
  // Controlado desde el padre para que los datos sobrevivan si el usuario vuelve a cambiar
  // la fecha o el horario (el formulario se desmonta y remonta al ir y volver de esos pasos).
  values: PatientValues;
  onValuesChange: (values: PatientValues) => void;
  onSubmit: (values: PatientValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}) {
  const { firstName, lastName, whatsapp, whatsappCountry } = values;
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  // Guarda contra doble-click: `isLoading` (estado de React) puede tardar un ciclo en
  // reflejarse en el botón, y en ese margen un doble click alcanza a disparar dos reservas.
  const isSubmittingRef = useRef(false);

  const isComplete =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    isValidPhoneNumber(whatsapp, whatsappCountry);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;
    if (!isValidPhoneNumber(whatsapp, whatsappCountry)) {
      const country = getPhoneCountry(whatsappCountry);
      setWhatsappError(`Ingresá tu WhatsApp (${country.numberLength} números para ${country.label}).`);
      return;
    }
    isSubmittingRef.current = true;
    try {
      await onSubmit(values);
    } finally {
      isSubmittingRef.current = false;
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200 flex flex-col gap-4"
    >
      <BookingStepHeading step={3} title="Completá tus datos" />

      <div className="grid gap-4 pl-8 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="firstName">Nombre</Label>
          <Input
            id="firstName"
            required
            autoComplete="given-name"
            placeholder="Juan"
            value={firstName}
            onChange={(e) => onValuesChange({ ...values, firstName: e.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lastName">Apellido</Label>
          <Input
            id="lastName"
            required
            autoComplete="family-name"
            placeholder="Pérez"
            value={lastName}
            onChange={(e) => onValuesChange({ ...values, lastName: e.target.value })}
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <div className="flex gap-2">
            <select
              id="whatsapp_country"
              aria-label="País"
              className={cn(selectClassName, "w-36 shrink-0 sm:w-44")}
              value={whatsappCountry}
              onChange={(e) => {
                onValuesChange({
                  ...values,
                  whatsappCountry: e.target.value,
                  whatsapp: sanitizePhoneDigits(whatsapp, e.target.value),
                });
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
              autoComplete="tel-national"
              maxLength={getPhoneCountry(whatsappCountry).numberLength}
              placeholder={whatsappCountry === "AR" ? "Ej: 3411234567" : "Ej: 666155767"}
              value={whatsapp}
              aria-invalid={!!whatsappError}
              aria-describedby="whatsapp-hint"
              onChange={(e) => {
                onValuesChange({
                  ...values,
                  whatsapp: sanitizePhoneDigits(e.target.value, whatsappCountry),
                });
                setWhatsappError(null);
              }}
            />
          </div>
          <p id="whatsapp-hint" className="text-xs text-muted-foreground">
            {whatsappCountry === "AR" ? "Solo números, sin 0 ni 15." : "Solo números."}
          </p>
          {whatsappError && (
            <p role="alert" className="text-sm text-red-600">
              {whatsappError}
            </p>
          )}
        </div>
      </div>

      <div className="ml-8 rounded-lg border bg-muted/40 p-4 text-sm">
        <p className="mb-2 font-semibold text-primary">Tu turno</p>
        <ul className="flex flex-col gap-1.5 text-muted-foreground">
          <li className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-brand-teal" aria-hidden="true" />
            {formatLongDate(date)}
          </li>
          <li className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-brand-teal" aria-hidden="true" />
            {time.slice(0, 5)} hs
          </li>
          <li className="flex items-center gap-2">
            <UserRound className="size-4 shrink-0 text-brand-teal" aria-hidden="true" />
            {professionalName}
          </li>
          {modalityLabel && (
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-brand-teal" aria-hidden="true" />
              Atención {modalityLabel}
            </li>
          )}
        </ul>

        {(firstName || lastName || whatsapp) && (
          <>
            <div className="my-3 border-t" />
            <p className="mb-1 font-semibold text-primary">Tus datos</p>
            <p className="text-muted-foreground">
              {[firstName, lastName].filter(Boolean).join(" ") || "—"}
            </p>
            {whatsapp && (
              <p className="text-muted-foreground">
                WhatsApp: +{getPhoneCountry(whatsappCountry).dialCode} {whatsapp}
              </p>
            )}
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="ml-8 text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading || !isComplete}
        aria-busy={isLoading}
        className="ml-8 sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Reservando...
          </>
        ) : (
          <>
            <CalendarCheck className="size-4" aria-hidden="true" />
            Confirmar reserva
          </>
        )}
      </Button>
    </form>
  );
}
