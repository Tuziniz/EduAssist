const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL = "https://www.ifsudestemg.edu.br";

// Cache simples para não ficar fazendo scraping a cada mensagem
let cache = {
  academicos: null,
  administrativos: null,
  ultimaAtualizacao: null,
};

const CACHE_DURACAO_MS = 30 * 60 * 1000; // 30 minutos

// =============================================
// Busca links de calendários de uma URL
// =============================================
async function buscarCalendarios(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WhatsAppBot/1.0)",
      },
    });

    const $ = cheerio.load(data);
    const itens = [];

    // O site usa tabela ou lista de links — captura todos os <a> dentro do conteúdo principal
    $("table a, .documentContent a, #content a").each((_, el) => {
      const texto = $(el).text().trim();
      let href = $(el).attr("href") || "";

      if (!texto || texto.length < 3) return;

      // Monta URL absoluta se for relativa
      if (href.startsWith("/")) href = BASE_URL + href;
      if (!href.startsWith("http")) return;

      // Filtra apenas itens relevantes (ignora menus e navegação)
      const textoLower = texto.toLowerCase();
      if (
        textoLower.includes("calendario") ||
        textoLower.includes("calendário") ||
        textoLower.includes("20") || // anos como 2024, 2025
        href.includes(".pdf") ||
        href.includes("calendario")
      ) {
        itens.push({ texto, url: href });
      }
    });

    // Remove duplicatas por texto
    const unicos = itens.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.texto === item.texto)
    );

    return unicos.slice(0, 10); // Máx 10 itens para não lotar o WhatsApp
  } catch (err) {
    console.error(`❌ Erro ao buscar ${url}:`, err.message);
    return null;
  }
}

// =============================================
// Retorna calendários com cache
// =============================================
async function getCalendariosAcademicos() {
  const agora = Date.now();
  const cacheValido =
    cache.academicos &&
    cache.ultimaAtualizacao &&
    agora - cache.ultimaAtualizacao < CACHE_DURACAO_MS;

  if (cacheValido) {
    console.log("📦 Retornando calendários acadêmicos do cache");
    return cache.academicos;
  }

  console.log("🌐 Buscando calendários acadêmicos no site...");
  const itens = await buscarCalendarios(
    `${BASE_URL}/documentos-institucionais/calendarios/calendarios-academicos`
  );

  if (itens) {
    cache.academicos = itens;
    cache.ultimaAtualizacao = agora;
  }

  return itens;
}

async function getCalendariosAdministrativos() {
  const agora = Date.now();
  const cacheValido =
    cache.administrativos &&
    cache.ultimaAtualizacao &&
    agora - cache.ultimaAtualizacao < CACHE_DURACAO_MS;

  if (cacheValido) {
    console.log("📦 Retornando calendários administrativos do cache");
    return cache.administrativos;
  }

  console.log("🌐 Buscando calendários administrativos no site...");
  const itens = await buscarCalendarios(
    `${BASE_URL}/documentos-institucionais/calendarios/calendario-administrativo`
  );

  if (itens) {
    cache.administrativos = itens;
    cache.ultimaAtualizacao = agora;
  }

  return itens;
}

// =============================================
// Formata lista de calendários para WhatsApp
// =============================================
function formatarCalendarios(itens, titulo) {
  if (!itens || itens.length === 0) {
    return (
      `📅 *${titulo}*\n\n` +
      `Não foi possível carregar os calendários agora.\n` +
      `Acesse diretamente:\n` +
      `${BASE_URL}/hotsites/botoes-principais/calendarios`
    );
  }

  let resposta = `📅 *${titulo}*\n\n`;
  itens.forEach((item, i) => {
    resposta += `${i + 1}. ${item.texto}\n${item.url}\n`;
  });
  resposta += `_Dados atualizados diretamente do site do IF Sudeste MG_`;

  return resposta;
}

module.exports = {
  getCalendariosAcademicos,
  getCalendariosAdministrativos,
  formatarCalendarios,
};
