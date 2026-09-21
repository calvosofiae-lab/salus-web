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

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayIso(): string {
  return toISODate(new Date());
}

// month es 0-11 (como Date), no 1-12.
export function getMonthBounds(year: number, month: number): { start: string; end: string } {
  return {
    start: toISODate(new Date(year, month, 1)),
    end: toISODate(new Date(year, month + 1, 0)),
  };
}

// Turno cuya fecha+hora de inicio ya pasó -- decide si se puede marcar 'realizado'/'no_asistio'
// (no tiene sentido antes de que el turno ocurra).
export function isPastDateTime(isoDate: string, time: string): boolean {
  const [year, month, day] = isoDate.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime() <= Date.now();
}

export function formatMonthYear(year: number, month: number): string {
  const label = new Date(year, month, 1).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
  return capitalize(label);
}
