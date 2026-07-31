import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Panel de administración</h1>
      <p className="text-sm text-muted-foreground">
        Gestioná los profesionales de la red SALUS.
      </p>
      <div>
        <Button asChild>
          <Link href="/admin/profesionales">Ver profesionales</Link>
        </Button>
      </div>
    </div>
  );
}
