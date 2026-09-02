"use client";

import { useProfessionalReport } from "@/features/admin/hooks/useProfessionalReport";
import { STATUS_LABELS } from "@/features/appointments/constants";

export function ProfessionalReportTable() {
  const { status, rows } = useProfessionalReport();

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Cargando reporte...</p>;
  }
  if (status === "error") {
    return <p className="text-sm text-red-500">Error al cargar el reporte.</p>;
  }
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay profesionales cargados todavía.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4">Profesional</th>
            <th className="py-2 pr-4">Rating promedio</th>
            <th className="py-2 pr-4">Reviews</th>
            <th className="py-2 pr-4">{STATUS_LABELS.reservado}</th>
            <th className="py-2 pr-4">{STATUS_LABELS.realizado}</th>
            <th className="py-2 pr-4">{STATUS_LABELS.cancelado}</th>
            <th className="py-2 pr-4">{STATUS_LABELS.no_asistio}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.professional_id} className="border-b">
              <td className="py-2 pr-4">{row.full_name}</td>
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
  );
}
