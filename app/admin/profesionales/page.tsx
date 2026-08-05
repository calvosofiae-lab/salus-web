import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfessionalsTable } from "@/features/admin/components/ProfessionalsTable";

export default function AdminProfessionalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-navy">Profesionales</h1>
        <Button asChild>
          <Link href="/admin/profesionales/nuevo">
            <UserPlus className="size-4" />
            Nuevo profesional
          </Link>
        </Button>
      </div>
      <ProfessionalsTable />
    </div>
  );
}
