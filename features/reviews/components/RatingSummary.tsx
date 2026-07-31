export function RatingSummary({ averageRating }: { averageRating: number | null }) {
  if (averageRating === null) return null;

  return <p className="text-sm text-muted-foreground">⭐ {averageRating.toFixed(1)} / 5</p>;
}
