"use client";

import { useEffect, useState } from "react";
import { getProvinces } from "@/repositories/locationsRepository";

type Status = "loading" | "error" | "ready";

export function useProvinces() {
  const [status, setStatus] = useState<Status>("loading");
  const [provinces, setProvinces] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const data = await getProvinces();
        if (cancelled) return;
        setProvinces(data);
        setStatus("ready");
      } catch (err) {
        console.error("Error al cargar provincias:", err);
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, provinces };
}
