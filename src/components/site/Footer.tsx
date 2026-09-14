import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, MapPin, Calendar, Phone, MessageCircle } from "lucide-react";
import logo from "@/assets/braza-logo.png";
import { SITE, whatsappLink } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/10 bg-[#08090c]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary via-white/70 to-secondary" />
      <div className="pointer-events-none absolute -left-40 top-10 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-secondary/8 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt={`Logo ${SITE.name}`}
              className="h-20 w-20 rounded-xl object-contain"
            />
            <div>
              <h2 className="font-oswald text-2xl font-bold uppercase tracking-wider text-white">
                Braza
              </h2>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">
                Veículos
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
            Carros e motos selecionados para quem quer comprar bem, com atendimento direto e sem
            complicação.
          </p>
          <p className="mt-3 inline-flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
            <span>{SITE.address}</span>
          </p>
          <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            <span>{SITE.hours}</span>
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Contato
          </h3>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
            <span>{SITE.phoneDisplay}</span>
          </a>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0 text-secondary" />
            <span>{SITE.extraPhoneDisplay}</span>
          </p>
          <p className="mt-2 text-xs text-white/40">WhatsApp pelo número principal</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Navegação
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/estoque" className="hover:text-primary">
                Estoque
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="hover:text-primary">
                Sobre
              </Link>
            </li>
            <li>
              <Link to="/financie" className="hover:text-primary">
                Financie
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Redes sociais
          </h3>
          <div className="mt-3 flex gap-3">
            <a
              href="#"
              aria-label="Instagram"
              className="rounded-full border border-white/10 p-2 text-muted-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="rounded-full border border-white/10 p-2 text-muted-foreground transition hover:border-secondary hover:bg-secondary/10 hover:text-secondary"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="rounded-full border border-white/10 p-2 text-muted-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/8 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {SITE.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
