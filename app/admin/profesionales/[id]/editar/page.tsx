import { Suspense } from "react";
import { EditProfessionalClient } from "./edit-professional-client";

export default function EditProfessionalPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
      <EditProfessionalClient />
    </Suspense>
  );
}
