"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAvailabilityRules } from "@/features/appointments/hooks/useAvailabilityRules";
import type { AvailabilityRule } from "@/features/appointments/types";

// Lunes a sábado: SALUS no opera domingos.
const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const DEFAULT_START = "09:00";
const DEFAULT_END = "18:00";
const LAST_TIME_OPTION = "23:30";

// Cada media hora, de 00:00 a 23:30: son los únicos horarios que se pueden elegir.
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, "0");
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

const timeSelectClass =
  "h-8 w-24 rounded-md border border-brand-teal/40 bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-teal disabled:cursor-not-allowed disabled:opacity-50";

// Sugiere la siguiente franja a partir del fin de la última cargada ese día (en vez de repetir
// 09:00-18:00, que casi siempre se superpondría con una franja ya existente). Si no queda lugar
// antes de las 23:30, igual devuelve algo -- el trigger del backend avisa si se superpone.
function suggestNextRange(dayRules: AvailabilityRule[]): { start: string; end: string } {
  if (dayRules.length === 0) return { start: DEFAULT_START, end: DEFAULT_END };
  const lastEnd = dayRules
    .map((r) => r.end_time.slice(0, 5))
    .sort()
    .at(-1)!;
  const [h, m] = lastEnd.split(":").map(Number);
  const endMinutes = Math.min(h * 60 + m + 120, 23 * 60 + 30);
  const end =
    endMinutes === 23 * 60 + 30
      ? LAST_TIME_OPTION
      : `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${endMinutes % 60 === 0 ? "00" : "30"}`;
  return { start: lastEnd, end };
}

function RangeRow({
  rule,
  isSaving,
  onRemove,
  onSave,
}: {
  rule: AvailabilityRule;
  isSaving: boolean;
  onRemove: (id: string) => void;
  onSave: (id: string, start: string, end: string) => void;
}) {
  const [start, setStart] = useState(rule.start_time.slice(0, 5));
  const [end, setEnd] = useState(rule.end_time.slice(0, 5));
  const [rangeError, setRangeError] = useState<string | undefined>();

  const dirty = start !== rule.start_time.slice(0, 5) || end !== rule.end_time.slice(0, 5);

  function handleSave() {
    if (start >= end) {
      setRangeError("El horario de fin debe ser posterior al de inicio.");
      return;
    }
    setRangeError(undefined);
    onSave(rule.id, start, end);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          aria-label="Hora de inicio"
          className={timeSelectClass}
          value={start}
          disabled={isSaving}
          onChange={(e) => {
            setStart(e.target.value);
            setRangeError(undefined);
          }}
        >
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
          value={end}
          disabled={isSaving}
          onChange={(e) => {
            setEnd(e.target.value);
            setRangeError(undefined);
          }}
        >
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {dirty && (
          <Button type="button" size="sm" variant="outline" disabled={isSaving} onClick={handleSave}>
            Guardar
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Quitar franja"
          disabled={isSaving}
          onClick={() => onRemove(rule.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {rangeError && (
        <p role="alert" className="text-xs text-red-600">
          {rangeError}
        </p>
      )}
    </div>
  );
}

function DayRanges({
  day,
  dayRules,
  isSaving,
  onAdd,
  onRemove,
  onSave,
}: {
  day: { value: number; label: string };
  dayRules: AvailabilityRule[];
  isSaving: boolean;
  onAdd: (day: number, start: string, end: string) => void;
  onRemove: (id: string) => void;
  onSave: (id: string, start: string, end: string) => void;
}) {
  const sortedRules = [...dayRules].sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="flex flex-wrap items-start gap-3 p-2.5">
      <span className="w-32 shrink-0 pt-1.5 text-sm font-medium text-brand-navy">{day.label}</span>
      <div className="flex flex-col items-start gap-2">
        {sortedRules.length === 0 && (
          <span className="pt-1.5 text-sm text-muted-foreground">Día libre</span>
        )}
        {sortedRules.map((rule) => (
          <RangeRow key={rule.id} rule={rule} isSaving={isSaving} onRemove={onRemove} onSave={onSave} />
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isSaving}
          onClick={() => {
            const { start, end } = suggestNextRange(sortedRules);
            onAdd(day.value, start, end);
          }}
        >
          <Plus className="size-3.5" />
          Agregar franja
        </Button>
      </div>
    </div>
  );
}

export function WeeklyAvailabilityForm({
  professionalId,
  onChanged,
}: {
  professionalId: string;
  onChanged?: () => void;
}) {
  const { rules, status, error, isSaving, addRule, removeRule, updateRule } =
    useAvailabilityRules(professionalId);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-brand-navy">Horario semanal</CardTitle>
        <p className="text-sm text-muted-foreground">
          Se atiende de lunes a sábado. Podés cargar más de una franja por día (por ejemplo,
          mañana y tarde con un corte al mediodía). Los cambios solo afectan turnos futuros, no
          modifican los ya reservados.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {status === "loading" && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            Error al cargar tu disponibilidad.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex flex-col divide-y rounded-md border">
          {DAYS.map((day) => (
            <DayRanges
              key={day.value}
              day={day}
              dayRules={rules.filter((r) => r.day_of_week === day.value)}
              isSaving={isSaving}
              onAdd={async (d, start, end) => {
                const ok = await addRule(d, start, end);
                if (ok) onChanged?.();
              }}
              onRemove={async (id) => {
                await removeRule(id);
                onChanged?.();
              }}
              onSave={async (id, start, end) => {
                const ok = await updateRule(id, start, end);
                if (ok) onChanged?.();
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
