import * as XLSX from "xlsx";

export type ImportacaoCarro = {
  marca: string;
  modelo: string;
  ano: number;
  versao?: string;
  ano_modelo?: number;
  preco?: number;
  quilometragem?: number;
  combustivel?: string;
  cambio?: string;
  motor?: string;
  tracao?: string;
  cor?: string;
  descricao?: string;
  destaque?: string;
};

export type ResultadoImportacao = {
  carros: ImportacaoCarro[];
  erros: string[];
  linhaCabecalho: number;
};

const aliases: Record<keyof ImportacaoCarro, string[]> = {
  marca: ["marca", "fabricante", "brand"],
  modelo: ["modelo", "model", "veiculo", "veículo", "carro", "moto"],
  ano: ["ano", "year", "ano fabricacao", "ano fabricação"],
  versao: [
    "versao",
    "versão",
    "versao modelo",
    "versão modelo",
    "versao veiculo",
    "versão veículo",
  ],
  ano_modelo: ["ano modelo", "ano do modelo", "model year"],
  preco: ["preco", "preço", "valor", "price"],
  quilometragem: ["quilometragem", "km", "kilometragem", "mileage"],
  combustivel: ["combustivel", "combustível", "fuel"],
  cambio: ["cambio", "câmbio", "transmissao", "transmissão", "transmission"],
  motor: ["motor", "motorizacao", "motorização", "engine", "potencia", "potência"],
  tracao: ["tracao", "tração", "drivetrain", "drive", "tracao integral", "tração integral"],
  cor: ["cor", "color"],
  descricao: ["descricao", "descrição", "observacao", "observação", "description"],
  destaque: ["destaque", "selo", "tag", "badge"],
};

const fields = Object.keys(aliases) as (keyof ImportacaoCarro)[];

function normalizar(valor: unknown) {
  return String(valor ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function valorTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function valorNumero(valor: unknown) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : undefined;
  const texto = valorTexto(valor).replace(/R\$|\s/g, "");
  if (!texto) return undefined;
  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto.replace(/,/g, "");
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : undefined;
}

function encontrarCabecalho(linhas: unknown[][]) {
  let melhor: {
    linha: number;
    colunas: Partial<Record<keyof ImportacaoCarro, number>>;
    pontos: number;
  } | null = null;
  for (let linha = 0; linha < Math.min(linhas.length, 100); linha++) {
    const colunas: Partial<Record<keyof ImportacaoCarro, number>> = {};
    for (const [indice, valor] of linhas[linha].entries()) {
      const nome = normalizar(valor);
      const campo = fields.find((chave) =>
        aliases[chave].some((alias) => normalizar(alias) === nome),
      );
      if (campo && colunas[campo] === undefined) colunas[campo] = indice;
    }
    const pontos = Object.keys(colunas).length;
    if (
      colunas.marca !== undefined &&
      colunas.modelo !== undefined &&
      colunas.ano !== undefined &&
      (!melhor || pontos > melhor.pontos)
    ) {
      melhor = { linha, colunas, pontos };
    }
  }
  return melhor;
}

function lerLinhas(workbook: XLSX.WorkBook): unknown[][] {
  const primeiraAba = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<unknown[]>(primeiraAba, { header: 1, defval: "", raw: true });
}

export function analisarLinhas(linhas: unknown[][]): ResultadoImportacao {
  const cabecalho = encontrarCabecalho(linhas);
  if (!cabecalho) {
    return {
      carros: [],
      erros: ["Não encontrei uma linha com as colunas Marca, Modelo e Ano."],
      linhaCabecalho: -1,
    };
  }

  const carros: ImportacaoCarro[] = [];
  const erros: string[] = [];
  for (let indice = cabecalho.linha + 1; indice < linhas.length; indice++) {
    const linha = linhas[indice];
    const valores = Object.fromEntries(
      fields.map((campo) => [campo, valorTexto(linha[cabecalho.colunas[campo] ?? -1])]),
    ) as Record<keyof ImportacaoCarro, string>;
    if (!Object.values(valores).some(Boolean)) continue;
    const ano = valorNumero(linha[cabecalho.colunas.ano ?? -1]);
    if (!valores.marca || !valores.modelo || !ano) {
      erros.push(`Linha ${indice + 1}: Marca, Modelo e Ano são obrigatórios.`);
      continue;
    }
    const carro: ImportacaoCarro = { marca: valores.marca, modelo: valores.modelo, ano };
    for (const campo of fields) {
      if (campo === "marca" || campo === "modelo" || campo === "ano") continue;
      const bruto = linha[cabecalho.colunas[campo] ?? -1];
      if (bruto === "" || bruto === null || bruto === undefined) continue;
      if (["ano_modelo", "preco", "quilometragem"].includes(campo)) {
        const numero = valorNumero(bruto);
        if (numero !== undefined) carro[campo] = numero;
      } else {
        carro[campo] = valorTexto(bruto);
      }
    }
    carros.push(carro);
  }
  return { carros, erros, linhaCabecalho: cabecalho.linha };
}

export function analisarArquivo(buffer: ArrayBuffer): ResultadoImportacao {
  return analisarLinhas(lerLinhas(XLSX.read(buffer, { type: "array", cellDates: false })));
}

export function urlExportacaoGoogleSheets(url: string) {
  const match = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return url;
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=xlsx`;
}

export async function analisarFontePlanilha(arquivo?: File, url?: string) {
  if (arquivo) return analisarArquivo(await arquivo.arrayBuffer());
  if (!url?.trim()) throw new Error("Selecione um arquivo ou informe um link do Google Sheets.");
  const resposta = await fetch(urlExportacaoGoogleSheets(url.trim()));
  if (!resposta.ok)
    throw new Error(
      "Não foi possível acessar a planilha. Confira se o Google Sheets está público.",
    );
  return analisarArquivo(await resposta.arrayBuffer());
}
