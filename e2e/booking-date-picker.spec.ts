import { test, expect, type Page, type Locator } from "@playwright/test";

// Regresión para el selector de fecha del turno (features/appointments/components/SlotPicker.tsx).
//
// Bug reportado: en Safari y Chrome de iPhone (ambos sobre WebKit) el picker nativo de fecha
// se cerraba solo apenas el usuario empezaba a elegir. Causa: en iOS la rueda nativa dispara
// `onChange` en cada tick de scroll (no solo al confirmar), y esos valores intermedios son
// casi siempre un día hábil válido. Como el paso "Elegí una fecha" reemplazaba el <input> por
// el resumen "Fecha: ... Cambiar fecha" apenas la fecha elegida era válida, el primer tick ya
// alcanzaba para desmontar el <input> -- con el picker nativo todavía abierto, cerrándolo de
// golpe. No pasaba en Android/desktop porque ahí el evento se dispara una sola vez, al
// confirmar. Se agregó un botón "Continuar" explícito: el input ya no se desmonta hasta que
// la persona usuaria confirma a propósito, sin importar cuántos onChange intermedios dispare
// el navegador mientras tanto.
//
// IMPORTANTE -- lo que esta suite NO puede probar: el picker de fecha en sí es UI del sistema
// operativo, fuera del DOM de la página, así que ningún test de Playwright (en ningún motor,
// ni siquiera WebKit) puede abrirlo/cerrarlo ni verificar si "se cerró solo". Lo que sí cubre,
// corriendo en Chromium/Firefox/WebKit (desktop y con viewport de iPhone/Android emulado): que
// el <input> no se desmonta mientras el usuario sigue editando, y que el estado de React no se
// resetea al confirmar. La confirmación en un iPhone real la sigue haciendo una persona.
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

// Un día hábil distinto a `from`, unos días más adelante.
function anotherBookableDate(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 2);
  while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}

// Domingo más cercano anterior a `target`.
function precedingSunday(target: Date): Date {
  const d = new Date(target);
  while (d.getDay() !== 0) d.setDate(d.getDate() - 1);
  return d;
}

// Busca sin filtros (trae todos los profesionales activos) y entra al perfil del primero.
async function gotoFirstProfessionalBooking(page: Page): Promise<Locator> {
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
  test("el input no se desmonta mientras se sigue editando, antes de confirmar", async ({
    page,
  }) => {
    const target = nextBookableDate();
    const another = anotherBookableDate(target);
    const dateInput = await gotoFirstProfessionalBooking(page);

    // Simula varios ticks de la rueda nativa de iOS mientras el usuario todavía está
    // eligiendo, sin tocar "Continuar" -- el input tiene que seguir en el DOM en todo momento.
    await dateInput.fill(toISODate(target));
    await expect(dateInput).toBeVisible();
    await dateInput.fill(toISODate(another));
    await expect(dateInput).toBeVisible();
    await expect(page.getByText("Cambiar fecha")).toBeHidden();

    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("Cambiar fecha")).toBeVisible();
    await expect(dateInput).toBeHidden();
  });

  test("confirmar una fecha válida muestra el paso de horarios y no se resetea", async ({
    page,
  }) => {
    const target = nextBookableDate();
    const dateInput = await gotoFirstProfessionalBooking(page);

    await dateInput.fill(toISODate(target));
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByRole("heading", { name: "Elegí un horario" })).toBeVisible();

    // Deja que el fetch de horarios resuelva (loading -> ready/error/empty), que dispara otro
    // re-render -- el paso de fecha debe seguir colapsado en "hecho" después de eso.
    await expect(page.getByText("Buscando horarios...")).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText("Cambiar fecha")).toBeVisible();
    await expect(dateInput).toBeHidden();
  });

  test("confirmar un domingo muestra el error y no avanza de paso", async ({ page }) => {
    const sunday = precedingSunday(nextBookableDate());
    const dateInput = await gotoFirstProfessionalBooking(page);

    await dateInput.fill(toISODate(sunday));
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText(DATE_ERROR)).toBeVisible();
    // No se confirmó ninguna fecha: seguimos en el paso 1, con el valor elegido en el input.
    await expect(page.getByText("Cambiar fecha")).toBeHidden();
    await expect(dateInput).toHaveValue(toISODate(sunday));
  });
});
