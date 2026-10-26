"use client";

import Link from "next/link";
import { Eye, Pencil, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useAdminProfessionalsList,
  type ActiveFilter,
} from "@/features/professionals/hooks/useAdminProfessionalsList";
import { PROFESSION_LABELS } from "@/features/professionals/constants";
import type { Professional } from "@/features/professionals/types";

const ACTIVE_FILTER_OPTIONS: { value: ActiveFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

const EMPTY_MESSAGES: Record<ActiveFilter, string> = {
  all: "No hay profesionales cargados todavía.",
  active: "No hay profesionales activos.",
  inactive: "No hay profesionales inactivos.",
};

export function ProfessionalsTable() {
  const {
    status,
    professionals,
    error,
    savingId,
    savingAction,
    deactivate,
    activate,
    togglePremium,
    toggleFeaturedOfMonth,
    page,
    pageCount,
    setPage,
    activeFilter,
    setActiveFilter,
  } = useAdminProfessionalsList();

  function handleDeactivate(prof: Professional) {
    const confirmed = window.confirm(
      `¿Dar de baja a ${prof.full_name}? Va a dejar de verse en la búsqueda pública.`,
    );
    if (!confirmed) return;
    deactivate(prof.id);
  }

  const filterButtons = (
    <div className="flex gap-2">
      {ACTIVE_FILTER_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={activeFilter === option.value ? "default" : "outline"}
          onClick={() => setActiveFilter(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-3">
        {filterButtons}
        <p className="text-sm text-muted-foreground">Cargando profesionales...</p>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex flex-col gap-3">
        {filterButtons}
        <p className="text-sm text-red-500">Error al cargar los profesionales.</p>
      </div>
    );
  }
  if (professionals.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {filterButtons}
        <p className="text-sm text-muted-foreground">{EMPTY_MESSAGES[activeFilter]}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filterButtons}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-4">Nombre</th>
              <th className="py-2 pr-4">Profesión</th>
              <th className="py-2 pr-4">Precio</th>
              <th className="py-2 pr-4">Estado</th>
              <th className="py-2 pr-4">Plan</th>
              <th className="py-2 pr-4">Destacado del mes</th>
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody>
            {professionals.map((prof) => {
              const isSaving = savingId === prof.id;
              const isSavingAction = (
                action: "activate" | "deactivate" | "premium" | "featured_of_month",
              ) => isSaving && savingAction === action;
              return (
                <tr key={prof.id} className="border-b">
                  <td className="py-2 pr-4">{prof.full_name}</td>
                  <td className="py-2 pr-4">
                    {PROFESSION_LABELS[prof.profession] ?? prof.profession}
                  </td>
                  <td className="py-2 pr-4">
                    {prof.consultation_fee != null
                      ? `$${prof.consultation_fee.toLocaleString("es-AR")}`
                      : "—"}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant={prof.is_active ? "default" : "secondary"}>
                      {prof.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => togglePremium(prof.id, !prof.is_premium)}
                      title={
                        prof.is_premium
                          ? "Pasar a plan estándar"
                          : "Pasar a plan premium"
                      }
                      className="disabled:opacity-50"
                    >
                      <Badge
                        variant={prof.is_premium ? "default" : "outline"}
                        className={prof.is_premium ? "bg-brand-yellow text-brand-navy hover:bg-brand-yellow" : ""}
                      >
                        {prof.is_premium ? "Premium" : "Estándar"}
                      </Badge>
                    </button>
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        toggleFeaturedOfMonth(prof.id, !prof.is_featured_of_month)
                      }
                      title={
                        prof.is_featured_of_month
                          ? "Sacar de destacados del mes"
                          : "Marcar como destacado del mes (máximo 2 a la vez)"
                      }
                      className="disabled:opacity-50"
                    >
                      <Badge
                        variant={prof.is_featured_of_month ? "default" : "outline"}
                        className={
                          prof.is_featured_of_month
                            ? "bg-brand-teal text-white hover:bg-brand-teal"
                            : ""
                        }
                      >
                        {isSavingAction("featured_of_month")
                          ? "Guardando..."
                          : prof.is_featured_of_month
                            ? "Destacado"
                            : "No destacado"}
                      </Badge>
                    </button>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline" disabled={isSaving}>
                        <Link href={`/admin/profesionales/${prof.id}/turnos`}>
                          <Eye className="size-3.5" />
                          Ver turnos
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" disabled={isSaving}>
                        <Link href={`/admin/profesionales/${prof.id}/editar`}>
                          <Pencil className="size-3.5" />
                          Editar
                        </Link>
                      </Button>
                      {prof.is_active ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isSaving}
                          onClick={() => handleDeactivate(prof)}
                        >
                          <UserX className="size-3.5" />
                          {isSavingAction("deactivate") ? "Dando de baja..." : "Dar de baja"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSaving}
                          onClick={() => activate(prof.id)}
                        >
                          <UserCheck className="size-3.5" />
                          {isSavingAction("activate") ? "Reactivando..." : "Reactivar"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-muted-foreground">
            Página {page + 1} de {pageCount}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
