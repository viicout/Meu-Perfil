export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const dados = req.body;

  if (!dados) {
    return res.status(400).json({ error: "Corpo da requisição vazio." });
  }

  // Import dinâmico (compatível com Vercel Serverless)
  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Gere um treino completo dividido em ${dados.diasTreino} dias.
Objetivo: ${dados.objetivo}.
Nível: ${dados.nivel}.
Tipo: ${dados.tipoTreino}.

Cada dia deve conter:

1. Mobilidade (3-5 exercícios)
2. Aquecimento (3-5 exercícios)
3. Treino Principal (6-10 exercícios)
4. Alongamento (2-4 exercícios)

Retorne APENAS JSON no formato:
{
  "treino": [
    {
      "dia": "Dia 1",
      "mobilidade": ["...", "..."],
      "aquecimento": ["...", "..."],
      "principal": ["...", "..."],
      "alongamento": ["...", "..."]
    }
  ]
}
  `;

  try {
    const result = await model.generateContent(prompt);

    const resposta = result.response.text();

    // Garantir que é JSON válido
    const json = JSON.parse(resposta);

    return res.status(200).json(json);
  } catch (err) {
    return res.status(500).json({
      error: "Falha ao gerar treino com a IA.",
      detalhe: err.message
    });
  }
}
