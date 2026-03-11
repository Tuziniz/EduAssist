// =============================================
// BASE DE PERGUNTAS E RESPOSTAS (FAQ)
// Edite aqui para personalizar seu bot!
// =============================================

const faqs = [
  {
    // Palavras-chave que ativam esta resposta
    keywords: ["horario", "horário", "funciona", "abre", "fecha", "aberto"],
    resposta:
      "🕐 *Nosso horário de atendimento:*\n\n" +
      "• Segunda a Sexta: 8h às 18h\n" +
      "• Sábado: 9h às 13h\n" +
      "• Domingo e feriados: Fechado\n\n" +
      "Posso te ajudar com mais alguma coisa?",
  },
  {
    keywords: ["preco", "preço", "valor", "custa", "custo", "quanto"],
    resposta:
      "💰 *Nossos planos:*\n\n" +
      "• Básico: R$ 49/mês\n" +
      "• Profissional: R$ 99/mês\n" +
      "• Empresarial: R$ 199/mês\n\n" +
      "Acesse nosso site para ver todos os detalhes ou fale com um consultor!",
  },
  {
    keywords: ["contato", "telefone", "falar", "atendente", "humano", "pessoa"],
    resposta:
      "📞 *Fale com a gente:*\n\n" +
      "• WhatsApp: (11) 99999-9999\n" +
      "• E-mail: contato@suaempresa.com.br\n" +
      "• Site: www.suaempresa.com.br\n\n" +
      "Nosso time responde em até 2 horas úteis! 😊",
  },
  {
    keywords: ["entrega", "frete", "envio", "prazo", "chega"],
    resposta:
      "🚚 *Informações de entrega:*\n\n" +
      "• Capitais: 2 a 3 dias úteis\n" +
      "• Interior: 4 a 7 dias úteis\n" +
      "• Frete grátis acima de R$ 150\n\n" +
      "Você pode rastrear seu pedido pelo nosso site!",
  },
  {
    keywords: ["cancelar", "cancelamento", "devolver", "devolucao", "devolução", "reembolso"],
    resposta:
      "↩️ *Política de cancelamento:*\n\n" +
      "• Cancelamento em até 7 dias após a compra\n" +
      "• Reembolso em até 5 dias úteis\n" +
      "• Para cancelar, envie seu nº de pedido\n\n" +
      "Precisa cancelar? Me informe o número do pedido!",
  },
  {
    keywords: ["pagamento", "pagar", "pix", "cartao", "cartão", "boleto", "parcelar"],
    resposta:
      "💳 *Formas de pagamento:*\n\n" +
      "• PIX (aprovação imediata)\n" +
      "• Cartão de crédito (até 12x)\n" +
      "• Cartão de débito\n" +
      "• Boleto bancário (2 dias úteis)\n\n" +
      "Todas as transações são 100% seguras! 🔒",
  },
];

// Resposta quando não entender a pergunta
const respostaDefault =
  "🤖 Olá! Sou o assistente virtual do *IF Sudeste MG — Campus SJDR*.\n\n" +
  "Posso te ajudar com:\n\n" +
  "• 📅 *calendário* — Calendários acadêmicos e administrativos\n" +
  "• 🕐 *horário* — Horários de funcionamento\n" +
  "• 💰 *preço* — Valores e planos\n" +
  "• 📞 *contato* — Falar com atendente\n" +
  "• 🚚 *entrega* — Prazos e frete\n" +
  "• ↩️ *cancelamento* — Devoluções\n" +
  "• 💳 *pagamento* — Formas de pagar\n\n" +
  "Digite uma dessas palavras ou descreva sua dúvida!";

// Saudação inicial
const saudacao =
  "👋 *Olá, bem-vindo(a)!*\n\n" +
  "Sou o assistente virtual da *Sua Empresa*.\n" +
  "Como posso te ajudar hoje?\n\n" +
  "Digite *menu* para ver as opções disponíveis.";

module.exports = { faqs, respostaDefault, saudacao };
