import { createClient } from "@supabase/supabase-js";

// Chave publicável do projeto: a segurança é aplicada pelas políticas RLS no Supabase.
const SUPABASE_URL = "https://xjokgcsozlqiqjfnzxle.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_c50RR1HGqK3NSgAC_x85bA_AWtnc9Lc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window === "undefined" ? undefined : window.localStorage,
  },
});

export type Carro = {
  id: number;
  marca: string;
  modelo: string;
  versao: string | null;
  ano: number;
  ano_modelo: number | null;
  preco: number | null;
  quilometragem: number | null;
  combustivel: string | null;
  motor: string | null;
  tracao: string | null;
  cambio: string | null;
  cor: string | null;
  fotos: string[] | null;
  descricao: string | null;
  destaque: string | null;
  mostrar_novidades?: boolean;
  ordem_novidades?: number | null;
  status: "disponivel" | "vendido";
  created_at: string;
};

export type AnalyticsEventType = "site_visit" | "car_view" | "whatsapp_click";

export async function trackAnalyticsEvent(
  eventType: AnalyticsEventType,
  carId?: number,
): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const authorizationToken = session?.access_token ?? SUPABASE_PUBLISHABLE_KEY;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/track_analytics_event`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${authorizationToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _event_type: eventType,
        _car_id: carId ?? null,
      }),
      keepalive: true,
    });

    if (!response.ok) {
      console.error(
        "Não foi possível registrar a métrica:",
        response.status,
        await response.text(),
      );
      return false;
    }

    return true;
  } catch (error) {
    // A falha não interrompe a navegação do visitante, mas permanece visível para diagnóstico.
    console.error("Não foi possível registrar a métrica:", error);
    return false;
  }
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const carUrl = (c: Pick<Carro, "id" | "marca" | "modelo" | "ano">) =>
  `/carros/${slugify(c.marca)}/${slugify(c.modelo)}/${c.ano}/${c.id}`;

export const carTitle = (c: Pick<Carro, "marca" | "modelo" | "ano" | "ano_modelo">) =>
  `${c.marca} ${c.modelo} ${c.ano_modelo ?? c.ano}`;

export const PLACEHOLDER_CAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#1a1a1a"/><text x="400" y="300" fill="#8a8a8a" font-family="sans-serif" font-size="28" text-anchor="middle">Foto em breve</text></svg>`,
  );

const INVENTORY_CACHE_KEY = "braza-inventory-v1";
const INVENTORY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

function readInventoryCache(): Carro[] | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = JSON.parse(window.localStorage.getItem(INVENTORY_CACHE_KEY) ?? "null") as {
      savedAt?: number;
      rows?: Carro[];
    } | null;
    if (
      !cached?.savedAt ||
      !Array.isArray(cached.rows) ||
      Date.now() - cached.savedAt > INVENTORY_CACHE_MAX_AGE
    )
      return null;
    return cached.rows;
  } catch {
    return null;
  }
}

function writeInventoryCache(rows: Carro[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(INVENTORY_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), rows }));
  } catch {
    // O estoque continua funcionando mesmo se o navegador bloquear o armazenamento local.
  }
}

export async function fetchCarros(filters?: {
  termo?: string | undefined;
  marca?: string | undefined;
  combustivel?: string | undefined;
  anoMin?: number | undefined;
  anoMax?: number | undefined;
  precoMin?: number | undefined;
  precoMax?: number | undefined;
  novidades?: boolean | undefined;
  limit?: number | undefined;
}) {
  let rows: Carro[];
  try {
    const { data, error } = await supabase
      .from("carros")
      .select("*")
      .eq("status", "disponivel")
      .order("created_at", { ascending: false });
    if (error) throw error;
    rows = (data ?? []) as Carro[];
    writeInventoryCache(rows);
  } catch (err) {
    const cached = readInventoryCache();
    if (!cached) throw err;
    console.warn(
      "Supabase temporariamente indisponível; exibindo o último estoque carregado.",
      err,
    );
    rows = cached;
  }

  if (filters?.marca) rows = rows.filter((carro) => carro.marca === filters.marca);
  if (filters?.combustivel)
    rows = rows.filter((carro) => carro.combustivel === filters.combustivel);
  if (filters?.anoMin && Number.isFinite(filters.anoMin))
    rows = rows.filter((carro) => (carro.ano_modelo ?? carro.ano) >= filters.anoMin!);
  if (filters?.anoMax && Number.isFinite(filters.anoMax))
    rows = rows.filter((carro) => (carro.ano_modelo ?? carro.ano) <= filters.anoMax!);
  if (filters?.precoMin && Number.isFinite(filters.precoMin))
    rows = rows.filter((carro) => carro.preco !== null && carro.preco >= filters.precoMin!);
  if (filters?.precoMax && Number.isFinite(filters.precoMax))
    rows = rows.filter((carro) => carro.preco !== null && carro.preco <= filters.precoMax!);
  if (filters?.novidades && rows.some((carro) => typeof carro.mostrar_novidades === "boolean")) {
    rows = rows
      .filter((carro) => carro.mostrar_novidades)
      .sort(
        (a, b) =>
          (a.ordem_novidades ?? Number.MAX_SAFE_INTEGER) -
          (b.ordem_novidades ?? Number.MAX_SAFE_INTEGER),
      );
  }
  if (filters?.termo?.trim()) rows = fuzzyFilter(rows, filters.termo);
  if (filters?.limit && Number.isFinite(filters.limit)) rows = rows.slice(0, filters.limit);
  return rows;
}

// Busca tolerante a erros de digitação (client-side, complementa o índice trigram do Postgres)
export function fuzzyFilter(rows: Carro[], termo: string) {
  const tokens = slugify(termo).split("-").filter(Boolean);
  if (!tokens.length) return rows;
  const scored = rows
    .map((c) => {
      const hay = slugify(`${c.marca} ${c.modelo} ${c.versao ?? ""} ${c.ano} ${c.cor ?? ""}`).split(
        "-",
      );
      let score = 0;
      for (const t of tokens) {
        let best = 0;
        for (const w of hay) best = Math.max(best, similarity(t, w));
        score += best;
      }
      return { c, score: score / tokens.length };
    })
    .filter((r) => r.score >= 0.55)
    .sort((a, b) => b.score - a.score);
  return scored.map((r) => r.c);
}

function similarity(a: string, b: string) {
  if (!a || !b) return 0;
  if (b.startsWith(a) || a.startsWith(b)) return 1;
  const d = levenshtein(a, b);
  return 1 - d / Math.max(a.length, b.length);
}

function levenshtein(a: string, b: string) {
  let prev: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(
        (cur[j - 1] as number) + 1,
        (prev[j] as number) + 1,
        (prev[j - 1] as number) + cost,
      );
    }
    prev = cur;
  }
  return prev[b.length] as number;
}
