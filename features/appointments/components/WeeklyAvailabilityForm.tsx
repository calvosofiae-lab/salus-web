"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAvailabilityRules } from "@/features/appointments/hooks/useAvailabilityRules";
import { useSlotDuration } from "@/features/appointments/hooks/useSlotDuration";
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

// Cada 15 minutos, de 00:00 a 23:45: son los únicos horarios que se pueden elegir.
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const hour = String(Math.floor(i / 4)).padStart(2, "0");
  const minute = String((i % 4) * 15).padStart(2, "0");
  return `${hour}:${minute}`;
});

const timeSelectClass =
  "h-8 w-24 rounded-md border border-brand-teal/40 bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-teal disabled:cursor-not-allowed disabled:opacity-50";

function DayRow({
  day,
  rule,
  isSaving,
  onActivate,
  onDeactivate,
  onSave,
}: {
  day: { value: number; label: string };
  rule: AvailabilityRule | undefined;
  isSaving: boolean;
  onActivate: (day: number, start: string, end: string) => void;
  onDeactivate: (id: string) => void;
  onSave: (id: string, start: string, end: string) => void;
}) {
  const [start, setStart] = useState(rule?.start_time.slice(0, 5) ?? DEFAULT_START);
  const [end, setEnd] = useState(rule?.end_time.slice(0, 5) ?? DEFAULT_END);
  const [rangeError, setRangeError] = useState<string | undefined>();

  const dirty = rule ? start !== rule.start_time.slice(0, 5) || end !== rule.end_time.slice(0, 5) : false;

  function validate(): boolean {
    if (start >= end) {
      setRangeError("El horario de fin debe ser posterior al de inicio.");
      return false;
    }
    setRangeError(undefined);
    return true;
  }

  function handleToggle(checked: boolean) {
    if (checked) {
      onActivate(day.value, start, end);
    } else if (rule) {
      onDeactivate(rule.id);
    }
  }

  function handleSave() {
    if (!rule || !validate()) return;
    onSave(rule.id, start, end);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-2.5">
      <label className="flex w-32 shrink-0 items-center gap-2 text-sm font-medium text-brand-navy">
        <Checkbox
          checked={!!rule}
          disabled={isSaving}
          onCheckedChange={(checked) => handleToggle(checked === true)}
        />
        {day.label}
      </label>
      {rule ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <select
              aria-label={`Hora de inicio, ${day.label}`}
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
              aria-label={`Hora de fin, ${day.label}`}
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
          </div>
          {rangeError && (
            <p role="alert" className="text-xs text-red-600">
              {rangeError}
            </p>
          )}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Día libre</span>
      )}
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
  const {
    duration,
    status: durationStatus,
    isSaving: isSavingDuration,
    changeDuration,
  } = useSlotDuration(professionalId);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-brand-navy">Horario semanal</CardTitle>
        <p className="text-sm text-muted-foreground">
          Se atiende de lunes a sábado. Los cambios solo afectan turnos futuros, no modifican
          los ya reservados.
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

        <div className="flex items-center gap-2 border-b pb-4">
          <label htmlFor="slot-duration" className="text-sm font-medium text-brand-navy">
            Duración de cada turno
          </label>
          <select
            id="slot-duration"
            className={timeSelectClass}
            value={duration}
            disabled={durationStatus === "loading" || isSavingDuration}
            onChange={async (e) => {
              const ok = await changeDuration(Number(e.target.value) as 45 | 60);
              if (ok) onChanged?.();
            }}
          >
            <option value={45}>45 minutos</option>
            <option value={60}>60 minutos</option>
          </select>
        </div>

        <div className="flex flex-col divide-y rounded-md border">
          {DAYS.map((day) => (
            <DayRow
              key={day.value}
              day={day}
              rule={rules.find((r) => r.day_of_week === day.value)}
              isSaving={isSaving}
              onActivate={async (d, start, end) => {
                const ok = await addRule(d, start, end);
                if (ok) onChanged?.();
              }}
              onDeactivate={async (id) => {
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
