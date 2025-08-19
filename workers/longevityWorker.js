// Heavy math: life table transform, proportional hazards, Sullivan HALE, attribution.
// DISCLAIMER: This model uses period life tables and literature HRs; it is simplified and does not capture interactions.
// Not medical advice. Results are sensitive to assumptions.

importScripts; // no-op hint for bundlers

let life, hrAct, hrBmi, hrSmoke, hrAlc, haleWeights, screening_crc, screening_breast;

self.onmessage = (e)=>{
  const {cmd, payload} = e.data;
  if (cmd==='init'){
    // Datasets are passed in as blobs from dataLoader
    const d = payload||{};
    life = d['lifetable_US_2022'] || {};
    hrAct= d['hr_physical_activity'] || null;
    hrBmi= d['hr_bmi'] || null;
    hrSmoke=d['hr_smoking'] || null;
    hrAlc= d['hr_alcohol'] || null;
    haleWeights = d['hale_weights'] || null;
    screening_crc = d['screening_crc'] || null;
    screening_breast = d['screening_breast'] || null;
    self.postMessage({ready:true});
    return;
  }
  if (cmd==='run'){
    self.postMessage(runModel(payload));
  }
};

function runModel(st){
  const ages = range(0,111);
  // Life table qx for sex; fall back to synthetic Gompertz if missing.
  const qx = life?.[st.sex]?.qx || syntheticQx(st.sex);
  const muBase = ages.map(a => -Math.log(1 - (qx[a] ?? qx[110])));
  // HRs (age-invariant scalars in this MVP)
  const HR = hrSmoking(st.smoking) * hrActivity(st.metHours, hrAct) * hrBmiFn(st.bmi, hrBmi) * hrAlcohol(st.alcoholDrinks, hrAlc);

  const qxAdj = muBase.map(m => 1 - Math.exp(-(m*HR)));
  const base = lifeTableFromQx(qx);
  const adj  = lifeTableFromQx(indexify(qxAdj));

  let le_delta = +(adj.e[st.age]-base.e[st.age]).toFixed(2);

  // HALE via Sullivan (if weights present)
  let hale_base=null, hale_adj=null, hale_delta=null;
  if (haleWeights?.[st.sex]){
    const Hb = haleFromLife(base, haleWeights[st.sex]);
    const Ha = haleFromLife(adj,  haleWeights[st.sex]);
    hale_base = +Hb[st.age].toFixed(2);
    hale_adj  = +Ha[st.age].toFixed(2);
    hale_delta= +(hale_adj - hale_base).toFixed(2);
  }

  // Screening additive deltas
  const scr = screeningYearsGain(st.age, st.sex, st.screening);
  const le_adj_final   = +(adj.e[st.age] + scr.le).toFixed(2);
  const le_delta_final = +(le_delta + scr.le).toFixed(2);
  const hale_adj_final = (hale_adj!=null && scr.qaly!=null) ? +(hale_adj + scr.qaly).toFixed(2) : hale_adj;
  const hale_delta_fin = (hale_delta!=null && scr.qaly!=null) ? +(hale_delta + scr.qaly).toFixed(2) : hale_delta;

  return {
    le_baseline: +base.e[st.age].toFixed(2),
    le_adj: le_adj_final, le_delta: le_delta_final,
    hale_baseline: hale_base, hale_adj: hale_adj_final, hale_delta: hale_delta_fin,
    survival: { age: ages, S_base: base.S, S_adj: adj.S },
    contrib: contributionBreakdown(st, muBase, qx, base)
  };
}

// --- HR helpers (duplicate of hrModels, kept local to worker) ---
function hrSmoking(sm){ // sm = {status, yearsSinceQuit}
  if (sm.status==='never') return 1.0;
  if (sm.status==='current') return (hrSmoke?.current||2.8);
  const decay = hrSmoke?.former_decay || [{years:0,HR:2.0},{years:5,HR:1.5},{years:10,HR:1.2},{years:15,HR:1.05},{years:20,HR:1.0}];
  const t = Math.max(0, sm.yearsSinceQuit||0);
  let prev=decay[0]; for(let i=1;i<decay.length;i++){
    const cur=decay[i]; if(t<=cur.years){
      const w=(t-prev.years)/(cur.years-prev.years);
      return prev.HR + w*(cur.HR-prev.HR);
    } prev=cur;
  }
  return decay[decay.length-1].HR;
}
function hrActivity(met, table){
  const bins = table?.bins_MET_h_week || [0,7.5,15,22.5,37.5,60,90];
  const HRs  = table?.HR || [1.00,0.81,0.69,0.61,0.55,0.53,0.53];
  return interpBins(met,bins,HRs);
}
function hrBmiFn(bmi, table){
  const bins = table?.bins_BMI || [0,18.5,22.5,25,27.5,30,35,40,70];
  const HRs  = table?.HR || [1.22,1.00,1.00,1.07,1.20,1.45,1.94,2.76];
  return interpBins(bmi,bins,HRs);
}
function hrAlcohol(drinks, table){
  const pts = table?.dose_HR || [{drinksPerDay:0,HR:1.00},{drinksPerDay:1,HR:1.03},{drinksPerDay:2,HR:1.06},{drinksPerDay:3,HR:1.12},{drinksPerDay:4,HR:1.20},{drinksPerDay:6,HR:1.40}];
  if (drinks<=pts[0].drinksPerDay) return pts[0].HR;
  for (let i=1;i<pts.length;i++){
    const a=pts[i-1], b=pts[i];
    if (drinks<=b.drinksPerDay){
      const w=(drinks-a.drinksPerDay)/(b.drinksPerDay-a.drinksPerDay);
      return a.HR + w*(b.HR-a.HR);
    }
  }
  const a=pts[pts.length-2], b=pts[pts.length-1];
  const slope=(b.HR-a.HR)/(b.drinksPerDay-a.drinksPerDay);
  return b.HR + slope*(drinks-b.drinksPerDay);
}
function interpBins(x,bins,vals){
  if (x<=bins[0]) return vals[0];
  for (let i=1;i<bins.length;i++){
    if (x<=bins[i]){
      const w=(x-bins[i-1])/(bins[i]-bins[i-1]);
      return vals[i-1] + w*(vals[i]-vals[i-1]);
    }
  }
  return vals[vals.length-1];
}

