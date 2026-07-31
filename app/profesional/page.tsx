import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfessionalHomePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Mi panel</h1>
      <p className="text-sm text-muted-foreground">
        Administrá tu información de perfil en SALUS.
      </p>
      <div>
        <Button asChild>
          <Link href="/profesional/perfil">Editar mi perfil</Link>
        </Button>
      </div>
    </div>
  );
}
