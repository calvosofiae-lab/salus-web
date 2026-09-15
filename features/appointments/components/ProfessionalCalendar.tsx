"use client";

import { useMemo, useState } from "react";
import { useMyAppointments } from "@/features/appointments/hooks/useMyAppointments";
import { useScheduleConflicts } from "@/features/appointments/hooks/useScheduleConflicts";
import { useAvailabilityBlocks } from "@/features/appointments/hooks/useAvailabilityBlocks";
import { useMonthAvailability } from "@/features/appointments/hooks/useMonthAvailability";
import { ScheduleConflictsBanner } from "@/features/appointments/components/ScheduleConflictsBanner";
import { WeeklyAvailabilityForm } from "@/features/appointments/components/WeeklyAvailabilityForm";
import { MonthCalendar } from "@/features/appointments/components/MonthCalendar";
import { DayPanel } from "@/features/appointments/components/DayPanel";
import { getMonthBounds, todayIso, toISODate } from "@/features/appointments/lib/date";
import type { Appointment, AvailabilityBlock } from "@/features/appointments/types";

// Expande cada bloque (rango start_date..end_date) en fechas ISO sueltas, para poder consultar
// "¿este día está bloqueado?" con un simple Set.has() al pintar el almanaque.
function expandBlockedDates(blocks: AvailabilityBlock[]): Set<string> {
  const dates = new Set<string>();
  for (const block of blocks) {
    const [sy, sm, sd] = block.start_date.split("-").map(Number);
    const [ey, em, ed] = block.end_date.split("-").map(Number);
    const cursor = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    while (cursor <= end) {
      dates.add(toISODate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return dates;
}

export function ProfessionalCalendar({ professionalId }: { professionalId: string }) {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedDate, setSelectedDate] = useState(todayIso());

  const monthBounds = useMemo(
    () => getMonthBounds(visibleMonth.year, visibleMonth.month),
    [visibleMonth],
  );

  const { appointments, status, changeStatus, reschedule, reload } = useMyAppointments(
    professionalId,
    monthBounds.start,
    monthBounds.end,
  );
  const { conflictIds, reload: reloadConflicts } = useScheduleConflicts(professionalId);
  const availabilityBlocks = useAvailabilityBlocks(professionalId);
  const { datesWithoutAvailability, reload: reloadMonthAvailability } = useMonthAvailability(
    professionalId,
    visibleMonth.year,
    visibleMonth.month,
  );

  const appointmentCounts = useMemo(() => {
    return appointments.reduce<Record<string, number>>((acc, appt) => {
      acc[appt.appointment_date] = (acc[appt.appointment_date] ?? 0) + 1;
      return acc;
    }, {});
  }, [appointments]);

  const blockedDates = useMemo(
    () => expandBlockedDates(availabilityBlocks.blocks),
    [availabilityBlocks.blocks],
  );

  const dayAppointments = useMemo<Appointment[]>(
    () => appointments.filter((appt) => appt.appointment_date === selectedDate),
    [appointments, selectedDate],
  );

  async function handleDataChanged() {
    await Promise.all([reload(), reloadConflicts(), reloadMonthAvailability()]);
  }

  function handleMonthChange(year: number, month: number) {
    setVisibleMonth({ year, month });
    // El rango de turnos cargado cambia con el mes -- si la fecha elegida quedó fuera, el panel
    // mostraría "sin turnos" aunque los haya, porque todavía no se pidieron esos datos.
    setSelectedDate(toISODate(new Date(year, month, 1)));
  }

  return (
    <div className="flex flex-col gap-10">
      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          Error al cargar los turnos de este mes.
        </p>
      )}

      <ScheduleConflictsBanner conflictCount={conflictIds.size} status={status} />

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <MonthCalendar
          year={visibleMonth.year}
          month={visibleMonth.month}
          onMonthChange={handleMonthChange}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          appointmentCounts={appointmentCounts}
          blockedDates={blockedDates}
          datesWithoutAvailability={datesWithoutAvailability}
        />
        <DayPanel
          professionalId={professionalId}
          date={selectedDate}
          dayAppointments={dayAppointments}
          conflictIds={conflictIds}
          changeStatus={changeStatus}
          reschedule={reschedule}
          onDataChanged={handleDataChanged}
          onSelectDate={setSelectedDate}
          dayBlocks={availabilityBlocks.blocks}
          addDayBlock={availabilityBlocks.addBlock}
          removeDayBlock={availabilityBlocks.removeBlock}
          isDayBlockSaving={availabilityBlocks.isSaving}
        />
      </div>

      <WeeklyAvailabilityForm professionalId={professionalId} onChanged={handleDataChanged} />
    </div>
  );
}
