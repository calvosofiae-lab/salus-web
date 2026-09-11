"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CalendarPlus, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCreateAppointment } from "@/features/appointments/hooks/useCreateAppointment";
import type { RepeatFrequency } from "@/repositories/appointmentsRepository";
import {
  isValidSplitPhone,
  PHONE_COUNTRY_OPTIONS,
  sanitizeAreaDigits,
  sanitizeNumberDigits,
} from "@/features/appointments/lib/phone";

const selectClassName =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_VALUES = {
  firstName: "",
  lastName: "",
  email: "",
  whatsappCountry: "AR",
  whatsappArea: "",
  whatsappNumber: "",
  date: "",
  time: "",
  repeatFrequency: "none" as RepeatFrequency,
  repeatCount: 2,
};

// Cubre B (repetición semanal/quincenal/mensual) y C (turno puntual, sin repetir, en cualquier
// fecha/hora) con un único formulario: C es simplemente este mismo form con repeatFrequency="none".
// A diferencia de BookingForm, la fecha/hora se tipean libremente -- no dependen de
// get_available_slots/get_day_schedule, para poder cargar horarios fuera de la disponibilidad
// configurada.
export function CreateAppointmentForm({
  professionalId,
  onCreated,
}: {
  professionalId: string;
  onCreated?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState(EMPTY_VALUES);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { create, error, isLoading, results, created, withConflict } = useCreateAppointment();
  const isSubmittingRef = useRef(false);

  const {
    firstName,
    lastName,
    email,
    whatsappCountry,
    whatsappArea,
    whatsappNumber,
    date,
    time,
    repeatFrequency,
    repeatCount,
  } = values;

  const isComplete =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    EMAIL_PATTERN.test(email) &&
    isValidSplitPhone(whatsappArea, whatsappNumber, whatsappCountry) &&
    date.length > 0 &&
    time.length > 0 &&
    (repeatFrequency === "none" || (repeatCount >= 1 && repeatCount <= 52));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;
    if (!EMAIL_PATTERN.test(email)) {
      setEmailError("Ingresá un email válido.");
      return;
    }
    if (!isValidSplitPhone(whatsappArea, whatsappNumber, whatsappCountry)) {
      setWhatsappError("Ingresá un WhatsApp válido para el país seleccionado.");
      return;
    }
    isSubmittingRef.current = true;
    try {
      const createdRows = await create({
        professionalId,
        date,
        startTime: time,
        firstName,
        lastName,
        email,
        whatsapp: `${whatsappArea}${whatsappNumber}`,
        whatsappCountry,
        repeatFrequency,
        repeatCount: repeatFrequency === "none" ? 1 : repeatCount,
      });
      if (createdRows) {
        setValues(EMPTY_VALUES);
        onCreated?.();
      }
    } finally {
      isSubmittingRef.current = false;
    }
  }

  if (!isOpen) {
    return (
      <Button type="button" variant="outline" onClick={() => setIsOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Nuevo turno
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-brand-navy">Nuevo turno</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cargá un turno para un paciente en cualquier fecha y horario, incluso fuera de tu
          disponibilidad habitual. Si repetís el turno, se crea uno por cada fecha.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="new_appt_first_name">Nombre</Label>
              <Input
                id="new_appt_first_name"
                required
                placeholder="Juan"
                value={firstName}
                onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new_appt_last_name">Apellido</Label>
              <Input
                id="new_appt_last_name"
                required
                placeholder="Pérez"
                value={lastName}
                onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="new_appt_email">Email</Label>
              <Input
                id="new_appt_email"
                type="email"
                required
                placeholder="Ej: juan.perez@gmail.com"
                value={email}
                aria-invalid={!!emailError}
                onChange={(e) => {
                  setValues((v) => ({ ...v, email: e.target.value }));
                  setEmailError(null);
                }}
              />
              {emailError && (
                <p role="alert" className="text-sm text-red-600">
                  {emailError}
                </p>
              )}
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="new_appt_whatsapp_country">WhatsApp</Label>
              <div className="flex flex-wrap gap-2">
                <select
                  id="new_appt_whatsapp_country"
                  aria-label="País"
                  className={cn(selectClassName, "w-36 shrink-0 sm:w-44")}
                  value={whatsappCountry}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, whatsappCountry: e.target.value }));
                    setWhatsappError(null);
                  }}
                >
                  {PHONE_COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <Input
                  id="new_appt_whatsapp_area"
                  required
                  inputMode="numeric"
                  className="w-20 shrink-0"
                  maxLength={5}
                  placeholder="Área"
                  aria-label="Código de área, sin el 0"
                  value={whatsappArea}
                  aria-invalid={!!whatsappError}
                  onChange={(e) => {
                    setValues((v) => ({
                      ...v,
                      whatsappArea: sanitizeAreaDigits(e.target.value),
                    }));
                    setWhatsappError(null);
                  }}
                />
                <Input
                  id="new_appt_whatsapp_number"
                  required
                  inputMode="numeric"
                  className="w-32 shrink-0"
                  placeholder="Número"
                  aria-label="Número"
                  value={whatsappNumber}
                  aria-invalid={!!whatsappError}
                  onChange={(e) => {
                    setValues((v) => ({
                      ...v,
                      whatsappNumber: sanitizeNumberDigits(e.target.value),
                    }));
                    setWhatsappError(null);
                  }}
                />
              </div>
              {whatsappError && (
                <p role="alert" className="text-sm text-red-600">
                  {whatsappError}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="new_appt_date">Fecha del primer turno</Label>
              <Input
                id="new_appt_date"
                type="date"
                className="h-9"
                value={date}
                onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new_appt_time">Hora</Label>
              <Input
                id="new_appt_time"
                type="time"
                className="h-9"
                value={time}
                onChange={(e) => setValues((v) => ({ ...v, time: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new_appt_frequency">Repetir</Label>
              <select
                id="new_appt_frequency"
                className={selectClassName}
                value={repeatFrequency}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    repeatFrequency: e.target.value as RepeatFrequency,
                  }))
                }
              >
                <option value="none">Una vez</option>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>
            {repeatFrequency !== "none" && (
              <div className="grid gap-1.5">
                <Label htmlFor="new_appt_repeat_count">Cantidad de veces</Label>
                <Input
                  id="new_appt_repeat_count"
                  type="number"
                  min={1}
                  max={52}
                  className="h-9 w-24"
                  value={repeatCount}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, repeatCount: Number(e.target.value) }))
                  }
                />
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isLoading || !isComplete} aria-busy={isLoading}>
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <CalendarPlus className="size-4" aria-hidden="true" />
              )}
              Crear turno
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Cerrar
            </Button>
          </div>
        </form>

        {results && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-brand-teal/30 bg-brand-teal/5 px-4 py-3 text-sm text-primary"
          >
            <p>{created === 1 ? "Se creó 1 turno." : `Se crearon ${created} turnos.`}</p>
          </div>
        )}
        {results && withConflict > 0 && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              {withConflict === 1
                ? "1 de esos turnos coincide con un horario ya reservado."
                : `${withConflict} de esos turnos coinciden con un horario ya reservado.`}{" "}
              Revisalos en la lista de abajo para reprogramar al paciente que corresponda.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
