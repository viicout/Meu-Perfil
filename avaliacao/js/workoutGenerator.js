// workoutGenerator.js
// Lógica que monta o programa dividido por dias (usando dados do exerciseDB)

import { getExercises } from './exerciseDB.js';

function sample(arr, n=1){
  if(!arr || !arr.length) return [];
  const c = arr.slice();
  const out = [];
  for(let i=0;i<Math.min(n,c.length);i++){
    const idx = Math.floor(Math.random()*c.length);
    out.push(c.splice(idx,1)[0]);
  }
  return out;
}

function buildSplitPlan(sessions, focusList){
  const plan = [];
  const focus = (focusList && focusList.length)? focusList.slice() : ['full'];
  if(sessions <=1) plan.push({dayName:'Dia 1 — Full Body', muscles:['full']});
  else if(sessions===2){ plan.push({dayName:'Dia 1 — Upper', muscles:['peito','costas','ombro','braco']}); plan.push({dayName:'Dia 2 — Lower', muscles:['pernas']});}
  else if(sessions===3){
    plan.push({dayName:'Dia 1 — Push (Peito/Ombro/Tríceps)', muscles:['peito','ombro','braco']});
    plan.push({dayName:'Dia 2 — Pull (Costas/Bíceps)', muscles:['costas','braco']});
    plan.push({dayName:'Dia 3 — Legs (Pernas/Glúteo/Core)', muscles:['pernas','full']});
  } else if(sessions===4){
    plan.push({dayName:'Dia 1 — Peito/Tríceps', muscles:['peito','braco']});
    plan.push({dayName:'Dia 2 — Costas/Ombro', muscles:['costas','ombro']});
    plan.push({dayName:'Dia 3 — Pernas', muscles:['pernas']});
    plan.push({dayName:'Dia 4 — Full / Core', muscles:['full']});
  } else if(sessions===5){
    plan.push({dayName:'Dia 1 — Peito', muscles:['peito']});
    plan.push({dayName:'Dia 2 — Costas', muscles:['costas']});
    plan.push({dayName:'Dia 3 — Pernas', muscles:['pernas']});
    plan.push({dayName:'Dia 4 — Ombro', muscles:['ombro']});
    plan.push({dayName:'Dia 5 — Braços / Core', muscles:['braco','full']});
  } else {
    plan.push({dayName:'Dia 1 — Peito', muscles:['peito']});
    plan.push({dayName:'Dia 2 — Costas', muscles:['costas']});
    plan.push({dayName:'Dia 3 — Pernas', muscles:['pernas']});
    plan.push({dayName:'Dia 4 — Ombro', muscles:['ombro']});
    plan.push({dayName:'Dia 5 — Braços', muscles:['braco']});
    plan.push({dayName:'Dia 6 — Full / Mobilidade', muscles:['full']});
  }

  if(focus && focus.length && focus[0] !== 'full'){
    for(let i=0;i<Math.min(focus.length, plan.length); i++){
      if(!plan[i].muscles.includes(focus[i])) plan[i].muscles.unshift(focus[i]);
    }
  }
  return plan;
}

function setsRepsByGoal(goal, level){
  const base = {sets:3, reps:10};
  if(goal==='hipertrofia'){ base.sets = level==='iniciante'?3:4; base.reps=8;}
  else if(goal==='forca'){ base.sets=4; base.reps=3;}
  else if(goal==='resistencia'){ base.sets=3; base.reps=15;}
  else if(goal==='emagrecimento'){ base.sets=3; base.reps=12;}
  else if(goal==='mobilidade'){ base.sets=2; base.reps=10;}
  return base;
}

export function generateProgram(form, predictedIdx){
  const exercises = getExercises();
  const levelUsed = form.level && form.level!=='auto' ? form.level : (predictedIdx===0 ? 'iniciante' : predictedIdx===1 ? 'intermediario' : 'avancado');
  const sessions = Number(form.sessions) || 3;
  const focus = form.focus && form.focus.length ? form.focus : ['full'];
  const plan = buildSplitPlan(sessions, focus);

  const program = plan.map((day) => {
    const mobility = sample(exercises.mobility, 3);
    const warmup = sample(exercises.warmups, 2);

    const qtyMain = levelUsed==='iniciante'?6: levelUsed==='intermediario'?8:10;

    const pool = [];
    day.muscles.forEach(m => {
      if(m==='full'){
        ['peito','costas','pernas','ombro','braco'].forEach(k=>{
          if(form.type !== 'calistenia') pool.push(...(exercises.musculacao[k]||[]));
          if(form.type !== 'musculacao') pool.push(...(exercises.calistenia[k]||[]));
        });
      } else {
        if(form.type !== 'calistenia') pool.push(...(exercises.musculacao[m]||[]));
        if(form.type !== 'musculacao') pool.push(...(exercises.calistenia[m]||[]));
      }
    });

    if(!pool.length){
      Object.keys(exercises.musculacao).forEach(k => pool.push(...exercises.musculacao[k]));
    }

    const main = sample(pool, Math.min(qtyMain, pool.length));
    const sr = setsRepsByGoal(form.goal, levelUsed);
    const mainWith = main.map(ex => {
      const isCompound = ex.type==='compound';
      const sets = sr.sets + (isCompound && levelUsed==='avancado'?1:0);
      const reps = sr.reps + (form.goal==='resistencia'?6:0);
      // tweaks: for calisthenics, prefer higher reps for bodyweight strength/hypertrophy progressions
      let repsText = reps;
      if(form.type==='calistenia'){
        if(levelUsed==='iniciante') repsText = `${Math.max(6,reps)}–12`;
        else if(levelUsed==='intermediario') repsText = `${Math.max(8,reps)}–15`;
        else repsText = `${Math.max(6,reps)}–20`;
      }
      return Object.assign({}, ex, { sets, reps: repsText });
    });

    const stretchQty = Math.floor(Math.random()*3)+2;
    const stretching = sample(exercises.stretching, stretchQty);

    return { dayName: day.dayName, mobility, warmup, main: mainWith, stretching };
  });

  return { id: Date.now()+Math.floor(Math.random()*999), createdAt: new Date().toISOString(), form: Object.assign({}, form, { levelUsed }), program };
}
