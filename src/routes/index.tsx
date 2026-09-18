import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CarFront, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import heroMotorcycle from "@/assets/hero-motorcycle-v3.jpg";
import { CarCard, CarCardSkeleton } from "@/components/site/CarCard";
import { SITE, getAutoDealerSchema } from "@/lib/site";
import { fetchCarros } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE.name} | Carros e Motos em Uberlândia MG` },
      { name: "description", content: SITE.description },
      {
        name: "keywords",
        content:
          "carros uberlandia, motos uberlandia, seminovos uberlandia, concessionaria uberlandia, braza veiculos",
      },
      { property: "og:title", content: `${SITE.name} | Sua próxima conquista começa aqui` },
      { property: "og:description", content: SITE.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/` },
      { property: "og:image", content: SITE.ogImage },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/` }],
  }),
  component: Home,
});

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url}/estoque?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

function Home() {
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["carros", "home"],
    queryFn: () => fetchCarros({ novidades: true, limit: 6 }),
  });

  const marcas = Array.from(new Set((data ?? []).map((item) => item.marca))).slice(0, 10);

  return (
    <div className="overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getAutoDealerSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <section className="braza-grid relative min-h-[670px] overflow-hidden border-b border-white/10">
        <img
          src={heroMotorcycle}
          alt="Moto esportiva da Braza Veículos em cenário urbano"
          width={2048}
          height={768}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-85 sm:opacity-95 lg:-translate-x-[4%] lg:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090c] via-[#08090c]/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/80 to-transparent" />

        <div className="relative mx-auto flex min-h-[670px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:py-24">
          <div className="max-w-3xl">
            <h1 className="font-display text-[clamp(3.25rem,8vw,6.7rem)] font-bold uppercase leading-[0.94] tracking-[-0.025em] text-white">
              Sua próxima
              <span className="mt-1 block pb-2 text-braza">conquista</span>
              <span className="mt-2 block text-white">começa aqui.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-white sm:text-lg">
              Escolha seu próximo carro ou sua próxima moto com procedência, atendimento direto e
              uma negociação feita para você.
            </p>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/50 sm:text-lg">
              Av. João pinheiro, 3123 - Uberlândia - MG · Segunda à sábado, das 08:00 às 18:00
            </p>

            <form
              className="braza-panel mt-9 flex max-w-2xl overflow-hidden rounded-2xl p-1.5 shadow-2xl"
              onSubmit={(event) => {
                event.preventDefault();
                navigate({ to: "/estoque", search: { q: termo || undefined } });
              }}
            >
              <Search className="ml-4 h-5 w-5 shrink-0 self-center text-white/35" />
              <input
                value={termo}
                onChange={(event) => setTermo(event.target.value)}
                placeholder="Busque por marca, modelo ou ano"
                aria-label="Buscar veículo"
                className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm text-white outline-none placeholder:text-white/35 sm:text-base"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-cta-blue px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 sm:px-7"
              >
                Buscar <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {marcas.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="py-1.5 text-xs text-white/35">Populares:</span>
                {marcas.map((marca) => (
                  <Link
                    key={marca}
                    to="/estoque"
                    search={{ marca }}
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/55 transition hover:border-secondary/60 hover:text-white"
                  >
                    {marca}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-12">
        <div className="braza-panel grid overflow-hidden rounded-2xl shadow-2xl sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Procedência",
              text: "Seleção cuidadosa e negociação transparente.",
            },
            {
              icon: CarFront,
              title: "Duas ou quatro rodas",
              text: "Opções para todos os caminhos e estilos.",
            },
            {
              icon: CheckCircle2,
              title: "Atendimento direto",
              text: "Da escolha à entrega, lado a lado com você.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className={`flex gap-4 p-6 ${index < 2 ? "border-b border-white/8 sm:border-b-0 sm:border-r" : ""}`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${index === 1 ? "bg-secondary/12 text-secondary" : "bg-primary/12 text-primary"}`}
              >
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-oswald text-lg font-bold uppercase tracking-wide text-white">
                  {item.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-white/45">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase leading-relaxed tracking-[0.24em] sm:text-base">
              <span className="text-white">Seleção</span>{" "}
              <span className="text-secondary">Braza</span>
            </p>
            <h2 className="mt-3 font-oswald text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl">
              Últimas novidades
            </h2>
          </div>
          <Link
            to="/estoque"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/70 transition hover:text-secondary"
          >
            Explorar estoque <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => <CarCardSkeleton key={index} />)
            : (data ?? []).map((item) => <CarCard key={item.id} carro={item} />)}
        </div>
        {!isLoading && (data ?? []).length === 0 && (
          <div className="braza-panel mt-9 rounded-2xl p-8 text-center text-sm text-white/55">
            O estoque está sendo atualizado. Fale com a equipe para conhecer os veículos
            disponíveis.
          </div>
        )}
        {!isLoading && (data ?? []).length > 0 && (
          <div className="mt-10 text-center">
            <Link
              to="/estoque"
              className="inline-flex items-center gap-2 rounded-full bg-cta-blue px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Ver estoque completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <section className="braza-grid relative border-y border-white/8 bg-[#0b0d12]">
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-secondary">
              Venha conhecer
            </p>
            <h2 className="mt-3 font-oswald text-4xl font-bold uppercase leading-none text-white sm:text-5xl">
              A Braza está no seu caminho.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-white/55">
              {SITE.address}
              <br />
              {SITE.hours}
            </p>
            <Link
              to="/sobre"
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary transition hover:text-white"
            >
              Conheça nossa loja <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <iframe
              title={`Mapa de localização da ${SITE.name}`}
              src={SITE.mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[380px] w-full border-0"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
