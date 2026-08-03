import { Suspense } from "react";
import { EditProfessionalServer } from "./edit-professional-server";

export default function EditProfessionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
      <EditProfessionalServer params={params} />
    </Suspense>
  );
}
