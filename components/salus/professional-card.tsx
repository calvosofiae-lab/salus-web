import Link from "next/link";
import { MODALITY_LABELS, PROFESSION_LABELS } from "@/features/professionals/constants";
import { buildWhatsappLink } from "@/lib/whatsapp";
import type { Professional } from "@/features/professionals/types";

export function ProfessionalCard({ prof }: { prof: Professional }) {
  const foto = prof.photo_url || "https://via.placeholder.com/150";
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
    ? buildWhatsappLink(whatsapp, `Hola ${nombre}, te contacto desde SALUS`)
    : null;

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
          Reservar turno
        </Link>
        {linkWa && (
          <a href={linkWa} target="_blank" rel="noreferrer" className="prof-contact-btn">
            Contactar por WhatsApp
          </a>
        )}
        <div className="prof-disclaimer">
          Atención independiente bajo matrícula profesional habilitante.
        </div>
      </div>
    </div>
  );
}
