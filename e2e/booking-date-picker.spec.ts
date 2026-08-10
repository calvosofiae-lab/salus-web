import { test, expect, type Page } from "@playwright/test";

// Regresión para el selector de fecha del turno (features/appointments/components/SlotPicker.tsx).
//
// Bug reportado: en Safari y Chrome de iPhone (ambos sobre WebKit) el popover nativo del
// input de fecha se cerraba solo apenas el usuario empezaba a elegir. Causas encontradas:
//   1. El input era un componente controlado (value={date}): React le reasignaba `.value` en
//      cada render, y WebKit interpreta esa asignación programática como un cambio externo
//      mientras el popover está abierto, cerrándolo. Se pasó a `defaultValue` (no controlado).
//   2. La rueda nativa de iOS dispara `onChange` en cada tick de scroll -- no solo al
//      confirmar -- pasando por valores intermedios (posiblemente domingo) antes de llegar a
//      la fecha final. El código ya no vacía la selección al pasar por un domingo intermedio.
//
// IMPORTANTE -- lo que esta suite NO puede probar: el popover de fecha es UI del sistema
// operativo, fuera del DOM de la página, así que ningún test de Playwright (en ningún motor,
// ni siquiera WebKit) puede abrirlo/cerrarlo ni verificar si "se cerró solo". Lo que sí cubre,
// corriendo en Chromium/Firefox/WebKit (desktop y con viewport de iPhone/Android emulado): que
// el estado de React no se resetea al elegir fecha y que el flujo llega y se queda en el paso
// de horarios. La confirmación en un iPhone real la sigue haciendo una persona.
//
// Los tests no completan la reserva (no tocan horarios ni envían el formulario de datos) para
// no crear turnos reales contra la base de datos configurada en .env.local.

const DATE_ERROR = "Solo se puede reservar de lunes a sábado.";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Próxima fecha (desde pasado mañana) que no caiga en domingo -- el único día bloqueado para
// reservar (ver SlotPicker.tsx).
function nextBookableDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}

// Domingo más cercano anterior a `target` -- simula el valor intermedio que la rueda nativa
// de iOS dispara al pasar por ese día mientras el usuario todavía scrollea hacia `target`.
function precedingSunday(target: Date): Date {
  const d = new Date(target);
  while (d.getDay() !== 0) d.setDate(d.getDate() - 1);
  return d;
}

// Busca sin filtros (trae todos los profesionales activos) y entra al perfil del primero.
async function gotoFirstProfessionalBooking(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Buscar Profesionales" }).click();

  const bookLink = page.getByRole("link", { name: "Reservar turno" }).first();
  await expect(bookLink).toBeVisible({ timeout: 15_000 });
  await bookLink.click();

  const dateInput = page.locator("#appointment_date");
  await expect(dateInput).toBeVisible();
  return dateInput;
}

test.describe("Selector de fecha del turno", () => {
  test("elegir una fecha válida después de pasar por un domingo intermedio no se resetea", async ({
    page,
  }) => {
    const target = nextBookableDate();
    const sunday = precedingSunday(target);
    const dateInput = await gotoFirstProfessionalBooking(page);

    // Valor intermedio simulado (equivalente a un tick de la rueda de iOS a mitad de camino).
    await dateInput.fill(toISODate(sunday));
    await expect(page.getByText(DATE_ERROR)).toBeVisible();

    // Fecha final elegida por la persona usuaria.
    await dateInput.fill(toISODate(target));
    await expect(page.getByText(DATE_ERROR)).toBeHidden();
    await expect(page.getByRole("heading", { name: "Elegí un horario" })).toBeVisible();

    // Deja que el fetch de horarios resuelva (loading -> ready/error/empty), que dispara otro
    // re-render del componente -- si el input siguiera siendo controlado, esto podría volver
    // a pisar su valor y devolver la UI al paso 1.
    await expect(page.getByText("Buscando horarios...")).toBeHidden({ timeout: 15_000 });

    // El paso 1 debe seguir colapsado en "hecho": si el estado se hubiera reseteado, veríamos
    // de nuevo el input de fecha vacío en vez del resumen con "Cambiar fecha".
    await expect(page.getByText("Cambiar fecha")).toBeVisible();
    await expect(dateInput).toBeHidden();
  });

  test("elegir un domingo muestra el error sin vaciar el campo", async ({ page }) => {
    const sunday = precedingSunday(nextBookableDate());
    const dateInput = await gotoFirstProfessionalBooking(page);

    await dateInput.fill(toISODate(sunday));

    await expect(page.getByText(DATE_ERROR)).toBeVisible();
    // El valor elegido debe seguir en el input (regresión del bug original: `setDate("")`
    // lo vaciaba apenas se detectaba un domingo).
    await expect(dateInput).toHaveValue(toISODate(sunday));
  });
});
