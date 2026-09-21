import type { AppointmentStatus } from "@/features/appointments/types";

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  reservado: "Reservado",
  realizado: "Realizado",
  cancelado: "Cancelado",
  no_asistio: "No asistió",
};

export const STATUS_VARIANT: Record<AppointmentStatus, "default" | "secondary" | "destructive"> = {
  reservado: "default",
  realizado: "secondary",
  cancelado: "destructive",
  no_asistio: "destructive",
};

// Refleja lo que el trigger prevent_status_change_from_terminal (20260815020000, relajado en
// 20260915100000) efectivamente permite: desde 'reservado' se puede ir a cualquier otro estado
// (solo a 'realizado'/'no_asistio' si el turno ya pasó), desde 'no_asistio' se puede corregir a
// 'reservado' o 'cancelado' (para deshacer un marcado por error), y 'cancelado'/'realizado' son
// terminales de verdad -- ningún cambio posible desde ahí.
export function getSelectableStatuses(
  current: AppointmentStatus,
  isPast: boolean,
): AppointmentStatus[] {
  if (current === "reservado") {
    return isPast ? ["realizado", "no_asistio", "cancelado"] : ["cancelado"];
  }
  if (current === "no_asistio") {
    return ["reservado", "cancelado"];
  }
  return [];
}
