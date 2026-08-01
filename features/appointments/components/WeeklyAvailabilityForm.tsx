"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAvailabilityRules } from "@/features/appointments/hooks/useAvailabilityRules";

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export function WeeklyAvailabilityForm({ professionalId }: { professionalId: string }) {
  const { rules, status, addRule, removeRule } = useAvailabilityRules(professionalId);
  const [draft, setDraft] = useState<Record<number, { start: string; end: string }>>({});

  function updateDraft(day: number, field: "start" | "end", value: string) {
    setDraft((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  async function handleAdd(day: number) {
    const d = draft[day];
    if (!d?.start || !d?.end) return;
    await addRule(day, d.start, d.end);
    setDraft((prev) => ({ ...prev, [day]: { start: "", end: "" } }));
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-navy">
          Horario semanal
        </h2>
        <p className="text-xs text-muted-foreground">
          Los cambios solo afectan turnos futuros, no modifican los ya reservados.
        </p>
      </div>
      {status === "loading" && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {status === "error" && (
        <p className="text-sm text-red-500">Error al cargar tu disponibilidad.</p>
      )}
      <div className="flex flex-col divide-y rounded-md border">
        {DAYS.map((day) => {
          const dayRules = rules.filter((r) => r.day_of_week === day.value);
          return (
            <div key={day.value} className="flex flex-wrap items-center gap-2 p-2.5">
              <span className="w-20 shrink-0 text-sm font-medium text-brand-navy">
                {day.label}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {dayRules.map((rule) => (
                  <span
                    key={rule.id}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-teal/15 px-2 py-0.5 text-xs text-brand-teal-dark"
                  >
                    {rule.start_time.slice(0, 5)}–{rule.end_time.slice(0, 5)}
                    <button
                      type="button"
                      className="text-brand-teal-dark/70 hover:text-red-600"
                      onClick={() => removeRule(rule.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <Input
                  type="time"
                  className="h-8 w-24 text-xs"
                  value={draft[day.value]?.start ?? ""}
                  onChange={(e) => updateDraft(day.value, "start", e.target.value)}
                />
                <span className="text-xs text-muted-foreground">a</span>
                <Input
                  type="time"
                  className="h-8 w-24 text-xs"
                  value={draft[day.value]?.end ?? ""}
                  onChange={(e) => updateDraft(day.value, "end", e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAdd(day.value)}
                >
                  Agregar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
