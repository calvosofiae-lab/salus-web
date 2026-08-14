import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 border-b-brand-teal bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/admin" className="font-semibold text-brand-navy">
              SALUS Admin
            </Link>
            <Link href="/admin/profesionales" className="text-muted-foreground hover:text-brand-navy">
              Profesionales
            </Link>
            <Link href="/admin/cuenta" className="text-muted-foreground hover:text-brand-navy">
              Mi cuenta
            </Link>
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-6">{children}</main>
    </div>
  );
}
