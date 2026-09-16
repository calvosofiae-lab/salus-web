"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentListItem } from "@/features/appointments/components/AppointmentListItem";
import {
  CreateAppointmentForm,
  type CreateAppointmentFormHandle,
} from "@/features/appointments/components/CreateAppointmentForm";
import { useAvailabilityCalendar } from "@/features/appointments/hooks/useAvailabilityCalendar";
import { formatLongDate } from "@/features/appointments/lib/date";
import type { Appointment, AppointmentStatus, AvailabilityBlock } from "@/features/appointments/types";

type RescheduleResult = { success: true } | { success: false; error: string };

export function DayPanel({
  professionalId,
  date,
  dayAppointments,
  conflictIds,
  changeStatus,
  reschedule,
  onDataChanged,
  onSelectDate,
  dayBlocks,
  addDayBlock,
  removeDayBlock,
  isDayBlockSaving,
}: {
  professionalId: string;
  date: string;
  dayAppointments: Appointment[];
  conflictIds: Set<string>;
  changeStatus: (
    id: string,
    status: AppointmentStatus,
  ) => Promise<{ success: true } | { success: false; error: string }>;
  reschedule: (id: string, date: string, startTime: string) => Promise<RescheduleResult>;
  onDataChanged: () => void;
  onSelectDate: (date: string) => void;
  dayBlocks: AvailabilityBlock[];
  addDayBlock: (startDate: string, endDate: string, reason: string) => Promise<boolean>;
  removeDayBlock: (id: string) => Promise<void>;
  isDayBlockSaving: boolean;
}) {
  const {
    date: scheduleDate,
    setDate: setScheduleDate,
    slots,
    status,
    error,
    isSaving,
    toggleSlot,
    reload: reloadSchedule,
  } = useAvailabilityCalendar(professionalId);
  const createFormRef = useRef<CreateAppointmentFormHandle>(null);
  // Bloqueo de día completo: solo reconoce bloqueos de un solo día (start_date === end_date ===
  // date) creados desde este mismo botón -- si el día cae dentro de un bloqueo de varios días
  // (ej. una licencia cargada antes), el botón ofrece bloquearlo de nuevo en vez de desarmar ese
  // rango completo, que podría cubrir otros días que siguen queriendo bloqueados.
  const dayBlock = dayBlocks.find((b) => b.start_date === date && b.end_date === date);
  // Igual que antes en la lista plana: al reprogramar, el turno puede saltar a otro día (el
  // panel navega ahí solo) y esta fila se re-monta -- se guarda por id para que la confirmación
  // sobreviva ese salto.
  const [justRescheduled, setJustRescheduled] = useState<
    Record<string, { date: string; time: string }>
  >({});

  useEffect(() => {
    if (scheduleDate !== date) setScheduleDate(date);
  }, [date, scheduleDate, setScheduleDate]);

  const sortedAppointments = [...dayAppointments].sort((a, b) =>
    a.start_time.localeCompare(b.start_time),
  );
  const freeSlots = slots.filter((s) => s.status === "disponible");
  const blockedSlots = slots.filter((s) => s.status === "bloqueado");

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-4">
        <CardTitle className="text-base text-brand-navy">{formatLongDate(date)}</CardTitle>
        <div className="flex flex-wrap items-start gap-2">
          <CreateAppointmentForm
            ref={createFormRef}
            professionalId={professionalId}
            initialDate={date}
            onCreated={() => {
              onDataChanged();
              reloadSchedule();
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isDayBlockSaving}
            aria-busy={isDayBlockSaving}
            className={dayBlock ? "border-red-300 text-red-700 hover:bg-red-50" : ""}
            onClick={async () => {
              if (dayBlock) {
                await removeDayBlock(dayBlock.id);
              } else {
                await addDayBlock(date, date, "");
              }
              onDataChanged();
            }}
          >
            {isDayBlockSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <CalendarOff className="size-4" aria-hidden="true" />
            )}
            {dayBlock ? "Desbloquear día" : "Bloquear día"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-brand-navy">
            Turnos asignados {sortedAppointments.length > 0 && `(${sortedAppointments.length})`}
          </h3>
          {sortedAppointments.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay turnos asignados este día.</p>
          )}
          {sortedAppointments.length > 0 && (
            <div className="flex flex-col gap-2">
              {sortedAppointments.map((appt) => (
                <AppointmentListItem
                  key={appt.id}
                  appointment={appt}
                  professionalId={professionalId}
                  onChangeStatus={async (newStatus) => {
                    const result = await changeStatus(appt.id, newStatus);
                    if (result.success) reloadSchedule();
                    return result;
                  }}
                  onReschedule={async (newDate, newStartTime) => {
                    const result = await reschedule(appt.id, newDate, newStartTime);
                    if (result.success) {
                      onDataChanged();
                      reloadSchedule();
                      if (newDate !== date) onSelectDate(newDate);
                    }
                    return result;
                  }}
                  justRescheduledTo={justRescheduled[appt.id] ?? null}
                  onRescheduled={(slot) =>
                    setJustRescheduled((prev) => ({ ...prev, [appt.id]: slot }))
                  }
                  isOutOfSchedule={conflictIds.has(appt.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-brand-navy">Horarios del día</h3>
          {status === "loading" && <p className="text-sm text-muted-foreground">Cargando...</p>}
          {status === "error" && (
            <p role="alert" className="text-sm text-red-600">
              Error al cargar los horarios de ese día.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          {status === "ready" && slots.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No trabajás ese día: no tenés horario configurado arriba.
            </p>
          )}
          {(freeSlots.length > 0 || blockedSlots.length > 0) && (
            <div className="flex flex-col divide-y rounded-md border">
              {freeSlots.map((slot) => (
                <div key={slot.startTime} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="font-medium text-green-700">
                    {slot.startTime.slice(0, 5)} · Libre
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => createFormRef.current?.openFor(date, slot.startTime)}
                    >
                      Asignar turno
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isSaving}
                      onClick={async () => {
                        await toggleSlot(slot);
                        onDataChanged();
                      }}
                    >
                      {isSaving ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <CalendarOff className="size-3.5" aria-hidden="true" />
                      )}
                      Bloquear
                    </Button>
                  </div>
                </div>
              ))}
              {blockedSlots.map((slot) => (
                <div key={slot.startTime} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="font-medium text-red-700">
                    {slot.startTime.slice(0, 5)} · Bloqueado
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isSaving}
                    onClick={async () => {
                      await toggleSlot(slot);
                      onDataChanged();
                    }}
                  >
                    {isSaving && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
                    Desbloquear
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
