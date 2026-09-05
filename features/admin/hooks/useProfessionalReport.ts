"use client";

import { useCallback, useEffect, useState } from "react";
import { getProfessionalReport } from "@/repositories/professionalsRepository";
import type { ProfessionalReportRow } from "@/features/admin/types";

type Status = "loading" | "error" | "ready";

export function useProfessionalReport() {
  const [status, setStatus] = useState<Status>("loading");
  const [rows, setRows] = useState<ProfessionalReportRow[]>([]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getProfessionalReport();
      setRows(data);
      setStatus("ready");
    } catch (err) {
      console.error("Error al cargar el reporte de profesionales:", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { status, rows, reload: load };
}
