"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  getOwnAvailabilityBlocks,
} from "@/repositories/availabilityRepository";
import type { AvailabilityBlock } from "@/features/appointments/types";

export function useAvailabilityBlocks(professionalId: string) {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getOwnAvailabilityBlocks(professionalId);
      setBlocks(data);
      setStatus("ready");
    } catch (err) {
      console.error("Error al cargar bloqueos:", err);
      setStatus("error");
    }
  }, [professionalId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addBlock(date: string, reason: string) {
    await createAvailabilityBlock({
      professional_id: professionalId,
      blocked_date: date,
      reason: reason || null,
    });
    await load();
  }

  async function removeBlock(id: string) {
    await deleteAvailabilityBlock(id);
    await load();
  }

  return { blocks, status, addBlock, removeBlock };
}
