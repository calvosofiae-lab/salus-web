import { formatReviewCount } from "@/features/reviews/lib/format";

// Con 0 reseñas no se muestra la cantidad: el profesional nuevo arranca con 5 estrellas por
// defecto (20260807030000) y "5.0 (0 opiniones)" sería contradictorio.
export function RatingSummary({
  averageRating,
  reviewCount,
}: {
  averageRating: number | null;
  reviewCount: number;
}) {
  if (averageRating === null) return null;

  return (
    <p className="text-sm text-muted-foreground">
      ⭐ {averageRating.toFixed(1)} / 5
      {reviewCount > 0 && ` · ${formatReviewCount(reviewCount)}`}
    </p>
  );
}
