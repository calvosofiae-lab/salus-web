import { redirect } from "next/navigation";

// La disponibilidad se unificó con "Agenda" en una sola pantalla -- este link puede seguir
// guardado en favoritos o accesos directos de algún profesional.
export default function AvailabilityPage() {
  redirect("/profesional/turnos");
}
