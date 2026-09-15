import { AlertTriangle } from "lucide-react";

export function ScheduleConflictsBanner({
  conflictCount,
  status,
}: {
  conflictCount: number;
  status: "loading" | "ready" | "error";
}) {
  if (status !== "ready" || conflictCount === 0) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        {conflictCount === 1
          ? "Hay 1 turno reservado que quedó fuera de tu disponibilidad actual."
          : `Hay ${conflictCount} turnos reservados que quedaron fuera de tu disponibilidad actual.`}{" "}
        Buscalos abajo en el calendario para reprogramarlos.
      </p>
    </div>
  );
}
