import { createClient } from "@/lib/supabase/server";
import { getProfessionalByIdAdmin } from "@/repositories/professionalsRepository";
import { getProfessionalReviewComments } from "@/repositories/reviewsRepository";
import { ProfessionalReviewComments } from "@/features/admin/components/ProfessionalReviewComments";

export async function ProfessionalCommentsServer({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const professional = await getProfessionalByIdAdmin(supabase, id);

  if (!professional) {
    return <p className="text-sm text-red-500">Profesional no encontrado.</p>;
  }

  const reviews = await getProfessionalReviewComments(supabase, professional.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">
          Comentarios de {professional.full_name}
        </h1>
        <p className="text-sm text-muted-foreground">Reseñas de pacientes con comentario.</p>
      </div>
      <ProfessionalReviewComments reviews={reviews} />
    </div>
  );
}
