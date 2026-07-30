import { CAMPOS, Profesional } from "@/lib/salus/constants";

export function ProfessionalCard({ prof }: { prof: Profesional }) {
  const foto = (prof[CAMPOS.foto_url] as string) || "https://via.placeholder.com/150";
  const nombre = (prof[CAMPOS.nombre] as string) || "Profesional SALUS";
  const profesionRaw = prof[CAMPOS.profesion] as string | undefined;
  const matricula = prof[CAMPOS.matricula] as string | undefined;
  const profesion = profesionRaw
    ? `${profesionRaw} ${matricula ? "(M.N. " + matricula + ")" : ""}`
    : "Especialista en Salud Mental";
  const modalidadRaw = prof[CAMPOS.modalidad] as string | undefined;
  const modalidad = modalidadRaw ? `Atención ${modalidadRaw}` : "Atención Virtual / Presencial";
  const descripcion = (prof[CAMPOS.descripcion] as string) || "";
  const whatsapp = prof[CAMPOS.whatsapp] as string | undefined;

  const linkWa = whatsapp
    ? `https://wa.me/${whatsapp}?text=Hola%20${encodeURIComponent(nombre)},%20te%20contacto%20desde%20SALUS`
    : null;

  return (
    <div className="prof-card">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto} alt={nombre} className="prof-img" />
        <h3 className="prof-name">{nombre}</h3>
        <p className="prof-profession">{profesion}</p>
        <span className="prof-badge">{modalidad}</span>
        {descripcion && <p className="prof-description">{descripcion}</p>}
      </div>
      <div>
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
