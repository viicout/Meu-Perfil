// domRenderer.js
// Renderiza o programa (tabelas) e histórico

export function renderProgramToDom(containerEl, rec){
  const prog = rec.program;
  let html = `<div class="mb-2"><strong>${rec.form.name || 'Usuário anônimo'}</strong> <div class="text-muted small">${new Date(rec.createdAt).toLocaleString()} • ${rec.form.levelUsed} • ${rec.form.goal}</div></div>`;
  prog.forEach(day => {
    html += `<div class="day-card">`;
    html += `<h5>${day.dayName}</h5>`;

    html += `<div><strong>Mobilidade</strong><ul>`;
    day.mobility.forEach(m => html += `<li>${m}</li>`);
    html += `</ul></div>`;

    html += `<div><strong>Aquecimento</strong><ul>`;
    day.warmup.forEach(w => html += `<li>${w}</li>`);
    html += `</ul></div>`;

    html += `<div class="mt-2"><strong>Treino principal</strong><table class="table-custom w-100"><thead><tr><th>Exercício</th><th>Séries</th><th>Reps / Observação</th><th>Tipo</th></tr></thead><tbody>`;
    day.main.forEach(ex => {
      html += `<tr><td>${ex.name}</td><td>${ex.sets}</td><td>${ex.reps}</td><td>${ex.type === 'compound' ? 'Multiarticular' : 'Isolamento'}</td></tr>`;
    });
    html += `</tbody></table></div>`;

    html += `<div><strong>Alongamento</strong><ul>`;
    day.stretching.forEach(s => html += `<li>${s}</li>`);
    html += `</ul></div>`;

    html += `</div>`;
  });

  html += `<div class="mt-2"><button id="exportProgramBtn" class="btn btn-sm btn-outline-light">Exportar (JSON)</button></div>`;

  containerEl.innerHTML = html;
}

export function renderHistory(containerEl, history){
  if(!history || !history.length){ containerEl.innerHTML = `<p class="text-muted">Sem histórico.</p>`; return; }
  let html = '';
  history.forEach(rec => {
    html += `<div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-secondary bg-opacity-10 rounded">`;
    html += `<div><strong>${rec.form.name || 'Usuário'}</strong><div class="text-muted small">${new Date(rec.createdAt).toLocaleString()} • ${rec.form.levelUsed} • ${rec.form.goal}</div></div>`;
    html += `<div class="d-flex gap-2"><button class="btn btn-sm btn-outline-light" data-id="${rec.id}" data-action="view">Ver</button><button class="btn btn-sm btn-outline-light" data-id="${rec.id}" data-action="export">Exportar</button><button class="btn btn-sm btn-outline-light" data-id="${rec.id}" data-action="delete">Apagar</button></div>`;
    html += `</div>`;
  });
  containerEl.innerHTML = html;
}
