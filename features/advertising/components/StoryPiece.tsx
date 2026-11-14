"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  SALUS_COLORS as C,
  STORY_FORMAT as F,
  type StoryProfessional,
  type StoryRow,
  type StoryTexts,
} from "@/features/advertising/lib/story";

interface StoryPieceProps {
  professional: StoryProfessional;
  texts: StoryTexts;
  rows: StoryRow[];
  /** Foto y logo como data URL (ver AdvertisingScreen: así salen siempre en el PNG). */
  photo: string;
  logo: string;
}

/**
 * La historia en tamaño real (1080 × 1920). Todo con estilos en px y colores fijos (no clases de
 * Tailwind ni variables del tema) para que el PNG salga igual que la vista previa, con o sin modo
 * oscuro. Lo importante va entre las franjas que tapa Instagram (STORY_FORMAT.safeTop/Bottom).
 */
export const StoryPiece = forwardRef<HTMLDivElement, StoryPieceProps>(function StoryPiece(
  { professional, texts, rows, photo, logo },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{
        width: F.w,
        height: F.h,
        position: "relative",
        overflow: "hidden",
        background: C.cream,
        color: C.navy,
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: F.safeTop,
        paddingBottom: F.safeBottom,
        paddingLeft: 80,
        paddingRight: 80,
        boxSizing: "border-box",
      }}
    >
      {/* Fondo: franja teal arriba con curva y puntos de la marca. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 510,
          background: C.teal,
          borderBottomLeftRadius: "50% 120px",
          borderBottomRightRadius: "50% 120px",
        }}
      />
      <Dot color={C.yellow} size={34} top={120} left={110} />
      <Dot color={C.navy} size={26} top={170} left={950} />
      <Dot color={C.cream} size={20} top={420} left={70} opacity={0.6} />
      <Dot color={C.yellow} size={22} top={1770} left={960} />
      <Dot color={C.teal} size={30} top={1720} left={90} opacity={0.7} />

      {/* Foto */}
      <div
        style={{
          position: "relative",
          width: 270,
          height: 270,
          borderRadius: "50%",
          padding: 10,
          background: C.white,
          boxShadow: "0 18px 50px rgba(27,47,72,0.18)",
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL, se captura con html-to-image */}
        <img
          src={photo}
          alt=""
          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
        />
      </div>

      <div style={{ position: "relative", textAlign: "center", marginTop: 26 }}>
        <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.5 }}>
          {professional.fullName}
        </div>
        <div style={{ fontSize: 32, fontWeight: 600, color: C.tealDark, marginTop: 10 }}>
          {[professional.professionLabel, professional.license].filter(Boolean).join(" · ")}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          width: 120,
          height: 6,
          borderRadius: 3,
          background: C.yellow,
          margin: "30px 0 26px",
          flexShrink: 0,
        }}
      />

      <div style={{ position: "relative", textAlign: "center", width: "100%" }}>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.12 }}>
          {texts.title}
        </div>
        {texts.subtitle && (
          <div style={{ fontSize: 32, fontWeight: 500, marginTop: 12, opacity: 0.75 }}>
            {texts.subtitle}
          </div>
        )}
      </div>

      {/* Días: si no entran, la lista se achica sola (FitBox) en vez de pisar el pie. */}
      <FitBox style={{ position: "relative", width: "100%", marginTop: 32, flex: 1, minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {rows.map((row) => (
            <div
              key={row.label + (row.sublabel ?? "")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                background: C.white,
                borderRadius: 28,
                padding: "16px 26px",
                boxShadow: "0 6px 20px rgba(27,47,72,0.06)",
              }}
            >
              <div
                style={{
                  width: 180,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 34, fontWeight: 800 }}>{row.label}</span>
                {row.sublabel && (
                  <span style={{ fontSize: 28, fontWeight: 600, color: C.tealDark }}>
                    {row.sublabel}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, flex: 1 }}>
                {row.values.map((v) => (
                  <Chip key={v}>{v}</Chip>
                ))}
                {row.hidden > 0 && <Chip muted>+{row.hidden}</Chip>}
              </div>
            </div>
          ))}
        </div>
      </FitBox>

      {/* Pie: logo y llamado a reservar (el enlace va como sticker de Instagram). */}
      <div
        style={{
          position: "relative",
          width: "100%",
          marginTop: 28,
          display: "flex",
          alignItems: "center",
          gap: 28,
          background: C.navy,
          color: C.white,
          borderRadius: 36,
          padding: "22px 34px 22px 22px",
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL, se captura con html-to-image */}
        <img
          src={logo}
          alt=""
          style={{ width: 132, height: 121, borderRadius: 22, objectFit: "cover", flexShrink: 0 }}
        />
        <div>
          <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.15 }}>
            Reservá tu turno online
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, marginTop: 6, opacity: 0.8 }}>
            Tocá el enlace de esta historia
          </div>
        </div>
      </div>
    </div>
  );
});

