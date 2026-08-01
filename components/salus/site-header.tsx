import Link from "next/link";
import { Lock } from "lucide-react";

const NAV_LINKS = [
  { href: "#buscador", label: "Buscador" },
  { href: "#destacados", label: "Destacados" },
  { href: "#quienes-somos", label: "¿Quiénes somos?" },
  { href: "#que-hacemos", label: "¿Qué hacemos?" },
  { href: "#profesionales", label: "Profesionales" },
  { href: "#pacientes", label: "Pacientes" },
];

export function SiteHeader() {
  return (
    <header>
      <a href="#" className="logo-container" title="SALUS">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-salus.png" alt="SALUS - Red de Profesionales" className="logo-img" />
      </a>
      <nav>
        <ul>
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
          <li className="nav-login-item">
            <Link href="/auth/login" className="nav-login-link" title="Acceso para administradores y profesionales">
              <Lock size={13} strokeWidth={2} />
              <span>Ingresar</span>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
