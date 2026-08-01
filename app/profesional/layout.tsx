import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 border-b-brand-teal bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/profesional" className="font-semibold text-brand-navy">
              SALUS Profesional
            </Link>
            <Link
              href="/profesional/disponibilidad"
              className="text-muted-foreground hover:text-brand-navy"
            >
              Disponibilidad
            </Link>
            <Link
              href="/profesional/turnos"
              className="text-muted-foreground hover:text-brand-navy"
            >
              Mis turnos
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
      <main className="flex-1 max-w-5xl w-full mx-auto p-6">{children}</main>
    </div>
  );
}
