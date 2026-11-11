"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWeeklyBookingsReport } from "@/features/admin/hooks/useWeeklyBookingsReport";
import type { ActiveFilter } from "@/features/professionals/hooks/useAdminProfessionalsList";
import {
  ACTIVE_FILTER_EMPTY_MESSAGES,
  ActiveFilterButtons,
} from "@/features/admin/components/ActiveFilterButtons";

// Cantidad de semanas visibles; las flechas avanzan o retroceden de a un rango entero.
const RANGE_WEEKS = 4;

interface ProfessionalWeeks {
  professionalId: string;
  fullName: string;
  isActive: boolean;
  // Mismo orden que `weeks` (de la más vieja a la más nueva).
  counts: number[];
  web: number[];
  agenda: number[];
  cancelled: number[];
  total: number;
}

// Las fechas se manejan como "YYYY-MM-DD" y se operan en UTC al mediodía para no depender de la
// zona horaria del navegador; "hoy" se toma en hora de Argentina, igual que en la base.
function addDaysIso(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function currentMondayIso(): string {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  return addDaysIso(today, -((weekday + 6) % 7));
}

function formatDay(dateIso: string, withYear = false): string {
  const [year, month, day] = dateIso.split("-");
  return withYear ? `${day}/${month}/${year}` : `${day}/${month}`;
}

// "Hoy" se lee recién en el navegador (useEffect): si se calcula durante el render, el build
// falla al prerenderizar /admin/reportes (Next no permite `new Date()` en el prerender de un
// Client Component, porque quedaría congelada la fecha del build).
export function WeeklyBookingsReport() {
  const [currentMonday, setCurrentMonday] = useState<string | null>(null);

  useEffect(() => {
    setCurrentMonday(currentMondayIso());
  }, []);

  if (!currentMonday) {
    return <p className="text-sm text-muted-foreground">Cargando reporte...</p>;
  }
  return <WeeklyBookingsReportRange currentMonday={currentMonday} />;
}

function WeeklyBookingsReportRange({ currentMonday }: { currentMonday: string }) {
  // Rango inicial: las 3 semanas anteriores y la actual.
  const defaultStart = addDaysIso(currentMonday, -7 * (RANGE_WEEKS - 1));
  const [startWeek, setStartWeek] = useState(defaultStart);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("active");
  const { status, rows } = useWeeklyBookingsReport(startWeek, RANGE_WEEKS);

  const weeks = useMemo(
    () => Array.from({ length: RANGE_WEEKS }, (_, i) => addDaysIso(startWeek, 7 * i)),
    [startWeek],
  );
  const rangeEnd = addDaysIso(startWeek, 7 * RANGE_WEEKS - 1);

  const professionals = useMemo(() => {
    const weekIndex = new Map(weeks.map((w, i) => [w, i]));
    const byProfessional = new Map<string, ProfessionalWeeks>();

    for (const row of rows) {
      const i = weekIndex.get(row.week_start);
      // Filas de un rango anterior mientras carga el nuevo: se ignoran.
      if (i === undefined) continue;
      let entry = byProfessional.get(row.professional_id);
      if (!entry) {
        entry = {
          professionalId: row.professional_id,
          fullName: row.full_name,
          isActive: row.is_active,
          counts: weeks.map(() => 0),
          web: weeks.map(() => 0),
          agenda: weeks.map(() => 0),
          cancelled: weeks.map(() => 0),
          total: 0,
        };
        byProfessional.set(row.professional_id, entry);
      }
      entry.counts[i] = row.session_count;
      entry.web[i] = row.web_count;
      entry.agenda[i] = row.agenda_count;
      entry.cancelled[i] = row.cancelled_count;
      entry.total += row.session_count;
    }

    // Los que menos sesiones tienen primero: son los que hay que mirar.
    return Array.from(byProfessional.values())
      .filter((p) => activeFilter === "all" || p.isActive === (activeFilter === "active"))
      .sort((a, b) => a.total - b.total || a.fullName.localeCompare(b.fullName, "es"));
  }, [rows, weeks, activeFilter]);

  const withoutSessions = professionals.filter((p) => p.total === 0).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActiveFilterButtons value={activeFilter} onChange={setActiveFilter} />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setStartWeek((s) => addDaysIso(s, -7 * RANGE_WEEKS))}
            aria-label="4 semanas anteriores"
          >
            ‹ Anteriores
          </Button>
          <span className="min-w-[11rem] text-center font-medium">
            {formatDay(startWeek)} – {formatDay(rangeEnd, true)}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setStartWeek((s) => addDaysIso(s, 7 * RANGE_WEEKS))}
            aria-label="4 semanas siguientes"
          >
            Siguientes ›
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={startWeek === defaultStart}
            onClick={() => setStartWeek(defaultStart)}
          >
            Esta semana
          </Button>
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
              "Todos los profesionales tienen al menos una sesión en estas semanas."
            ) : (
              <>
                <span className="font-semibold text-red-600">{withoutSessions}</span>{" "}
                {withoutSessions === 1 ? "profesional sin" : "profesionales sin"} sesiones en
                estas semanas.
              </>
            )}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">Profesional</th>
                  {weeks.map((w) => {
                    const isCurrent = w === currentMonday;
                    const isFuture = w > currentMonday;
                    return (
                      <th
                        key={w}
                        className={`py-2 px-2 text-center font-medium whitespace-nowrap ${
                          isCurrent ? "bg-brand-teal/10" : ""
                        } ${isFuture ? "text-muted-foreground" : ""}`}
                        title={`Semana del lunes ${formatDay(w, true)}${
                          isFuture ? " (turnos agendados)" : ""
                        }`}
                      >
                        {isCurrent ? "Esta sem." : formatDay(w)}
                      </th>
                    );
                  })}
                  <th className="py-2 pl-2 text-center font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {professionals.map((p) => (
                  <tr key={p.professionalId} className="border-b">
                    <td className="py-2 pr-4">
                      {p.fullName}
                      {p.total === 0 && (
                        <span className="ml-2 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 whitespace-nowrap">
                          sin sesiones
                        </span>
                      )}
                    </td>
                    {p.counts.map((count, i) => (
                      <td
                        key={weeks[i]}
                        className={`py-2 px-2 text-center ${
                          weeks[i] === currentMonday ? "bg-brand-teal/10" : ""
                        } ${count === 0 ? "text-muted-foreground/50" : "font-medium"}`}
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
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Sesiones no canceladas por semana (lunes a domingo) según la fecha del turno: tanto las
            que reservan los pacientes desde la web como las que carga el profesional en su agenda.
            Las semanas futuras muestran los turnos ya agendados. Pasá el mouse por una celda para
            ver el detalle por origen y las canceladas.
          </p>
        </>
      )}
    </div>
  );
}
