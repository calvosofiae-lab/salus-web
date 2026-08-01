"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  getOwnAvailabilityBlocks,
} from "@/repositories/availabilityRepository";
import { getErrorMessage } from "@/lib/errors";
import type { AvailabilityBlock } from "@/features/appointments/types";

export function useAvailabilityBlocks(professionalId: string) {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
    setError(null);
    try {
      await createAvailabilityBlock({
        professional_id: professionalId,
        blocked_date: date,
        reason: reason || null,
      });
      await load();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al bloquear la fecha"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function removeBlock(id: string) {
    setIsSaving(true);
    setError(null);
    try {
      await deleteAvailabilityBlock(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al quitar el bloqueo"));
    } finally {
      setIsSaving(false);
    }
  }

  return { blocks, status, error, isSaving, addBlock, removeBlock };
}
