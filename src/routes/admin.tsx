import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { brl } from "@/lib/site";
import { supabase, type Carro } from "@/lib/supabase";
import { analisarFontePlanilha, type ImportacaoCarro } from "@/lib/spreadsheet";
import {
  calcularAreaCrop,
  DEFAULT_CROP,
  prepararImagem,
  type CropSettings,
} from "@/lib/image-editor";
import { NumberInput } from "@/components/site/NumberInput";
import { ResilientImage } from "@/components/site/ResilientImage";

const SUCCESS_TOAST_DURATION_MS = 500;

function showSuccess(message: string) {
  toast.success(message, { duration: SUCCESS_TOAST_DURATION_MS });
}

type AnalyticsSummaryRow = {
  event_type: string;
  car_id: number | null;
  total: number;
};

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel administrativo | Braza Veículos" },
      {
        name: "description",
        content: "Área restrita de gestão de estoque da Braza Veículos.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel administrativo | Braza Veículos" },
      { property: "og:description", content: "Área restrita." },
    ],
  }),
  component: Admin,
});

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

function CropPreview({
  src,
  crop,
  ratio,
  className,
}: {
  src: string;
  crop: CropSettings;
  ratio: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;
    const image = new Image();
    image.onload = () => {
      const context = canvas.getContext("2d");
      if (!context) return;
      const width = Math.max(
        1,
        Math.round(
          canvas.getBoundingClientRect().width * Math.min(window.devicePixelRatio || 1, 2),
        ),
      );
      const height = Math.max(1, Math.round(width / ratio));
      canvas.width = width;
      canvas.height = height;
      const area = calcularAreaCrop(image.naturalWidth, image.naturalHeight, crop, ratio);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, width, height);
    };
    image.src = src;
    return () => {
      image.onload = null;
    };
  }, [src, crop, ratio]);

  return <canvas ref={canvasRef} className={className} style={{ aspectRatio: ratio }} />;
}

async function baixarImagemComRetry(url: string) {
  let ultimoErro: Error | null = null;
  for (let tentativa = 0; tentativa < 4; tentativa += 1) {
    try {
      const separador = url.includes("?") ? "&" : "?";
      const resposta = await fetch(tentativa === 0 ? url : `${url}${separador}retry=${tentativa}`, {
        cache: "no-store",
      });
      if (resposta.ok) return resposta;
      ultimoErro = new Error(`HTTP ${resposta.status}`);
      if (resposta.status < 500 || tentativa === 3) break;
    } catch (error) {
      ultimoErro = error instanceof Error ? error : new Error("Falha de rede.");
      if (tentativa === 3) break;
    }
    await new Promise((resolve) => window.setTimeout(resolve, [400, 900, 1_800][tentativa]));
  }
  throw new Error(
    `Não foi possível abrir esta imagem${ultimoErro ? `: ${ultimoErro.message}` : "."}`,
  );
}

function Admin() {
  const [userId, setUserId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (carregando)
    return <div className="p-16 text-center text-sm text-muted-foreground">Carregando...</div>;
  if (!userId) return <Login />;
  return <Painel />;
}

function Login() {
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("senha")),
    });
    setLoading(false);
    if (error) toast.error("E-mail ou senha inválidos.");
  }
  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <h1 className="text-2xl font-bold text-foreground">Painel administrativo</h1>
      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-4 rounded-xl border border-border/70 bg-card p-6"
      >
        <label className="block text-xs text-muted-foreground">
          E-mail
          <input name="email" type="email" required className={inputCls} />
        </label>
        <label className="block text-xs text-muted-foreground">
          Senha
          <input name="senha" type="password" required className={inputCls} />
        </label>
        <button
          disabled={loading}
          className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

const vazio = {
  marca: "",
  modelo: "",
  versao: "",
  ano: "",
  ano_modelo: "",
  preco: "",
  quilometragem: "",
  combustivel: "Flex",
  cambio: "Automático",
  cor: "",
  motor: "",
  tracao: "",
  descricao: "",
  destaque: "",
};

