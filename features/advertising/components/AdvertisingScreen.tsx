"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarClock, CalendarDays, Copy, Download, Link2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { todayIso } from "@/features/appointments/lib/date";
import { getAvailableSlots, getOwnAvailabilityRules } from "@/repositories/availabilityRepository";
import { StoryPiece, StoryPreview } from "@/features/advertising/components/StoryPiece";
import {
  LOGO_SRC,
  STORY_FORMAT,
  STORY_KINDS,
  defaultTexts,
  fileName,
  formatDayMonth,
  scheduleRows,
  shareText,
  weekDates,
  weekRows,
  type StoryKind,
  type StoryProfessional,
  type StoryTexts,
  type WeekChoice,
} from "@/features/advertising/lib/story";
import type { AvailabilityRule } from "@/features/appointments/types";

const KIND_ICONS: Record<StoryKind, typeof CalendarDays> = {
  week: CalendarClock,
  schedule: CalendarDays,
};

type LoadStatus = "loading" | "ready" | "error";

/**
 * Imagen como data URL. html-to-image dibuja la pieza dentro de un SVG: si el <img> apunta a una
 * URL la tiene que descargar en ese momento y en algunos navegadores (sobre todo Safari/iOS) el
 * PNG sale sin la imagen. Ya embebida no depende de esa carga.
 */
