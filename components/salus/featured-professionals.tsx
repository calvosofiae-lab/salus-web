"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CAMPOS, Profesional, TABLA_PROFESIONALES } from "@/lib/salus/constants";
import { ProfessionalCard } from "@/components/salus/professional-card";

export function FeaturedProfessionals() {
  const [status, setStatus] = useState<"loading" | "empty" | "error" | "ready">("loading");
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);

  useEffect(() => {
    async function cargarDestacados() {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from(TABLA_PROFESIONALES)
          .select("*")
          .eq(CAMPOS.destacado, "true");

        if (error) throw error;

        if (!data || data.length === 0) {
          const { data: todos } = await supabase.from(TABLA_PROFESIONALES).select("*").limit(3);
          if (todos && todos.length > 0) {
            setProfesionales(todos);
            setStatus("ready");
          } else {
            setStatus("empty");
          }
          return;
        }

        setProfesionales(data);
        setStatus("ready");
      } catch (err) {
        console.error("Error al cargar destacados:", err);
        setStatus("error");
      }
    }

    cargarDestacados();
  }, []);

  return (
    <div id="destacadosGrid" className="featured-grid">
      {status === "loading" && <div className="status-msg">Cargando destacados...</div>}
      {status === "empty" && (
        <div className="status-msg">No hay profesionales destacados en este momento.</div>
      )}
      {status === "error" && (
        <div className="status-msg">Error al cargar los profesionales destacados.</div>
      )}
      {status === "ready" &&
        profesionales.map((prof, i) => <ProfessionalCard key={i} prof={prof} />)}
    </div>
  );
}
