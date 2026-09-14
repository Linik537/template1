export const SITE = {
  name: "Braza Veículos",
  url: "https://ourovillemotors.com.br",
  domain: "ourovillemotors.com.br",
  description:
    "Carros e motos novos e seminovos em Uberlândia MG. Encontre seu próximo veículo com atendimento direto, procedência e financiamento facilitado.",
  phoneDisplay: "(34) 99971-3860",
  phoneDigits: "5534999713860",
  extraPhoneDisplay: "(34) 3212-0868",
  extraPhoneDigits: "3432120868",
  address: "Avenida João Pinheiro, 3123 - Uberlândia - MG",
  streetAddress: "Avenida João Pinheiro, 3123",
  city: "Uberlândia",
  state: "MG",
  postalCode: "38400-714",
  country: "BR",
  hours: "Segunda à sábado, das 08:00 às 18:00",
  mapEmbed:
    "https://www.google.com/maps?q=Avenida+Jo%C3%A3o+Pinheiro,+3123,+Uberl%C3%A2ndia+-+MG&output=embed",
  geo: {
    latitude: "-18.8953",
    longitude: "-48.2612",
  },
  ogImage: "https://ourovillemotors.com.br/favicon.png",
};

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${SITE.phoneDigits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function brl(value: number | null | undefined) {
  if (value == null) return "Consulte";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function km(value: number | null | undefined) {
  if (value == null) return "-";
  return `${value.toLocaleString("pt-BR")} km`;
}

export function formatCarName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function getAutoDealerSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: SITE.name,
    image: SITE.ogImage,
    url: SITE.url,
    telephone: `+${SITE.phoneDigits}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.streetAddress,
      addressLocality: SITE.city,
      addressRegion: SITE.state,
      postalCode: SITE.postalCode,
      addressCountry: SITE.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE.geo.latitude,
      longitude: SITE.geo.longitude,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:00",
        closes: "18:00",
      },
    ],
    priceRange: "$$",
  };
}
