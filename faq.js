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
      "• Domingo e feriados: Fechado\n\n" +
      "Posso te ajudar com mais alguma coisa?",
  },
  {
    keywords: ["contato", "telefone", "falar", "atendente", "humano", "pessoa"],
    resposta:
      "📞 *Fale com a gente:*\n\n" +
      "• WhatsApp: (11) 99999-9999\n" +
      "• E-mail: contato@suaempresa.com.br\n" +
      "• Site: www.suaempresa.com.br\n\n" +
      "Nosso time responde em até 2 horas úteis! 😊",
  }
];

// Resposta quando não entender a pergunta
const respostaDefault =
  "🤖 Olá! Sou o assistente virtual do *IF Sudeste MG — Campus SJDR*.\n\n" +
  "Posso te ajudar com:\n\n" +
  "• 📅 *calendário* — Calendários acadêmicos e administrativos\n" +
  "• 🕐 *horário* — Horários de funcionamento\n" 
  "Digite uma dessas palavras ou descreva sua dúvida!";

// Saudação inicial
const saudacao =
  "👋 *Olá, bem-vindo(a)!*\n\n" +
  "Sou o assistente virtual do IF Sudeste.\n" +
  "Como posso te ajudar hoje?\n\n" +
  "Digite *menu* para ver as opções disponíveis.";

module.exports = { faqs, respostaDefault, saudacao };
