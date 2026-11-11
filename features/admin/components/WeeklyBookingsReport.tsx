"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWeeklyBookingsReport } from "@/features/admin/hooks/useWeeklyBookingsReport";
import type { ActiveFilter } from "@/features/professionals/hooks/useAdminProfessionalsList";
import {
  ACTIVE_FILTER_EMPTY_MESSAGES,
  ActiveFilterButtons,
} from "@/features/admin/components/ActiveFilterButtons";

const WEEK_OPTIONS = [4, 8, 12] as const;

interface ProfessionalWeeks {
  professionalId: string;
  fullName: string;
  isActive: boolean;
  // Mismo orden que `weeks` (de la más vieja a la actual).
  counts: number[];
  web: number[];
  agenda: number[];
  cancelled: number[];
  total: number;
}

// week_start viene como "YYYY-MM-DD" (lunes). Se arma la fecha a mano para no depender de la
// zona horaria del navegador.
function formatWeek(weekStart: string): string {
  const [, month, day] = weekStart.split("-");
  return `${day}/${month}`;
}

export function WeeklyBookingsReport() {
  const [weekCount, setWeekCount] = useState<number>(8);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("active");
  const { status, rows } = useWeeklyBookingsReport(weekCount);

  const { weeks, professionals } = useMemo(() => {
    const weekSet = Array.from(new Set(rows.map((r) => r.week_start))).sort();
    const weekIndex = new Map(weekSet.map((w, i) => [w, i]));
    const byProfessional = new Map<string, ProfessionalWeeks>();

    for (const row of rows) {
      let entry = byProfessional.get(row.professional_id);
      if (!entry) {
        entry = {
          professionalId: row.professional_id,
          fullName: row.full_name,
          isActive: row.is_active,
          counts: weekSet.map(() => 0),
          web: weekSet.map(() => 0),
          agenda: weekSet.map(() => 0),
          cancelled: weekSet.map(() => 0),
          total: 0,
        };
        byProfessional.set(row.professional_id, entry);
      }
      const i = weekIndex.get(row.week_start)!;
      entry.counts[i] = row.session_count;
      entry.web[i] = row.web_count;
      entry.agenda[i] = row.agenda_count;
      entry.cancelled[i] = row.cancelled_count;
      entry.total += row.session_count;
    }

    // Los que menos sesiones tienen primero: son los que hay que mirar.
    const list = Array.from(byProfessional.values())
      .filter((p) => activeFilter === "all" || p.isActive === (activeFilter === "active"))
      .sort((a, b) => a.total - b.total || a.fullName.localeCompare(b.fullName, "es"));

    return { weeks: weekSet, professionals: list };
  }, [rows, activeFilter]);

  const withoutSessions = professionals.filter((p) => p.total === 0).length;
  // Semanas seguidas sin sesiones contando hacia atrás desde la actual.
  function weeksWithoutSessions(counts: number[]): number {
    let n = 0;
    for (let i = counts.length - 1; i >= 0 && counts[i] === 0; i--) n++;
    return n;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActiveFilterButtons value={activeFilter} onChange={setActiveFilter} />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Últimas</span>
          {WEEK_OPTIONS.map((n) => (
            <Button
              key={n}
              type="button"
              size="sm"
              variant={weekCount === n ? "default" : "outline"}
              onClick={() => setWeekCount(n)}
            >
              {n}
            </Button>
          ))}
          <span className="text-muted-foreground">semanas</span>
        </div>
      </div>

      {status === "loading" && (
        <p className="text-sm text-muted-foreground">Cargando reporte...</p>
      )}
      {status === "error" && <p className="text-sm text-red-500">Error al cargar el reporte.</p>}

      {status === "ready" && professionals.length === 0 && (
        <p className="text-sm text-muted-foreground">{ACTIVE_FILTER_EMPTY_MESSAGES[activeFilter]}</p>
      )}

      {status === "ready" && professionals.length > 0 && (
        <>
          <p className="text-sm">
            {withoutSessions === 0 ? (
              "Todos los profesionales tuvieron al menos una sesión en el período."
            ) : (
              <>
                <span className="font-semibold text-red-600">{withoutSessions}</span>{" "}
                {withoutSessions === 1 ? "profesional sin" : "profesionales sin"} sesiones en las
                últimas {weekCount} semanas.
              </>
            )}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">Profesional</th>
                  {weeks.map((w, i) => (
                    <th
                      key={w}
                      className="py-2 px-2 text-center font-medium whitespace-nowrap"
                      title={`Semana del lunes ${formatWeek(w)}`}
                    >
                      {i === weeks.length - 1 ? "Esta sem." : formatWeek(w)}
                    </th>
                  ))}
                  <th className="py-2 pl-2 text-center font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {professionals.map((p) => {
                  const idleWeeks = weeksWithoutSessions(p.counts);
                  return (
                    <tr key={p.professionalId} className="border-b">
                      <td className="py-2 pr-4">
                        {p.fullName}
                        {idleWeeks >= 2 && (
                          <span
                            className="ml-2 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 whitespace-nowrap"
                            title="Semanas seguidas sin sesiones, contando la actual"
                          >
                            {idleWeeks === weeks.length
                              ? "sin sesiones"
                              : `${idleWeeks} sem. sin sesiones`}
                          </span>
                        )}
                      </td>
                      {p.counts.map((count, i) => (
                        <td
                          key={weeks[i]}
                          className={`py-2 px-2 text-center ${
                            count === 0 ? "text-muted-foreground/50" : "font-medium"
                          }`}
                          title={
                            `${p.web[i]} reservadas por pacientes en la web, ` +
                            `${p.agenda[i]} cargadas por el profesional` +
                            (p.cancelled[i] > 0 ? `, ${p.cancelled[i]} canceladas aparte` : "")
                          }
                        >
                          {count}
                        </td>
                      ))}
                      <td
                        className={`py-2 pl-2 text-center font-semibold ${
                          p.total === 0 ? "text-red-600" : ""
                        }`}
                      >
                        {p.total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Sesiones no canceladas por semana (lunes a domingo) según la fecha del turno: tanto las
            que reservan los pacientes desde la web como las que carga el profesional en su agenda.
            La semana actual incluye los turnos que todavía no pasaron. Pasá el mouse por una celda
            para ver el detalle por origen y las canceladas.
          </p>
        </>
      )}
    </div>
  );
}
