"use client";

import { useCallback, useEffect, useState } from "react";
import {
  activateProfessional,
  deactivateProfessional,
  getAllProfessionalsAdmin,
  setProfessionalFeaturedOfMonth,
  setProfessionalPremium,
} from "@/repositories/professionalsRepository";
import { getErrorMessage } from "@/lib/errors";
import type { Professional } from "@/features/professionals/types";

type Status = "loading" | "error" | "ready";
type SavingAction = "activate" | "deactivate" | "premium" | "featured_of_month";

export const ADMIN_PROFESSIONALS_PAGE_SIZE = 20;

export function useAdminProfessionalsList() {
  const [status, setStatus] = useState<Status>("loading");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  // Las tres acciones (activar/desactivar/cambiar plan) comparten savingId para
  // deshabilitar los botones de la fila mientras cualquiera esté en curso, pero cada botón
  // necesita saber si la acción EN CURSO es la suya para no mostrar "Dando de baja..." cuando
  // en realidad se está cambiando el plan (o viceversa).
  const [savingAction, setSavingAction] = useState<SavingAction | null>(null);

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
    setSavingAction("deactivate");
    setError(null);
    try {
      await deactivateProfessional(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al dar de baja al profesional"));
    } finally {
      setSavingId(null);
      setSavingAction(null);
    }
  }

  async function activate(id: string) {
    setSavingId(id);
    setSavingAction("activate");
    setError(null);
    try {
      await activateProfessional(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al reactivar al profesional"));
    } finally {
      setSavingId(null);
      setSavingAction(null);
    }
  }

  async function togglePremium(id: string, isPremium: boolean) {
    setSavingId(id);
    setSavingAction("premium");
    setError(null);
    try {
      await setProfessionalPremium(id, isPremium);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Ocurrió un error al cambiar el plan del profesional"));
    } finally {
      setSavingId(null);
      setSavingAction(null);
    }
  }

  async function toggleFeaturedOfMonth(id: string, featured: boolean) {
    setSavingId(id);
    setSavingAction("featured_of_month");
    setError(null);
    try {
      await setProfessionalFeaturedOfMonth(id, featured);
      await load();
    } catch (err) {
      setError(
        getErrorMessage(err, "Ocurrió un error al cambiar el destacado del mes del profesional"),
      );
    } finally {
      setSavingId(null);
      setSavingAction(null);
    }
  }

  const pageCount = Math.max(1, Math.ceil(totalCount / ADMIN_PROFESSIONALS_PAGE_SIZE));

  return {
    status,
    professionals,
    error,
    savingId,
    savingAction,
    deactivate,
    activate,
    togglePremium,
    toggleFeaturedOfMonth,
    reload: load,
    page,
    pageCount,
    setPage,
  };
}
