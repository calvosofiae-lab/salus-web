import { FeaturedProfessionals } from "@/components/salus/featured-professionals";

export function FeaturedSection() {
  return (
    <section id="destacados">
      <div className="section-card navy-border">
        <h2 className="section-title">Profesionales Destacados</h2>
        <FeaturedProfessionals />
      </div>
    </section>
  );
}