function Painel() {
  const qc = useQueryClient();
  const [aba, setAba] = useState<"estoque" | "analytics">("estoque");
  const [form, setForm] = useState({ ...vazio });
  const [editId, setEditId] = useState<number | null>(null);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [arquivoInputKey, setArquivoInputKey] = useState(0);
  const [editorIndex, setEditorIndex] = useState(0);
  const [crop, setCrop] = useState<CropSettings>({ ...DEFAULT_CROP });
  const [arquivoPreviewUrls, setArquivoPreviewUrls] = useState<string[]>([]);
  const [fotoEditando, setFotoEditando] = useState<string | null>(null);
  const [substituicoes, setSubstituicoes] = useState<Record<string, File>>({});
  const [salvando, setSalvando] = useState(false);
  const [planilha, setPlanilha] = useState<File | null>(null);
  const [urlPlanilha, setUrlPlanilha] = useState("");
  const [importando, setImportando] = useState(false);
  const [resultadoImportacao, setResultadoImportacao] = useState<{
    total: number;
    erros: string[];
  } | null>(null);
  const [novidadesIds, setNovidadesIds] = useState<number[] | null>(null);
  const [carroParaNovidades, setCarroParaNovidades] = useState("");
  const [salvandoNovidades, setSalvandoNovidades] = useState(false);
  const formularioCarroRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const urls = arquivos.map((arquivo) => URL.createObjectURL(arquivo));
    setArquivoPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [arquivos]);

  const editorPreviewUrl = arquivoPreviewUrls[editorIndex] ?? "";

  const carros = useQuery({
    queryKey: ["admin", "carros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carros")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Carro[];
    },
  });

  const analytics = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_analytics_summary");
      if (error) throw error;
      return (data ?? []).map((row) => ({
        event_type: String(row.event_type),
        car_id: row.car_id === null ? null : Number(row.car_id),
        total: Number(row.total),
      })) as AnalyticsSummaryRow[];
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!carros.data || novidadesIds !== null) return;
    const possuiConfiguracao = carros.data.some(
      (carro) => typeof carro.mostrar_novidades === "boolean",
    );
    const selecionados = possuiConfiguracao
      ? carros.data
          .filter((carro) => carro.mostrar_novidades)
          .sort(
            (a, b) =>
              (a.ordem_novidades ?? Number.MAX_SAFE_INTEGER) -
              (b.ordem_novidades ?? Number.MAX_SAFE_INTEGER),
          )
          .map((carro) => carro.id)
      : carros.data
          .filter((carro) => carro.status === "disponivel")
          .slice(0, 6)
          .map((carro) => carro.id);
    setNovidadesIds(selecionados);
  }, [carros.data, novidadesIds]);

  async function uploadArquivos(files: File[]): Promise<string[]> {
    if (!files.length) return [];
    const urls: string[] = [];
    const paths: string[] = [];
    try {
      for (const file of files) {
        const extensaoOriginal = file.name
          .split(".")
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const extensao =
          extensaoOriginal && ["jpg", "jpeg", "png", "webp"].includes(extensaoOriginal)
            ? extensaoOriginal
            : file.type === "image/png"
              ? "png"
              : file.type === "image/webp"
                ? "webp"
                : "jpg";
        const path = `${Date.now()}-${crypto.randomUUID()}.${extensao}`;
        paths.push(path);
        let ultimoErro: Error | null = null;

        for (let tentativa = 0; tentativa < 4; tentativa += 1) {
          const { error } = await supabase.storage.from("carros").upload(path, file, {
            upsert: true,
            contentType: file.type || undefined,
            cacheControl: "31536000",
          });
          if (!error) {
            ultimoErro = null;
            break;
          }

          ultimoErro = new Error(error.message);
          const falhaTemporaria = /(?:http\s*)?5\d\d|timeout|network|fetch|temporar/i.test(
            error.message,
          );
          if (!falhaTemporaria || tentativa === 3) break;
          await new Promise((resolve) => window.setTimeout(resolve, [400, 900, 1800][tentativa]));
        }

        if (ultimoErro)
          throw new Error(
            `Não foi possível enviar a foto "${file.name}" após novas tentativas: ${ultimoErro.message}`,
          );
        urls.push(supabase.storage.from("carros").getPublicUrl(path).data.publicUrl);
      }
      return urls;
    } catch (error) {
      if (paths.length) await supabase.storage.from("carros").remove(paths);
      throw error;
    }
  }

  async function processarFotosSelecionadas() {
    if (!arquivos.length) return;
    setSalvando(true);
    try {
      const indiceAtual = Math.min(editorIndex, arquivos.length - 1);
      const processada = await prepararImagem(arquivos[indiceAtual], crop);

      if (fotoEditando) {
        setSubstituicoes((atuais) => ({ ...atuais, [fotoEditando]: processada }));
        setArquivos([]);
        setFotoEditando(null);
        setEditorIndex(0);
        setCrop({ ...DEFAULT_CROP });
        setArquivoInputKey((key) => key + 1);
        showSuccess("Recorte aplicado. Você já pode editar outra foto.");
        return;
      }

      setArquivos((atuais) =>
        atuais.map((arquivo, indice) => (indice === indiceAtual ? processada : arquivo)),
      );
      const proximoIndice = indiceAtual < arquivos.length - 1 ? indiceAtual + 1 : indiceAtual;
      setEditorIndex(proximoIndice);
      setCrop({ ...DEFAULT_CROP });
      showSuccess(
        indiceAtual < arquivos.length - 1
          ? "Foto preparada. Agora ajuste a próxima."
          : "Foto preparada em WebP e pronta para salvar.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível preparar as fotos.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    let uploadsDaTentativa: string[] = [];
    let bancoConfirmou = false;
    try {
      const arquivosNovos = fotoEditando ? [] : arquivos;
      const substituicoesPendentes = Object.entries(substituicoes);
      uploadsDaTentativa = await uploadArquivos([
        ...arquivosNovos,
        ...substituicoesPendentes.map(([, arquivo]) => arquivo),
      ]);
      const novas = uploadsDaTentativa.slice(0, arquivosNovos.length);
      const fotosEditadas = uploadsDaTentativa.slice(arquivosNovos.length);
      const payload = {
        marca: form.marca,
        modelo: form.modelo,
        versao: form.versao.trim() || null,
        ano: Number(form.ano),
        ano_modelo: form.ano_modelo ? Number(form.ano_modelo) : null,
        preco: form.preco ? Number(form.preco) : null,
        quilometragem: form.quilometragem ? Number(form.quilometragem) : null,
        combustivel: form.combustivel,
        cambio: form.cambio,
        cor: form.cor || null,
        motor: form.motor || null,
        tracao: form.tracao || null,
        descricao: form.descricao || null,
        destaque: form.destaque || null,
      };
      if (editId) {
        const atual = carros.data?.find((c) => c.id === editId);
        const urlsEditadas = substituicoesPendentes.reduce<Record<string, string>>(
          (mapa, [foto], index) => {
            if (fotosEditadas[index]) mapa[foto] = fotosEditadas[index];
            return mapa;
          },
          {},
        );
        const fotos = (atual?.fotos ?? []).map((foto) => urlsEditadas[foto] ?? foto).concat(novas);
        const { data: carroAtualizado, error } = await supabase.rpc("admin_update_car", {
          _car_id: editId,
          _payload: { ...payload, fotos },
        });
        if (error) throw error;
        if (!carroAtualizado || Number(carroAtualizado.id) !== editId) {
          throw new Error("O banco não confirmou a atualização do veículo.");
        }
        bancoConfirmou = true;
        qc.setQueryData(["carro", String(editId)], carroAtualizado as Carro);
        await Promise.all(Object.keys(urlsEditadas).map((foto) => removerArquivoStorage(foto)));
      } else {
        const { error } = await supabase
          .from("carros")
          .insert({ ...payload, fotos: novas, status: "disponivel" });
        if (error) throw error;
        bancoConfirmou = true;
      }
      showSuccess("Veículo salvo!");
      setForm({ ...vazio });
      setEditId(null);
      setArquivos([]);
      setArquivoInputKey((key) => key + 1);
      setEditorIndex(0);
      setCrop({ ...DEFAULT_CROP });
      setFotoEditando(null);
      setSubstituicoes({});
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "carros"] }),
        qc.invalidateQueries({ queryKey: ["carros"] }),
      ]);
    } catch (error) {
      if (!bancoConfirmou && uploadsDaTentativa.length) {
        await Promise.all(uploadsDaTentativa.map((foto) => removerArquivoStorage(foto)));
      }
      const mensagem = error instanceof Error ? error.message : "Erro ao salvar.";
      console.error("Erro ao salvar veículo:", error);
      toast.error(`Erro ao salvar. Verifique sua sessão e as permissões do Supabase. ${mensagem}`);
    } finally {
      setSalvando(false);
    }
  }

  async function atualizarFotosDoCarro(carro: Carro, fotos: string[]) {
    const { data, error } = await supabase.rpc("admin_update_car", {
      _car_id: carro.id,
      _payload: {
        marca: carro.marca,
        modelo: carro.modelo,
        versao: carro.versao,
        ano: carro.ano,
        ano_modelo: carro.ano_modelo,
        preco: carro.preco,
        quilometragem: carro.quilometragem,
        combustivel: carro.combustivel,
        cambio: carro.cambio,
        cor: carro.cor,
        motor: carro.motor,
        tracao: carro.tracao,
        descricao: carro.descricao,
        destaque: carro.destaque,
        fotos,
      },
    });
    if (error) throw error;
    if (!data || Number(data.id) !== carro.id) {
      throw new Error("O banco não confirmou a alteração das fotos.");
    }

    const atualizado = data as Carro;
    qc.setQueryData<Carro[]>(["admin", "carros"], (atuais) =>
      atuais?.map((item) => (item.id === carro.id ? atualizado : item)),
    );
    qc.setQueryData(["carro", String(carro.id)], atualizado);
    void qc.invalidateQueries({ queryKey: ["carros"] });
    return atualizado;
  }

  async function salvarConfiguracaoNovidades() {
    const ids = (novidadesIds ?? []).filter((id) =>
      carros.data?.some((carro) => carro.id === id && carro.status === "disponivel"),
    );
    setSalvandoNovidades(true);
    try {
      const { error } = await supabase.rpc("admin_set_latest_cars", { _car_ids: ids });
      if (error) throw error;
      qc.setQueryData<Carro[]>(["admin", "carros"], (atuais) =>
        atuais?.map((carro) => {
          const posicao = ids.indexOf(carro.id);
          return {
            ...carro,
            mostrar_novidades: posicao >= 0,
            ordem_novidades: posicao >= 0 ? posicao + 1 : null,
          };
        }),
      );
      setNovidadesIds(ids);
      await qc.invalidateQueries({ queryKey: ["carros"] });
      showSuccess("Últimas Novidades atualizadas.");
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível salvar a seleção.";
      const migrationPendente = /admin_set_latest_cars|schema cache|could not find/i.test(mensagem);
      toast.error(
        migrationPendente
          ? "A atualização do banco ainda não foi aplicada. Execute a migration de Últimas Novidades no Supabase."
          : mensagem,
      );
    } finally {
      setSalvandoNovidades(false);
    }
  }

  function moverNovidade(indice: number, direcao: -1 | 1) {
    if (!novidadesIds) return;
    const destino = indice + direcao;
    if (destino < 0 || destino >= novidadesIds.length) return;
    const ordenados = [...novidadesIds];
    [ordenados[indice], ordenados[destino]] = [ordenados[destino], ordenados[indice]];
    setNovidadesIds(ordenados);
  }

  async function alternarStatus(c: Carro) {
    const status = c.status === "vendido" ? "disponivel" : "vendido";
    const { error } = await supabase.from("carros").update({ status }).eq("id", c.id);
    if (error) {
      toast.error("Não foi possível atualizar.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin", "carros"] });
    qc.invalidateQueries({ queryKey: ["carros"] });
  }

  async function remover(c: Carro) {
    if (!confirm(`Remover ${c.marca} ${c.modelo}?`)) return;
    const { error } = await supabase.from("carros").delete().eq("id", c.id);
    if (error) {
      toast.error("Não foi possível remover.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin", "carros"] });
    qc.invalidateQueries({ queryKey: ["carros"] });
  }

  async function removerFoto(c: Carro, foto: string) {
    const fotos = (c.fotos ?? []).filter((item) => item !== foto);
    try {
      await atualizarFotosDoCarro(c, fotos);
      await removerArquivoStorage(foto);
      showSuccess("Imagem removida.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover a imagem.");
    }
  }

  async function removerArquivoStorage(foto: string) {
    const marker = "/storage/v1/object/public/carros/";
    const path = foto.includes(marker) ? decodeURIComponent(foto.split(marker)[1]) : null;
    if (path) await supabase.storage.from("carros").remove([path]);
  }

  async function editarFoto(foto: string) {
    try {
      const resposta = await baixarImagemComRetry(foto);
      const blob = await resposta.blob();
      const nome = foto.split("/").pop()?.split("?")[0] ?? "foto-do-carro.jpg";
      setArquivos([new File([blob], nome, { type: blob.type || "image/jpeg" })]);
      setFotoEditando(foto);
      setEditorIndex(0);
      setCrop({ ...DEFAULT_CROP });
      showSuccess("Imagem carregada no editor.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir esta imagem.");
    }
  }

  async function definirCapa(c: Carro, foto: string) {
    const fotos = [foto, ...(c.fotos ?? []).filter((item) => item !== foto)];
    try {
      await atualizarFotosDoCarro(c, fotos);
      showSuccess("Foto definida como capa do card.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível definir a capa.");
    }
  }

  async function moverFoto(c: Carro, indice: number, direcao: -1 | 1) {
    const fotos = [...(c.fotos ?? [])];
    const destino = indice + direcao;
    if (destino < 0 || destino >= fotos.length) return;
    [fotos[indice], fotos[destino]] = [fotos[destino], fotos[indice]];
    try {
      await atualizarFotosDoCarro(c, fotos);
      showSuccess("Ordem das fotos atualizada.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível alterar a ordem das fotos.",
      );
    }
  }

  function removerArquivoSelecionado(indice: number) {
    const restantes = arquivos.filter((_, atual) => atual !== indice);
    setArquivos(restantes);
    setEditorIndex((atual) => Math.min(atual, Math.max(0, restantes.length - 1)));
  }

  function moverArquivoSelecionado(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= arquivos.length) return;
    const ordenados = [...arquivos];
    [ordenados[indice], ordenados[destino]] = [ordenados[destino], ordenados[indice]];
    setArquivos(ordenados);
    setEditorIndex(destino);
  }

  async function importarPlanilha() {
    setImportando(true);
    setResultadoImportacao(null);
    try {
      const resultado = await analisarFontePlanilha(planilha ?? undefined, urlPlanilha);
      if (!resultado.carros.length) {
        setResultadoImportacao({
          total: 0,
          erros: resultado.erros.length
            ? resultado.erros
            : ["Nenhum veículo válido foi encontrado."],
        });
        return;
      }
      const registros = resultado.carros.map((carro: ImportacaoCarro) => ({
        ...carro,
        versao: carro.versao ?? null,
        ano_modelo: carro.ano_modelo ?? null,
        preco: carro.preco ?? null,
        quilometragem: carro.quilometragem ?? null,
        combustivel: carro.combustivel ?? null,
        cambio: carro.cambio ?? null,
        motor: carro.motor ?? null,
        tracao: carro.tracao ?? null,
        cor: carro.cor ?? null,
        descricao: carro.descricao ?? null,
        destaque: carro.destaque ?? null,
        fotos: [],
        status: "disponivel",
      }));
      const { error } = await supabase.from("carros").insert(registros);
      if (error) throw error;
      setResultadoImportacao({ total: registros.length, erros: resultado.erros });
      setPlanilha(null);
      setUrlPlanilha("");
      qc.invalidateQueries({ queryKey: ["admin", "carros"] });
      qc.invalidateQueries({ queryKey: ["carros"] });
      showSuccess(
        `${registros.length} veículo(s) importado(s). Agora adicione as imagens pela edição.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível importar a planilha.");
    } finally {
      setImportando(false);
    }
  }

  function editar(c: Carro) {
    setEditId(c.id);
    setForm({
      marca: c.marca,
      modelo: c.modelo,
      versao: c.versao ?? "",
      ano: String(c.ano),
      ano_modelo: c.ano_modelo ? String(c.ano_modelo) : "",
      preco: c.preco ? String(c.preco) : "",
      quilometragem: c.quilometragem ? String(c.quilometragem) : "",
      combustivel: c.combustivel ?? "Flex",
      cambio: c.cambio ?? "Automático",
      cor: c.cor ?? "",
      motor: c.motor ?? "",
      tracao: c.tracao ?? "",
      descricao: c.descricao ?? "",
      destaque: c.destaque ?? "",
    });
    setArquivos([]);
    setArquivoInputKey((key) => key + 1);
    setEditorIndex(0);
    setCrop({ ...DEFAULT_CROP });
    setFotoEditando(null);
    setSubstituicoes({});
    window.requestAnimationFrame(() => {
      formularioCarroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function selecionarArquivoParaEditar(indice: number) {
    setEditorIndex(indice);
    setCrop({ ...DEFAULT_CROP });
  }

  const campo = (name: keyof typeof vazio, label: string, type = "text", required = false) => (
    <label className="block text-xs text-muted-foreground">
      {label}
      {type === "number" ? (
        <NumberInput
          value={form[name]}
          onChange={(value) => setForm((f) => ({ ...f, [name]: value }))}
          className={inputCls}
          upStart={name === "preco" ? 300000 : name === "ano" || name === "ano_modelo" ? 2016 : 1}
          downStart={name === "preco" ? 280000 : name === "ano" || name === "ano_modelo" ? 2015 : 0}
          step={name === "preco" ? 5000 : 1}
        />
      ) : (
        <input
          type={type}
          required={required}
          value={form[name]}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          className={inputCls}
        />
      )}
    </label>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Painel administrativo</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:text-primary"
        >
          Sair
        </button>
      </div>

      <div className="mt-6 flex gap-2">
        {(["estoque", "analytics"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${aba === a ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
          >
            {a === "estoque" ? "Estoque" : "Métricas"}
          </button>
        ))}
      </div>

      {aba === "estoque" ? (
        <>
          <section className="mt-6 rounded-xl border border-primary/40 bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Importar estoque</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Envie Excel/CSV ou use um Google Sheets público. O cabeçalho pode começar em
                  qualquer linha e as linhas vazias serão ignoradas.
                </p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                Marca, Modelo e Ano obrigatórios
              </span>
            </div>
            <form
              className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                void importarPlanilha();
              }}
            >
              <label className="block text-xs text-muted-foreground">
                Arquivo Excel ou CSV
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                  onChange={(e) => setPlanilha(e.target.files?.[0] ?? null)}
                  className={inputCls}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Link público do Google Sheets
                <input
                  value={urlPlanilha}
                  onChange={(e) => setUrlPlanilha(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className={inputCls}
                />
              </label>
              <button
                disabled={importando || (!planilha && !urlPlanilha.trim())}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {importando ? "Importando..." : "Importar dados"}
              </button>
            </form>
            {resultadoImportacao && (
              <div className="mt-4 rounded-md border border-border bg-background p-3 text-sm">
                <p className="text-foreground">
                  {resultadoImportacao.total} veículo(s) importado(s).
                </p>
                {resultadoImportacao.erros.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-destructive">
                    {resultadoImportacao.erros.slice(0, 8).map((erro) => (
                      <li key={erro}>{erro}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className="mt-6 rounded-xl border border-primary/40 bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Últimas Novidades</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Escolha até seis veículos para a página inicial. A ordem abaixo será a ordem
                  exibida no site.
                </p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {novidadesIds?.length ?? 0}/6 selecionados
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {(novidadesIds ?? []).map((id, indice) => {
                const carro = carros.data?.find((item) => item.id === id);
                if (!carro) return null;
                return (
                  <div
                    key={id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {indice + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                      {carro.marca} {carro.modelo} {carro.ano_modelo ?? carro.ano}
                    </span>
                    <button
                      type="button"
                      aria-label="Mover para cima"
                      disabled={indice === 0}
                      onClick={() => moverNovidade(indice, -1)}
                      className="rounded-md border border-border px-2.5 py-1 text-sm text-foreground disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Mover para baixo"
                      disabled={indice === (novidadesIds?.length ?? 0) - 1}
                      onClick={() => moverNovidade(indice, 1)}
                      className="rounded-md border border-border px-2.5 py-1 text-sm text-foreground disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNovidadesIds((atuais) => atuais?.filter((item) => item !== id) ?? [])
                      }
                      className="rounded-md border border-destructive/60 px-3 py-1 text-xs text-destructive"
                    >
                      Remover
                    </button>
                  </div>
                );
              })}
              {(novidadesIds?.length ?? 0) === 0 && (
                <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
                  Nenhum veículo selecionado.
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <select
                value={carroParaNovidades}
                onChange={(e) => setCarroParaNovidades(e.target.value)}
                className={`${inputCls} flex-1`}
              >
                <option value="">Selecione um veículo disponível</option>
                {(carros.data ?? [])
                  .filter(
                    (carro) =>
                      carro.status === "disponivel" && !(novidadesIds ?? []).includes(carro.id),
                  )
                  .map((carro) => (
                    <option key={carro.id} value={carro.id}>
                      {carro.marca} {carro.modelo} {carro.ano_modelo ?? carro.ano}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                disabled={!carroParaNovidades || (novidadesIds?.length ?? 0) >= 6}
                onClick={() => {
                  const id = Number(carroParaNovidades);
                  if (!Number.isFinite(id) || (novidadesIds ?? []).includes(id)) return;
                  setNovidadesIds((atuais) => [...(atuais ?? []), id]);
                  setCarroParaNovidades("");
                }}
                className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary disabled:opacity-40"
              >
                Adicionar
              </button>
              <button
                type="button"
                disabled={salvandoNovidades}
                onClick={() => void salvarConfiguracaoNovidades()}
                className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {salvandoNovidades ? "Salvando..." : "Salvar seleção"}
              </button>
            </div>
          </section>

          <form
            ref={formularioCarroRef}
            onSubmit={salvar}
            className="mt-6 scroll-mt-24 rounded-xl border border-border/70 bg-card p-6"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {editId ? "Editar veículo" : "Novo veículo"}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {campo("marca", "Marca")}
              {campo("modelo", "Modelo")}
              {campo("versao", "Versão")}
              {campo("ano", "Ano de fabricação", "number")}
              {campo("ano_modelo", "Ano do modelo", "number")}
              {campo("preco", "Preço (R$)", "number")}
              {campo("quilometragem", "Quilometragem", "number")}
              {campo("cor", "Cor")}
              {campo("motor", "Motor")}
              {campo("tracao", "Tração")}
              {campo("destaque", "Selo (ex: Único dono)")}
              <label className="block text-xs text-muted-foreground">
                Combustível
                <select
                  value={form.combustivel}
                  onChange={(e) => setForm((f) => ({ ...f, combustivel: e.target.value }))}
                  className={inputCls}
                >
                  {["Flex", "Gasolina", "Diesel", "Elétrico", "Híbrido"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-muted-foreground">
                Câmbio
                <select
                  value={form.cambio}
                  onChange={(e) => setForm((f) => ({ ...f, cambio: e.target.value }))}
                  className={inputCls}
                >
                  {["Automático", "Manual"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-muted-foreground">
                Adicionar fotos
                <input
                  key={arquivoInputKey}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const selecionadas = Array.from(e.target.files ?? []);
                    setArquivos((atuais) => [
                      ...(fotoEditando ? atuais.slice(1) : atuais),
                      ...selecionadas,
                    ]);
                    setFotoEditando(null);
                  }}
                  className={inputCls}
                />
              </label>
            </div>
            {arquivos.length > 0 && (
              <div className="mt-5 rounded-lg border border-primary/30 bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">Editor de capa e fotos</p>
                    <p className="text-xs text-muted-foreground">
                      {fotoEditando
                        ? "Ajuste a imagem existente e salve para substituí-la."
                        : "O ajuste será aplicado às fotos escolhidas no formato 4:3 usado pelo site."}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {arquivos.length} foto(s) selecionada(s)
                  </span>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-foreground">
                        Foto principal (4:3)
                      </p>
                      <div className="overflow-hidden rounded-lg border border-border bg-black">
                        <CropPreview
                          src={editorPreviewUrl}
                          crop={crop}
                          ratio={4 / 3}
                          className="mx-auto block w-full max-w-2xl"
                        />
                      </div>
                    </div>
                    <div className="max-w-56">
                      <p className="mb-1.5 text-xs font-semibold text-foreground">
                        Miniatura inferior (7:5)
                      </p>
                      <div className="overflow-hidden rounded-md border border-border bg-black">
                        <CropPreview
                          src={editorPreviewUrl}
                          crop={crop}
                          ratio={7 / 5}
                          className="block w-full"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs text-muted-foreground">
                      Zoom: {crop.zoom.toFixed(1)}x
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={crop.zoom}
                        onChange={(e) =>
                          setCrop((value) => ({ ...value, zoom: Number(e.target.value) }))
                        }
                        className="w-full accent-primary"
                      />
                    </label>
                    <label className="block text-xs text-muted-foreground">
                      Horizontal: {crop.offsetX}
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="1"
                        value={crop.offsetX}
                        onChange={(e) =>
                          setCrop((value) => ({ ...value, offsetX: Number(e.target.value) }))
                        }
                        className="w-full accent-primary"
                      />
                      <span className="mt-1 flex justify-between text-[10px]">
                        <span>Esquerda</span>
                        <span>Direita</span>
                      </span>
                    </label>
                    <label className="block text-xs text-muted-foreground">
                      Vertical: {crop.offsetY}
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="1"
                        value={crop.offsetY}
                        onChange={(e) =>
                          setCrop((value) => ({ ...value, offsetY: Number(e.target.value) }))
                        }
                        className="w-full accent-primary"
                      />
                      <span className="mt-1 flex justify-between text-[10px]">
                        <span>Topo</span>
                        <span>Base</span>
                      </span>
                    </label>
                    <p className="rounded-md border border-border bg-card px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                      As extremidades dos controles alcançam todo o espaço disponível da imagem
                      original. A miniatura mostra o pequeno recorte adicional aplicado abaixo da
                      foto principal.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {arquivos.map((arquivo, index) => (
                        <button
                          type="button"
                          key={`${arquivo.name}-${index}`}
                          onClick={() => selecionarArquivoParaEditar(index)}
                          className={`rounded-md border px-2 py-1 text-xs ${index === editorIndex ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
                        >
                          {index + 1}. {arquivo.name.slice(0, 14)}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => void processarFotosSelecionadas()}
                      disabled={salvando}
                      className="w-full rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
                    >
                      {salvando ? "Preparando..." : "Aplicar nesta foto e otimizar"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {editId && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">Fotos atuais e novas</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {(carros.data?.find((carro) => carro.id === editId)?.fotos ?? []).map(
                    (foto, indice, fotos) => (
                      <div
                        key={foto}
                        className="relative h-24 w-32 overflow-hidden rounded-md border border-border"
                      >
                        <ResilientImage src={foto} alt="" className="h-full w-full object-cover" />
                        <span className="absolute left-1 top-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                          {indice + 1}
                        </span>
                        <div className="absolute inset-x-1 bottom-1 flex gap-1">
                          <button
                            type="button"
                            onClick={() => void editarFoto(foto)}
                            className="flex-1 rounded bg-background px-1 py-1 text-[10px] font-semibold text-foreground"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const carro = carros.data?.find((item) => item.id === editId);
                              if (carro) void definirCapa(carro, foto);
                            }}
                            className="flex-1 rounded bg-primary px-1 py-1 text-[10px] font-semibold text-primary-foreground"
                          >
                            Capa
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const carro = carros.data?.find((item) => item.id === editId);
                              if (carro) void removerFoto(carro, foto);
                            }}
                            className="rounded bg-destructive px-1 py-1 text-[10px] text-destructive-foreground"
                          >
                            Excluir
                          </button>
                        </div>
                        <div className="absolute right-1 top-1 flex gap-1">
                          <button
                            type="button"
                            aria-label="Mover foto para a esquerda"
                            disabled={indice === 0}
                            onClick={() => {
                              const carro = carros.data?.find((item) => item.id === editId);
                              if (carro) void moverFoto(carro, indice, -1);
                            }}
                            className="rounded bg-background/90 px-1.5 py-0.5 text-xs text-foreground disabled:opacity-30"
                          >
                            &#8592;
                          </button>
                          <button
                            type="button"
                            aria-label="Mover foto para a direita"
                            disabled={indice === fotos.length - 1}
                            onClick={() => {
                              const carro = carros.data?.find((item) => item.id === editId);
                              if (carro) void moverFoto(carro, indice, 1);
                            }}
                            className="rounded bg-background/90 px-1.5 py-0.5 text-xs text-foreground disabled:opacity-30"
                          >
                            &#8594;
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                  {!fotoEditando &&
                    arquivoPreviewUrls.map((preview, indice) => {
                      const totalAtuais =
                        carros.data?.find((carro) => carro.id === editId)?.fotos?.length ?? 0;
                      return (
                        <div
                          key={`${arquivos[indice]?.name}-${indice}`}
                          className="relative h-24 w-32 overflow-hidden rounded-md border border-primary"
                        >
                          <img
                            src={preview}
                            alt={`Nova foto ${indice + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            Nova {totalAtuais + indice + 1}
                          </span>
                          <div className="absolute inset-x-1 bottom-1 flex gap-1">
                            <button
                              type="button"
                              onClick={() => selecionarArquivoParaEditar(indice)}
                              className="flex-1 rounded bg-background px-1 py-1 text-[10px] font-semibold text-foreground"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => removerArquivoSelecionado(indice)}
                              className="rounded bg-destructive px-1 py-1 text-[10px] text-destructive-foreground"
                            >
                              Excluir
                            </button>
                          </div>
                          <div className="absolute right-1 top-1 flex gap-1">
                            <button
                              type="button"
                              aria-label="Mover nova foto para a esquerda"
                              disabled={indice === 0}
                              onClick={() => moverArquivoSelecionado(indice, -1)}
                              className="rounded bg-background/90 px-1.5 py-0.5 text-xs text-foreground disabled:opacity-30"
                            >
                              &#8592;
                            </button>
                            <button
                              type="button"
                              aria-label="Mover nova foto para a direita"
                              disabled={indice === arquivoPreviewUrls.length - 1}
                              onClick={() => moverArquivoSelecionado(indice, 1)}
                              className="rounded bg-background/90 px-1.5 py-0.5 text-xs text-foreground disabled:opacity-30"
                            >
                              &#8594;
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            <label className="mt-4 block text-xs text-muted-foreground">
              Descrição
              <textarea
                rows={8}
                data-lenis-prevent-wheel
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                className={`${inputCls} min-h-48 resize-y overflow-y-auto`}
              />
            </label>
            <div className="mt-4 flex gap-3">
              <button
                disabled={salvando}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {salvando ? "Salvando..." : editId ? "Salvar alterações" : "Adicionar veículo"}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setForm({ ...vazio });
                    setArquivos([]);
                    setFotoEditando(null);
                    setSubstituicoes({});
                    setArquivoInputKey((key) => key + 1);
                  }}
                  className="rounded-full border border-border px-6 py-2.5 text-sm text-muted-foreground"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="mt-8 space-y-3">
            {(carros.data ?? []).map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-card p-4"
              >
                <div>
                  <span className="font-medium text-foreground">
                    {c.marca} {c.modelo} {c.ano_modelo ?? c.ano}
                  </span>
                  {c.versao?.trim() ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.versao.trim()}</p>
                  ) : (
                    <p className="mt-0.5 text-xs font-medium text-destructive">
                      Versão não informada
                    </p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{brl(c.preco)}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${c.status === "vendido" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}
                >
                  {c.status === "vendido" ? "Vendido" : "Disponível"}
                </span>
                <div className="ml-auto flex gap-2 text-xs">
                  <button
                    onClick={() => editar(c)}
                    className="rounded-md border border-border px-3 py-1.5 text-muted-foreground hover:text-primary"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => alternarStatus(c)}
                    className="rounded-md border border-border px-3 py-1.5 text-muted-foreground hover:text-primary"
                  >
                    {c.status === "vendido" ? "Reativar" : "Marcar vendido"}
                  </button>
                  <button
                    onClick={() => remover(c)}
                    className="rounded-md border border-destructive/60 px-3 py-1.5 text-destructive"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : analytics.isPending ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando métricas...</p>
      ) : analytics.isError ? (
        <div className="mt-8 rounded-xl border border-destructive/50 bg-card p-5">
          <p className="font-medium text-destructive">Não foi possível carregar as métricas.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirme que a correção de métricas foi executada no Supabase e tente novamente.
          </p>
          <button
            type="button"
            onClick={() => void analytics.refetch()}
            className="mt-4 rounded-full border border-border px-4 py-2 text-sm text-foreground"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <AnalyticsPanel eventos={analytics.data} carros={carros.data ?? []} />
      )}
    </div>
  );
}

function AnalyticsPanel({ eventos, carros }: { eventos: AnalyticsSummaryRow[]; carros: Carro[] }) {
  const total = (tipo: string, carId?: number) =>
    eventos
      .filter(
        (evento) => evento.event_type === tipo && (carId === undefined || evento.car_id === carId),
      )
      .reduce((sum, evento) => sum + evento.total, 0);
  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Entradas no site", total("site_visit")],
          ["Visualizações de veículos", total("car_view")],
          ["Interesses via WhatsApp", total("whatsapp_click")],
        ].map(([titulo, valor]) => (
          <div key={String(titulo)} className="rounded-xl border border-border/70 bg-card p-5">
            <p className="text-sm text-muted-foreground">{titulo}</p>
            <p className="mt-2 text-3xl font-bold text-primary">{valor}</p>
          </div>
        ))}
      </div>
      <section className="rounded-xl border border-border/70 bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground">Desempenho por veículo</h2>
        <div className="mt-4 space-y-3">
          {carros.map((carro) => (
            <div
              key={carro.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 text-sm last:border-0"
            >
              <span className="font-medium text-foreground">
                {carro.marca} {carro.modelo} {carro.ano_modelo ?? carro.ano}
              </span>
              <span className="text-muted-foreground">
                {total("car_view", carro.id)} visualizações ·{" "}
                <strong className="text-primary">
                  {total("whatsapp_click", carro.id)} interesses
                </strong>
              </span>
            </div>
          ))}
          {carros.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum veículo cadastrado.</p>
          )}
        </div>
      </section>
    </div>
  );
}
