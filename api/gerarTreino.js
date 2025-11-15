export default async function handler(req, res) {
  // Aceita somente POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use método POST." });
  }

  // Ler o JSON manualmente (Node/Vercel não usa req.body)
  let body = "";
  await new Promise((resolve) => {
    req.on("data", (chunk) => (body += chunk));
    req.on("end", resolve);
  });

  let dados;
  try {
    dados = JSON.parse(body);
  } catch (e) {
    return res.status(400).json({ error: "JSON inválido enviado." });
  }

  // Import dinâmico do Gemini
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

Retorne somente JSON no formato:
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

    // Texto bruto da IA
    let resposta = result.response.text();

    // Remover ```json ``` e demais bordas
    resposta = resposta.replace(/```json/g, "")
                       .replace(/```/g, "")
                       .trim();

    // Tentar converter JSON
    const treinoJson = JSON.parse(resposta);

    return res.status(200).json(treinoJson);

  } catch (err) {
    return res.status(500).json({
      error: "Falha na geração do treino.",
      detalhe: err.message
    });
  }
}
