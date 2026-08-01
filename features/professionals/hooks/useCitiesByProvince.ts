"use client";

import { useEffect, useState } from "react";
import { getCitiesByProvince } from "@/repositories/locationsRepository";

type Status = "idle" | "loading" | "error" | "ready";

export function useCitiesByProvince(province: string) {
  const [status, setStatus] = useState<Status>(province ? "loading" : "idle");
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (!province) {
      setCities([]);
      setStatus("idle");
      return;
    }

    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const data = await getCitiesByProvince(province);
        if (cancelled) return;
        setCities(data);
        setStatus("ready");
      } catch (err) {
        console.error("Error al cargar ciudades:", err);
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [province]);

  return { status, cities };
}
