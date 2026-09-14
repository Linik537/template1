import { createFileRoute } from "@tanstack/react-router";
import { FileCheck2, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { SITE, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/financie")({
  head: () => ({
    meta: [
      { title: `Financiamento de Veículos em Uberlândia : ${SITE.name}` },
      {
        name: "description",
        content:
          "Financie seu carro ou sua moto na Braza Veículos em Uberlândia com simulação rápida e atendimento pelo WhatsApp.",
      },
      {
        name: "keywords",
        content:
          "financiamento de carros e motos uberlandia, simular financiamento automotivo, financiar seminovo uberlandia",
      },
      { property: "og:title", content: `Financiamento de Veículos : ${SITE.name}` },
      {
        property: "og:description",
        content:
          "Simule seu financiamento pelo WhatsApp com a equipe Braza Veículos em Uberlândia.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/financie` },
      { property: "og:image", content: SITE.ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `Financiamento de Veículos | ${SITE.name}` },
      {
        name: "twitter:description",
        content: "Financiamento facilitado para carros e motos em Uberlândia.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/financie` }],
  }),
  component: Financie,
});

const passos = [
  {
    icon: MessageCircle,
    t: "1. Fale com a gente",
    d: "Chame no WhatsApp e diga qual veículo te interessa.",
  },
  {
    icon: FileCheck2,
    t: "2. Envie os documentos",
    d: "RG/CNH, CPF, comprovante de renda e de residência.",
  },
  {
    icon: ShieldCheck,
    t: "3. Aprovação",
    d: "Consultamos os principais bancos e buscamos a melhor taxa.",
  },
  {
    icon: Phone,
    t: "4. Sua conquista",
    d: "Assinatura, confirmação e entrega do seu veículo na loja.",
  },
];

function Financie() {
  const financialSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: "Financiamento de Veículos Braza Veículos",
    description: "Financiamento veicular facilitado com os principais bancos em Uberlândia MG.",
    provider: {
      "@type": "AutoDealer",
      name: SITE.name,
      telephone: `+${SITE.phoneDigits}`,
    },
    feesAndCommissionsSpecification: "Simulação gratuita e personalizada via WhatsApp.",
  };

  return (
    <div className="braza-grid relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(financialSchema) }}
      />
      <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
          Crédito sob medida
        </p>
        <h1 className="mt-4 max-w-4xl font-oswald text-5xl font-bold uppercase leading-[0.95] text-white sm:text-7xl">
          Tire seus planos
          <br />
          <span className="text-braza">do papel.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
          Seja carro ou moto, buscamos uma condição que faça sentido para o seu momento. Simule com
          nossa equipe de forma simples e direta.
        </p>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {passos.map((p) => (
            <div key={p.t} className="braza-panel rounded-2xl p-7 transition hover:-translate-y-1">
              <p.icon className="h-7 w-7 text-secondary" aria-hidden />
              <h2 className="mt-4 font-oswald text-xl font-bold uppercase tracking-wide text-white">
                {p.t}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{p.d}</p>
            </div>
          ))}
        </div>

        <div className="braza-panel mt-12 overflow-hidden rounded-2xl p-8 text-center sm:p-12">
          <h2 className="font-oswald text-3xl font-bold uppercase text-white">Vamos simular?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/50">
            Ligue ou mande mensagem para {SITE.phoneDisplay}. Atendemos {SITE.hours.toLowerCase()}.
          </p>
          <a
            href={whatsappLink("Olá! Gostaria de simular um financiamento na Braza Veículos.")}
            target="_blank"
            rel="noopener noreferrer"
            className="braza-glow mt-7 inline-flex items-center gap-2 rounded-full bg-braza px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110"
          >
            <MessageCircle className="h-4 w-4" /> Simular pelo WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
