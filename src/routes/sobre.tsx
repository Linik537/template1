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

      <section className="braza-grid relative border-b border-white/8 bg-[#0a0c10]">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/12 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-secondary/12 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.75fr] lg:py-28">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Nossa identidade
            </p>
            <h1 className="mt-4 max-w-3xl font-oswald text-5xl font-bold uppercase leading-[0.95] text-white sm:text-7xl">
              Mais caminhos.
              <br />
              <span className="text-braza">Mais liberdade.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
              A Braza Veículos nasceu em Uberlândia para conectar pessoas às melhores oportunidades
              sobre duas ou quatro rodas. Aqui, cada negociação é conduzida com clareza, atenção e
              respeito pelo seu momento.
            </p>
          </div>
          <div className="braza-panel mx-auto max-w-sm rounded-[2rem] p-7 shadow-2xl">
            <img
              src={logo}
              alt={`Logo ${SITE.name}`}
              className="aspect-square w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Confiança em primeiro lugar",
              text: "Informações claras e acompanhamento próximo para você decidir com segurança.",
              tone: "red",
            },
            {
              icon: CarFront,
              title: "Quatro rodas",
              text: "Carros selecionados para diferentes rotinas, famílias e conquistas.",
              tone: "blue",
            },
            {
              icon: Bike,
              title: "Duas rodas",
              text: "Motos para mobilidade, trabalho, lazer e aquela sensação de liberdade.",
              tone: "red",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="braza-panel rounded-2xl p-7 transition duration-300 hover:-translate-y-1"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.tone === "blue" ? "bg-secondary/12 text-secondary" : "bg-primary/12 text-primary"}`}
              >
                <item.icon className="h-6 w-6" />
              </span>
              <h2 className="mt-5 font-oswald text-xl font-bold uppercase tracking-wide text-white">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/50">{item.text}</p>
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
                className="group flex items-start gap-4 rounded-xl border border-white/8 bg-white/[0.025] p-4 transition hover:border-primary/50"
              >
                <MessageCircle className="mt-0.5 h-5 w-5 text-primary" />
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
              className="h-[520px] w-full grayscale-[0.7] contrast-125"
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
