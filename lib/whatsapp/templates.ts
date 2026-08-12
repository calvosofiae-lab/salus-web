// Arma nombre de template + parámetros posicionales para cada mensaje. Los textos
// reales ("Hola {{1}}, tu turno con {{2}}...") viven en el template aprobado en
// Meta Business Manager, no acá: esta función solo decide en qué orden van los
// datos. Los nombres de template y el idioma son configurables por env var para no
// hardcodear nada específico del proveedor en el código.
//
// Los params quedan siempre en una cantidad fija (5) para que coincidan con la
// cantidad de variables que tenga el template aprobado en Meta: nombre, nombre del
// otro, fecha, hora y teléfono del otro (para que paciente y profesional puedan
// seguir coordinando directamente por WhatsApp sin pasar por SALUS). El teléfono
// del profesional es opcional en su perfil: si no lo cargó, el mensaje al paciente
// manda "no informado" en ese parámetro en vez de omitirlo (mantiene el conteo
// fijo que exige el template) — el mensaje al profesional siempre lleva el
// teléfono del paciente porque es un dato obligatorio de la reserva.
//
// La modalidad del profesional no se incluye: si professional.modality tiene más
// de un valor no hay un dato inequívoco que mandar, y variar la cantidad de
// parámetros según el caso rompería el template aprobado.

export interface TemplateMessage {
  templateName: string;
  languageCode: string;
  bodyParams: string[];
}

const PHONE_NOT_AVAILABLE = "no informado";

function getLanguageCode(): string {
  return process.env.WHATSAPP_TEMPLATE_LANGUAGE_CODE || "es_AR";
}

export function buildPatientConfirmationMessage(data: {
  patientFirstName: string;
  professionalFullName: string;
  dateLabel: string;
  timeLabel: string;
  professionalPhoneDisplay: string | null;
}): TemplateMessage {
  const templateName = process.env.WHATSAPP_TEMPLATE_PATIENT_CONFIRMATION;
  if (!templateName) {
    throw new Error("WHATSAPP_TEMPLATE_PATIENT_CONFIRMATION no está configurado.");
  }
  return {
    templateName,
    languageCode: getLanguageCode(),
    bodyParams: [
      data.patientFirstName,
      data.professionalFullName,
      data.dateLabel,
      data.timeLabel,
      data.professionalPhoneDisplay ?? PHONE_NOT_AVAILABLE,
    ],
  };
}

export function buildProfessionalConfirmationMessage(data: {
  professionalFullName: string;
  patientFullName: string;
  dateLabel: string;
  timeLabel: string;
  patientPhoneDisplay: string;
}): TemplateMessage {
  const templateName = process.env.WHATSAPP_TEMPLATE_PROFESSIONAL_CONFIRMATION;
  if (!templateName) {
    throw new Error("WHATSAPP_TEMPLATE_PROFESSIONAL_CONFIRMATION no está configurado.");
  }
  return {
    templateName,
    languageCode: getLanguageCode(),
    bodyParams: [
      data.professionalFullName,
      data.patientFullName,
      data.dateLabel,
      data.timeLabel,
      data.patientPhoneDisplay,
    ],
  };
}
