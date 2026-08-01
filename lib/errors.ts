// Los errores de supabase-js (PostgrestError, incluidos los `raise exception` de triggers/RPCs)
// no son instancias de `Error` en la versión que usa este proyecto -- son objetos planos con
// `message`/`details`/`hint`/`code`. `err instanceof Error` da falso para ellos, así que un
// catch que solo chequea eso pierde el mensaje específico (ej. "Ese horario se superpone...")
// y cae siempre al fallback genérico.
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}
