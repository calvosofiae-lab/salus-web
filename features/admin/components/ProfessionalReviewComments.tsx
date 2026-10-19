"use client";

import { useState } from "react";
import { CircleCheck, CircleX, Eye, EyeOff, Loader2 } from "lucide-react";
import { setReviewCommentStatus } from "@/repositories/reviewsRepository";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Review } from "@/features/reviews/types";
import type { ReviewCommentStatus } from "@/types/database";

const STATUS_LABELS: Record<ReviewCommentStatus, string> = {
  pending: "Pendiente",
  published: "Publicado",
  hidden: "No publicado",
};

const STATUS_CLASSES: Record<ReviewCommentStatus, string> = {
  pending: "border-brand-yellow bg-brand-yellow/15 text-brand-navy",
  published: "border-emerald-600 bg-emerald-50 text-emerald-800",
  hidden: "border-muted-foreground/40 bg-muted text-muted-foreground",
};

function formatReviewDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Los comentarios no se publican en el perfil del profesional hasta que el admin los aprueba
// (20261017010000), y solo si el paciente autorizó la publicación (20261019000000).
// Pendientes primero, para que lo que falta revisar quede arriba.
export function ProfessionalReviewComments({ reviews: initialReviews }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(reviewId: string, status: ReviewCommentStatus) {
    setSavingId(reviewId);
    setError(null);
    try {
      await setReviewCommentStatus(reviewId, status);
      setReviews((current) =>
        current.map((r) => (r.id === reviewId ? { ...r, comment_status: status } : r)),
      );
    } catch (err) {
      console.error("Error actualizando el comentario:", err);
      setError("No se pudo actualizar el comentario. Intentalo de nuevo.");
    } finally {
      setSavingId(null);
    }
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Este profesional no tiene comentarios todavía.</p>
    );
  }

  const sorted = [...reviews].sort(
    (a, b) => Number(b.comment_status === "pending") - Number(a.comment_status === "pending"),
  );

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex flex-col divide-y rounded-md border">
        {sorted.map((review) => {
          const isSaving = savingId === review.id;
          return (
            <div key={review.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-brand-navy">
                    <span className="text-brand-yellow">★</span> {review.rating}/5
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-medium",
                      STATUS_CLASSES[review.comment_status],
                    )}
                  >
                    {STATUS_LABELS[review.comment_status]}
                  </span>
                  {review.comment_publication_authorized ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-800">
                      <CircleCheck className="size-3.5" aria-hidden="true" />
                      Autorizó la publicación
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CircleX className="size-3.5" aria-hidden="true" />
                      No autorizó la publicación
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatReviewDate(review.created_at)}
                </span>
              </div>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{review.comment}</p>
              <div className="flex flex-wrap gap-2">
                {review.comment_status !== "published" && (
                  <Button
                    size="sm"
                    disabled={isSaving || !review.comment_publication_authorized}
                    title={
                      review.comment_publication_authorized
                        ? undefined
                        : "El paciente no autorizó la publicación de este comentario"
                    }
                    onClick={() => changeStatus(review.id, "published")}
                  >
                    {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                    Publicar
                  </Button>
                )}
                {review.comment_status !== "hidden" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => changeStatus(review.id, "hidden")}
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <EyeOff className="size-4" />
                    )}
                    {review.comment_status === "published" ? "Despublicar" : "No publicar"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
