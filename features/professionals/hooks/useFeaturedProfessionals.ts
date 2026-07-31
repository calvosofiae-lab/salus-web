"use client";

import { useEffect, useState } from "react";
import { getFeaturedProfessionals } from "@/repositories/professionalsRepository";
import type { Professional } from "@/features/professionals/types";

type Status = "loading" | "empty" | "error" | "ready";

export function useFeaturedProfessionals() {
  const [status, setStatus] = useState<Status>("loading");
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const data = await getFeaturedProfessionals();
        if (cancelled) return;
        setProfessionals(data);
        setStatus(data.length > 0 ? "ready" : "empty");
      } catch (err) {
        console.error("Error al cargar destacados:", err);
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, professionals };
}
