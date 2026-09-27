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

// Datos de contacto (del profesional en los mails al paciente, del paciente en el mail al
// profesional) para que cada uno pueda escribirle al otro directamente en vez de tener que
// volver al sitio. Ambos campos son opcionales: puede faltar el email (profesional sin cuenta
// de auth todavía) o el whatsapp (no siempre se carga).
export interface ContactInfo {
  email: string | null;
  whatsappLink: string | null;
}

function contactBlock(contact: ContactInfo): string {
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

// Primer nombre de quien sea que se esté por nombrar de forma cercana ("comunicate con
// Rosina"/"con Diego" en vez de "con el profesional"/"con el paciente").
function firstNameOf(fullName: string): string {
  return fullName.split(" ")[0];
}

// Mismos dos canales que contactBlock, pero como links sueltos ("correo electrónico" /
// "WhatsApp") para que cada template arme su propia oración alrededor.
function contactLinks(contact: ContactInfo): string[] {
  const links: string[] = [];
  if (contact.email) {
    links.push(`<a href="mailto:${escapeHtml(contact.email)}">correo electrónico</a>`);
  }
  if (contact.whatsappLink) {
    links.push(`<a href="${escapeHtml(contact.whatsappLink)}">WhatsApp</a>`);
  }
  return links;
}

// "a través de su correo electrónico o WhatsApp" (o solo uno de los dos, o nada si el
// destinatario no cargó ninguno) -- la parte que varía es a quién se refiere y el verbo/frase
// que lo precede, así que cada template pasa su propia oración de apertura.
function contactSentence(lead: string, contact: ContactInfo): string {
  const links = contactLinks(contact);
  if (links.length === 0) return "";
  return `<p>${lead} ${links.join(" o ")}.</p>`;
}

function wrapEmailHtml(bodyHtml: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #2c3e50;">
      <h2 style="color: #1b2f48; margin-bottom: 1rem;">SALUS</h2>
      ${bodyHtml}
      <p style="margin-top: 1.5rem;">
        Salus<br>
        Impulsamos el encuentro más importante.
      </p>
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
  professionalContact: ContactInfo;
}): EmailMessage {
  const professionalFirstName = firstNameOf(data.professionalFullName);
  return {
    subject: `Turno confirmado con ${data.professionalFullName}`,
    html: wrapEmailHtml(`
      <p>Hola, ${escapeHtml(data.patientFirstName)}:</p>
      <p>¡Tu turno está confirmado!</p>
      <p>
        Tu encuentro con <strong>${escapeHtml(data.professionalFullName)}</strong> quedó reservado para el
        <strong>${escapeHtml(data.dateLabel)}</strong> a las <strong>${escapeHtml(data.timeLabel)}</strong>.
      </p>
      ${contactSentence(
        `Si necesitás comunicarte con ${escapeHtml(professionalFirstName)} antes de tu turno, podés hacerlo a través de su`,
        data.professionalContact,
      )}
      <p>Te esperamos y esperamos que tengas una muy buena experiencia.</p>
      <p>Gracias por confiar en Salus para acompañarte en este proceso.</p>
    `),
  };
}

