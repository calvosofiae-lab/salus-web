// Arma asunto + HTML de cada mail. A diferencia de WhatsApp (que depende de templates
// pre-aprobados por Meta), acá no hay restricción de proveedor: el contenido se arma
// directamente en código, en un solo lugar, para no hardcodear el texto en múltiples partes
// de la app.

export interface EmailMessage {
  subject: string;
  html: string;
  // Email de la otra parte del turno (paciente o profesional): si quien recibe el mail lo
  // responde, la respuesta le llega directo a esa persona en vez de a no-reply, que no tiene
  // casilla. Falta cuando la otra parte no tiene email cargado.
  replyTo?: string;
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

// Si el mail tiene replyTo, el pie dice a quién le llega la respuesta en vez de pedir que no
// se responda.
function wrapEmailHtml(bodyHtml: string, replyToFirstName?: string): string {
  const footer = replyToFirstName
    ? `Si respondés este correo, tu respuesta le llega directamente a ${escapeHtml(replyToFirstName)}.`
    : "Este es un mensaje automático. Por favor, no respondas a este correo.";
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #2c3e50;">
      <h2 style="color: #1b2f48; margin-bottom: 1rem;">SALUS PROFESIONALES</h2>
      ${bodyHtml}
      <p style="margin-top: 1.5rem;">
        Salus Profesionales<br>
        Impulsamos el encuentro más importante.
      </p>
      <p style="margin-top: 2rem; font-size: 0.85rem; color: #52606d;">
        ${footer}
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
    replyTo: data.professionalContact.email ?? undefined,
    html: wrapEmailHtml(
      `
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
    `,
      data.professionalContact.email ? professionalFirstName : undefined,
    ),
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
    replyTo: data.patientContact.email ?? undefined,
    html: wrapEmailHtml(
      `
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
    `,
      data.patientContact.email ? patientFirstName : undefined,
    ),
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
    replyTo: data.professionalContact.email ?? undefined,
    html: wrapEmailHtml(
      `
      <p>Hola ${escapeHtml(data.patientFirstName)},</p>
      <p>
        <strong>${escapeHtml(data.professionalFullName)}</strong> te agendó un turno para el
        <strong>${escapeHtml(data.dateLabel)}</strong> a las <strong>${escapeHtml(data.timeLabel)}</strong>.
      </p>
      <p>Si no podés asistir, comunicate con el profesional para reprogramarlo.</p>
      ${contactBlock(data.professionalContact)}
    `,
      data.professionalContact.email ? firstNameOf(data.professionalFullName) : undefined,
    ),
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
    replyTo: data.professionalContact.email ?? undefined,
    html: wrapEmailHtml(
      `
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
    `,
      data.professionalContact.email ? professionalFirstName : undefined,
    ),
  };
}

// Lo manda el cron diario (no una acción del profesional), la víspera del turno.
export function buildPatientReminderEmail(data: {
  patientFirstName: string;
  professionalFullName: string;
  dateLabel: string;
  timeLabel: string;
  professionalContact: ContactInfo;
}): EmailMessage {
  const professionalFirstName = firstNameOf(data.professionalFullName);
  // "a través de su correo electrónico o por WhatsApp" -- arma la frase según los canales que
  // tenga cargados el profesional (no usa contactSentence porque el conector es "o por").
  const [emailLink, whatsappLink] = [
    data.professionalContact.email
      ? `su <a href="mailto:${escapeHtml(data.professionalContact.email)}">correo electrónico</a>`
      : null,
    data.professionalContact.whatsappLink
      ? `<a href="${escapeHtml(data.professionalContact.whatsappLink)}">WhatsApp</a>`
      : null,
  ];
  const channels =
    emailLink && whatsappLink
      ? `a través de ${emailLink} o por ${whatsappLink}`
      : emailLink
        ? `a través de ${emailLink}`
        : whatsappLink
          ? `por ${whatsappLink}`
          : null;

  return {
    subject: `Mañana tenés turno con ${data.professionalFullName}`,
    replyTo: data.professionalContact.email ?? undefined,
    html: wrapEmailHtml(
      `
      <p>¡Hola, ${escapeHtml(data.patientFirstName)}! 🤍</p>
      <p>Te recordamos que mañana tenés un encuentro programado con tu profesional.</p>
      <p>
        📅 Día: <strong>${escapeHtml(data.dateLabel)}</strong><br>
        🕐 Horario: <strong>${escapeHtml(data.timeLabel)}</strong><br>
        🩺 Profesional: <strong>${escapeHtml(data.professionalFullName)}</strong>
      </p>
      <p>
        Si no vas a poder asistir, te pedimos que le avises con anticipación para que pueda
        ofrecer ese horario a otra persona.
      </p>
      ${
        channels
          ? `<p>Podés comunicarte directamente con ${escapeHtml(professionalFirstName)} ${channels}.</p>`
          : ""
      }
      <p>Gracias por elegir Salus y confiar en nuestra red de profesionales.</p>
    `,
      data.professionalContact.email ? professionalFirstName : undefined,
    ),
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
    replyTo: data.professionalContact.email ?? undefined,
    html: wrapEmailHtml(
      `
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
    `,
      data.professionalContact.email ? professionalFirstName : undefined,
    ),
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
    replyTo: data.professionalContact.email ?? undefined,
    html: wrapEmailHtml(
      `
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
      <p>Esperamos que puedas encontrar pronto un nuevo horario que se adapte a vos.</p>
    `,
      data.professionalContact.email ? professionalFirstName : undefined,
    ),
  };
}

// Versión en texto plano del mismo mail. Los filtros de spam penalizan los mails que traen solo
// HTML, y armarla a partir del HTML evita mantener dos copias de cada template.
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<a [^>]*href="mailto:([^"]*)"[^>]*>(.*?)<\/a>/g, "$2 ($1)")
    .replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, "$2 ($1)")
    .replace(/<br\s*\/?>\s*/g, "\n")
    .replace(/<\/(p|h2)>/g, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
