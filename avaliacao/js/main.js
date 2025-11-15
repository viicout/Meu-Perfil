// main.js — controlador principal (compatível com seu index.html)
import { runAI } from './aiModel.js';
import { renderProgramToDom, renderHistory } from './domRenderer.js';
import PDFGenerator from './pdfGenerator.js';
import { normalizeAIResponse } from './workoutGenerator.js';

const STORAGE_KEY = 'trainforge_modular_v1';

const el = {
  name: document.getElementById('name'),
  age: document.getElementById('age'),
  weight: document.getElementById('weight'),
  time: document.getElementById('time'),
  sessions: document.getElementById('sessions'),
  goal: document.getElementById('goal'),
  type: document.getElementById('type'),
  level: document.getElementById('level'),
  limitations: document.getElementById('limitations'),
  generateBtn: document.getElementById('generateBtn'),
  resetBtn: document.getElementById('resetBtn'),
  printBtn: document.getElementById('printBtn'),
  downloadAllPdfBtn: document.getElementById('downloadAllPdfBtn'),
  workoutBox: document.getElementById('workoutBox'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  exportAllBtn: document.getElementById('exportAllBtn'),
  toggleTheme: document.getElementById('toggleTheme'),
  trainProgress: document.getElementById('trainProgress'),
  trainProgressText: document.getElementById('trainProgressText')
};

function uid(){ return Date.now() + Math.floor(Math.random()*999); }
function getFocusChecked(){ return Array.from(document.querySelectorAll('input[name="focus"]:checked')).map(i=>i.value); }
function loadHistory(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }catch(e){ return []; } }
function saveHistory(h){ localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); }

let history = loadHistory();
renderHistory(el.historyList, history);

function formValues(){
  return {
    name: el.name?.value?.trim() || '',
    age: el.age?.value?.trim() || '',
    weight: el.weight?.value?.trim() || '',
    time: el.time?.value?.trim() || '45',
    sessions: el.sessions?.value?.trim() || '3',
    goal: el.goal?.value || 'hipertrofia',
    type: el.type?.value || 'musculacao',
    level: el.level?.value || 'auto',
    limitations: el.limitations?.value?.trim() || '',
    focus: getFocusChecked()
  };
}

async function generateAndRender(){
  const form = formValues();

  el.generateBtn.disabled = true;
  const prevText = el.generateBtn.innerText;
  el.generateBtn.innerText = "Gerando...";

  if (el.trainProgress) { el.trainProgress.style.display = 'block'; el.trainProgressText.textContent = 'Chamando IA...'; }

  try {
    // enviar payload direto para a API (mantenha campos explícitos)
    const payload = {
      diasTreino: Number(form.sessions) || 3,
      objetivo: form.goal,
      nivel: form.level,
      tipoTreino: form.type,
      nome: form.name,
      foco: form.focus,
      tempo: Number(form.time) || 45,
      limitacoes: form.limitations
    };

    const aiResp = await runAI(payload);

    if (aiResp.erro) {
      el.workoutBox.innerHTML = `<div class="alert alert-danger">Erro: ${aiResp.mensagem}</div>`;
      console.error('AI returned error object:', aiResp);
    } else {
      const norm = normalizeAIResponse(aiResp);
      const rec = { id: uid(), createdAt: new Date().toISOString(), form: Object.assign({}, form, { levelUsed: form.level }), program: norm.program || [] };
      renderProgramToDom(el.workoutBox, rec);
      history.unshift(rec); history = history.slice(0,80); saveHistory(history);
      renderHistory(el.historyList, history);
    }

  } catch (err) {
    console.error('generateAndRender error', err);
    el.workoutBox.innerHTML = `<div class="alert alert-danger">Erro ao gerar treino: ${err.message || err}</div>`;
  } finally {
    if (el.trainProgress) el.trainProgress.style.display = 'none';
    el.generateBtn.disabled = false;
    el.generateBtn.innerText = prevText;
  }
}

// binds
if (el.generateBtn) el.generateBtn.addEventListener('click', generateAndRender);
if (el.resetBtn) el.resetBtn.addEventListener('click', () => {
  el.name.value=''; el.age.value=''; el.weight.value=''; el.time.value=45; el.sessions.value=3;
  el.goal.value='hipertrofia'; el.type.value='musculacao'; el.level.value='auto'; el.limitations.value='';
  document.querySelectorAll('input[name="focus"]').forEach((c,i)=> c.checked = i===0);
});
if (el.printBtn) el.printBtn.addEventListener('click', () => window.print());
if (el.downloadAllPdfBtn) el.downloadAllPdfBtn.addEventListener('click', () => PDFGenerator.generatePDFFromHtml(el.workoutBox.innerHTML));
if (el.clearHistoryBtn) el.clearHistoryBtn.addEventListener('click', () => { if(!confirm('Apagar todo o histórico?')) return; history=[]; saveHistory(history); renderHistory(el.historyList, history); el.workoutBox.innerHTML = `<p class="text-muted-light">Histórico limpo.</p>`; });
if (el.exportAllBtn) el.exportAllBtn.addEventListener('click', () => {
  if(!history || !history.length) return alert('Sem histórico para exportar.');
  const blob = new Blob([JSON.stringify(history,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `trainforge_history_${Date.now()}.json`; a.click(); URL.revokeObjectURL(a.href);
});
