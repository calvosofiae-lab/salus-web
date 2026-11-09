import { createClient } from "@/lib/supabase/server";
import { getOwnProfessionalCached } from "@/features/professionals/services/getOwnProfessionalCached";
import { getPublishedReviewCommentsServer } from "@/repositories/reviewsRepository";
import { ProfessionalPublishedComments } from "@/features/reviews/components/ProfessionalPublishedComments";

// Solo lectura: el profesional ve los comentarios que el admin ya publicó en su perfil, ni más
// ni menos. Los pendientes o no publicados no le llegan (la RPC filtra por comment_status),
// así que no puede inferir quién escribió algo que el admin decidió no mostrar.
export default async function ProfessionalReportsPage() {
  const supabase = await createClient();
  const professional = await getOwnProfessionalCached(supabase);

  // El layout ya filtra este caso y no renderiza children sin perfil; esto es solo para TS.
  if (!professional) return null;

  const comments = await getPublishedReviewCommentsServer(supabase, professional.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Comentarios de pacientes publicados en tu perfil. Se muestran de forma anónima, tal
          como los ven las personas que visitan tu perfil.
        </p>
      </div>
      <ProfessionalPublishedComments comments={comments} isActive={professional.is_active} />
    </div>
  );
}
