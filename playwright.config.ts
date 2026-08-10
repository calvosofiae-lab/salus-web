import { defineConfig, devices } from "@playwright/test";

// Suite chica enfocada en la regresión del selector de fecha del turno (ver
// e2e/booking-date-picker.spec.ts): corre los mismos escenarios en varios motores de
// navegador para pescar diferencias de comportamiento entre ellos, en particular en WebKit
// (el motor que usa iOS, aunque Playwright no reproduce el picker nativo del sistema
// operativo -- ver el comentario al inicio del spec).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    // Emulación de viewport/UA de iPhone sobre el motor WebKit: es lo más cercano a Safari de
    // iOS que Playwright puede correr, pero sigue sin ser el navegador real de iOS.
    { name: "Mobile Safari (iPhone 13)", use: { ...devices["iPhone 13"] } },
    { name: "Mobile Chrome (Pixel 7)", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
