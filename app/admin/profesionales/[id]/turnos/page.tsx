import { Suspense } from "react";
import { ProfessionalAppointmentsServer } from "./professional-appointments-server";

export default function AdminProfessionalAppointmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
      <ProfessionalAppointmentsServer params={params} />
    </Suspense>
  );
}
