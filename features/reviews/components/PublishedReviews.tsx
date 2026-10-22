"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { getPublishedReviewComments } from "@/repositories/reviewsRepository";
import type { PublishedReviewComment } from "@/features/reviews/types";

const PAGE_SIZE = 3;

function formatMonthYear(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

// Comentarios de pacientes aprobados por el admin. Anónimos a propósito: en salud mental no
// corresponde mostrar quién atendió a quién. Si no hay ninguno aprobado, no se muestra nada.
export function PublishedReviews({ professionalId }: { professionalId: string }) {
  const [reviews, setReviews] = useState<PublishedReviewComment[]>([]);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    getPublishedReviewComments(professionalId)
      .then((data) => {
        if (!cancelled) setReviews(data);
      })
      .catch((err) => console.error("Error cargando opiniones:", err));
    return () => {
      cancelled = true;
    };
  }, [professionalId]);

  if (reviews.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-primary">Experiencias de pacientes</h2>
      <ul className="flex flex-col divide-y rounded-md border">
        {reviews.slice(0, visible).map((review) => (
          <li key={review.id} className="flex flex-col gap-1 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span
                className="text-sm text-brand-yellow"
                aria-label={`${review.rating} de 5 estrellas`}
              >
                {"★".repeat(review.rating)}
                <span className="text-muted-foreground/40">{"★".repeat(5 - review.rating)}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                Paciente de Salus · {formatMonthYear(review.created_at)}
              </span>
            </div>
            <p className="whitespace-pre-line text-sm">{review.comment}</p>
          </li>
        ))}
      </ul>
      {reviews.length > visible && (
        <button
          type="button"
          className="self-start text-sm font-medium text-primary hover:underline"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
        >
          Ver más experiencias
        </button>
      )}
      <div className="flex gap-2.5 rounded-lg border border-brand-teal/30 bg-brand-teal/5 p-3 text-xs text-muted-foreground">
        <Info className="mt-px size-4 shrink-0 text-brand-teal" aria-hidden="true" />
        <div className="flex flex-col gap-1.5">
          <p className="font-medium text-primary">Sobre las experiencias publicadas</p>
          <p>
            Los comentarios corresponden a experiencias compartidas por personas usuarias de Salus
            que autorizaron su publicación anónima. El contenido está sujeto a revisión para
            resguardar la privacidad de las personas.
          </p>
        </div>
      </div>
    </section>
  );
}