export function buildProfessionalConfirmationEmail(data: {
  professionalFullName: string;
  patientFullName: string;
  dateLabel: string;
  timeLabel: string;
  patientContact: ContactInfo;
}): EmailMessage {
  const professionalFirstName = firstNameOf(data.professionalFullName);
  const patientFirstName = firstNameOf(data.patientFullName);
  return {
    subject: `Nueva reserva de ${data.patientFullName}`,
    html: wrapEmailHtml(`
      <p>Hola, ${escapeHtml(professionalFirstName)}:</p>
      <p>¡Tenés una reserva nueva!</p>
      <p>
        Tu encuentro con <strong>${escapeHtml(data.patientFullName)}</strong> quedó reservado para el
        <strong>${escapeHtml(data.dateLabel)}</strong> a las <strong>${escapeHtml(data.timeLabel)}</strong>.
      </p>
      ${contactSentence(
        `Si necesitás comunicarte con ${escapeHtml(patientFirstName)} antes del turno, podés hacerlo a través de su`,
        data.patientContact,
      )}
      <p>Te deseamos un muy buen encuentro.</p>
      <p>Gracias por ser parte de Salus.</p>
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
  professionalContact: ContactInfo;
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
  professionalContact: ContactInfo;
}): EmailMessage {
  const professionalFirstName = firstNameOf(data.professionalFullName);
  return {
    subject: `Se reprogramó tu turno con ${data.professionalFullName}`,
    html: wrapEmailHtml(`
      <p>Hola, ${escapeHtml(data.patientFirstName)}:</p>
      <p>¡Tu turno fue reprogramado!</p>
      <p>
        Tu encuentro con <strong>${escapeHtml(data.professionalFullName)}</strong> pasó del
        ${escapeHtml(data.previousDateLabel)} a las ${escapeHtml(data.previousTimeLabel)} al
        <strong>${escapeHtml(data.dateLabel)}</strong> a las <strong>${escapeHtml(data.timeLabel)}</strong>.
      </p>
      ${contactSentence(
        `Si el nuevo horario no te queda cómodo, podés comunicarte con ${escapeHtml(professionalFirstName)} a través de su`,
        data.professionalContact,
      )}
      <p>Gracias por tu flexibilidad y por confiar en Salus.</p>
    `),
  };
}

export function buildPatientSurveyEmail(data: {
  patientFirstName: string;
  professionalFullName: string;
  surveyLink: string;
  professionalContact: ContactInfo;
}): EmailMessage {
  const professionalFirstName = firstNameOf(data.professionalFullName);
  return {
    subject: `¿Cómo fue tu turno con ${data.professionalFullName}?`,
    html: wrapEmailHtml(`
      <p>Hola ${escapeHtml(data.patientFirstName)},</p>
      <p>
        Esperamos que hayas tenido una buena experiencia en tu encuentro con
        <strong>${escapeHtml(data.professionalFullName)}</strong>.
      </p>
      <p>
        Tu opinión es muy importante para nosotrxs y nos ayuda a seguir construyendo una red de
        profesionales de confianza.
      </p>
      <p>Te invitamos a completar una breve encuesta sobre tu experiencia.</p>
      <p><a href="${escapeHtml(data.surveyLink)}">Completar encuesta</a></p>
      ${contactSentence(
        `Si necesitás volver a comunicarte con ${escapeHtml(professionalFirstName)}, podés hacerlo a través de su`,
        data.professionalContact,
      )}
      <p>Gracias por confiar en Salus.</p>
    `),
  };
}

export function buildPatientCancelledEmail(data: {
  patientFirstName: string;
  professionalFullName: string;
  dateLabel: string;
  timeLabel: string;
  professionalProfileLink: string;
  professionalContact: ContactInfo;
}): EmailMessage {
  const professionalFirstName = firstNameOf(data.professionalFullName);
  return {
    subject: `Se canceló tu turno con ${data.professionalFullName}`,
    html: wrapEmailHtml(`
      <p>Hola, ${escapeHtml(data.patientFirstName)}:</p>
      <p>
        Queremos informarte que tu turno con <strong>${escapeHtml(data.professionalFullName)}</strong>,
        programado para el ${escapeHtml(data.dateLabel)} a las ${escapeHtml(data.timeLabel)}, fue cancelado.
      </p>
      <p>
        Si querés coordinar un nuevo encuentro, podés consultar la disponibilidad y reservar otro turno
        desde <a href="${escapeHtml(data.professionalProfileLink)}">el perfil del profesional</a>.
      </p>
      ${contactSentence(
        `También podés comunicarte directamente con ${escapeHtml(professionalFirstName)} a través de su`,
        data.professionalContact,
      )}
      <p>Esperamos que puedas encontrar pronto un nuevo horario que se adapte a vos. 💚</p>
    `),
  };
}
