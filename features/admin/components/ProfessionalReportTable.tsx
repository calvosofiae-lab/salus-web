"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProfessionalReport } from "@/features/admin/hooks/useProfessionalReport";
import { STATUS_LABELS } from "@/features/appointments/constants";
import type { ProfessionalReportRow } from "@/features/admin/types";
import type { ActiveFilter } from "@/features/professionals/hooks/useAdminProfessionalsList";
import {
  ACTIVE_FILTER_EMPTY_MESSAGES,
  ActiveFilterButtons,
} from "@/features/admin/components/ActiveFilterButtons";

type SortKey = Exclude<keyof ProfessionalReportRow, "is_active">;
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "full_name", label: "Profesional" },
  { key: "average_rating", label: "Rating promedio" },
  { key: "review_count", label: "Reviews" },
  { key: "reservado_count", label: STATUS_LABELS.reservado },
  { key: "realizado_count", label: STATUS_LABELS.realizado },
  { key: "cancelado_count", label: STATUS_LABELS.cancelado },
  { key: "no_asistio_count", label: STATUS_LABELS.no_asistio },
];

// Los conteos nunca vienen null, pero average_rating sí (profesional sin reviews todavía) --
// se ordena como el valor más bajo posible, sin importar la dirección.
function compareValues(a: string | number | null, b: string | number | null): number {
  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b, "es");
  }
  const numA = typeof a === "number" ? a : -Infinity;
  const numB = typeof b === "number" ? b : -Infinity;
  return numA - numB;
}

export function ProfessionalReportTable() {
  const { status, rows } = useProfessionalReport();
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("active");

  // El reporte trae a todos los profesionales de una vez (sin paginar), así que se filtra acá.
  const sortedRows = useMemo(() => {
    const filtered =
      activeFilter === "all"
        ? [...rows]
        : rows.filter((row) => row.is_active === (activeFilter === "active"));
    filtered.sort((a, b) => {
      const cmp = compareValues(a[sortKey], b[sortKey]);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return filtered;
  }, [rows, sortKey, sortDir, activeFilter]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    // Para texto tiene más sentido arrancar A-Z; para métricas, de mayor a menor.
    setSortDir(key === "full_name" ? "asc" : "desc");
  }

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Cargando reporte...</p>;
  }
  if (status === "error") {
    return <p className="text-sm text-red-500">Error al cargar el reporte.</p>;
  }
  const filterButtons = <ActiveFilterButtons value={activeFilter} onChange={setActiveFilter} />;

  if (sortedRows.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {filterButtons}
        <p className="text-sm text-muted-foreground">{ACTIVE_FILTER_EMPTY_MESSAGES[activeFilter]}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filterButtons}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              {COLUMNS.map((col) => (
                <th key={col.key} className="py-2 pr-4">
                  <button
                    type="button"
                    className="flex items-center gap-1 font-medium hover:text-primary"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <span className="text-muted-foreground">
                      {sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.professional_id} className="border-b">
                <td className="py-2 pr-4">
                  {row.comment_count > 0 ? (
                    <Link
                      href={`/admin/reportes/${row.professional_id}`}
                      className="font-medium text-primary hover:underline"
                      title="Ver comentarios de las reseñas"
                    >
                      {row.full_name}
                    </Link>
                  ) : (
                    row.full_name
                  )}
                  {row.pending_comment_count > 0 && (
                    <span
                      className="ml-2 rounded-full border border-brand-yellow bg-brand-yellow/15 px-2 py-0.5 text-xs font-medium text-brand-navy"
                      title="Comentarios esperando que los revises para publicarlos"
                    >
                      {row.pending_comment_count} por revisar
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4">
                  {row.average_rating != null ? row.average_rating.toFixed(1) : "—"}
                </td>
                <td className="py-2 pr-4">{row.review_count}</td>
                <td className="py-2 pr-4">{row.reservado_count}</td>
                <td className="py-2 pr-4">{row.realizado_count}</td>
                <td className="py-2 pr-4">{row.cancelado_count}</td>
                <td className="py-2 pr-4">{row.no_asistio_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
