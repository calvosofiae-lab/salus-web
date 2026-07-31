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
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Horario semanal</h2>
      <p className="text-sm text-muted-foreground">
        Los cambios de disponibilidad solo afectan turnos futuros; no modifican turnos ya
        reservados.
      </p>
      {status === "loading" && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {status === "error" && (
        <p className="text-sm text-red-500">Error al cargar tu disponibilidad.</p>
      )}
      <div className="flex flex-col gap-4">
        {DAYS.map((day) => {
          const dayRules = rules.filter((r) => r.day_of_week === day.value);
          return (
            <div key={day.value} className="border rounded-md p-3 flex flex-col gap-2">
              <span className="font-medium text-sm">{day.label}</span>
              <div className="flex flex-wrap gap-2">
                {dayRules.map((rule) => (
                  <span
                    key={rule.id}
                    className="inline-flex items-center gap-2 rounded-md bg-secondary px-2 py-1 text-xs"
                  >
                    {rule.start_time.slice(0, 5)}–{rule.end_time.slice(0, 5)}
                    <button
                      type="button"
                      className="text-red-500"
                      onClick={() => removeRule(rule.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  className="w-32"
                  value={draft[day.value]?.start ?? ""}
                  onChange={(e) => updateDraft(day.value, "start", e.target.value)}
                />
                <span className="text-sm">a</span>
                <Input
                  type="time"
                  className="w-32"
                  value={draft[day.value]?.end ?? ""}
                  onChange={(e) => updateDraft(day.value, "end", e.target.value)}
                />
                <Button type="button" size="sm" onClick={() => handleAdd(day.value)}>
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
