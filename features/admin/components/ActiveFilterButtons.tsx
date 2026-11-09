"use client";

import { Button } from "@/components/ui/button";
import type { ActiveFilter } from "@/features/professionals/hooks/useAdminProfessionalsList";

const ACTIVE_FILTER_OPTIONS: { value: ActiveFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

export const ACTIVE_FILTER_EMPTY_MESSAGES: Record<ActiveFilter, string> = {
  all: "No hay profesionales cargados todavía.",
  active: "No hay profesionales activos.",
  inactive: "No hay profesionales inactivos.",
};

interface ActiveFilterButtonsProps {
  value: ActiveFilter;
  onChange: (value: ActiveFilter) => void;
  // Opcional: si se pasa, cada botón muestra su total ("Activos (12)").
  counts?: Record<ActiveFilter, number> | null;
}

export function ActiveFilterButtons({ value, onChange, counts }: ActiveFilterButtonsProps) {
  return (
    <div className="flex gap-2">
      {ACTIVE_FILTER_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "default" : "outline"}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {counts && ` (${counts[option.value]})`}
        </Button>
      ))}
    </div>
  );
}
