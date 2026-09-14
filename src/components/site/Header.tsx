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
      <header className="border-b border-white/10 bg-background/75 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-3 px-4 sm:h-[88px] sm:px-6">
          <Link
            to="/"
            onClick={scrollToPageTop}
            className="group flex items-center gap-3"
            aria-label={`${SITE.name} : página inicial`}
          >
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:h-[78px] sm:w-[78px]">
              <img
                src={logo}
                alt={`Logo ${SITE.name}`}
                className="h-full w-full scale-[1.55] object-contain transition duration-300 group-hover:scale-[1.62]"
              />
            </span>
            <span className="hidden whitespace-nowrap font-oswald text-[22px] font-bold uppercase tracking-[0.1em] text-white sm:inline">
              Braza Veículos
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={n.to === "/estoque" ? scrollToPageTop : undefined}
                className="rounded-md px-3 py-2 text-xl font-display font-semibold uppercase tracking-widest text-white transition hover:text-primary"
                activeProps={{ className: "!text-primary" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <a
            href={`tel:${SITE.phoneDigits.slice(2)}`}
            aria-label={`Ligar para ${SITE.phoneDisplay}`}
            title={`Ligar para ${SITE.phoneDisplay}`}
            className="hidden h-11 w-11 shrink-0 items-center justify-center text-white/70 transition hover:text-primary lg:inline-flex"
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
            className="braza-glow ml-auto inline-flex items-center gap-2.5 rounded-full bg-braza px-5 py-3 text-base font-bold text-white shadow-[0_8px_24px_rgba(216,32,47,0.22)] transition hover:-translate-y-0.5 hover:brightness-110 md:ml-0"
          >
            <MessageCircle className="h-5.5 w-5.5 text-white" aria-hidden />
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
          <nav className="border-t border-white/10 bg-background/85 px-4 py-3 backdrop-blur-xl md:hidden">
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
