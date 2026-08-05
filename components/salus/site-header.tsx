"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#buscador", label: "Buscador" },
  { href: "#destacados", label: "Destacados" },
  { href: "#quienes-somos", label: "¿Quiénes somos?" },
  { href: "#que-hacemos", label: "¿Qué hacemos?" },
  { href: "#profesionales", label: "Profesionales" },
  { href: "#pacientes", label: "Pacientes" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Los links del nav son anclas de la landing (#buscador, etc). Fuera de la home
  // hay que anteponer "/" para volver a la landing y después saltar a la sección.
  const sectionHref = (hash: string) => (pathname === "/" ? hash : `/${hash}`);

  return (
    <header>
      <Link href="/" className="logo-container" title="SALUS">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-salus.png" alt="SALUS - Red de Profesionales" className="logo-img" />
      </Link>
      <button
        type="button"
        className="nav-toggle"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav className={open ? "nav-open" : undefined}>
        <ul>
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={sectionHref(link.href)} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            </li>
          ))}
          <li className="nav-login-item">
            <Link
              href="/auth/login"
              className="nav-login-link"
              title="Acceso para administradores y profesionales"
              onClick={() => setOpen(false)}
            >
              <Lock size={13} strokeWidth={2} />
              <span>Ingresar</span>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
