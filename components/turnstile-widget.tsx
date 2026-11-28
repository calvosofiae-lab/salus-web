"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Widget de Cloudflare Turnstile (captcha gratis; para la mayoría de la gente es invisible o
// un solo click). Si NEXT_PUBLIC_TURNSTILE_SITE_KEY no está configurada no muestra nada y el
// servidor tampoco lo exige (ver lib/turnstile.ts).

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () =>
        window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile no cargó"));
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("No se pudo cargar Turnstile"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export const isTurnstileEnabled = Boolean(SITE_KEY);

export interface TurnstileWidgetHandle {
  /** Pide un token nuevo (cada token sirve para un solo intento). */
  reset: () => void;
}

export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  { onToken: (token: string | null) => void }
>(function TurnstileWidget({ onToken }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useImperativeHandle(ref, () => ({
    reset() {
      onTokenRef.current(null);
      if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
    },
  }));

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          language: "es",
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} className="min-h-[65px]" />;
});
