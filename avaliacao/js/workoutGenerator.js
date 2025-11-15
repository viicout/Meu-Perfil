// workoutGenerator.js
// Formata um resultado AI (caso precise) — basicamente uma função utilitária.
// Exporta uma função que recebe o objeto retornado pela IA e normaliza.

export function normalizeAIResponse(aiResp) {
  // se aiResp já é o objeto com program, retorne conforme
  if (!aiResp) return { program: [] };
  if (Array.isArray(aiResp)) return { program: aiResp };
  if (aiResp.program || aiResp.treino || aiResp.plano) {
    return { program: aiResp.program || aiResp.treino || aiResp.plano };
  }
  // if contains top-level fields from earlier mock
  return { program: aiResp.program || [] };
}
