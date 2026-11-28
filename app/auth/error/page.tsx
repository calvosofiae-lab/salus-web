import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Pantalla genérica de error de autenticación. No muestra el texto que llega en ?error=:
// cualquiera puede armar un link a esta página con el mensaje que quiera ("tu cuenta fue
// bloqueada, llamá a...") y que aparezca dentro de salusprofesionales.com.ar.
export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Algo salió mal</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            El link no es válido o ya venció. Si estabas recuperando tu contraseña, pedí un link
            nuevo.
          </p>
          <Link href="/auth/forgot-password" className="text-sm underline underline-offset-4">
            Recuperar contraseña
          </Link>
          <Link href="/auth/login" className="text-sm underline underline-offset-4">
            Volver a ingresar
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
