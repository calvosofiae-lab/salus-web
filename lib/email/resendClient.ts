import "server-only";

// Cliente crudo de la API de Resend, sin conocer nada del dominio de SALUS: solo sabe mandar
// un email. El resto de la app nunca debe importar esto directamente ni ver la API key — pasa
// siempre por services/emailNotificationService.ts. Fetch nativo en vez del SDK oficial de
// Resend para no sumar una dependencia nueva, mismo criterio que lib/whatsapp/cloudApiClient.ts.

export interface SendTransactionalEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendTransactionalEmailResult {
  providerMessageId: string;
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<SendTransactionalEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY o RESEND_FROM_EMAIL no están configurados.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = payload?.message || `HTTP ${response.status}`;
    throw new Error(`Resend rechazó el email: ${detail}`);
  }

  const providerMessageId = payload?.id;
  if (!providerMessageId) {
    throw new Error("Resend no devolvió un id de mensaje.");
  }

  return { providerMessageId };
}
