export default async function handler(req, res) {
  // Permitir apenas método POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  // Pegar os dados enviados do frontend
  const dados = req.body;

  // Verificar se recebeu os dados
  if (!dados) {
    return res.status(400).json({ error: "Corpo da requisição vazio." });
  }

  // Etapa 1 — Montar o prompt para a IA (por enquanto está estático)
  const prompt = `
Gere um treino COMPLETO dividido em ${dados.diasTreino} dias.
Objetivo: ${dados.objetivo}.
Nível: ${dados.nivel}.
Tipo: ${dados.tipoTreino}.

Sempre inclua:
- Mobilidade
- Aquecimento
- Treino principal
- Alongamento

Retorne em formato JSON.
  `;

  // Etapa 2 — Aqui depois entraremos com o Google Gemini
  // Por enquanto vamos retornar uma resposta falsa (mock)
  return res.status(200).json({
    status: "OK",
    mensagem: "Backend funcionando! Pronto para conectar com o Google Gemini.",
    prompt_enviado: prompt
  });
}
