import "server-only";

// Cliente crudo del WhatsApp Cloud API (Meta), sin conocer nada del dominio de
// SALUS: solo sabe mandar un mensaje de template a un número dado. El resto de la
// app nunca debe importar esto directamente ni ver el token — pasa siempre por
// services/whatsappNotificationService.ts.

export interface SendWhatsAppTemplateMessageInput {
  to: string; // dígitos en formato E.164 sin "+", ej: "5493411234567"
  templateName: string;
  languageCode: string;
  bodyParams: string[];
}

export interface SendWhatsAppTemplateMessageResult {
  providerMessageId: string;
}

export async function sendWhatsAppTemplateMessage(
  input: SendWhatsAppTemplateMessageInput,
): Promise<SendWhatsAppTemplateMessageResult> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_CLOUD_API_VERSION || "v21.0";

  if (!token || !phoneNumberId) {
    throw new Error("WHATSAPP_CLOUD_API_TOKEN o WHATSAPP_CLOUD_API_PHONE_NUMBER_ID no están configurados.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to,
        type: "template",
        template: {
          name: input.templateName,
          language: { code: input.languageCode },
          components: [
            {
              type: "body",
              parameters: input.bodyParams.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(`WhatsApp Cloud API rechazó el mensaje: ${detail}`);
  }

  const providerMessageId = payload?.messages?.[0]?.id;
  if (!providerMessageId) {
    throw new Error("WhatsApp Cloud API no devolvió un message id.");
  }

  return { providerMessageId };
}
