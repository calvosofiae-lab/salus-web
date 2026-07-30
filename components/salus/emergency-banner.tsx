"use client";

import { useEffect, useState } from "react";

export function EmergencyBanner() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => close(), 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setFadeOut(true);
    setTimeout(() => setVisible(false), 800);
  }

  if (!visible) return null;

  return (
    <div id="emergencyBanner" className={`emergency-banner ${fadeOut ? "fade-out" : ""}`}>
      <div>
        <strong>Aviso importante:</strong> SALUS no presta servicios de guardia ni atención
        inmediata de urgencias. Ante una crisis o emergencia de salud mental, por favor
        comunicate al <strong>107 / 911</strong> o dirígete al centro de salud más cercano.
      </div>
      <button className="emergency-close" onClick={close} title="Cerrar aviso">
        &times;
      </button>
    </div>
  );
}
