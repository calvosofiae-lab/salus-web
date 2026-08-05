"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAvailabilityRules } from "@/features/appointments/hooks/useAvailabilityRules";

// Solo de lunes a viernes: SALUS no opera fines de semana.
const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
];

// Cada media hora, de 00:00 a 23:30: son los únicos horarios que se pueden elegir.
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, "0");
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

const timeSelectClass =
  "h-8 w-24 rounded-md border border-brand-teal/40 bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-teal disabled:cursor-not-allowed disabled:opacity-50";

export function WeeklyAvailabilityForm({ professionalId }: { professionalId: string }) {
  const { rules, status, error, isSaving, addRule, removeRule } =
    useAvailabilityRules(professionalId);
  const [draft, setDraft] = useState<Record<number, { start: string; end: string }>>({});
  const [rangeError, setRangeError] = useState<Record<number, string | undefined>>({});

  function updateDraft(day: number, field: "start" | "end", value: string) {
    setDraft((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    setRangeError((prev) => ({ ...prev, [day]: undefined }));
  }

  async function handleAdd(day: number) {
    const d = draft[day];
    if (!d?.start || !d?.end) return;
    if (d.start >= d.end) {
      setRangeError((prev) => ({
        ...prev,
        [day]: "El horario de fin debe ser posterior al de inicio.",
      }));
      return;
    }
    const [startH, startM] = d.start.split(":").map(Number);
    const [endH, endM] = d.end.split(":").map(Number);
    const durationMinutes = endH * 60 + endM - (startH * 60 + startM);
    if (durationMinutes % 60 !== 0) {
      setRangeError((prev) => ({
        ...prev,
        [day]:
          "El rango debe cubrir turnos completos de 1 hora (por ejemplo, 09:00 a 10:00 o 09:30 a 11:30).",
      }));
      return;
    }
    const success = await addRule(day, d.start, d.end);
    if (success) {
      setDraft((prev) => ({ ...prev, [day]: { start: "", end: "" } }));
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-navy">
          Horario semanal
        </h2>
        <p className="text-xs text-muted-foreground">
          Solo se atiende de lunes a viernes. Los cambios solo afectan turnos futuros, no
          modifican los ya reservados.
        </p>
      </div>
      {status === "loading" && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {status === "error" && (
        <p className="text-sm text-red-500">Error al cargar tu disponibilidad.</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex flex-col divide-y rounded-md border">
        {DAYS.map((day) => {
          const dayRules = rules.filter((r) => r.day_of_week === day.value);
          return (
            <div key={day.value} className="flex flex-wrap items-start gap-2 p-2.5">
              <span className="w-20 shrink-0 pt-1.5 text-sm font-medium text-brand-navy">
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
                      className="text-brand-teal-dark/70 hover:text-red-600 disabled:opacity-50"
                      disabled={isSaving}
                      onClick={() => removeRule(rule.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <select
                    aria-label="Hora de inicio"
                    className={timeSelectClass}
                    value={draft[day.value]?.start ?? ""}
                    onChange={(e) => updateDraft(day.value, "start", e.target.value)}
                  >
                    <option value="">--:--</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground">a</span>
                  <select
                    aria-label="Hora de fin"
                    className={timeSelectClass}
                    value={draft[day.value]?.end ?? ""}
                    onChange={(e) => updateDraft(day.value, "end", e.target.value)}
                  >
                    <option value="">--:--</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => handleAdd(day.value)}
                  >
                    <Plus className="size-3.5" />
                    Agregar
                  </Button>
                </div>
                {rangeError[day.value] && (
                  <p className="text-xs text-red-500">{rangeError[day.value]}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
