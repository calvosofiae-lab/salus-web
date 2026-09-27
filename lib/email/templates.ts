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

// Datos de contacto del profesional para que el paciente pueda escribirle directamente en
// vez de tener que volver al sitio. Ambos son opcionales: el profesional puede no tener
// cuenta de auth todavía (sin email) o no haber cargado whatsapp.
export interface ProfessionalContact {
  email: string | null;
  whatsappLink: string | null;
}

function contactBlock(contact: ProfessionalContact): string {
  if (!contact.email && !contact.whatsappLink) return "";

  const parts: string[] = [];
  if (contact.email) {
    parts.push(`<a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>`);
  }
  if (contact.whatsappLink) {
    parts.push(`<a href="${escapeHtml(contact.whatsappLink)}">WhatsApp</a>`);
  }

  return `<p>Para comunicarte con el profesional: ${parts.join(" o ")}.</p>`;
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
  professionalContact: ProfessionalContact;
}): EmailMessage {
  return {
    subject: `Turno confirmado con ${data.professionalFullName}`,
    html: wrapEmailHtml(`
      <p>Hola ${escapeHtml(data.patientFirstName)},</p>
      <p>
        Tu turno con <strong>${escapeHtml(data.professionalFullName)}</strong> fue confirmado para el
        <strong>${escapeHtml(data.dateLabel)}</strong> a las <strong>${escapeHtml(data.timeLabel)}</strong>.
      </p>
      ${contactBlock(data.professionalContact)}
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
  professionalContact: ProfessionalContact;
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
      ${contactBlock(data.professionalContact)}
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
  professionalContact: ProfessionalContact;
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
      <p>Si el nuevo horario no te queda cómodo, escribile al profesional y busquen juntos otra opción.</p>
      ${contactBlock(data.professionalContact)}
    `),
  };
}

export function buildPatientSurveyEmail(data: {
  patientFirstName: string;
  professionalFullName: string;
  surveyLink: string;
  professionalContact: ProfessionalContact;
}): EmailMessage {
  return {
    subject: `¿Cómo fue tu turno con ${data.professionalFullName}?`,
    html: wrapEmailHtml(`
      <p>Hola ${escapeHtml(data.patientFirstName)},</p>
      <p>
        Gracias por tu visita a <strong>${escapeHtml(data.professionalFullName)}</strong>. ¿Nos
        ayudás completando esta breve encuesta de satisfacción?
      </p>
      <p><a href="${escapeHtml(data.surveyLink)}">Completar encuesta</a></p>
      ${contactBlock(data.professionalContact)}
    `),
  };
}

export function buildPatientCancelledEmail(data: {
  patientFirstName: string;
  professionalFullName: string;
  dateLabel: string;
  timeLabel: string;
  professionalProfileLink: string;
  professionalContact: ProfessionalContact;
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
      <p>
        Si querés sacar otro turno, podés hacerlo desde
        <a href="${escapeHtml(data.professionalProfileLink)}">el perfil del profesional</a>.
      </p>
      ${contactBlock(data.professionalContact)}
    `),
  };
}
