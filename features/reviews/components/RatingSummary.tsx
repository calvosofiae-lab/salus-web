// Con 0 reseñas no se muestra nada: el profesional nuevo arranca con 5 estrellas por defecto
// (20260807030000), y mostrarlas lo dejaba por encima de uno con reseñas reales.
export function RatingSummary({
  averageRating,
  reviewCount,
}: {
  averageRating: number | null;
  reviewCount: number;
}) {
  if (averageRating === null || reviewCount === 0) return null;

  return (
    <p className="text-sm text-muted-foreground">
      ⭐ {averageRating.toFixed(1)} / 5
    </p>
  );
}
