require("dotenv").config();
const express = require("express");
const twilio = require("twilio");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ── Pacotes opcionais para leitura de documentos ─────────────────────────────
// Instale com: npm install pdf-parse mammoth xlsx chokidar
let pdfParse, mammoth, XLSX, chokidar;
try { pdfParse  = require("pdf-parse");  } catch (_) {}
try { mammoth   = require("mammoth");    } catch (_) {}
try { XLSX      = require("xlsx");       } catch (_) {}
try { chokidar  = require("chokidar");  } catch (_) {}

// =============================================================================
// CONFIGURAÇÕES — ajuste aqui
// =============================================================================
const PORT              = process.env.PORT || 3000;
const LM_STUDIO_URL     = process.env.LM_STUDIO_URL || "http://localhost:6464/v1/chat/completions";
const LM_MODEL          = process.env.LM_MODEL      || "local-model"; // nome do modelo carregado no LM Studio
const DOCS_FOLDER       = process.env.DOCS_FOLDER   || "./documentos"; // pasta com PDFs, DOCX, XLSX
const MAX_CONTEXT_CHARS = 12000; // limite de contexto enviado à IA
const MAX_HISTORY       = 6;     // turnos de conversa mantidos por usuário (pares user+assistant)

// Prompt de sistema — define o comportamento da IA
const SYSTEM_PROMPT = `Você é o assistente virtual oficial do Instituto Federal do Sudeste de Minas Gerais (IF Sudeste MG), Campus São João del Rei.

Seu papel é responder dúvidas de alunos, servidores e comunidade externa sobre a instituição de forma clara, objetiva e educada.

Regras:
- Responda SEMPRE em português brasileiro.
- Seja direto e conciso. Evite respostas longas demais.
- Use os documentos fornecidos como fonte principal de informação.
- Se não souber ou a informação não estiver nos documentos, diga claramente que não tem essa informação no momento e sugira contato com a secretaria.
- Nunca invente informações, datas ou prazos.
- Formate as respostas para WhatsApp: use *negrito*, listas simples e emojis quando adequado.`;

// =============================================================================
// CONTEXTO DE DOCUMENTOS — carrega arquivos da pasta ./documentos
// =============================================================================
let contextoDocumentos = "";

/**
 * Lê um arquivo e retorna seu texto extraído.
 * Suporta .txt, .pdf, .docx, .xlsx
 */
async function lerArquivo(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  try {
    if (ext === ".txt" || ext === ".md") {
      return fs.readFileSync(filePath, "utf-8");
    }
    if (ext === ".pdf" && pdfParse) {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    }
    if (ext === ".docx" && mammoth) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    if ((ext === ".xlsx" || ext === ".xls") && XLSX) {
      const wb = XLSX.readFile(filePath);
      return wb.SheetNames.map(name => {
        const sheet = XLSX.utils.sheet_to_csv(wb.Sheets[name]);
        return `[Planilha: ${name}]\n${sheet}`;
      }).join("\n\n");
    }
    return null; // extensão não suportada
  } catch (err) {
    console.error(`⚠️  Erro ao ler ${filePath}:`, err.message);
    return null;
  }
}

/**
 * Carrega todos os documentos da pasta DOCS_FOLDER e monta o contexto.
 */
async function carregarDocumentos() {
  if (!fs.existsSync(DOCS_FOLDER)) {
    console.log(`📁 Pasta "${DOCS_FOLDER}" não encontrada — rodando sem documentos.`);
    contextoDocumentos = "";
    return;
  }

  const arquivos = fs.readdirSync(DOCS_FOLDER).filter(f =>
    [".txt", ".md", ".pdf", ".docx", ".xlsx", ".xls"].includes(path.extname(f).toLowerCase())
  );

  if (arquivos.length === 0) {
    console.log(`📂 Pasta "${DOCS_FOLDER}" vazia — sem documentos carregados.`);
    contextoDocumentos = "";
    return;
  }

  console.log(`📄 Carregando ${arquivos.length} documento(s)...`);
  let textoTotal = "";

  for (const arquivo of arquivos) {
    const filePath = path.join(DOCS_FOLDER, arquivo);
    const texto = await lerArquivo(filePath);
    if (texto) {
      textoTotal += `\n\n=== ${arquivo} ===\n${texto.trim()}`;
      console.log(`   ✅ ${arquivo}`);
    }
  }

  // Trunca para não estourar o contexto do modelo
  if (textoTotal.length > MAX_CONTEXT_CHARS) {
    contextoDocumentos = textoTotal.slice(0, MAX_CONTEXT_CHARS) + "\n[... conteúdo truncado ...]";
    console.log(`✂️  Contexto truncado em ${MAX_CONTEXT_CHARS} caracteres.`);
  } else {
    contextoDocumentos = textoTotal;
  }

  console.log(`✅ Documentos carregados (${contextoDocumentos.length} chars)\n`);
}

