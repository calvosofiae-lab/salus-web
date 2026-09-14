"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createDateBlock,
  deleteDateBlock,
  getDaySchedule,
  getOwnDateBlocks,
} from "@/repositories/availabilityRepository";
import { getErrorMessage } from "@/lib/errors";
import { todayIso } from "@/features/appointments/lib/date";
import type { AvailabilityDateBlock, DaySlot } from "@/features/appointments/types";

export function useAvailabilityCalendar(professionalId: string) {
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [dateBlocks, setDateBlocks] = useState<AvailabilityDateBlock[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [daySlots, blocks] = await Promise.all([
        getDaySchedule(professionalId, date),
        getOwnDateBlocks(professionalId),
      ]);
      setSlots(daySlots);
      setDateBlocks(blocks);
      setStatus("ready");
    } catch (err) {
      console.error("Error al cargar el calendario de disponibilidad:", err);
      setStatus("error");
    }
  }, [professionalId, date]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleSlot(slot: DaySlot) {
    if (slot.status === "reservado") return;
    setIsSaving(true);
    setError(null);
    try {
      if (slot.status === "bloqueado") {
        const block = dateBlocks.find(
          (b) => b.date === date && b.start_time.slice(0, 5) === slot.startTime.slice(0, 5),
        );
        if (block) await deleteDateBlock(block.id);
      } else {
        await createDateBlock({
          professional_id: professionalId,
          date,
          start_time: slot.startTime,
        });
      }
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al actualizar ese horario"));
    } finally {
      setIsSaving(false);
    }
  }

  return { date, setDate, slots, status, error, isSaving, toggleSlot };
}
