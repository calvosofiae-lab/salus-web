import type { PublishedReviewComment } from "@/features/reviews/types";

function formatMonthYear(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

// Misma presentación que PublishedReviews (perfil público), sin paginar: acá el profesional
// quiere ver todos los suyos de una.
export function ProfessionalPublishedComments({
  comments,
  isActive,
}: {
  comments: PublishedReviewComment[];
  isActive: boolean;
}) {
  // get_published_review_comments no devuelve nada para un profesional inactivo (filtra por
  // p.is_active): sin este aviso parecería que no tiene comentarios.
  if (!isActive) {
    return (
      <p className="text-sm text-muted-foreground">
        Tu perfil no está activo, así que no hay comentarios publicados para mostrar.
      </p>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no tenés comentarios publicados en tu perfil.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {comments.length === 1 ? "1 comentario publicado" : `${comments.length} comentarios publicados`}
      </p>
      <ul className="flex flex-col divide-y rounded-md border">
        {comments.map((comment) => (
          <li key={comment.id} className="flex flex-col gap-1 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span
                className="text-sm text-brand-yellow"
                aria-label={`${comment.rating} de 5 estrellas`}
              >
                {"★".repeat(comment.rating)}
                <span className="text-muted-foreground/40">{"★".repeat(5 - comment.rating)}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                Paciente de Salus · {formatMonthYear(comment.created_at)}
              </span>
            </div>
            <p className="whitespace-pre-line text-sm">{comment.comment}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
