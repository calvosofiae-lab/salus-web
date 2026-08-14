import type { Database } from "@/types/database";

export type AvailabilityRule = Database["public"]["Tables"]["availability_rules"]["Row"];
export type AvailabilityRuleInput =
  Database["public"]["Tables"]["availability_rules"]["Insert"];

export type AvailabilityBlock = Database["public"]["Tables"]["availability_blocks"]["Row"];
export type AvailabilityBlockInput =
  Database["public"]["Tables"]["availability_blocks"]["Insert"];

export type AvailabilityDateBlock =
  Database["public"]["Tables"]["availability_date_blocks"]["Row"];
export type AvailabilityDateBlockInput =
  Database["public"]["Tables"]["availability_date_blocks"]["Insert"];

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export interface TimeSlot {
  startTime: string;
}

export type SlotDuration = 45 | 60;

// Estado de un horario puntual en el calendario de disponibilidad: verde (disponible), rojo
// (bloqueado por el profesional) o amarillo (ya reservado).
export type DaySlotStatus = "disponible" | "bloqueado" | "reservado";

export interface DaySlot {
  startTime: string;
  status: DaySlotStatus;
  // Solo presente cuando status === "reservado" -- para mostrar quién tiene el turno.
  appointment?: Pick<Appointment, "id" | "patient_first_name" | "patient_last_name">;
}
