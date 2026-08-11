// Traducciones puntuales para violaciones de check constraint que no pasan por un `raise
// exception` con mensaje propio (ej. constraints declarados directo en el `create table`).
// Si el mensaje crudo de Postgres menciona alguno de estos nombres, se reemplaza por texto
// legible en vez de mostrar "violates check constraint ...".
const CHECK_CONSTRAINT_MESSAGES: Record<string, string> = {
  availability_rules_end_after_start_check: "El horario de fin debe ser posterior al de inicio.",
  availability_blocks_end_after_start_check:
    "La fecha de fin debe ser igual o posterior a la de inicio.",
};

function translateConstraintViolation(message: string): string | null {
  const match = message.match(/violates check constraint "([^"]+)"/);
  if (!match) return null;
  return CHECK_CONSTRAINT_MESSAGES[match[1]] ?? null;
}

// SQLSTATE que Postgres asigna por default a un `raise exception 'mensaje'` que no
// especifica su propio código -- es el que usan todos los `raise exception '<mensaje en
// español>'` de las funciones/triggers de este proyecto (ver supabase/migrations). Sirve para
// distinguir esos mensajes, pensados para mostrarse tal cual, de cualquier otro error de
// Postgres/PostgREST (función ambigua, permiso denegado, columna inexistente, etc.) que es un
// detalle interno y no debería llegar crudo a la persona que está reservando un turno.
const RAISED_APPLICATION_ERROR_CODE = "P0001";

// Los errores de supabase-js (PostgrestError, incluidos los `raise exception` de triggers/RPCs)
// no son instancias de `Error` en la versión que usa este proyecto -- son objetos planos con
// `message`/`details`/`hint`/`code`. `err instanceof Error` da falso para ellos, así que un
// catch que solo chequea eso pierde el mensaje específico (ej. "Ese horario se superpone...")
// y cae siempre al fallback genérico.
export function getErrorMessage(err: unknown, fallback: string): string {
  // Errores que el código de la app tira a mano (`throw new Error("...")`) son mensajes
  // escritos a propósito para mostrarse -- se confía en ellos igual que antes.
  if (err instanceof Error) return err.message;

  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    const rawMessage = (err as { message: string }).message;

    const translated = translateConstraintViolation(rawMessage);
    if (translated) return translated;

    const code = "code" in err ? (err as { code: unknown }).code : null;
    if (code === RAISED_APPLICATION_ERROR_CODE) return rawMessage;
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
