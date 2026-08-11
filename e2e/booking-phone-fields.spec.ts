import { test, expect, type Page } from "@playwright/test";

// Regresión para el split del campo WhatsApp en 3 inputs (país / área sin el 0 / número) en
// el formulario de datos del paciente (features/appointments/components/BookingForm.tsx,
// features/appointments/lib/phone.ts). Antes era un <select> de país (solo Argentina/España)
// + un único input de número.
//
// Los tests llegan hasta el paso 3 ("Completá tus datos") pero NUNCA hacen click en
// "Confirmar reserva": eso crearía un turno real contra la base de datos configurada en
// .env.local (mismo cuidado que e2e/booking-date-picker.spec.ts).
//
// La disponibilidad horaria (get_available_slots) es real, cambia todo el tiempo con el uso
// de la app y no es lo que este archivo prueba -- se mockea para que un horario "libre"
// siempre aparezca, así el test depende únicamente del formulario, no de que en este momento
// exista un turno libre de verdad.

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

// Busca sin filtros, entra al perfil del primer profesional y avanza hasta el paso 3 del
// flujo de reserva con un horario mockeado.
async function gotoBookingFormStep(page: Page): Promise<void> {
  await page.route("**/rest/v1/rpc/get_available_slots", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ start_time: "09:00:00" }]),
    }),
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Buscar Profesionales" }).click();

  const bookLink = page.getByRole("link", { name: "Reservar turno" }).first();
  await expect(bookLink).toBeVisible({ timeout: 15_000 });
  await bookLink.click();

  // .first(): la página de profesional usa Partial Prerendering (streaming) y puede tener
  // brevemente dos nodos con este id mientras el contenido dinámico reemplaza al fallback
  // estático -- .first() evita que eso dispare una violación de "strict mode".
  const dateInput = page.locator("#appointment_date").first();
  await expect(dateInput).toBeVisible({ timeout: 15_000 });

  await dateInput.fill(toISODate(nextBookableDate()));
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Buscando horarios...")).toBeHidden({ timeout: 15_000 });

  await page
    .getByRole("group", { name: "Horarios disponibles" })
    .getByRole("button")
    .first()
    .click();
  await expect(page.getByRole("heading", { name: "Completá tus datos" })).toBeVisible();
}

test.describe("Campos de teléfono del formulario de datos del paciente", () => {
  test("el WhatsApp se pide en 3 campos separados (país, área y número)", async ({ page }) => {
    await gotoBookingFormStep(page);

    await expect(page.locator("#whatsapp_country")).toBeVisible();
    await expect(page.locator("#whatsapp_area")).toBeVisible();
    await expect(page.locator("#whatsapp_number")).toBeVisible();
    // El input único viejo ya no existe.
    await expect(page.locator("#whatsapp")).toHaveCount(0);
  });

  test("el selector de país es universal, no solo Argentina/España", async ({ page }) => {
    await gotoBookingFormStep(page);

    const countryOptions = page.locator("#whatsapp_country option");
    await expect(page.locator('#whatsapp_country option[value="MX"]')).toHaveText(/México/);
    expect(await countryOptions.count()).toBeGreaterThan(50);
  });

  test("el código de área se limpia solo, sin el 0 inicial", async ({ page }) => {
    await gotoBookingFormStep(page);

    const areaInput = page.locator("#whatsapp_area");
    await areaInput.fill("0341");
    await expect(areaInput).toHaveValue("341");
  });

  test("el botón de confirmar solo se habilita con un WhatsApp válido para el país elegido", async ({
    page,
  }) => {
    await gotoBookingFormStep(page);

    await page.locator("#firstName").fill("Test");
    await page.locator("#lastName").fill("Testing");
    const submitButton = page.getByRole("button", { name: "Confirmar reserva" });

    // Sin WhatsApp cargado: deshabilitado.
    await expect(submitButton).toBeDisabled();

    // Número incompleto: sigue deshabilitado.
    await page.locator("#whatsapp_area").fill("341");
    await page.locator("#whatsapp_number").fill("123");
    await expect(submitButton).toBeDisabled();

    // Argentina + área + número completos (10 dígitos): se habilita.
    await page.locator("#whatsapp_number").fill("1234567");
    await expect(submitButton).toBeEnabled();
    await expect(page.getByText("WhatsApp: +54 341 1234567")).toBeVisible();

    // Los mismos 10 dígitos no son un número válido para España (espera 9): vuelve a
    // deshabilitarse al cambiar de país, sin tocar los dígitos ya cargados.
    await page.locator("#whatsapp_country").selectOption("ES");
    await expect(submitButton).toBeDisabled();
    await expect(page.getByText("WhatsApp: +34 341 1234567")).toBeVisible();
  });
});
