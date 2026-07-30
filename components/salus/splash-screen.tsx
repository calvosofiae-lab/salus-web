"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div id="splash-screen" className={fadeOut ? "fade-out" : ""}>
      <div className="splash-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-salus.png" alt="SALUS" />
      </div>
      <p className="splash-text">Impulsamos el encuentro más importante</p>
    </div>
  );
}
