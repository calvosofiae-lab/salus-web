"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminProfessionalsList } from "@/features/professionals/hooks/useAdminProfessionalsList";
import { PROFESSION_LABELS } from "@/features/professionals/constants";

export function ProfessionalsTable() {
  const { status, professionals, deactivate, activate } = useAdminProfessionalsList();

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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4">Nombre</th>
            <th className="py-2 pr-4">Profesión</th>
            <th className="py-2 pr-4">Estado</th>
            <th className="py-2 pr-4">Destacado</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {professionals.map((prof) => (
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
              <td className="py-2 pr-4">{prof.is_featured ? "Sí" : "No"}</td>
              <td className="py-2 pr-4">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/profesionales/${prof.id}/editar`}>Editar</Link>
                  </Button>
                  {prof.is_active ? (
                    <Button size="sm" variant="destructive" onClick={() => deactivate(prof.id)}>
                      Dar de baja
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => activate(prof.id)}>
                      Reactivar
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
