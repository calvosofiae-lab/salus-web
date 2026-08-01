"use client";

import { CheckCircle2, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const surveyLink =
    appointment.status === "realizado" && appointment.rating_token
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/valoracion/${appointment.rating_token}`
      : null;

  const surveyWhatsappHref = surveyLink
    ? `https://wa.me/${appointment.patient_whatsapp}?text=${encodeURIComponent(
        `Hola ${appointment.patient_first_name}, gracias por tu visita. ¿Nos ayudás completando esta breve encuesta de satisfacción? ${surveyLink}`,
      )}`
    : null;

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
        {appointment.status === "realizado" &&
          (appointment.reviewed ? (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="size-3.5" />
              Calificado
            </Badge>
          ) : (
            surveyWhatsappHref && (
              <Button asChild size="sm" variant="outline">
                <a href={surveyWhatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-3.5" />
                  Enviar encuesta
                </a>
              </Button>
            )
          ))}
        <AppointmentStatusMenu currentStatus={appointment.status} onChange={onChangeStatus} />
      </div>
    </div>
  );
}