// --- Screening additive deltas (simple, per-person) ---
function screeningYearsGain(age, sex, flags){
  const eff=0.8;
  let le=0, qaly=0;
  if (flags?.crc && age>=45 && age<=75 && screening_crc){
    le  += (screening_crc.LYG_per_1000||260)/1000 * eff;
    qaly+= (screening_crc.QALY_per_1000||210)/1000 * eff;
  }
  if (flags?.breast && sex==='F' && age>=40 && age<=74 && screening_breast){
    le  += (screening_breast.LYG_per_1000||60)/1000 * eff;
    qaly+= (screening_breast.QALY_per_1000||45)/1000 * eff;
  }
  return {le,qaly};
}

// --- Life table math ---
function lifeTableFromQx(qx){
  const ages = Object.keys(qx).map(k=>+k).sort((a,b)=>a-b);
  const maxA = ages[ages.length-1];
  const l = new Array(maxA+1); const L = new Array(maxA+1); const T = new Array(maxA+1); const e = new Array(maxA+1); const S = new Array(maxA+1);
  let l0=100000; l[0]=l0;
  for(let a=0;a<maxA;a++){
    const qa = qx[a] ?? qx[maxA];
    l[a+1] = l[a]*(1-qa);
    L[a]   = (l[a]+l[a+1])/2;
  }
  L[maxA] = l[maxA]; // last age interval
  T[maxA] = L[maxA];
  for(let a=maxA-1;a>=0;a--) T[a] = L[a] + T[a+1];
  for(let a=0;a<=maxA;a++){ e[a] = T[a]/l[a]; S[a] = l[a]/l0; }
  return { l,L,T,e,S };
}

function haleFromLife(life, weights){ // weights[age] in [0,1]
  const maxA = life.L.length-1;
  const Lh = new Array(maxA+1);
  for(let a=0;a<=maxA;a++){
    const w = weights[a] ?? weights[maxA] ?? 0.7;
    Lh[a] = life.L[a]*w;
  }
  const Th = new Array(maxA+1); Th[maxA]=Lh[maxA];
  for(let a=maxA-1;a>=0;a--) Th[a]=Lh[a]+Th[a+1];
  const Eh = new Array(maxA+1);
  for(let a=0;a<=maxA;a++) Eh[a]=Th[a]/life.l[a];
  return Eh;
}

function syntheticQx(sex){
  // Gompertz-Makeham-ish fallback to avoid hard failure if dataset missing. Tuned to resemble US 2022.
  const qx={};
  for(let a=0;a<=110;a++){
    const makeham = 0.0005;
    const b = 0.085 + (sex==='M'?0.005:0);
    const c = 0.00002;
    const mu = makeham + c*Math.exp(b*Math.max(0,a-30));
    qx[a] = 1 - Math.exp(-mu);
  }
  qx[110]=1.0;
  return qx;
}

function range(a,b){ return Array.from({length:b-a},(_,i)=>a+i); }
function indexify(arr){ const out={}; for (let i=0;i<arr.length;i++) out[i]=arr[i]; return out; }
function clamp(x,a,b){ return Math.min(b,Math.max(a,x)); }

// Attribution: simple “turn one factor on” deltas vs baseline. Order-dependent; explanatory only.
function contributionBreakdown(st, muBase, qx, base){
  const parts = [];
  const factors = [
    {key:'smoking',  label:'Smoking',  HR: hrSmoking(st.smoking)},
    {key:'activity', label:'Physical activity', HR: hrActivity(st.metHours, hrAct)},
    {key:'bmi',      label:'BMI', HR: hrBmiFn(st.bmi, hrBmi)},
    {key:'alcohol',  label:'Alcohol', HR: hrAlcohol(st.alcoholDrinks, hrAlc)}
  ];
  for (const f of factors){
    const qxOne = muBase.map(m => 1 - Math.exp(-(m*f.HR)));
    const lt = lifeTableFromQx(indexify(qxOne));
    parts.push({label:f.label, deltaYears: +(lt.e[st.age]-base.e[st.age]).toFixed(2)});
  }
  return parts;
}
