import type { Database } from "@/types/database";

export type AvailabilityRule = Database["public"]["Tables"]["availability_rules"]["Row"];
export type AvailabilityRuleInput =
  Database["public"]["Tables"]["availability_rules"]["Insert"];

export type AvailabilityBlock = Database["public"]["Tables"]["availability_blocks"]["Row"];
export type AvailabilityBlockInput =
  Database["public"]["Tables"]["availability_blocks"]["Insert"];

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export interface TimeSlot {
  startTime: string;
}
