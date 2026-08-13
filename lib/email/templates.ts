// Arma asunto + HTML de cada mail. A diferencia de WhatsApp (que depende de templates
// pre-aprobados por Meta), acá no hay restricción de proveedor: el contenido se arma
// directamente en código, en un solo lugar, para no hardcodear el texto en múltiples partes
// de la app.

export interface EmailMessage {
  subject: string;
  html: string;
}

function wrapEmailHtml(bodyHtml: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #2c3e50;">
      <h2 style="color: #1b2f48; margin-bottom: 1rem;">SALUS</h2>
      ${bodyHtml}
      <p style="margin-top: 2rem; font-size: 0.85rem; color: #52606d;">
        Este es un mensaje automático, no respondas a este email.
      </p>
    </div>
  `.trim();
}

export function buildPatientConfirmationEmail(data: {
  patientFirstName: string;
  professionalFullName: string;
  dateLabel: string;
  timeLabel: string;
}): EmailMessage {
  return {
    subject: `Turno confirmado con ${data.professionalFullName}`,
    html: wrapEmailHtml(`
      <p>Hola ${data.patientFirstName},</p>
      <p>
        Tu turno con <strong>${data.professionalFullName}</strong> fue confirmado para el
        <strong>${data.dateLabel}</strong> a las <strong>${data.timeLabel}</strong>.
      </p>
    `),
  };
}

export function buildProfessionalConfirmationEmail(data: {
  professionalFullName: string;
  patientFullName: string;
  dateLabel: string;
  timeLabel: string;
}): EmailMessage {
  return {
    subject: `Nueva reserva de ${data.patientFullName}`,
    html: wrapEmailHtml(`
      <p>Hola ${data.professionalFullName},</p>
      <p>
        Recibiste una nueva reserva de <strong>${data.patientFullName}</strong> para el
        <strong>${data.dateLabel}</strong> a las <strong>${data.timeLabel}</strong>.
      </p>
    `),
  };
}
