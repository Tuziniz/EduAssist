# 🤖 WhatsApp FAQ Bot — Twilio + Node.js

Bot de respostas automáticas para WhatsApp usando o **Twilio Sandbox**.

---

## 📁 Estrutura dos arquivos

```
whatsapp-bot/
├── index.js        ← Servidor principal (não precisa alterar muito)
├── faq.js          ← ✏️  EDITE AQUI suas perguntas e respostas
├── .env            ← Suas credenciais do Twilio (criar na etapa 2)
├── scraper.js      ← Catch dos Calendários pelo Site 
└── package.json    ← Dependências do projeto
```

---

## 🚀 Passo a passo para testar

### Etapa 1 — Instalar dependências

```bash
npm install
```

---

### Etapa 2 — Configurar credenciais

1. Acesse [console.twilio.com](https://console.twilio.com)
2. Copie o **Account SID** e **Auth Token** da tela inicial
3. Crie o arquivo `.env` (copie o `.env.example`):

```bash
cp .env.example .env
```

4. Preencha o `.env` com seus dados:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=seu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
PORT=3000
```

---

### Etapa 3 — Ativar o Sandbox do Twilio

1. No console Twilio, vá em: **Messaging → Try it out → Send a WhatsApp message**
2. Você verá uma instrução para enviar uma mensagem de ativação, tipo:
   ```
   join <palavra-chave>
   ```
3. Envie essa mensagem do seu WhatsApp para o número **+1 415 523 8886**
4. Você receberá uma confirmação de que o Sandbox está ativo ✅

---

### Etapa 4 — Iniciar o servidor

```bash
npm start
```

Ou com auto-reload durante desenvolvimento:

```bash
npm run dev
```

Você verá:
```
🤖 WhatsApp FAQ Bot iniciado!
🌐 Servidor: http://localhost:3000
📡 Webhook:  http://localhost:3000/webhook
```

---

### Etapa 5 — Expor o servidor com ngrok

O Twilio precisa de uma URL pública para enviar mensagens ao seu servidor local.

**Instale o ngrok** (se não tiver): [ngrok.com/download](https://ngrok.com/download)

Em outro terminal, rode:

```bash
ngrok http 3000
```

Você verá algo assim:
```
Forwarding  https://abc123.ngrok-free.app → http://localhost:3000
```

Copie a URL `https://...ngrok-free.app`

---

### Etapa 6 — Configurar o Webhook no Twilio

1. No console Twilio, vá em: **Messaging → Try it out → Send a WhatsApp message**
2. Role até a seção **Sandbox Settings**
3. No campo **"When a message comes in"**, cole:
   ```
   https://abc123.ngrok-free.app/webhook          OBS: tem que ter o /webhook
   ```
4. Método: **HTTP POST**
5. Clique em **Save** ✅

---

### Etapa 7 — Testar! 🎉

Envie uma mensagem pelo WhatsApp para o número do Sandbox e o bot responderá!

**Exemplos para testar:**
- `oi` → Saudação de boas-vindas
- `menu` → Lista de opções
- `preço` → Informações de preço
- `horário` → Horários de atendimento
- `entrega` → Informações de frete
- `pagamento` → Formas de pagamento
- `cancelamento` → Política de devolução
- `contato` → Informações de contato
- `Calendario` → Calendarios do IF Sudeste
---

## ✏️ Como personalizar o bot

Abra o arquivo `faq.js` e edite:
Tem também o `scraper,js` e edite:

```js
const faqs = [
  {
    keywords: ["preco", "valor", "quanto"],  // palavras que ativam
    resposta: "💰 Nosso produto custa R$ 99!", // resposta enviada
  },
  // Adicione quantas quiser!
];
```

**Dicas:**
- Coloque palavras sem acento nos `keywords` (o bot já normaliza o texto)
- Use `*texto*` para **negrito** no WhatsApp
- Use `_texto_` para _itálico_
- Use emojis para deixar mais amigável 😊

---

## 🐛 Solução de problemas

| Problema | Solução |
|----------|---------|
| Bot não responde | Verifique se o ngrok está ativo e a URL no Twilio está correta |
| Erro de autenticação | Confira o `TWILIO_ACCOUNT_SID` e `TWILIO_AUTH_TOKEN` no `.env` |
| Mensagem não chega | Confirme que ativou o Sandbox (etapa 3) |
| URL expirou | O ngrok gratuito muda a URL a cada restart — atualize no Twilio |

---

## 📦 Tecnologias usadas

- **Node.js** — Servidor
- **Express** — Framework HTTP
- **Twilio SDK** — Integração com WhatsApp
- **ngrok** — Túnel para expor localhost
