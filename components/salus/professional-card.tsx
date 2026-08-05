import Link from "next/link";
import { Calendar, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { MODALITY_LABELS, PROFESSION_LABELS } from "@/features/professionals/constants";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { buildInstagramLink, buildLinkedinLink } from "@/lib/social";
import { getDefaultAvatar } from "@/lib/avatar";
import type { Professional } from "@/features/professionals/types";

export function ProfessionalCard({ prof }: { prof: Professional }) {
  const foto = prof.photo_url || getDefaultAvatar(prof.gender);
  const nombre = prof.full_name || "Profesional SALUS";
  const profesionLabel = PROFESSION_LABELS[prof.profession] ?? prof.profession;
  const profesion = prof.profession
    ? `${profesionLabel} ${prof.license_number ? "(M.N. " + prof.license_number + ")" : ""}`
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
                <MessageCircle size={16} strokeWidth={2} />
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
