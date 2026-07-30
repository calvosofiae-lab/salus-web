export function AboutSection() {
  return (
    <section id="quienes-somos">
      <div className="section-card yellow-border">
        <h2 className="section-title">¿Quiénes somos?</h2>

        <div className="founders-grid">
          <div className="founder-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sofi.jpg" alt="Sofi" className="founder-img" />
            <div className="founder-name">Sofi</div>
          </div>
          <div className="founder-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/celes.jpg" alt="Cele" className="founder-img" />
            <div className="founder-name">Cele</div>
          </div>
        </div>

        <div className="section-content">
          <p>
            Somos Sofi y Cele, dos amigas que trabajan juntas hace años y ahora decidieron
            ocuparse de una problemática muy importante: el desencuentro entre pacientes y
            profesionales. A partir de la cantidad de demanda que hay de psicólogos/as y
            psiquiatras, decidimos hacer algo al respecto para que sea más sencilla la
            experiencia fundamental de la terapia.
          </p>
          <p>¡Gracias por confiar en nosotras! Estamos trabajando para ustedes.</p>
        </div>
      </div>
    </section>
  );
}
