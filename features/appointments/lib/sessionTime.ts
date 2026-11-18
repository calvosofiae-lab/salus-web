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
