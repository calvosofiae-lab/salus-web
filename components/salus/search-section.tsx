"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CAMPOS,
  CIUDADES_POR_PROVINCIA,
  PROVINCIAS,
  Profesional,
  TABLA_PROFESIONALES,
} from "@/lib/salus/constants";
import { ProfessionalCard } from "@/components/salus/professional-card";
import { EmergencyBanner } from "@/components/salus/emergency-banner";

const MOTIVOS = [
  "Adolescentes",
  "Psicología infantil",
  "Adultos general",
  "Orientación vocacional",
  "Trastornos de la conducta alimentaria",
  "Consumo problemático",
  "Sexualidad y género",
  "Violencia de género",
  "Neurodivergencias",
];

export function SearchSection() {
  const [profesion, setProfesion] = useState("");
  const [motivo, setMotivo] = useState("");
  const [genero, setGenero] = useState("");
  const [cobertura, setCobertura] = useState("");
  const [modalidad, setModalidad] = useState("");
  const [provincia, setProvincia] = useState("");
  const [ciudad, setCiudad] = useState("");

  const [searched, setSearched] = useState(false);
  const [status, setStatus] = useState<"loading" | "empty" | "error" | "ready">("loading");
  const [resultados, setResultados] = useState<Profesional[]>([]);
  const [searching, setSearching] = useState(false);

  const ciudadesDisponibles = provincia ? CIUDADES_POR_PROVINCIA[provincia] : undefined;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSearched(true);
    setStatus("loading");
    setSearching(true);

    try {
      const supabase = createClient();
      let query = supabase.from(TABLA_PROFESIONALES).select("*");

      if (profesion) query = query.ilike(CAMPOS.profesion, `%${profesion}%`);
      if (motivo) query = query.ilike(CAMPOS.motivo, `%${motivo}%`);
      if (genero) query = query.eq(CAMPOS.genero, genero);
      if (cobertura) query = query.ilike(CAMPOS.cobertura, `%${cobertura}%`);
      if (modalidad) query = query.ilike(CAMPOS.modalidad, `%${modalidad}%`);

      if (modalidad === "Presencial") {
        if (ciudad) {
          query = query.ilike(CAMPOS.ubicacion, `%${ciudad}%`);
        } else if (provincia) {
          query = query.ilike(CAMPOS.ubicacion, `%${provincia}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        setStatus("empty");
        setResultados([]);
        return;
      }

      setResultados(data);
      setStatus("ready");
    } catch (err) {
      console.error("Error consultando Supabase:", err);
      setStatus("error");
    } finally {
      setSearching(false);
    }
  }

  function handleModalidadChange(value: string) {
    setModalidad(value);
    if (value !== "Presencial") {
      setProvincia("");
      setCiudad("");
    }
  }

  function handleProvinciaChange(value: string) {
    setProvincia(value);
    setCiudad("");
  }

  return (
    <div id="buscador" className="search-section">
      <EmergencyBanner />

      <div className="search-panel">
        <form id="searchForm" onSubmit={handleSubmit}>
          <div className="grid-filters">
            <div className="filter-group">
              <label htmlFor="profesion">Especialidad</label>
              <select
                id="profesion"
                value={profesion}
                onChange={(e) => setProfesion(e.target.value)}
              >
                <option value="">Todas (Psicología y Psiquiatría)</option>
                <option value="Psicólogo/a">Psicólogo/a</option>
                <option value="Psiquiatra">Psiquiatra</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="motivo">Motivo de consulta</label>
              <select id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                <option value="">Todos los motivos</option>
                {MOTIVOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="genero">Género del profesional</label>
              <select id="genero" value={genero} onChange={(e) => setGenero(e.target.value)}>
                <option value="">Prefiero no especificar</option>
                <option value="Prefiero profesional mujer">Prefiero profesional mujer</option>
                <option value="Prefiero profesional hombre">Prefiero profesional hombre</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="cobertura">Atención / Cobertura</label>
              <select
                id="cobertura"
                value={cobertura}
                onChange={(e) => setCobertura(e.target.value)}
              >
                <option value="">Todas las coberturas</option>
                <option value="particular">Particular</option>
                <option value="obra-social">Obra social</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="modalidad">Modalidad</label>
              <select
                id="modalidad"
                value={modalidad}
                onChange={(e) => handleModalidadChange(e.target.value)}
              >
                <option value="">Todas las modalidades</option>
                <option value="Virtual">Virtual</option>
                <option value="Presencial">Presencial</option>
              </select>
            </div>

            <div
              id="locationGroup"
              className={`full-width-group ${modalidad === "Presencial" ? "active" : ""}`}
            >
              <div className="location-flex">
                <div className="filter-group">
                  <label htmlFor="provincia">Provincia</label>
                  <select
                    id="provincia"
                    value={provincia}
                    onChange={(e) => handleProvinciaChange(e.target.value)}
                  >
                    <option value="">Todas las provincias</option>
                    {PROVINCIAS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="ciudad">Ciudad / Localidad</label>
                  <select id="ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
                    <option value="">
                      {ciudadesDisponibles
                        ? "Todas las ciudades/localidades"
                        : "Seleccioná primero una provincia"}
                    </option>
                    {ciudadesDisponibles?.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    {provincia && !ciudadesDisponibles && (
                      <option value="General">Toda la provincia</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="btn-search-container">
            <button type="submit" className="btn-search" disabled={searching}>
              {searching ? "Buscando..." : "Buscar Profesionales"}
            </button>
          </div>
        </form>

        {searched && (
          <div id="resultsContainer" className="results-container active">
            <h3 className="results-title">Resultados de tu Búsqueda</h3>
            <div id="resultsGrid" className="featured-grid">
              {status === "loading" && (
                <div className="status-msg">Buscando profesionales disponibles...</div>
              )}
              {status === "empty" && (
                <div className="status-msg">
                  No encontramos profesionales con los filtros seleccionados. Probá ampliar la
                  búsqueda.
                </div>
              )}
              {status === "error" && (
                <div className="status-msg">
                  Ocurrió un error al realizar la búsqueda. Intentalo de nuevo.
                </div>
              )}
              {status === "ready" &&
                resultados.map((prof, i) => <ProfessionalCard key={i} prof={prof} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
