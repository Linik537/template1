import { createFileRoute } from "@tanstack/react-router";
import { Bike, CarFront, Clock, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import logo from "@/assets/braza-logo.png";
import { SITE, getAutoDealerSchema, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: `Sobre a ${SITE.name} | Carros e Motos em Uberlândia` },
      {
        name: "description",
        content: `Conheça a ${SITE.name}, nossa forma de trabalhar, localização na ${SITE.address} e canais de atendimento.`,
      },
      {
        name: "keywords",
        content:
          "braza veiculos uberlandia, loja de carros e motos uberlandia, concessionaria avenida joao pinheiro",
      },
      { property: "og:title", content: `Sobre a ${SITE.name}` },
      { property: "og:description", content: SITE.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/sobre` },
      { property: "og:image", content: SITE.ogImage },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/sobre` }],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <div className="overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getAutoDealerSchema()) }}
      />

      <section className="border-b border-white/10 bg-[#0a0c10]">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-28">
          <div>
            <p className="border-l-2 border-primary pl-4 text-xs font-bold uppercase tracking-[0.25em] text-white/70">
              Sobre a Braza
            </p>
            <h1 className="mt-7 max-w-3xl font-oswald text-[clamp(3rem,6vw,5.5rem)] font-bold uppercase leading-[0.98] text-white">
              Seu próximo caminho começa com confiança.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              Somos uma concessionária de carros e motos em Uberlândia. Reunimos boas oportunidades
              e atendimento próximo para que você escolha com segurança, sem complicar a jornada.
            </p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Duas ou quatro rodas. A escolha é sua.
            </p>
          </div>
          <img
            src={logo}
            alt={`Logo ${SITE.name}`}
            className="mx-auto aspect-square w-full max-w-[320px] object-contain sm:max-w-[400px] lg:max-w-[480px]"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            O jeito Braza
          </p>
          <h2 className="mt-3 font-oswald text-3xl font-bold uppercase text-white sm:text-4xl">
            Clareza na escolha. Liberdade para seguir.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              number: "01",
              title: "Negociação transparente",
              text: "Informações claras e acompanhamento próximo para você decidir com segurança.",
            },
            {
              icon: CarFront,
              number: "02",
              title: "Carros para sua rotina",
              text: "Modelos selecionados para diferentes trajetos, famílias e planos.",
            },
            {
              icon: Bike,
              number: "03",
              title: "Motos para ir além",
              text: "Opções para mobilidade, trabalho, lazer e novos destinos.",
            },
          ].map((item) => (
            <article
              key={item.number}
              className="flex h-full flex-col rounded-lg border border-white/12 bg-[#10141b] p-6 transition-colors hover:border-white/30 sm:p-7"
            >
              <div className="flex items-start justify-between">
                <item.icon className="h-7 w-7 text-white" aria-hidden />
                <span className="font-oswald text-lg font-bold text-primary">{item.number}</span>
              </div>
              <h3 className="mt-9 font-oswald text-2xl font-bold uppercase leading-tight text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#0b0d12]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-secondary">
              Fale com a Braza
            </p>
            <h2 className="mt-3 font-oswald text-4xl font-bold uppercase text-white">
              Estamos perto de você.
            </h2>
            <div className="mt-8 space-y-4">
              <Info icon={MapPin} label="Endereço" value={SITE.address} />
              <Info icon={Clock} label="Horário" value={SITE.hours} />
              <a
                href={whatsappLink("Olá! Gostaria de falar com a Braza Veículos.")}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 rounded-xl border border-white/8 bg-white/[0.025] p-4 transition hover:border-secondary/50"
              >
                <MessageCircle className="mt-0.5 h-5 w-5 text-secondary" />
                <span>
                  <strong className="block text-xs uppercase tracking-wider text-white/35">
                    WhatsApp
                  </strong>
                  <span className="mt-1 block text-sm text-white/75 group-hover:text-white">
                    {SITE.phoneDisplay}
                  </span>
                </span>
              </a>
              <div className="flex items-start gap-4 rounded-xl border border-white/8 bg-white/[0.025] p-4">
                <Phone className="mt-0.5 h-5 w-5 text-secondary" />
                <span>
                  <strong className="block text-xs uppercase tracking-wider text-white/35">
                    Telefone adicional
                  </strong>
                  <span className="mt-1 block text-sm text-white/75">{SITE.extraPhoneDisplay}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <iframe
              title={`Mapa da localização da ${SITE.name}`}
              src={SITE.mapEmbed}
              className="h-[520px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-white/8 bg-white/[0.025] p-4">
      <Icon className="mt-0.5 h-5 w-5 text-secondary" />
      <span>
        <strong className="block text-xs uppercase tracking-wider text-white/35">{label}</strong>
        <span className="mt-1 block text-sm text-white/75">{value}</span>
      </span>
    </div>
  );
}
