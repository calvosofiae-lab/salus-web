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

// Código SQLSTATE de Postgres para violación de constraint `unique` (independiente del
// nombre de la constraint, así que sirve para cualquier tabla). Útil para traducir el
// mensaje crudo de Postgres ("duplicate key value violates unique constraint...") a algo
// legible sin tener que envolver cada insert directo en una función/RPC.
export const POSTGRES_UNIQUE_VIOLATION = "23505";

export function isPostgresErrorCode(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === code
  );
}
