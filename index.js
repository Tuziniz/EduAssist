require("dotenv").config();
const express = require("express");
const twilio = require("twilio");
const { faqs, respostaDefault, saudacao } = require("./faq");
const {
  getCalendariosAcademicos,
  getCalendariosAdministrativos,
  formatarCalendarios,
} = require("./scraper");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// =============================================
// FUNÇÃO: Normaliza texto (remove acentos etc)
// =============================================
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ehPerguntaCalendario(texto) {
  const palavras = [
    "calendario",
    "calendário",
    "academico",
    "acadêmico",
    "administrativo",
    "aula",
    "aulas",
    "semestre",
    "periodo",
    "período",
    "ferias",
    "férias",
    "recesso",
    "feriado",
    "data",
    "datas",
    "prazo",
    "prazos",
    "cronograma",
  ];
  return palavras.some((p) => texto.includes(p));
}

function ehCalendarioAdministrativo(texto) {
  return texto.includes("administrativo") || texto.includes("servidor");
}

// =============================================
// ROTA: Recebe mensagens do Twilio (webhook)
// =============================================
app.post("/webhook", async (req, res) => {
  const mensagemRecebida = req.body.Body || "";
  const remetente = req.body.From || "";
  const texto = normalizar(mensagemRecebida);

  console.log(`\n📩 Mensagem recebida de ${remetente}:`);
  console.log(`   "${mensagemRecebida}"`);

  const twiml = new twilio.twiml.MessagingResponse();
  let resposta = "";

  // ── Saudações
  const saudacoes = [
    "oi",
    "ola",
    "hey",
    "hi",
    "bom dia",
    "boa tarde",
    "boa noite",
    "inicio",
  ];
  if (saudacoes.some((s) => texto.includes(s)) && texto.length < 20) {
    resposta = saudacao;

    // ── Menu / Ajuda
  } else if (
    texto.includes("menu") ||
    texto.includes("ajuda") ||
    texto.includes("help")
  ) {
    resposta = respostaDefault;

    // ── Calendários: busca dinâmica no site do IF
  } else if (ehPerguntaCalendario(texto)) {
    // Responde imediatamente com aviso de carregamento
    twiml.message(
      "🔍 Buscando calendários no site do IF Sudeste MG, aguarde um instante...",
    );
    res.type("text/xml");
    res.send(twiml.toString());

    // Busca e envia os dados em background via API Twilio
    try {
      let itens, titulo;
      if (ehCalendarioAdministrativo(texto)) {
        itens = await getCalendariosAdministrativos();
        titulo = "Calendários Administrativos — IF Sudeste MG";
      } else {
        itens = await getCalendariosAcademicos();
        titulo = "Calendários Acadêmicos — IF Sudeste MG";
      }

      const mensagemFinal = formatarCalendarios(itens, titulo);
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: remetente,
        body: mensagemFinal,
      });
      console.log("📤 Calendários enviados com sucesso!");
    } catch (err) {
      console.error("❌ Erro ao buscar/enviar calendários:", err.message);
    }
    return;

    // ── FAQ estático
  } else {
    let encontrou = false;
    for (const faq of faqs) {
      if (faq.keywords.some((kw) => texto.includes(kw))) {
        resposta = faq.resposta;
        encontrou = true;
        break;
      }
    }
    if (!encontrou) resposta = respostaDefault;
  }

  console.log(`📤 Respondendo: "${resposta.substring(0, 80)}..."`);
  twiml.message(resposta);
  res.type("text/xml");
  res.send(twiml.toString());
});

// =============================================
// ROTA: Healthcheck (verificar se está rodando)
// =============================================
app.get("/", (req, res) => {
  res.json({
    status: "✅ Bot rodando!",
    webhook: `POST /webhook`,
    timestamp: new Date().toISOString(),
  });
});

// =============================================
// INICIA O SERVIDOR
// =============================================
app.listen(PORT, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🤖 WhatsApp FAQ Bot iniciado!");
  console.log(`🌐 Servidor: http://localhost:${PORT}`);
  console.log(`📡 Webhook:  http://localhost:${PORT}/webhook`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⏳ Aguardando mensagens...\n");
});
