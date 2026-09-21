import type { Review } from "@/features/reviews/types";

function formatReviewDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ProfessionalReviewComments({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Este profesional no tiene comentarios todavía.</p>
    );
  }

  return (
    <div className="flex flex-col divide-y rounded-md border">
      {reviews.map((review) => (
        <div key={review.id} className="flex flex-col gap-1 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-brand-navy">
              <span className="text-brand-yellow">★</span> {review.rating}/5
            </span>
            <span className="text-xs text-muted-foreground">
              {formatReviewDate(review.created_at)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{review.comment}</p>
        </div>
      ))}
    </div>
  );
}
