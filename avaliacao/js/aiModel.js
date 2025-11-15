// aiModel.js — chama /api/gerarTreino e retorna o JSON (ou mensagem de erro)
export async function runAI(promptPayload) {
  try {
    const resp = await fetch("/api/gerarTreino", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(promptPayload)
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`API erro ${resp.status}: ${text}`);
    }

    const json = await resp.json();
    // A API pode retornar { program: [...] } ou { treino: [...] } ou até texto
    return json;
  } catch (err) {
    console.error("runAI error:", err);
    return { erro: true, mensagem: String(err.message || err) };
  }
}
