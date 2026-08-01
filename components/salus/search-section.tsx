"use client";

import { FormEvent, useState } from "react";
import {
  COVERAGE_OPTIONS,
  CONSULTATION_REASONS,
  GENDER_OPTIONS,
  MODALITY_OPTIONS,
  PROFESSION_OPTIONS,
} from "@/features/professionals/constants";
import { useProfessionalSearch } from "@/features/professionals/hooks/useProfessionalSearch";
import { useProvinces } from "@/features/professionals/hooks/useProvinces";
import { useCitiesByProvince } from "@/features/professionals/hooks/useCitiesByProvince";
import type {
  Coverage,
  Modality,
  Profession,
} from "@/features/professionals/types";
import { ProfessionalCard } from "@/components/salus/professional-card";
import { EmergencyBanner } from "@/components/salus/emergency-banner";

export function SearchSection() {
  const [profesion, setProfesion] = useState<Profession | "">("");
  const [motivo, setMotivo] = useState("");
  const [genero, setGenero] = useState("");
  const [cobertura, setCobertura] = useState<Coverage | "">("");
  const [modalidad, setModalidad] = useState<Modality | "">("");
  const [provincia, setProvincia] = useState("");
  const [ciudad, setCiudad] = useState("");

  const [searched, setSearched] = useState(false);
  const { status, results, search } = useProfessionalSearch();
  const { provinces } = useProvinces();
  const { cities: ciudadesDisponibles, status: citiesStatus } = useCitiesByProvince(provincia);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSearched(true);

    await search({
      profession: profesion || undefined,
      consultationReason: motivo || undefined,
      gender: genero || undefined,
      coverage: cobertura || undefined,
      modality: modalidad || undefined,
      province: modalidad === "presencial" ? provincia || undefined : undefined,
      city: modalidad === "presencial" ? ciudad || undefined : undefined,
    });
  }

  function handleModalidadChange(value: Modality | "") {
    setModalidad(value);
    if (value !== "presencial") {
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
                onChange={(e) => setProfesion(e.target.value as Profession | "")}
              >
                <option value="">Todas (Psicología y Psiquiatría)</option>
                {PROFESSION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="motivo">Motivo de consulta</label>
              <select id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                <option value="">Todos los motivos</option>
                {CONSULTATION_REASONS.map((m) => (
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
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    Prefiero profesional {o.label.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="cobertura">Atención / Cobertura</label>
              <select
                id="cobertura"
                value={cobertura}
                onChange={(e) => setCobertura(e.target.value as Coverage | "")}
              >
                <option value="">Todas las coberturas</option>
                {COVERAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="modalidad">Modalidad</label>
              <select
                id="modalidad"
                value={modalidad}
                onChange={(e) => handleModalidadChange(e.target.value as Modality | "")}
              >
                <option value="">Todas las modalidades</option>
                {MODALITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              id="locationGroup"
              className={`full-width-group ${modalidad === "presencial" ? "active" : ""}`}
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
                    {provinces.map((p) => (
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
                      {!provincia
                        ? "Seleccioná primero una provincia"
                        : citiesStatus === "loading"
                          ? "Cargando ciudades..."
                          : "Todas las ciudades/localidades"}
                    </option>
                    {ciudadesDisponibles.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    {provincia && citiesStatus === "ready" && ciudadesDisponibles.length === 0 && (
                      <option value="General">Toda la provincia</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="btn-search-container">
            <button type="submit" className="btn-search" disabled={status === "loading"}>
              {status === "loading" ? "Buscando..." : "Buscar Profesionales"}
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
                results.map((prof) => <ProfessionalCard key={prof.id} prof={prof} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
