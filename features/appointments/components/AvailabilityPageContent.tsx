"use client";

import { useScheduleConflicts } from "@/features/appointments/hooks/useScheduleConflicts";
import { ScheduleConflictsBanner } from "@/features/appointments/components/ScheduleConflictsBanner";
import { WeeklyAvailabilityForm } from "@/features/appointments/components/WeeklyAvailabilityForm";
import { AvailabilityCalendar } from "@/features/appointments/components/AvailabilityCalendar";
import { BlockDateForm } from "@/features/appointments/components/BlockDateForm";

export function AvailabilityPageContent({ professionalId }: { professionalId: string }) {
  const { conflictIds, status, reload } = useScheduleConflicts(professionalId);

  return (
    <div className="flex flex-col gap-10">
      <ScheduleConflictsBanner conflictCount={conflictIds.size} status={status} />
      <WeeklyAvailabilityForm professionalId={professionalId} onChanged={reload} />
      <AvailabilityCalendar professionalId={professionalId} onChanged={reload} />
      <BlockDateForm professionalId={professionalId} onChanged={reload} />
    </div>
  );
}
