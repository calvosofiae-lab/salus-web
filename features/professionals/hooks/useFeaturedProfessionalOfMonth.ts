"use client";

import { useEffect, useState } from "react";
import { getFeaturedProfessionalOfMonth } from "@/repositories/reviewsRepository";
import { getPublicProfessionalById } from "@/repositories/professionalsRepository";
import type { Professional } from "@/features/professionals/types";

export function useFeaturedProfessionalOfMonth() {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "none">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const id = await getFeaturedProfessionalOfMonth();
        if (!id) {
          if (!cancelled) setStatus("none");
          return;
        }
        const prof = await getPublicProfessionalById(id);
        if (cancelled) return;
        setProfessional(prof);
        setStatus(prof ? "ready" : "none");
      } catch (err) {
        console.error("Error al cargar el destacado del mes:", err);
        if (!cancelled) setStatus("none");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { professional, status };
}
