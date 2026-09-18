import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CarCard, CarCardSkeleton } from "@/components/site/CarCard";
import { NumberInput } from "@/components/site/NumberInput";
import { SITE } from "@/lib/site";
import { fetchCarros } from "@/lib/supabase";

type EstoqueSearch = {
  q?: string | undefined;
  marca?: string | undefined;
  combustivel?: string | undefined;
  anoMin?: number | undefined;
  anoMax?: number | undefined;
  precoMin?: number | undefined;
  precoMax?: number | undefined;
};

type Ordem = "recentes" | "antigos" | "preco_asc" | "preco_desc" | "km" | "az";

export const Route = createFileRoute("/estoque")({
  validateSearch: (s: Record<string, unknown>): EstoqueSearch => {
    const q = typeof s["q"] === "string" ? s["q"] : undefined;
    const marca = typeof s["marca"] === "string" ? s["marca"] : undefined;
    const combustivel = typeof s["combustivel"] === "string" ? s["combustivel"] : undefined;
    const anoMinRaw = s["anoMin"] ? Number(s["anoMin"]) : undefined;
    const anoMaxRaw = s["anoMax"] ? Number(s["anoMax"]) : undefined;
    const precoMinRaw = s["precoMin"] ? Number(s["precoMin"]) : undefined;
    const precoMaxRaw = s["precoMax"] ? Number(s["precoMax"]) : undefined;
    return {
      q,
      marca,
      combustivel,
      anoMin: anoMinRaw && Number.isFinite(anoMinRaw) && anoMinRaw > 0 ? anoMinRaw : undefined,
      anoMax: anoMaxRaw && Number.isFinite(anoMaxRaw) && anoMaxRaw > 0 ? anoMaxRaw : undefined,
      precoMin:
        precoMinRaw && Number.isFinite(precoMinRaw) && precoMinRaw > 0 ? precoMinRaw : undefined,
      precoMax:
        precoMaxRaw && Number.isFinite(precoMaxRaw) && precoMaxRaw > 0 ? precoMaxRaw : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: `Estoque de Carros e Motos | ${SITE.name} Uberlândia` },
      {
        name: "description",
        content:
          "Confira carros e motos disponíveis na Braza Veículos em Uberlândia MG. Filtre por marca, ano, preço e combustível.",
      },
      {
        name: "keywords",
        content:
          "estoque de carros e motos uberlandia, veículos a venda uberlandia, seminovos uberlandia",
      },
      { property: "og:title", content: `Estoque de Veículos | ${SITE.name}` },
      {
        property: "og:description",
        content: "Catálogo de carros e motos com atendimento direto em Uberlândia.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/estoque` },
      { property: "og:image", content: SITE.ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `Estoque | ${SITE.name}` },
      {
        name: "twitter:description",
        content: "Explore nosso estoque de veículos revisados em Uberlândia.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/estoque` }],
  }),
  component: Estoque,
});

function Estoque() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/estoque" });
  const [termo, setTermo] = useState(search.q ?? "");
  const [ordem, setOrdem] = useState<Ordem>("recentes");

  const { data, isLoading } = useQuery({
    queryKey: ["carros", search],
    queryFn: () =>
      fetchCarros({
        termo: search.q,
        marca: search.marca,
        combustivel: search.combustivel,
        anoMin: search.anoMin,
        anoMax: search.anoMax,
        precoMin: search.precoMin,
        precoMax: search.precoMax,
      }),
  });

  const { data: todos } = useQuery({ queryKey: ["carros", "all"], queryFn: () => fetchCarros({}) });
  const marcas = Array.from(new Set((todos ?? []).map((c) => c.marca))).sort();

  const sorted = useMemo(() => sortCarros(data ?? [], ordem), [data, ordem]);

  const setFilter = (patch: Partial<EstoqueSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const selectCls =
    "w-full rounded-md border border-white/30 bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-white";
  const orderSelectCls =
    "rounded-md border border-white/30 bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-white w-full sm:w-auto sm:min-w-[190px]";

  return (
    <div className="relative z-30 bg-background">
      <div className="braza-grid border-b border-white/8 bg-[#0a0c10]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Duas e quatro rodas
          </p>
          <h1 className="mt-2 font-oswald text-5xl font-bold uppercase text-white sm:text-6xl">
            Encontre seu próximo veículo.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50">
            Explore o estoque da Braza e use os filtros para chegar mais rápido ao modelo ideal.
          </p>

          <form
            className="mt-8 flex max-w-4xl overflow-hidden rounded-2xl border border-white/30 bg-card p-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              setFilter({ q: termo || undefined });
            }}
          >
            <input
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Pesquisar marca, modelo ou ano..."
              aria-label="Pesquisar no estoque"
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
            <button
              type="submit"
              className="rounded-xl bg-cta-blue px-6 text-white transition hover:brightness-110"
              aria-label="Buscar"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit space-y-5 rounded-2xl border border-white/30 bg-card p-5 lg:sticky lg:top-28">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Filtros</h2>
            <label className="block text-xs text-muted-foreground">
              Marca
              <select
                className={selectCls}
                value={search.marca ?? ""}
                onChange={(e) => setFilter({ marca: e.target.value || undefined })}
              >
                <option value="">Todas</option>
                {marcas.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="space-y-2">
              <legend className="text-xs text-muted-foreground">Ano</legend>
              <label className="block text-[11px] text-muted-foreground">
                De
                <NumberInput
                  className={selectCls}
                  value={search.anoMin ?? ""}
                  placeholder="2015"
                  upStart={2016}
                  downStart={2015}
                  ariaLabel="Ano mínimo"
                  onChange={(value) => setFilter({ anoMin: value ? Number(value) : undefined })}
                />
              </label>
              <label className="block text-[11px] text-muted-foreground">
                Até
                <NumberInput
                  className={selectCls}
                  value={search.anoMax ?? ""}
                  placeholder="2027"
                  upStart={2027}
                  downStart={2026}
                  ariaLabel="Ano máximo"
                  onChange={(value) => setFilter({ anoMax: value ? Number(value) : undefined })}
                />
              </label>
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="text-xs text-muted-foreground">Preço (R$)</legend>
              <label className="block text-[11px] text-muted-foreground">
                De
                <NumberInput
                  className={selectCls}
                  value={search.precoMin ?? ""}
                  placeholder="100000"
                  step={5000}
                  upStart={100000}
                  downStart={95000}
                  ariaLabel="Preço mínimo"
                  onChange={(value) => setFilter({ precoMin: value ? Number(value) : undefined })}
                />
              </label>
              <label className="block text-[11px] text-muted-foreground">
                Até
                <NumberInput
                  className={selectCls}
                  value={search.precoMax ?? ""}
                  placeholder="300000"
                  step={5000}
                  upStart={300000}
                  downStart={295000}
                  ariaLabel="Preço máximo"
                  onChange={(value) => setFilter({ precoMax: value ? Number(value) : undefined })}
                />
              </label>
            </fieldset>
            <label className="block text-xs text-muted-foreground">
              Combustível
              <select
                className={selectCls}
                value={search.combustivel ?? ""}
                onChange={(e) => setFilter({ combustivel: e.target.value || undefined })}
              >
                <option value="">Todos</option>
                <option value="Flex">Flex</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Diesel">Diesel</option>
                <option value="Elétrico">Elétrico</option>
                <option value="Híbrido">Híbrido</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setTermo("");
                navigate({ search: {} });
              }}
              className="w-full rounded-md border border-white/30 px-3 py-2 text-xs text-muted-foreground hover:border-white hover:text-white"
            >
              Limpar filtros
            </button>
          </aside>

          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{sorted.length}</strong> veículos encontrados
              </p>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center">
                Ordenar por
                <select
                  className={orderSelectCls}
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value as Ordem)}
                  aria-label="Ordenar veículos"
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="antigos">Menos recentes</option>
                  <option value="preco_asc">Menor preço</option>
                  <option value="preco_desc">Maior preço</option>
                  <option value="km">Menor kilometragem</option>
                  <option value="az">Ordem alfabética</option>
                </select>
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)
                : sorted.map((c) => <CarCard key={c.id} carro={c} />)}
            </div>
            {!isLoading && sorted.length === 0 && (
              <p className="braza-panel rounded-2xl p-8 text-center text-sm text-muted-foreground">
                Nenhum veículo encontrado com esses filtros.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function sortCarros<
  T extends {
    id: number;
    marca: string;
    modelo: string;
    ano: number | null;
    ano_modelo: number | null;
    preco: number | null;
    quilometragem: number | null;
    created_at: string;
  },
>(rows: T[], ordem: Ordem): T[] {
  const list = [...rows];
  switch (ordem) {
    // "Recente" = ano do modelo (segundo número de "2022/2023"); em empate, ano de fabricação
    case "recentes":
      return list.sort((a, b) => compareAno(b, a));
    case "antigos":
      return list.sort((a, b) => compareAno(a, b));
    case "preco_asc":
      return list.sort((a, b) => compareNullable(a.preco, b.preco, "asc"));
    case "preco_desc":
      return list.sort((a, b) => compareNullable(a.preco, b.preco, "desc"));
    case "km":
      return list.sort((a, b) => compareNullable(a.quilometragem, b.quilometragem, "asc"));
    case "az":
      return list.sort((a, b) => {
        const nameA = `${a.marca} ${a.modelo} ${a.ano ?? ""}`.trim().toLowerCase();
        const nameB = `${b.marca} ${b.modelo} ${b.ano ?? ""}`.trim().toLowerCase();
        return nameA.localeCompare(nameB, "pt-BR");
      });
    default:
      return list;
  }
}

function compareAno(
  a: { ano: number | null; ano_modelo: number | null },
  b: { ano: number | null; ano_modelo: number | null },
) {
  // 1º critério: ano do modelo (segundo número de "2022/2023"); 2º: ano de fabricação
  return compareNullable(a.ano_modelo, b.ano_modelo, "asc") || compareNullable(a.ano, b.ano, "asc");
}

function compareNullable(
  a: number | null | undefined,
  b: number | null | undefined,
  dir: "asc" | "desc",
) {
  const aNull = a == null;
  const bNull = b == null;
  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;
  const diff = (a as number) - (b as number);
  return dir === "asc" ? diff : -diff;
}
