"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminProfessionalsList } from "@/features/professionals/hooks/useAdminProfessionalsList";
import { PROFESSION_LABELS } from "@/features/professionals/constants";
import type { Professional } from "@/features/professionals/types";

export function ProfessionalsTable() {
  const {
    status,
    professionals,
    error,
    savingId,
    deactivate,
    activate,
    page,
    pageCount,
    setPage,
  } = useAdminProfessionalsList();

  function handleDeactivate(prof: Professional) {
    const confirmed = window.confirm(
      `¿Dar de baja a ${prof.full_name}? Va a dejar de verse en la búsqueda pública.`,
    );
    if (!confirmed) return;
    deactivate(prof.id);
  }

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Cargando profesionales...</p>;
  }
  if (status === "error") {
    return <p className="text-sm text-red-500">Error al cargar los profesionales.</p>;
  }
  if (professionals.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay profesionales cargados todavía.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-4">Nombre</th>
              <th className="py-2 pr-4">Profesión</th>
              <th className="py-2 pr-4">Estado</th>
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody>
            {professionals.map((prof) => {
              const isSaving = savingId === prof.id;
              return (
                <tr key={prof.id} className="border-b">
                  <td className="py-2 pr-4">{prof.full_name}</td>
                  <td className="py-2 pr-4">
                    {PROFESSION_LABELS[prof.profession] ?? prof.profession}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant={prof.is_active ? "default" : "secondary"}>
                      {prof.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline" disabled={isSaving}>
                        <Link href={`/admin/profesionales/${prof.id}/editar`}>Editar</Link>
                      </Button>
                      {prof.is_active ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isSaving}
                          onClick={() => handleDeactivate(prof)}
                        >
                          {isSaving ? "Dando de baja..." : "Dar de baja"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSaving}
                          onClick={() => activate(prof.id)}
                        >
                          {isSaving ? "Reactivando..." : "Reactivar"}
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
