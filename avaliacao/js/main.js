// main.js - orquestrador
import { getExercises } from './exerciseDB.js';
import { ensureModel, predictLevel } from './aiModel.js';
import { generateProgram } from './workoutGenerator.js';
import { renderProgramToDom, renderHistory } from './domRenderer.js';
import { printProgram } from './pdfGenerator.js';

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
  workoutBox: document.getElementById('workoutBox'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  exportAllBtn: document.getElementById('exportAllBtn'),
  toggleTheme: document.getElementById('toggleTheme'),
  trainProgress: document.getElementById('trainProgress'),
  trainProgressText: document.getElementById('trainProgressText'),
  downloadAllPdfBtn: document.getElementById('downloadAllPdfBtn')
};

function uid(){ return Date.now() + Math.floor(Math.random()*999); }
function getFocusChecked(){ return Array.from(document.querySelectorAll('input[name="focus"]:checked')).map(i=>i.value); }

function formValues(){
  return {
    name: el.name.value.trim(),
    age: el.age.value.trim(),
    weight: el.weight.value.trim(),
    time: el.time.value.trim(),
    sessions: el.sessions.value.trim(),
    goal: el.goal.value,
    type: el.type.value,
    level: el.level.value,
    limitations: el.limitations.value.trim(),
    focus: getFocusChecked()
  };
}

function loadHistory(){ try{ const r = localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):[] }catch(e){ return []; } }
function saveHistory(h){ localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); }

let history = loadHistory();
renderHistory(el.historyList, history);

// attach history listeners (delegation)
el.historyList.addEventListener('click', (ev) => {
  const btn = ev.target.closest('button');
  if(!btn) return;
  const id = Number(btn.getAttribute('data-id'));
  const action = btn.getAttribute('data-action');
  const rec = history.find(h => h.id === id);
  if(!rec) return;
  if(action === 'view'){ renderProgramToDom(el.workoutBox, rec); window.scrollTo({top:0, behavior:'smooth'}); }
  if(action === 'export'){ const blob = new Blob([JSON.stringify(rec,null,2)],{type:'application/json'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`programa_${rec.id}.json`; a.click(); URL.revokeObjectURL(url); }
  if(action === 'delete'){ if(!confirm('Apagar este registro?')) return; history = history.filter(h=>h.id !== id); saveHistory(history); renderHistory(el.historyList, history); el.workoutBox.innerHTML = '<p class="text-muted">Registro apagado.</p>'; }
});

el.generateBtn.addEventListener('click', async () => {
  // train model if needed (show progress)
  try{
    el.trainProgress.style.display = 'block';
    el.trainProgressText.textContent = 'Treinando IA local...';
    await ensureModel(({epoch, epochs, loss}) => {
      el.trainProgressText.textContent = `Treinando IA local... (${epoch}/${epochs}) loss:${loss.toFixed(3)}`;
    });
  } catch(e){
    console.warn('IA não disponível', e);
  } finally {
    el.trainProgress.style.display = 'none';
  }

  const form = formValues();
  let predictedIdx = null;
  if(form.level === 'auto'){
    predictedIdx = (typeof predictLevel === 'function') ? predictLevel(form) : 1;
  } else {
    predictedIdx = form.level === 'iniciante' ? 0 : form.level === 'intermediario' ? 1 : 2;
  }

  const rec = generateProgram(form, predictedIdx);
  history.unshift(rec);
  history = history.slice(0,80);
  saveHistory(history);
  renderHistory(el.historyList, history);
  renderProgramToDom(el.workoutBox, rec);
  window.scrollTo({top:0, behavior:'smooth'});
});

el.resetBtn.addEventListener('click', () => {
  el.name.value=''; el.age.value=''; el.weight.value=''; el.time.value=45; el.sessions.value=3;
  el.goal.value='hipertrofia'; el.type.value='musculacao'; el.level.value='auto'; el.limitations.value='';
  document.querySelectorAll('input[name="focus"]').forEach((el,i)=> el.checked = (i===0));
});

el.printBtn.addEventListener('click', ()=> printProgram());
el.downloadAllPdfBtn.addEventListener('click', ()=> printProgram());

el.clearHistoryBtn.addEventListener('click', () => {
  if(!confirm('Apagar todo o histórico?')) return;
  history = []; saveHistory(history); renderHistory(el.historyList, history); el.workoutBox.innerHTML = '<p class="text-muted">Histórico limpo.</p>';
});

el.exportAllBtn.addEventListener('click', () => {
  if(!history.length) return alert('Sem histórico para exportar.');
  const blob = new Blob([JSON.stringify(history,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download = `trainforge_history_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
});

el.toggleTheme.addEventListener('click', () => {
  document.documentElement.style.filter = document.documentElement.style.filter ? '' : 'brightness(1.03) saturate(1.05)';
  // small UI feedback
  alert('Tema alternado (simples).');
});

// silent model training in background (optional)
(async ()=> {
  try{
    await ensureModel(()=>{});
  }catch(e){ console.warn('Treino silencioso falhou', e); }
})();
