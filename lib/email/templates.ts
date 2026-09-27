// Arma asunto + HTML de cada mail. A diferencia de WhatsApp (que depende de templates
// pre-aprobados por Meta), acá no hay restricción de proveedor: el contenido se arma
// directamente en código, en un solo lugar, para no hardcodear el texto en múltiples partes
// de la app.

export interface EmailMessage {
  subject: string;
  html: string;
}

// Nombres de paciente y profesional son texto cargado por usuarios: van escapados antes de
// entrar al HTML del mail. No es un vector de XSS clásico (los clientes de correo no ejecutan
// scripts), pero un apellido con "&" o "<" rompe el render del mensaje.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
      <p>Hola ${escapeHtml(data.patientFirstName)},</p>
      <p>
        Tu turno con <strong>${escapeHtml(data.professionalFullName)}</strong> fue confirmado para el
        <strong>${escapeHtml(data.dateLabel)}</strong> a las <strong>${escapeHtml(data.timeLabel)}</strong>.
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
      <p>Hola ${escapeHtml(data.professionalFullName)},</p>
      <p>
        Recibiste una nueva reserva de <strong>${escapeHtml(data.patientFullName)}</strong> para el
        <strong>${escapeHtml(data.dateLabel)}</strong> a las <strong>${escapeHtml(data.timeLabel)}</strong>.
      </p>
    `),
  };
}

// Los tres mails de abajo van solo al paciente: los dispara una acción del profesional sobre
// un turno que el paciente no tocó, así que es él quien necesita enterarse. Al profesional no
// se le avisa de algo que acaba de hacer él mismo.

export function buildPatientCreatedByProfessionalEmail(data: {
  patientFirstName: string;
  professionalFullName: string;
  dateLabel: string;
  timeLabel: string;
}): EmailMessage {
  return {
    subject: `Tenés un turno agendado con ${data.professionalFullName}`,
    html: wrapEmailHtml(`
      <p>Hola ${escapeHtml(data.patientFirstName)},</p>
      <p>
        <strong>${escapeHtml(data.professionalFullName)}</strong> te agendó un turno para el
        <strong>${escapeHtml(data.dateLabel)}</strong> a las <strong>${escapeHtml(data.timeLabel)}</strong>.
      </p>
      <p>Si no podés asistir, comunicate con el profesional para reprogramarlo.</p>
    `),
  };
}

export function buildPatientRescheduledEmail(data: {
  patientFirstName: string;
  professionalFullName: string;
  previousDateLabel: string;
  previousTimeLabel: string;
  dateLabel: string;
  timeLabel: string;
}): EmailMessage {
  return {
    subject: `Se reprogramó tu turno con ${data.professionalFullName}`,
    html: wrapEmailHtml(`
      <p>Hola ${escapeHtml(data.patientFirstName)},</p>
      <p>
        Tu turno con <strong>${escapeHtml(data.professionalFullName)}</strong> pasó del
        ${escapeHtml(data.previousDateLabel)} a las ${escapeHtml(data.previousTimeLabel)} al
        <strong>${escapeHtml(data.dateLabel)}</strong> a las <strong>${escapeHtml(data.timeLabel)}</strong>.
      </p>
      <p>Si el nuevo horario no te sirve, comunicate con el profesional.</p>
    `),
  };
}

export function buildPatientCancelledEmail(data: {
  patientFirstName: string;
  professionalFullName: string;
  dateLabel: string;
  timeLabel: string;
}): EmailMessage {
  return {
    subject: `Se canceló tu turno con ${data.professionalFullName}`,
    html: wrapEmailHtml(`
      <p>Hola ${escapeHtml(data.patientFirstName)},</p>
      <p>
        Tu turno con <strong>${escapeHtml(data.professionalFullName)}</strong> del
        <strong>${escapeHtml(data.dateLabel)}</strong> a las <strong>${escapeHtml(data.timeLabel)}</strong> fue
        cancelado.
      </p>
      <p>Si querés sacar otro turno, podés hacerlo desde el perfil del profesional.</p>
    `),
  };
}
