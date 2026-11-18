export type SlotDurationMinutes = 45 | 60;
export type BreakMinutes = 0 | 5 | 10 | 15;

export const BREAK_OPTIONS: BreakMinutes[] = [0, 5, 10, 15];

export function toSlotDuration(value: number | null | undefined): SlotDurationMinutes {
  return value === 45 ? 45 : 60;
}

export function toBreakMinutes(value: number | null | undefined): BreakMinutes {
  return BREAK_OPTIONS.includes(value as BreakMinutes) ? (value as BreakMinutes) : 0;
}

// El descanso va dentro del turno: un turno de 60 con 10 de descanso es una sesión de 50.
export function sessionMinutes(slot: SlotDurationMinutes, breakMinutes: BreakMinutes): number {
  return slot - breakMinutes;
}

export function sessionMinutesOf(professional: {
  slot_duration_minutes: number | null | undefined;
  break_minutes?: number | null;
}): number {
  return sessionMinutes(
    toSlotDuration(professional.slot_duration_minutes),
    toBreakMinutes(professional.break_minutes),
  );
}

// "09:00" o "09:00:00" + minutos -> "09:50". Para mostrar dónde termina la sesión.
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** "09:00 a 09:50": horario de la sesión (sin el descanso). */
export function formatSessionRange(startTime: string, minutes: number): string {
  return `${startTime.slice(0, 5)} a ${addMinutes(startTime, minutes)}`;
}
