import { Link } from "@tanstack/react-router";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/braza-logo.png";
import { SITE, whatsappLink } from "@/lib/site";
import { scrollToPageTop } from "@/lib/scroll";
import { trackAnalyticsEvent } from "@/lib/supabase";
import { useWhatsAppContext } from "@/components/site/WhatsAppFloater";

const nav = [
  { to: "/estoque", label: "ESTOQUE" },
  { to: "/sobre", label: "SOBRE" },
  { to: "/financie", label: "FINANCIE" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { message, carId } = useWhatsAppContext();
  const activeMessage = message || "Olá! Quero conhecer os carros e motos da Braza Veículos.";

  return (
    <div className="sticky top-0 z-50">
      <div className="h-1 bg-[linear-gradient(90deg,#e4202f_0_42%,#fff_42%_58%,#1767d9_58%)]" />
      <header className="border-b border-white/10 bg-[#090a0d]/90 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-3 px-4 sm:h-[88px] sm:px-6">
          <Link
            to="/"
            onClick={scrollToPageTop}
            className="group flex items-center gap-3"
            aria-label={`${SITE.name} : página inicial`}
          >
            <img
              src={logo}
              alt={`Logo ${SITE.name}`}
              className="h-16 w-16 rounded-xl object-contain transition duration-300 group-hover:scale-105 sm:h-[74px] sm:w-[74px]"
            />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-oswald text-[22px] font-bold uppercase tracking-[0.12em] text-white">
                Braza
              </span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.34em] text-secondary">
                Veículos
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={n.to === "/estoque" ? scrollToPageTop : undefined}
                className="relative px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white/70 transition after:absolute after:inset-x-4 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition hover:text-white hover:after:scale-x-100"
                activeProps={{ className: "!text-white after:!scale-x-100" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <a
            href={`tel:${SITE.phoneDigits.slice(2)}`}
            aria-label={`Ligar para ${SITE.phoneDisplay}`}
            title={`Ligar para ${SITE.phoneDisplay}`}
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-secondary/60 hover:bg-secondary/10 hover:text-secondary lg:inline-flex"
          >
            <Phone className="h-6 w-6" aria-hidden />
          </a>

          <a
            href={whatsappLink(activeMessage)}
            onClick={() => {
              if (carId) void trackAnalyticsEvent("whatsapp_click", carId);
            }}
            target="_blank"
            rel="noopener noreferrer"
            className="braza-glow ml-auto inline-flex items-center gap-2 rounded-full bg-braza px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(216,32,47,0.22)] transition hover:-translate-y-0.5 hover:brightness-110 md:ml-0"
          >
            <MessageCircle className="h-5 w-5 text-white" aria-hidden />
            <span className="hidden sm:inline">{SITE.phoneDisplay}</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>

          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-white/10 p-2 text-foreground md:hidden"
            aria-label="Abrir menu"
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <nav className="border-t border-white/10 bg-[#090a0d]/95 px-4 py-3 backdrop-blur-xl md:hidden">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => {
                  setOpen(false);
                  if (n.to === "/estoque") scrollToPageTop();
                }}
                className="block rounded-lg border-b border-white/5 px-3 py-3 text-base font-bold uppercase tracking-[0.16em] text-white/80"
                activeProps={{ className: "!border-l-2 !border-l-primary !text-white" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </div>
  );
}