function Chip({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 30,
        fontWeight: 700,
        padding: "9px 20px",
        borderRadius: 999,
        background: muted ? C.cream : "rgba(102,154,139,0.16)",
        color: muted ? C.navy : C.tealDark,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/**
 * Achica su contenido (scale) lo justo para que entre en el alto disponible. Se mide sin escalar
 * (offsetHeight no cambia con transform) y el ancho se compensa para que el texto use todo el
 * renglón.
 */
function FitBox({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) {
  const box = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const available = box.current?.clientHeight ?? 0;
    const width = box.current?.clientWidth ?? 0;
    if (!content.current || !available || !width) return;
    const el = content.current;
    // Alto visual a una escala dada: el contenido se arma con ancho width/scale y se achica.
    const heightAt = (scale: number) => {
      el.style.width = `${width / scale}px`;
      return el.offsetHeight * scale;
    };
    let fit = 1;
    if (heightAt(1) > available) {
      // Al achicar, el contenido gana ancho y puede necesitar menos renglones, así que no basta
      // con available/natural: se busca (bisección) la escala más grande que entra.
      let lo = available / el.offsetHeight; // con esta siempre entra
      let hi = 1;
      for (let i = 0; i < 10; i++) {
        const mid = (lo + hi) / 2;
        if (heightAt(mid) <= available) lo = mid;
        else hi = mid;
      }
      fit = lo;
    }
    el.style.width = `${width / fit}px`;
    setScale(fit);
    // Se vuelve a medir cada vez que cambia el contenido (otros días, otros textos).
  }, [children]);

  return (
    <div
      ref={box}
      style={{
        ...style,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // Pocas filas: centradas en el espacio libre. Si hubo que achicar, desde arriba (centrado,
        // el contenido sin escalar se recortaría por los dos lados).
        justifyContent: scale < 1 ? "flex-start" : "center",
      }}
    >
      <div
        ref={content}
        style={{
          width: `${100 / scale}%`,
          flexShrink: 0,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Dot({
  color,
  size,
  top,
  left,
  opacity = 1,
}: {
  color: string;
  size: number;
  top: number;
  left: number;
  opacity?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        opacity,
      }}
    />
  );
}

/** Muestra la historia escalada para que entre en pantalla, sin cambiar su tamaño real. */
export function StoryPreview({
  children,
  maxHeight = 640,
  showSafeZones = false,
}: {
  children: React.ReactNode;
  maxHeight?: number;
  /** Marca (solo en pantalla, no se exporta) las franjas que tapa Instagram. */
  showSafeZones?: boolean;
}) {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!box) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(box);
    return () => ro.disconnect();
  }, [box]);

  const scale = width ? Math.min(width / F.w, maxHeight / F.h) : 0;
  const stripe =
    "repeating-linear-gradient(45deg, rgba(0,0,0,0.28) 0 6px, rgba(0,0,0,0.12) 6px 12px)";

  return (
    <div ref={setBox} className="w-full">
      <div
        className="relative mx-auto overflow-hidden rounded-md border shadow-sm"
        style={{ width: F.w * scale, height: F.h * scale, visibility: scale ? "visible" : "hidden" }}
      >
        <div
          style={{ width: F.w, height: F.h, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          {children}
        </div>
        {showSafeZones && (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 top-0"
              style={{ height: F.safeTop * scale, background: stripe }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{ height: F.safeBottom * scale, background: stripe }}
            />
          </>
        )}
      </div>
    </div>
  );
}