// Recarrega documentos ao detectar mudanças na pasta
function iniciarWatcher() {
  if (!chokidar || !fs.existsSync(DOCS_FOLDER)) return;

  chokidar.watch(DOCS_FOLDER, { ignoreInitial: true }).on("all", async (event, filePath) => {
    console.log(`🔄 Arquivo alterado (${event}): ${filePath} — recarregando documentos...`);
    await carregarDocumentos();
  });

  console.log(`👁️  Monitorando pasta "${DOCS_FOLDER}" para atualizações automáticas.\n`);
}

// =============================================================================
// HISTÓRICO DE CONVERSA — mantém contexto por usuário
// =============================================================================
const historicos = new Map(); // chave: número do usuário

function obterHistorico(usuario) {
  if (!historicos.has(usuario)) {
    historicos.set(usuario, []);
  }
  return historicos.get(usuario);
}

function adicionarAoHistorico(usuario, role, content) {
  const historico = obterHistorico(usuario);
  historico.push({ role, content });

  // Mantém apenas os últimos MAX_HISTORY turnos (pares)
  const limite = MAX_HISTORY * 2;
  if (historico.length > limite) {
    historico.splice(0, historico.length - limite);
  }
}

// =============================================================================
// INTEGRAÇÃO COM LM STUDIO
// =============================================================================

/**
 * Envia mensagens para o LM Studio e retorna a resposta da IA.
 */
async function perguntarIA(usuario, mensagem) {
  const historico = obterHistorico(usuario);

  // Monta o system prompt com documentos (se houver)
  const systemContent = contextoDocumentos.length > 0
    ? `${SYSTEM_PROMPT}\n\n--- DOCUMENTOS INSTITUCIONAIS ---\n${contextoDocumentos}`
    : SYSTEM_PROMPT;

  const messages = [
    { role: "system", content: systemContent },
    ...historico,
    { role: "user", content: mensagem },
  ];

  const response = await axios.post(
    LM_STUDIO_URL,
    {
      model: LM_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 500,
      stream: false,
    },
    { timeout: 30000 }
  );

  const resposta = response.data.choices[0].message.content.trim();

  // Salva no histórico
  adicionarAoHistorico(usuario, "user", mensagem);
  adicionarAoHistorico(usuario, "assistant", resposta);

  return resposta;
}

// =============================================================================
// SERVIDOR EXPRESS + WEBHOOK TWILIO
// =============================================================================
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const mensagem  = (req.body.Body || "").trim();
  const remetente = req.body.From || "";

  console.log(`\n📩 [${remetente}] "${mensagem}"`);

  const twiml = new twilio.twiml.MessagingResponse();

  // Comando especial: limpa histórico da conversa
  if (mensagem.toLowerCase() === "!limpar") {
    historicos.delete(remetente);
    twiml.message("🗑️ Histórico de conversa limpo! Pode começar de novo.");
    res.type("text/xml");
    return res.send(twiml.toString());
  }

  // Comando especial: recarrega documentos manualmente
  if (mensagem.toLowerCase() === "!recarregar") {
    twiml.message("🔄 Recarregando documentos...");
    res.type("text/xml");
    res.send(twiml.toString());
    await carregarDocumentos();
    // Envia confirmação via API (pois o TwiML já foi enviado)
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: remetente,
        body: `✅ Documentos recarregados! (${contextoDocumentos.length} chars de contexto)`,
      });
    } catch (_) {}
    return;
  }

  // Envia aviso de "digitando..." imediatamente (respostas da IA podem demorar)
  twiml.message("⏳ Processando sua pergunta...");
  res.type("text/xml");
  res.send(twiml.toString());

  // Consulta o LM Studio em background e envia resposta via API
  try {
    const resposta = await perguntarIA(remetente, mensagem);
    console.log(`📤 Resposta IA: "${resposta.substring(0, 80)}..."`);

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: remetente,
      body: resposta,
    });
  } catch (err) {
    console.error("❌ Erro ao chamar LM Studio:", err.message);

    const msgErro = err.code === "ECONNREFUSED"
      ? "⚠️ O servidor de IA não está acessível. Verifique se o LM Studio está rodando."
      : "⚠️ Ocorreu um erro ao processar sua mensagem. Tente novamente em instantes.";

    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: remetente,
        body: msgErro,
      });
    } catch (_) {}
  }
});

// Healthcheck
app.get("/", (req, res) => {
  res.json({
    status: "✅ Bot rodando!",
    lmStudio: LM_STUDIO_URL,
    documentos: `${contextoDocumentos.length} chars carregados`,
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// INICIALIZAÇÃO
// =============================================================================
(async () => {
  await carregarDocumentos();
  iniciarWatcher();

  app.listen(PORT, () => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🤖 WhatsApp Bot — LM Studio");
    console.log(`🌐 Servidor:  http://localhost:${PORT}`);
    console.log(`📡 Webhook:   http://localhost:${PORT}/webhook`);
    console.log(`🧠 LM Studio: ${LM_STUDIO_URL}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⏳ Aguardando mensagens...\n");
  });
})();