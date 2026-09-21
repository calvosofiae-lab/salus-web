import Link from "next/link";
import { Suspense } from "react";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { ProfessionalGate } from "./professional-gate";

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 border-b-brand-teal bg-white">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-x-5 gap-y-2 p-4">
          <nav className="flex flex-wrap items-center gap-5 text-sm font-medium">
            <Link href="/profesional" className="font-semibold text-brand-navy">
              SALUS Profesional
            </Link>
            <Link
              href="/profesional/turnos"
              className="text-muted-foreground hover:text-brand-navy"
            >
              Agenda
            </Link>
            <Link
              href="/profesional/perfil"
              className="text-muted-foreground hover:text-brand-navy"
            >
              Mi perfil
            </Link>
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
          <ProfessionalGate>{children}</ProfessionalGate>
        </Suspense>
      </main>
    </div>
  );
}
