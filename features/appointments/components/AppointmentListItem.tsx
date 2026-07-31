"use client";

import { Badge } from "@/components/ui/badge";
import { AppointmentStatusMenu } from "@/features/appointments/components/AppointmentStatusMenu";
import { STATUS_LABELS } from "@/features/appointments/constants";
import type { Appointment, AppointmentStatus } from "@/features/appointments/types";

const STATUS_VARIANT: Record<
  AppointmentStatus,
  "default" | "secondary" | "destructive"
> = {
  reservado: "default",
  realizado: "secondary",
  cancelado: "destructive",
  no_asistio: "destructive",
};

export function AppointmentListItem({
  appointment,
  onChangeStatus,
}: {
  appointment: Appointment;
  onChangeStatus: (status: AppointmentStatus) => void;
}) {
  return (
    <div className="flex items-center justify-between border rounded-md px-4 py-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          {appointment.start_time.slice(0, 5)} · {appointment.patient_first_name}{" "}
          {appointment.patient_last_name}
        </span>
        <span className="text-xs text-muted-foreground">
          WhatsApp: {appointment.patient_whatsapp}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={STATUS_VARIANT[appointment.status]}>
          {STATUS_LABELS[appointment.status]}
        </Badge>
        <AppointmentStatusMenu currentStatus={appointment.status} onChange={onChangeStatus} />
      </div>
    </div>
  );
}
