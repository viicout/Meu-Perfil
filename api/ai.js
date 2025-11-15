import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { prompt } = req.body;

    try {
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Você é um treinador que cria treinos detalhados." },
                { role: "user", content: prompt }
            ]
        });

        const reply = completion.choices[0].message.content;

        res.status(200).json({ reply });

    } catch (err) {
        console.error("API ERROR:", err);
        res.status(500).json({ error: "Erro ao conectar com IA" });
    }
}
