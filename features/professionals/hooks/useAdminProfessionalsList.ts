"use client";

import { useCallback, useEffect, useState } from "react";
import {
  activateProfessional,
  deactivateProfessional,
  getAllProfessionalsAdmin,
} from "@/repositories/professionalsRepository";
import { getErrorMessage } from "@/lib/errors";
import type { Professional } from "@/features/professionals/types";

type Status = "loading" | "error" | "ready";

export const ADMIN_PROFESSIONALS_PAGE_SIZE = 20;

export function useAdminProfessionalsList() {
  const [status, setStatus] = useState<Status>("loading");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const { data, count } = await getAllProfessionalsAdmin(page, ADMIN_PROFESSIONALS_PAGE_SIZE);
      setProfessionals(data);
      setTotalCount(count);
      setStatus("ready");
    } catch (err) {
      console.error("Error al cargar profesionales:", err);
      setStatus("error");
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function deactivate(id: string) {
    setSavingId(id);
    setError(null);
    try {
      await deactivateProfessional(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al dar de baja al profesional"));
    } finally {
      setSavingId(null);
    }
  }

  async function activate(id: string) {
    setSavingId(id);
    setError(null);
    try {
      await activateProfessional(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al reactivar al profesional"));
    } finally {
      setSavingId(null);
    }
  }

  const pageCount = Math.max(1, Math.ceil(totalCount / ADMIN_PROFESSIONALS_PAGE_SIZE));

  return {
    status,
    professionals,
    error,
    savingId,
    deactivate,
    activate,
    reload: load,
    page,
    pageCount,
    setPage,
  };
}
