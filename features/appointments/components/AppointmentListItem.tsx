"use client";

import { useRef, useState } from "react";
import { CalendarClock, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppointmentStatusMenu } from "@/features/appointments/components/AppointmentStatusMenu";
import { SlotPicker } from "@/features/appointments/components/SlotPicker";
import { STATUS_LABELS, STATUS_VARIANT } from "@/features/appointments/constants";
import { formatLongDate } from "@/features/appointments/lib/date";
import { buildWhatsappLink } from "@/lib/whatsapp";
import type { Appointment, AppointmentStatus } from "@/features/appointments/types";

type RescheduleResult = { success: true } | { success: false; error: string };

export function AppointmentListItem({
  appointment,
  professionalId,
  onChangeStatus,
  onReschedule,
  justRescheduledTo,
  onRescheduled,
}: {
  appointment: Appointment;
  professionalId: string;
  onChangeStatus: (status: AppointmentStatus) => void;
  onReschedule: (date: string, startTime: string) => Promise<RescheduleResult>;
  // Se guarda en el padre (no acá) porque al reprogramar el turno cambia de fecha y esta
  // fila se re-monta bajo otro encabezado de día -- un estado local se perdería justo
  // cuando necesitamos mostrar la confirmación.
  justRescheduledTo: { date: string; time: string } | null;
  onRescheduled: (slot: { date: string; time: string }) => void;
}) {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const surveyLink =
    appointment.status === "realizado" && appointment.rating_token
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/valoracion/${appointment.rating_token}`
      : null;

  const surveyWhatsappHref = surveyLink
    ? buildWhatsappLink(
        appointment.patient_whatsapp,
        appointment.patient_whatsapp_country,
        `Hola ${appointment.patient_first_name}, gracias por tu visita. ¿Nos ayudás completando esta breve encuesta de satisfacción? ${surveyLink}`,
      )
    : null;

  const rescheduleWhatsappHref = justRescheduledTo
    ? buildWhatsappLink(
        appointment.patient_whatsapp,
        appointment.patient_whatsapp_country,
        `Hola ${appointment.patient_first_name}, tu turno fue reprogramado. Nueva fecha: ${formatLongDate(justRescheduledTo.date)} a las ${justRescheduledTo.time.slice(0, 5)} hs.`,
      )
    : null;

  function openReschedule() {
    setRescheduleError(null);
    setSelectedSlot(null);
    setIsRescheduling(true);
  }

  async function handleConfirmReschedule() {
    if (!selectedSlot || isSubmittingRef.current) return;
    const slot = selectedSlot;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setRescheduleError(null);
    try {
      const result = await onReschedule(slot.date, slot.time);
      if (result.success) {
        onRescheduled(slot);
        setIsRescheduling(false);
        setSelectedSlot(null);
      } else {
        setRescheduleError(result.error);
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border rounded-md px-4 py-3">
      <div className="flex items-center justify-between">
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
          {appointment.status === "reservado" && (
            <Button
              size="sm"
              variant="outline"
              disabled={isRescheduling}
              onClick={openReschedule}
            >
              <CalendarClock className="size-3.5" />
              Reprogramar
            </Button>
          )}
          <AppointmentStatusMenu currentStatus={appointment.status} onChange={onChangeStatus} />
        </div>
      </div>

      {isRescheduling && (
        <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3">
          <p className="text-xs font-medium text-brand-navy">Elegí el nuevo día y horario</p>
          <SlotPicker
            compact
            professionalId={professionalId}
            selectedSlot={selectedSlot}
            onSelectSlot={(date, time) => setSelectedSlot({ date, time })}
          />
          {rescheduleError && (
            <p role="alert" className="text-sm text-red-600">
              {rescheduleError}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!selectedSlot || isSubmitting}
              aria-busy={isSubmitting}
              onClick={handleConfirmReschedule}
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              {isSubmitting ? "Reprogramando..." : "Confirmar reprogramación"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsRescheduling(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {justRescheduledTo && rescheduleWhatsappHref && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-brand-teal/40 bg-brand-teal/5 px-3 py-2"
        >
          <p className="flex items-center gap-1.5 text-xs text-brand-navy">
            <CheckCircle2 className="size-3.5 shrink-0 text-brand-teal" aria-hidden="true" />
            Turno reprogramado para el {formatLongDate(justRescheduledTo.date)} a las{" "}
            {justRescheduledTo.time.slice(0, 5)} hs.
          </p>
          <Button asChild size="sm" variant="outline">
            <a href={rescheduleWhatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-3.5" aria-hidden="true" />
              Avisar por WhatsApp
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
