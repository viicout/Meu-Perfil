// aiModel.js
// Gerencia criação/treino/predição do modelo TF.js
// O TensorFlow é carregado dinamicamente para economizar banda no carregamento inicial.

let model = null;
let tf = null;
let modelReady = false;

export async function ensureModel(progressCb = null) {
  if (modelReady) return;
  // carrega TF.js ESM build
  if (!tf) {
    const mod = await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.8.0/dist/tf.esm.min.js');
    tf = mod;
  }

  // construir dataset sintético e treinar
  const objetivos = ["hipertrofia","forca","resistencia","emagrecimento","mobilidade","calistenia","condicionamento"];
  const samples = [];
  const labels = [];
  for (let i=0;i<1400;i++){
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
    if(objetivo === "mobilidade") score-=1;
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
  model.add(tf.layers.dense({units:32, activation:'relu', inputShape:[xs.shape[1]]}));
  model.add(tf.layers.dropout({rate:0.12}));
  model.add(tf.layers.dense({units:24, activation:'relu'}));
  model.add(tf.layers.dense({units:3, activation:'softmax'}));
  model.compile({loss:'categoricalCrossentropy', optimizer: tf.train.adam(0.01), metrics:['accuracy']});

  const BATCH = 64, EPOCHS = 14;
  await model.fit(xs, ys, {
    batchSize: BATCH, epochs: EPOCHS, shuffle:true,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (progressCb) progressCb({ epoch: epoch+1, epochs: EPOCHS, loss: logs.loss });
        await tf.nextFrame();
      }
    }
  });

  xs.dispose(); ys.dispose();
  modelReady = true;
}

export function predictLevel(form){
  if (!modelReady || !model) return null;
  const objetivos = ["hipertrofia","forca","resistencia","emagrecimento","mobilidade","calistenia","condicionamento"];
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
