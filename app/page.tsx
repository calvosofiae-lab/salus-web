import "./salus.css";
import { SplashScreen } from "@/components/salus/splash-screen";
import { BackgroundShapes, BackgroundWave } from "@/components/salus/background-shapes";
import { SiteHeader } from "@/components/salus/site-header";
import { SiteHero } from "@/components/salus/site-hero";
import { SearchSection } from "@/components/salus/search-section";
import { FeaturedSection } from "@/components/salus/featured-section";
// Ocultado momentáneamente a pedido del cliente (se va a volver a mostrar más adelante) --
// no se borró el componente, solo se sacó de la home. Descomentar este import y el uso de
// <FeaturedOfMonthBanner /> más abajo para reactivarlo.
// import { FeaturedOfMonthBanner } from "@/features/professionals/components/FeaturedOfMonthBanner";
import { AboutSection } from "@/components/salus/about-section";
import { WhatWeDoSection } from "@/components/salus/what-we-do-section";
import { ProfessionalsSection } from "@/components/salus/professionals-section";
import { PatientsSection } from "@/components/salus/patients-section";
import { SiteFooter } from "@/components/salus/site-footer";

export default function Home() {
  return (
    <div className="salus">
      <SplashScreen />
      <BackgroundShapes />

      <SiteHeader />
      <SiteHero />

      <SearchSection />

      <FeaturedSection />
      {/* <FeaturedOfMonthBanner /> */}
      <AboutSection />
      <WhatWeDoSection />
      <ProfessionalsSection />
      <PatientsSection />

      <BackgroundWave />
      <SiteFooter />
    </div>
  );
}
