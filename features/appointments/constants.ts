import type { AppointmentStatus } from "@/features/appointments/types";

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  reservado: "Reservado",
  realizado: "Realizado",
  cancelado: "Cancelado",
  no_asistio: "No asistió",
};

export const STATUS_OPTIONS: AppointmentStatus[] = [
  "reservado",
  "realizado",
  "cancelado",
  "no_asistio",
];