async function toDataUrl(src: string): Promise<string> {
  // Las fotos de Supabase se piden por el optimizador de Next (mismo dominio, ver next.config.ts
  // images.remotePatterns): el CSP solo deja hacer fetch al propio sitio y al Supabase del
  // entorno, y así además llega una versión liviana (640 px alcanzan para el círculo de la foto).
  const url = /^https?:\/\//.test(src)
    ? `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`
    : src;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar la imagen (${response.status})`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function useDataUrl(src: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    toDataUrl(src)
      .then((u) => current && setUrl(u))
      // Si falla la conversión se usa la URL directa: la vista previa anda igual.
      .catch(() => current && setUrl(src));
    return () => {
      current = false;
    };
  }, [src]);
  return url;
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded-lg bg-muted p-0.5" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
            value === o.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function AdvertisingScreen({ professional }: { professional: StoryProfessional }) {
  const [kind, setKind] = useState<StoryKind>("week");
  const [week, setWeek] = useState<WeekChoice>("current");
  const [customTexts, setCustomTexts] = useState<Partial<StoryTexts>>({});
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const piece = useRef<HTMLDivElement>(null);

  const photo = useDataUrl(professional.photoUrl);
  const logo = useDataUrl(LOGO_SRC);

  // La semana se calcula en el navegador (en el server, en UTC, de noche ya sería mañana).
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayIso()), []);
  const dates = useMemo(() => (today ? weekDates(today, week) : []), [today, week]);

  const [slotsByDate, setSlotsByDate] = useState<Record<string, string[]>>({});
  const [slotsStatus, setSlotsStatus] = useState<LoadStatus>("loading");
  useEffect(() => {
    if (!today) return;
    let current = true;
    setSlotsStatus("loading");
    Promise.all(dates.map((d) => getAvailableSlots(professional.id, d)))
      .then((all) => {
        if (!current) return;
        setSlotsByDate(Object.fromEntries(dates.map((d, i) => [d, all[i]])));
        setSlotsStatus("ready");
      })
      .catch((err) => {
        console.error("Error al cargar los turnos libres de la semana:", err);
        if (current) setSlotsStatus("error");
      });
    return () => {
      current = false;
    };
  }, [professional.id, today, dates]);

  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [rulesStatus, setRulesStatus] = useState<LoadStatus>("loading");
  useEffect(() => {
    let current = true;
    getOwnAvailabilityRules(professional.id)
      .then((data) => {
        if (!current) return;
        setRules(data);
        setRulesStatus("ready");
      })
      .catch((err) => {
        console.error("Error al cargar los horarios de atención:", err);
        if (current) setRulesStatus("error");
      });
    return () => {
      current = false;
    };
  }, [professional.id]);

  const rows = useMemo(
    () => (kind === "week" ? weekRows(slotsByDate, dates) : scheduleRows(rules)),
    [kind, slotsByDate, dates, rules],
  );
  const status = kind === "week" ? slotsStatus : rulesStatus;
  const texts: StoryTexts = { ...defaultTexts(kind, week, professional), ...customTexts };
  const ready = status === "ready" && rows.length > 0 && !!photo && !!logo;

  function notify(text: string, error = false) {
    setNotice({ text, error });
    window.setTimeout(() => setNotice((n) => (n?.text === text ? null : n)), 4000);
  }

  function changeKind(next: StoryKind) {
    setKind(next);
    setCustomTexts({});
  }

  function changeWeek(next: WeekChoice) {
    setWeek(next);
    setCustomTexts({});
  }

  async function download() {
    if (!piece.current || !ready) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      await document.fonts.ready;
      await Promise.all(
        Array.from(piece.current.querySelectorAll("img")).map((img) =>
          img.decode().catch(() => undefined),
        ),
      );
      const options = { width: STORY_FORMAT.w, height: STORY_FORMAT.h, pixelRatio: 1 };
      // Primera pasada descartada: en Safari/iOS las imágenes dentro del SVG recién quedan listas
      // en la segunda (bug conocido de html-to-image).
      await toPng(piece.current, options);
      const url = await toPng(piece.current, options);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName(kind, professional);
      a.click();
      notify("Imagen descargada");
    } catch (err) {
      console.error("Error al generar la historia:", err);
      notify("No se pudo generar la imagen", true);
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      notify(done);
    } catch {
      notify("No se pudo copiar", true);
    }
  }

  const rangeLabel =
    dates.length === 0
      ? null
      : dates.length === 1
        ? `Solo el ${formatDayMonth(dates[0])}`
        : `Del ${formatDayMonth(dates[0])} al ${formatDayMonth(dates[dates.length - 1])}`;

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Qué publicitar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(STORY_KINDS) as StoryKind[]).map((k) => {
                const Icon = KIND_ICONS[k];
                const active = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => k !== kind && changeKind(k)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      active
                        ? "border-brand-teal bg-brand-teal/10"
                        : "border-border hover:border-foreground/30",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Icon
                        className={cn("size-4", active ? "text-brand-teal" : "text-muted-foreground")}
                      />
                      {STORY_KINDS[k].name}
                    </span>
                    <span className="text-xs leading-snug text-muted-foreground">
                      {STORY_KINDS[k].detail}
                    </span>
                  </button>
                );
              })}
            </div>

            {kind === "week" && (
              <div className="flex flex-col gap-1.5">
                <Segmented<WeekChoice>
                  value={week}
                  onChange={changeWeek}
                  options={[
                    { value: "current", label: "Esta semana" },
                    { value: "next", label: "Semana que viene" },
                  ]}
                />
                <p className="text-xs text-muted-foreground">
                  {rangeLabel
                    ? `${rangeLabel}. Solo salen los horarios que siguen libres; si alguien reserva, ya no aparecen.`
                    : "A esta semana ya no le quedan días de atención: elegí la semana que viene."}
                </p>
              </div>
            )}
            {kind === "schedule" && (
              <p className="text-xs text-muted-foreground">
                Salen los días y franjas que configuraste en tu{" "}
                <Link href="/profesional/turnos" className="underline">
                  Agenda
                </Link>
                . Si los cambiás allá, la historia se actualiza sola.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Textos</CardTitle>
            <CardDescription>Podés retocarlos para esta historia.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="story-title">Título</Label>
              <Input
                id="story-title"
                maxLength={60}
                value={texts.title}
                onChange={(e) => setCustomTexts((t) => ({ ...t, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="story-subtitle">Bajada</Label>
              <Input
                id="story-subtitle"
                maxLength={80}
                value={texts.subtitle}
                onChange={(e) => setCustomTexts((t) => ({ ...t, subtitle: e.target.value }))}
              />
            </div>
            {Object.keys(customTexts).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => setCustomTexts({})}
              >
                <RotateCcw /> Restaurar textos
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Enlace para la historia</CardTitle>
            <CardDescription>
              Al subir la historia en Instagram, agregá el sticker &quot;Enlace&quot; y pegá este
              link: lleva a tu perfil en SALUS para reservar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                readOnly
                value={professional.profileUrl}
                aria-label="Enlace a tu perfil"
                onFocus={(e) => e.target.select()}
              />
              <Button
                variant="outline"
                onClick={() => copy(professional.profileUrl, "Enlace copiado")}
              >
                <Link2 /> Copiar
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => copy(shareText(texts, professional), "Texto copiado")}
            >
              <Copy /> Copiar texto con el enlace
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle className="text-lg">Vista previa</CardTitle>
          <CardDescription>
            {STORY_FORMAT.name} · {STORY_FORMAT.w} × {STORY_FORMAT.h} px · PNG
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status === "loading" || !photo || !logo ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Cargando…</p>
          ) : status === "error" ? (
            <p className="py-16 text-center text-sm text-red-600">
              No se pudieron cargar tus horarios. Probá de nuevo en un rato.
            </p>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {kind === "week" ? (
                "No te quedan turnos libres en esta semana. Probá con la otra semana o con la agenda general."
              ) : (
                <>
                  Todavía no configuraste tus horarios de atención. Cargalos en tu{" "}
                  <Link href="/profesional/turnos" className="underline">
                    Agenda
                  </Link>
                  .
                </>
              )}
            </p>
          ) : (
            <StoryPreview showSafeZones={showSafeZones}>
              <StoryPiece
                ref={piece}
                professional={professional}
                texts={texts}
                rows={rows}
                photo={photo}
                logo={logo}
              />
            </StoryPreview>
          )}
          <label className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showSafeZones}
              onChange={(e) => setShowSafeZones(e.target.checked)}
            />
            Mostrar las franjas que tapa Instagram (no salen en la imagen)
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {notice && (
              <span
                className={cn(
                  "mr-auto text-sm",
                  notice.error ? "text-red-600" : "text-muted-foreground",
                )}
              >
                {notice.text}
              </span>
            )}
            <Button onClick={download} disabled={!ready || busy}>
              <Download /> {busy ? "Generando…" : "Descargar PNG"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
