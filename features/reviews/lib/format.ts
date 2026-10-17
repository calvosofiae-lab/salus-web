// "1 opinión" / "12 opiniones".
export function formatReviewCount(count: number): string {
  return `${count} ${count === 1 ? "opinión" : "opiniones"}`;
}
