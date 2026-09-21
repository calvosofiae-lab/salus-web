import { ProfessionalReportTable } from "@/features/admin/components/ProfessionalReportTable";

export default function AdminReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Valoraciones y turnos por profesional.
        </p>
      </div>
      <ProfessionalReportTable />
    </div>
  );
}
