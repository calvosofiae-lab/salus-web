"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMonthYear, todayIso, toISODate } from "@/features/appointments/lib/date";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface DayCell {
  date: string;
  day: number;
  inCurrentMonth: boolean;
  isSunday: boolean;
}

// Semanas de lunes a domingo (getDay() da 0=domingo..6=sábado).
function buildMonthGrid(year: number, month: number): DayCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return {
      date: toISODate(date),
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === month,
      isSunday: date.getDay() === 0,
    };
  });
}

export function MonthCalendar({
  year,
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  appointmentCounts,
  blockedDates,
  datesWithoutAvailability,
}: {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  appointmentCounts: Record<string, number>;
  blockedDates: Set<string>;
  datesWithoutAvailability: Set<string>;
}) {
  const cells = buildMonthGrid(year, month);
  const today = todayIso();

  function goToPreviousMonth() {
    onMonthChange(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);
  }

  function goToNextMonth() {
    onMonthChange(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base text-brand-navy">{formatMonthYear(year, month)}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Rojo: domingo o día bloqueado. Amarillo: sin horarios disponibles.
          </p>
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={goToPreviousMonth} aria-label="Mes anterior">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={goToNextMonth} aria-label="Mes siguiente">
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="py-1">
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const count = appointmentCounts[cell.date] ?? 0;
            const isSelected = cell.date === selectedDate;
            const isToday = cell.date === today;
            const isBlocked = blockedDates.has(cell.date);
            const isRed = isBlocked || cell.isSunday;
            const isUnavailable = !isRed && datesWithoutAvailability.has(cell.date);
            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => onSelectDate(cell.date)}
                title={
                  isBlocked
                    ? "Día bloqueado"
                    : cell.isSunday
                      ? "Domingo"
                      : isUnavailable
                        ? "Sin horarios disponibles"
                        : undefined
                }
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border text-sm transition-colors",
                  cell.inCurrentMonth ? "text-foreground" : "text-muted-foreground/50",
                  isRed && !isSelected && "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
                  isUnavailable &&
                    !isSelected &&
                    "border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100",
                  !isRed &&
                    !isUnavailable &&
                    !isSelected &&
                    "border-transparent hover:border-brand-teal/40 hover:bg-brand-teal/5",
                  isToday &&
                    !isSelected &&
                    !isRed &&
                    !isUnavailable &&
                    "border-brand-teal/60 font-semibold",
                  isSelected && "border-brand-teal bg-brand-teal text-white hover:bg-brand-teal",
                  isSelected && isRed && "ring-2 ring-red-400",
                  isSelected && isUnavailable && "ring-2 ring-yellow-400",
                )}
              >
                <span>{cell.day}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] leading-tight",
                      isSelected ? "bg-white/25 text-white" : "bg-brand-teal/15 text-brand-navy",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
