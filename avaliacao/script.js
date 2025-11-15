// script.js - IA local (TensorFlow.js) + divisão automática por dias + tabelas (SEM imagens)
// Salve como script.js no mesmo diretório do index.html

(() => {
  // ---------- banco ampliado (nomes + categorias) ----------
  // Sem imagens: apenas nome e tipo (compound/isolation/core)
  const EX = {
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
      peito: [
        { name: "Flexão padrão", type: "compound" },
        { name: "Flexão diamante", type: "compound" },
        { name: "Flexão declinada", type: "compound" }
      ],
      costas: [
        { name: "Barra fixa", type: "compound" },
        { name: "Australian pull-up", type: "compound" }
      ],
      pernas: [
        { name: "Agachamento corporal", type: "compound" },
        { name: "Pistol assistido", type: "isolation" }
      ],
      ombro: [
        { name: "Pike push-up", type: "compound" }
      ],
      braco: [
        { name: "Chin-up", type: "compound" }
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
      "Séries leves do movimento principal (2x10)"
    ],
    stretching: [
      "Alongamento peitoral 30s/side",
      "Alongamento de isquiotibiais 30s/side",
      "Alongamento de ombro 30s/side",
      "Alongamento quadríceps 30s/side"
    ]
  };

  // ---------- util ----------
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const STORAGE_KEY = "trainforge_tf_tables_v1";

  function uid(){ return Date.now() + Math.floor(Math.random()*9999); }
  function sample(arr,n=1){ if(!arr||!arr.length) return []; const c=arr.slice(); const out=[]; for(let i=0;i<Math.min(n,c.length);i++){ const idx=Math.floor(Math.random()*c.length); out.push(c.splice(idx,1)[0]); } return out; }

  // ---------- IA (TF.js) ----------
  let model = null, modelReady = false;

  async function createAndTrainModel(progressCb=null){
    const objetivos = ["hipertrofia","forca","resistencia","emagrecimento","mobilidade"];
    const samples = []; const labels = [];
    for(let i=0;i<1600;i++){
      const age = 15 + Math.floor(Math.random()*60);
      const weight = 45 + Math.floor(Math.random()*80);
      const time = 20 + Math.floor(Math.random()*100);
      const sessions = 1 + Math.floor(Math.random()*7);
      const objetivo = objetivos[Math.floor(Math.random()*objetivos.length)];

      let score = 0;
      if(sessions >= 5) score+=2;
      if(time >= 60) score+=1;
      if(age < 25 && sessions>=3) score+=1;
      if(weight > 100) score+=1;
      if(objetivo === "mobilidade") score -= 1;
      score += Math.floor(Math.random()*3)-1;

      let label = 1;
      if(score <= 0) label = 0;
      else if(score >= 3) label = 2;

      const objIdx = objetivos.indexOf(objetivo);
      const objOneHot = objetivos.map((_,j)=> j===objIdx?1:0);
      const features = [
        (age-15)/60,
        (weight-45)/80,
        (time-20)/100,
        (sessions-1)/6,
        ...objOneHot
      ];
      samples.push(features);
      labels.push(label);
    }

    const xs = tf.tensor2d(samples);
    const ys = tf.oneHot(tf.tensor1d(labels,'int32'),3);

    model = tf.sequential();
    model.add(tf.layers.dense({units:32,activation:'relu',inputShape:[xs.shape[1]]}));
    model.add(tf.layers.dropout({rate:0.12}));
    model.add(tf.layers.dense({units:24,activation:'relu'}));
    model.add(tf.layers.dense({units:3,activation:'softmax'}));
    model.compile({loss:'categoricalCrossentropy',optimizer:tf.train.adam(0.01),metrics:['accuracy']});

    const BATCH=64, EPOCHS=18;
    await model.fit(xs, ys, {
      batchSize:BATCH, epochs:EPOCHS, shuffle:true,
      callbacks:{
        onEpochEnd: async (epoch, logs) => {
          if(progressCb) progressCb({epoch: epoch+1, epochs: EPOCHS, loss: logs.loss, acc: logs.acc || logs.acc});
          await tf.nextFrame();
        }
      }
    });

    xs.dispose(); ys.dispose();
    modelReady = true;
  }

  function predictLevel(form){
    if(!modelReady || !model) return null;
    const objetivos = ["hipertrofia","forca","resistencia","emagrecimento","mobilidade"];
    const objetivo = form.goal || "hipertrofia";
    const objIdx = objetivos.indexOf(objetivo);
    const objOneHot = objetivos.map((_,j)=> j===objIdx?1:0);
    const features = [
      ((Number(form.age)||25)-15)/60,
      ((Number(form.weight)||75)-45)/80,
      ((Number(form.time)||45)-20)/100,
      ((Number(form.sessions)||3)-1)/6,
      ...objOneHot
    ];
    const input = tf.tensor2d([features]);
    const out = model.predict(input);
    const arr = out.arraySync()[0];
    input.dispose(); out.dispose();
    return arr.indexOf(Math.max(...arr)); // 0,1,2
  }

  // ---------- logic: split days automatically ----------
  function buildSplitPlan(sessions, focusList) {
    const plan = [];
    const focus = (focusList && focusList.length) ? focusList.slice() : ["full"];
    if(sessions <= 1){
      plan.push({ dayName: "Dia 1 — Full Body", muscles: ["full"] });
    } else if(sessions === 2){
      plan.push({ dayName: "Dia 1 — Upper", muscles: ["peito","costas","ombro","braco"] });
      plan.push({ dayName: "Dia 2 — Lower", muscles: ["pernas"] });
    } else if(sessions === 3){
      plan.push({ dayName: "Dia 1 — Push (Peito/Ombro/Tríceps)", muscles: ["peito","ombro","braco"] });
      plan.push({ dayName: "Dia 2 — Pull (Costas/Bíceps)", muscles: ["costas","braco"] });
      plan.push({ dayName: "Dia 3 — Legs (Pernas/Glúteo/Core)", muscles: ["pernas","full"] });
    } else if(sessions === 4){
      plan.push({ dayName: "Dia 1 — Peito/Tríceps", muscles:["peito","braco"]});
      plan.push({ dayName: "Dia 2 — Costas/Ombro", muscles:["costas","ombro"]});
      plan.push({ dayName: "Dia 3 — Pernas", muscles:["pernas"]});
      plan.push({ dayName: "Dia 4 — Full / Core", muscles:["full"]});
    } else if(sessions === 5){
      plan.push({ dayName: "Dia 1 — Peito", muscles:["peito"]});
      plan.push({ dayName: "Dia 2 — Costas", muscles:["costas"]});
      plan.push({ dayName: "Dia 3 — Pernas", muscles:["pernas"]});
      plan.push({ dayName: "Dia 4 — Ombro", muscles:["ombro"]});
      plan.push({ dayName: "Dia 5 — Braços / Core", muscles:["braco","full"]});
    } else {
      plan.push({ dayName: "Dia 1 — Peito", muscles:["peito"]});
      plan.push({ dayName: "Dia 2 — Costas", muscles:["costas"]});
      plan.push({ dayName: "Dia 3 — Pernas", muscles:["pernas"]});
      plan.push({ dayName: "Dia 4 — Ombro", muscles:["ombro"]});
      plan.push({ dayName: "Dia 5 — Braços", muscles:["braco"]});
      plan.push({ dayName: "Dia 6 — Full / Mobilidade", muscles:["full"]});
    }

    if(focus && focus.length && focus[0] !== "full"){
      for(let i=0;i<Math.min(focus.length, plan.length); i++){
        if(!plan[i].muscles.includes(focus[i])) plan[i].muscles.unshift(focus[i]);
      }
    }
    return plan;
  }

  function setsRepsByGoal(goal, level) {
    const base = {sets:3,reps:10};
    if(goal==="hipertrofia"){ base.sets = level==="iniciante"?3:4; base.reps=8; }
    else if(goal==="forca"){ base.sets=4; base.reps=3; }
    else if(goal==="resistencia"){ base.sets=3; base.reps=15; }
    else if(goal==="emagrecimento"){ base.sets=3; base.reps=12; }
    else if(goal==="mobilidade"){ base.sets=2; base.reps=10; }
    return base;
  }

  function generateProgram(form, predictedIdx){
    const levelUsed = form.level && form.level!=="auto" ? form.level : (predictedIdx===0? "iniciante": predictedIdx===1? "intermediario":"avancado");
    const sessions = Number(form.sessions) || 3;
    const focus = form.focus && form.focus.length ? form.focus : ["full"];
    const plan = buildSplitPlan(sessions, focus);

    const program = plan.map((day) => {
      const mobility = sample(EX.mobility, 3);
      const warmup = sample(EX.warmups, 2);
      const qtyMain = levelUsed==="iniciante"? 6 : levelUsed==="intermediario"? 8 : 10;

      const allPool = [];
      day.muscles.forEach(m=>{
        if(m==="full"){
          ["peito","costas","pernas","ombro","braco"].forEach(k=>{
            if(EX.musculacao[k]) allPool.push(...EX.musculacao[k]);
            if(EX.calistenia[k]) allPool.push(...EX.calistenia[k]);
          });
        } else {
          if(EX.musculacao[m]) allPool.push(...EX.musculacao[m]);
          if(EX.calistenia[m]) allPool.push(...EX.calistenia[m]);
        }
      });

      if(!allPool.length){
        Object.keys(EX.musculacao).forEach(k => allPool.push(...EX.musculacao[k]));
      }

      const main = sample(allPool, Math.min(qtyMain, allPool.length));
      const sr = setsRepsByGoal(form.goal, levelUsed);
      const mainWith = main.map(ex => {
        const isCompound = ex.type === "compound";
        const sets = sr.sets + (isCompound && levelUsed==="avancado"?1:0);
        const reps = sr.reps + (form.goal==="resistencia"?6:0);
        return Object.assign({}, ex, { sets, reps });
      });

      const stretchQty = Math.floor(Math.random()*3)+2;
      const stretching = sample(EX.stretching, stretchQty);

      return {
        dayName: day.dayName,
        mobility,
        warmup,
        main: mainWith,
        stretching
      };
    });

    return { id: uid(), createdAt: new Date().toISOString(), form: Object.assign({}, form, { levelUsed }), program };
  }

  // ---------- persistence ----------
  function loadHistory(){ try{ const r = localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):[] }catch(e){return[]} }
  function saveHistory(h){ localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); }

  // ---------- DOM ----------
  const el = {
    name: $("#name"), age: $("#age"), weight: $("#weight"), time: $("#time"), sessions: $("#sessions"),
    goal: $("#goal"), type: $("#type"), level: $("#level"), limitations: $("#limitations"),
    generateBtn: $("#generateBtn"), resetBtn: $("#resetBtn"), printBtn: $("#printBtn"),
    workoutBox: $("#workoutBox"), historyList: $("#historyList"), clearHistoryBtn: $("#clearHistoryBtn"),
    exportAllBtn: $("#exportAllBtn"), toggleTheme: $("#toggleTheme"), trainProgress: $("#trainProgress"),
    trainProgressText: $("#trainProgressText"), downloadAllPdfBtn: $("#downloadAllPdfBtn")
  };

  function getFocusChecked(){ return $$('input[name="focus"]').filter(c=>c.checked).map(c=>c.value); }
  function formValues(){ return {
    name: el.name.value.trim(), age: el.age.value.trim(), weight: el.weight.value.trim(),
    time: el.time.value.trim(), sessions: el.sessions.value.trim(), goal: el.goal.value,
    type: el.type.value, level: el.level.value, limitations: el.limitations.value.trim(), focus: getFocusChecked()
  }; }

  // render program (tables)
  function renderProgram(rec){
    const prog = rec.program;
    let html = `<div style="margin-bottom:6px"><strong>${rec.form.name || "Usuário anônimo"}</strong> <div class="muted">${new Date(rec.createdAt).toLocaleString()} • ${rec.form.levelUsed} • ${rec.form.goal}</div></div>`;
    prog.forEach((day) => {
      html += `<div class="day-card"><h3>${day.dayName}</h3>`;

      // mobility (list)
      html += `<div><strong>Mobilidade</strong><ul>${day.mobility.map(m=>`<li>${m}</li>`).join("")}</ul></div>`;

      // warmup (list)
      html += `<div><strong>Aquecimento</strong><ul>${day.warmup.map(w=>`<li>${w}</li>`).join("")}</ul></div>`;

      // main (table)
      html += `<div style="margin-top:8px"><strong>Treino principal</strong><table class="table"><thead><tr><th>Exercício</th><th>Séries</th><th>Repetições / Observação</th><th>Observações</th></tr></thead><tbody>`;
      day.main.forEach(ex => {
        html += `<tr><td>${ex.name}</td><td>${ex.sets}</td><td>${ex.reps}</td><td>${ex.type === "compound" ? "Multiarticular" : "Isolamento"}</td></tr>`;
      });
      html += `</tbody></table></div>`;

      // stretching (list)
      html += `<div><strong>Alongamento</strong><ul>${day.stretching.map(s=>`<li>${s}</li>`).join("")}</ul></div>`;

      html += `</div>`; // day-card
    });

    html += `<div style="display:flex;gap:8px;margin-top:10px"><button id="exportProgramBtn" class="btn">Exportar (JSON)</button></div>`;
    el.workoutBox.innerHTML = html;

    $("#exportProgramBtn").addEventListener("click", ()=> {
      const blob = new Blob([JSON.stringify(rec,null,2)],{type:"application/json"});
      const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`programa_${rec.id}.json`; a.click(); URL.revokeObjectURL(url);
    });
  }

  // history
  let history = loadHistory();
  function renderHistory(){
    el.historyList.innerHTML = "";
    if(!history.length){ el.historyList.innerHTML = `<p class="muted">Sem histórico.</p>`; return; }
    history.forEach(rec=>{
      const item = document.createElement("div"); item.className="history-item";
      item.innerHTML = `<div><div style="font-weight:700">${rec.form.name||"Usuário anônimo"}</div><div class="meta muted">${new Date(rec.createdAt).toLocaleString()} • ${rec.form.levelUsed} • ${rec.form.goal}</div></div><div style="display:flex;gap:8px"><button class="btn small" data-id="${rec.id}" data-action="view">Ver</button><button class="btn small" data-id="${rec.id}" data-action="export">Exportar</button><button class="btn small" data-id="${rec.id}" data-action="delete">Apagar</button></div>`;
      el.historyList.appendChild(item);
    });
    $$('button[data-action]').forEach(b => {
      b.onclick = () => {
        const id = Number(b.getAttribute("data-id")); const act = b.getAttribute("data-action");
        const rec = history.find(h => h.id === id); if(!rec) return;
        if(act==="view") renderProgram(rec);
        if(act==="export"){ const blob=new Blob([JSON.stringify(rec,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`programa_${rec.id}.json`; a.click(); URL.revokeObjectURL(url); }
        if(act==="delete"){ if(!confirm("Apagar este registro?")) return; history = history.filter(h => h.id !== id); saveHistory(history); renderHistory(); el.workoutBox.innerHTML = `<p class="muted">Registro apagado.</p>`; }
      };
    });
  }

  // ---------- training UI flow ----------
  async function ensureModelTrained(){
    if(modelReady) return;
    el.trainProgress.style.display = "block";
    el.trainProgressText.textContent = "Treinando modelo local... aguarde alguns segundos.";
    await createAndTrainModel(({epoch, epochs, loss}) => {
      el.trainProgressText.textContent = `Treinando modelo local... (${epoch}/${epochs}) loss:${loss.toFixed(3)}`;
    });
    el.trainProgress.style.display = "none";
  }

  el.generateBtn.addEventListener("click", async () => {
    try{ await ensureModelTrained(); }catch(e){ console.warn(e); alert("Não foi possível treinar o modelo local. O gerador continuará sem IA."); }
    const form = formValues();
    let predictedIdx = null;
    if(form.level === "auto") {
      predictedIdx = modelReady ? predictLevel(form) : 1;
    } else {
      predictedIdx = form.level === "iniciante" ? 0 : form.level === "intermediario" ? 1 : 2;
    }
    const rec = generateProgram(form, predictedIdx);
    history.unshift(rec); history = history.slice(0,80); saveHistory(history);
    renderHistory(); renderProgram(rec);
    window.scrollTo({top:0,behavior:"smooth"});
  });

  el.resetBtn.addEventListener("click", ()=>{
    el.name.value=""; el.age.value=""; el.weight.value="";
    el.time.value=45; el.sessions.value=3; el.goal.value="hipertrofia";
    el.type.value="musculacao"; el.level.value="auto"; el.limitations.value="";
    $$('input[name="focus"]').forEach((c,i)=> c.checked = (i===0));
  });

  el.printBtn.addEventListener("click", ()=> window.print());
  el.downloadAllPdfBtn.addEventListener("click", ()=> window.print());

  el.clearHistoryBtn.addEventListener("click", ()=>{
    if(!confirm("Apagar todo o histórico?")) return;
    history = []; saveHistory(history); renderHistory(); el.workoutBox.innerHTML = `<p class="muted">Histórico limpo.</p>`;
  });

  el.exportAllBtn.addEventListener("click", ()=>{
    if(!history.length) return alert("Sem histórico para exportar.");
    const blob = new Blob([JSON.stringify(history,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`trainforge_history_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
  });

  el.toggleTheme.addEventListener("click", ()=>{
    document.documentElement.style.filter = document.documentElement.style.filter ? "" : "brightness(1.03) saturate(1.05)";
    alert("Tema alternado (simples).");
  });

  // initial render
  renderHistory();
  if(history.length) renderProgram(history[0]);

  // train model silently in background to speed first run
  (async ()=>{ try{ await createAndTrainModel(()=>{}); }catch(e){ console.warn("Modelo não treinado:", e); } })();

})();
