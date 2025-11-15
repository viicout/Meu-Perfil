import AImodel from './AImodel.js';
import WorkoutGenerator from './workoutGenerator.js';
import PDFGenerator from './pdfGenerator.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("avaliationForm");
  const workoutBox = document.getElementById("workoutBox");
  const historyList = document.getElementById("historyList");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const pdfBtn = document.getElementById("pdfBtn");

  loadHistory();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    workoutBox.innerHTML = `<p class="text-info">Gerando treino com IA... Aguarde.</p>`;

    const data = {
      nome: document.getElementById("name").value,
      objetivo: document.getElementById("goal").value,
      experiencia: document.getElementById("experience").value,
      dias: parseInt(document.getElementById("days").value),
      equipamento: document.getElementById("equipment").value,
      restricao: document.getElementById("restriction").value || "nenhuma"
    };

    try {
      const aiResult = await AImodel.generateWorkout(data);

      const html = WorkoutGenerator.formatAIResult(aiResult);
        workoutBox.innerHTML = html;
        workoutBox.classList.add("fade-in");
      setTimeout(() => workoutBox.classList.remove("fade-in"), 600);

      saveHistory(aiResult, data);
      loadHistory();

    } catch (error) {
      console.error(error);
      workoutBox.innerHTML = `<p class="text-danger">Erro ao gerar treino. Tente novamente.</p>`;
    }
  });

  pdfBtn.addEventListener("click", () => {
    PDFGenerator.generatePDF(workoutBox.innerHTML);
  });

  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem("treinoHistory");
    loadHistory();
  });

  function saveHistory(ai, data) {
    const history = JSON.parse(localStorage.getItem("treinoHistory")) || [];

    history.unshift({
      data: new Date().toLocaleString(),
      objetivo: data.objetivo,
      experiencia: data.experiencia,
      plano: ai.plano,
    });

    localStorage.setItem("treinoHistory", JSON.stringify(history));
  }

  function loadHistory() {
    const history = JSON.parse(localStorage.getItem("treinoHistory")) || [];
    if (history.length === 0) {
      historyList.innerHTML = `<p class="text-muted">Sem histórico.</p>`;
      return;
    }

    historyList.innerHTML = history
      .map(h => `
        <div class="border-bottom border-secondary py-2">
          <p class="small text-light">
            <strong>${h.data}</strong><br>
            <span class="text-info">${h.objetivo}</span> • 
            <span class="text-warning">${h.experiencia}</span>
          </p>
        </div>
      `)
      .join("");
  }
});

historyList.innerHTML = history
  .map(h => `
    <div class="history-item">
      <div class="history-date">${h.data}</div>
      <div class="history-goal">Objetivo: ${h.objetivo}</div>
      <div class="history-exp">Nível: ${h.experiencia}</div>
    </div>
  `)
  .join("");

const copyBtn = document.getElementById("copyBtn");

copyBtn.addEventListener("click", () => {
  const text = workoutBox.innerText;
  navigator.clipboard.writeText(text);
  copyBtn.innerText = "Copiado!";
  setTimeout(() => copyBtn.innerText = "Copiar treino", 1500);
});


const imgBtn = document.getElementById("imgBtn");

imgBtn.addEventListener("click", async () => {
  imgBtn.innerText = "Gerando imagem...";
  
  const canvas = await html2canvas(workoutBox, { scale: 2 });
  const link = document.createElement("a");
  link.download = `treino_${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();

  imgBtn.innerText = "Salvar como imagem";
});
