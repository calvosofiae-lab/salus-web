"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fila compacta para un paso del flujo de reserva ya completado (fecha u horario elegidos),
// con botón para volver a ese paso. Reutilizada por SlotPicker para los pasos 1 y 2.
export function BookingStepDone({
  label,
  value,
  changeLabel,
  onChange,
}: {
  label: string;
  value: ReactNode;
  changeLabel: string;
  onChange: () => void;
}) {
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200 flex items-center justify-between gap-3 rounded-lg border border-brand-teal/30 bg-brand-teal/5 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white">
          <Check className="size-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="truncate text-sm font-semibold text-primary">{value}</p>
        </div>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onChange} className="shrink-0">
        {changeLabel}
      </Button>
    </div>
  );
}

// Encabezado numerado para un paso activo (todavía sin completar) del flujo.
export function BookingStepHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-primary text-xs font-semibold text-primary"
        aria-hidden="true"
      >
        {step}
      </span>
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
    </div>
  );
}
