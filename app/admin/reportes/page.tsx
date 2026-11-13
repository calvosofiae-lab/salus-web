import { ProfessionalReportTable } from "@/features/admin/components/ProfessionalReportTable";
import { WeeklyBookingsReport } from "@/features/admin/components/WeeklyBookingsReport";

export default function AdminReportsPage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand-navy">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Valoraciones y turnos por profesional.
          </p>
        </div>
        <ProfessionalReportTable />
      </section>
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-brand-navy">Sesiones por semana</h2>
          <p className="text-sm text-muted-foreground">
            Para detectar a tiempo a los profesionales que no están recibiendo consultas.
          </p>
        </div>
        <WeeklyBookingsReport />
      </section>
    </div>
  );
}
