import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/admin">SALUS Admin</Link>
            <Link href="/admin/profesionales">Profesionales</Link>
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-6">{children}</main>
    </div>
  );
}
