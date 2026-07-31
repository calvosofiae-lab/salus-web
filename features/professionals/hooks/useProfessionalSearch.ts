"use client";

import { useState } from "react";
import { searchProfessionals } from "@/repositories/professionalsRepository";
import type { Professional, ProfessionalFilters } from "@/features/professionals/types";

type Status = "idle" | "loading" | "empty" | "error" | "ready";

export function useProfessionalSearch() {
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<Professional[]>([]);

  async function search(filters: ProfessionalFilters) {
    setStatus("loading");
    try {
      const data = await searchProfessionals(filters);
      setResults(data);
      setStatus(data.length > 0 ? "ready" : "empty");
    } catch (err) {
      console.error("Error consultando profesionales:", err);
      setStatus("error");
    }
  }

  return { status, results, search };
}
