import { Suspense } from "react";
import { ProfessionalCommentsServer } from "./professional-comments-server";

export default function AdminProfessionalCommentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
      <ProfessionalCommentsServer params={params} />
    </Suspense>
  );
}
