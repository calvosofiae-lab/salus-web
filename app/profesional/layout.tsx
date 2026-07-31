import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/profesional">SALUS Profesional</Link>
            <Link href="/profesional/disponibilidad">Disponibilidad</Link>
            <Link href="/profesional/turnos">Mis turnos</Link>
            <Link href="/profesional/perfil">Mi perfil</Link>
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-6">{children}</main>
    </div>
  );
}
