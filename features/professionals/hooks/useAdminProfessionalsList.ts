"use client";

import { useCallback, useEffect, useState } from "react";
import {
  activateProfessional,
  deactivateProfessional,
  getAllProfessionalsAdmin,
} from "@/repositories/professionalsRepository";
import type { Professional } from "@/features/professionals/types";

type Status = "loading" | "error" | "ready";

export function useAdminProfessionalsList() {
  const [status, setStatus] = useState<Status>("loading");
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getAllProfessionalsAdmin();
      setProfessionals(data);
      setStatus("ready");
    } catch (err) {
      console.error("Error al cargar profesionales:", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function deactivate(id: string) {
    await deactivateProfessional(id);
    await load();
  }

  async function activate(id: string) {
    await activateProfessional(id);
    await load();
  }

  return { status, professionals, deactivate, activate, reload: load };
}
