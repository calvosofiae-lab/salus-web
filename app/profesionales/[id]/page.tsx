import { Suspense } from "react";
import { ProfessionalProfileServer } from "./professional-profile-server";

export default function ProfessionalPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Cargando...</p>}>
      <ProfessionalProfileServer params={params} />
    </Suspense>
  );
}
