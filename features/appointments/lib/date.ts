function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = capitalize(date.toLocaleDateString("es-AR", { weekday: "long" }));
  const monthName = capitalize(date.toLocaleDateString("es-AR", { month: "long" }));
  return `${weekday} ${String(day).padStart(2, "0")} ${monthName} ${year}`;
}
