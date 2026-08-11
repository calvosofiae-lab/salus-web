import Link from "next/link";
import { Calendar, Instagram, Linkedin } from "lucide-react";
import { MODALITY_LABELS, PROFESSION_LABELS } from "@/features/professionals/constants";
import { formatLicense } from "@/features/professionals/lib/license";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { buildInstagramLink, buildLinkedinLink } from "@/lib/social";
import { getDefaultAvatar } from "@/lib/avatar";
import type { Professional } from "@/features/professionals/types";

// lucide-react no tiene el logo de WhatsApp (solo íconos de chat genéricos, que se confunden
// con mensajería común); se usa el glifo de marca oficial en vez de MessageCircle.
function WhatsappIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.148.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ProfessionalCard({ prof }: { prof: Professional }) {
  const foto = prof.photo_url || getDefaultAvatar(prof.gender);
  const nombre = prof.full_name || "Profesional SALUS";
  const profesionLabel = PROFESSION_LABELS[prof.profession] ?? prof.profession;
  const licenseLabel = formatLicense(prof);
  const profesion = prof.profession
    ? `${profesionLabel} ${licenseLabel ? "(" + licenseLabel + ")" : ""}`
    : "Especialista en Salud Mental";
  const modalidadLabels = prof.modality.map((m) => MODALITY_LABELS[m] ?? m);
  const modalidad =
    modalidadLabels.length > 0
      ? `Atención ${modalidadLabels.join(" y ")}`
      : "Atención Virtual / Presencial";
  const descripcion = prof.description || "";
  const whatsapp = prof.whatsapp;

  const linkWa = whatsapp
    ? buildWhatsappLink(whatsapp, prof.whatsapp_country, `Hola ${nombre}, te contacto desde SALUS`)
    : null;
  const linkInstagram = prof.instagram_url ? buildInstagramLink(prof.instagram_url) : null;
  const linkLinkedin = prof.linkedin_url ? buildLinkedinLink(prof.linkedin_url) : null;
  const hasSocialLinks = linkWa || linkInstagram || linkLinkedin;

  return (
    <div className="prof-card">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto} alt={nombre} className="prof-img" />
        <h3 className="prof-name">{nombre}</h3>
        <p className="prof-profession">{profesion}</p>
        {prof.average_rating !== null && (
          <p className="prof-rating">
            <span className="prof-rating-star">★</span>
            {prof.average_rating.toFixed(1)}/5
          </p>
        )}
        <span className="prof-badge">{modalidad}</span>
        {prof.consultation_fee != null && (
          <p className="prof-price">${prof.consultation_fee.toLocaleString("es-AR")} la sesión</p>
        )}
        {descripcion && <p className="prof-description">{descripcion}</p>}
      </div>
      <div>
        <Link href={`/profesionales/${prof.id}`} className="prof-book-btn">
          <Calendar size={15} strokeWidth={2} />
          Reservar turno
        </Link>
        {hasSocialLinks && (
          <div className="prof-social-row">
            {linkWa && (
              <a
                href={linkWa}
                target="_blank"
                rel="noreferrer"
                className="prof-social-btn prof-social-whatsapp"
                aria-label="Contactar por WhatsApp"
                title="WhatsApp"
              >
                <WhatsappIcon size={16} />
              </a>
            )}
            {linkInstagram && (
              <a
                href={linkInstagram}
                target="_blank"
                rel="noreferrer"
                className="prof-social-btn prof-social-instagram"
                aria-label="Instagram"
                title="Instagram"
              >
                <Instagram size={16} strokeWidth={2} />
              </a>
            )}
            {linkLinkedin && (
              <a
                href={linkLinkedin}
                target="_blank"
                rel="noreferrer"
                className="prof-social-btn prof-social-linkedin"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <Linkedin size={16} strokeWidth={2} />
              </a>
            )}
          </div>
        )}
        <div className="prof-disclaimer">
          Atención independiente bajo matrícula profesional habilitante.
        </div>
      </div>
    </div>
  );
}
