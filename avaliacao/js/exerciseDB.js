// exerciseDB.js
// Banco de exercícios (sem imagens). Calistenia e Musculação separados.
// Exporta uma função getExercises() que retorna o objeto.

export function getExercises() {
  return {
    musculacao: {
      peito: [
        { name: "Supino reto", type: "compound" },
        { name: "Supino inclinado", type: "compound" },
        { name: "Crucifixo", type: "isolation" },
        { name: "Crossover", type: "isolation" },
        { name: "Flexão inclinada", type: "compound" }
      ],
      costas: [
        { name: "Remada curvada", type: "compound" },
        { name: "Puxada alta", type: "compound" },
        { name: "Barra fixa (ou puxador)", type: "compound" },
        { name: "Remada unilateral", type: "isolation" }
      ],
      pernas: [
        { name: "Agachamento livre", type: "compound" },
        { name: "Leg press", type: "compound" },
        { name: "Stiff", type: "compound" },
        { name: "Passada", type: "compound" }
      ],
      ombro: [
        { name: "Desenvolvimento", type: "compound" },
        { name: "Elevação lateral", type: "isolation" }
      ],
      braco: [
        { name: "Rosca direta", type: "isolation" },
        { name: "Tríceps testa", type: "isolation" },
        { name: "Dips (paralelas)", type: "compound" }
      ]
    },
    calistenia: {
      // APENAS peso do corpo (sem máquinas)
      peito: [
        { name: "Flexão padrão", type: "compound" },
        { name: "Flexão diamante", type: "compound" },
        { name: "Flexão declinada", type: "compound" }
      ],
      costas: [
        { name: "Barra fixa", type: "compound" },
        { name: "Australian pull-up", type: "compound" },
        { name: "Chin-up", type: "compound" }
      ],
      pernas: [
        { name: "Agachamento corporal", type: "compound" },
        { name: "Pistol assistido", type: "isolation" },
        { name: "Saltos pliométricos", type: "compound" }
      ],
      ombro: [
        { name: "Pike push-up", type: "compound" },
        { name: "Handstand practice (progres.)", type: "compound" }
      ],
      braco: [
        { name: "Rows australianos", type: "compound" },
        { name: "Dips entre bancos", type: "compound" }
      ]
    },
    mobility: [
      "Rotação de ombro",
      "Cat-cow",
      "Círculos de quadril",
      "Mobilidade de tornozelo",
      "Torção de coluna deitada"
    ],
    warmups: [
      "Pular corda 3–5 min",
      "Corrida leve 5 min",
      "Polichinelos 2–3 min",
      "Séries leves do movimento principal (2×10)"
    ],
    stretching: [
      "Alongamento peitoral 30s/side",
      "Alongamento de isquiotibiais 30s/side",
      "Alongamento de ombro 30s/side",
      "Alongamento de quadríceps 30s/side"
    ]
  };
}
