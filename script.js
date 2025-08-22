// Consolidated JavaScript for Actuarial Toolkit
// Data previously in separate JSON files
const datasets = {
  lifetable_US_2022:  { "F": { "qx": { "0": 0.00527, "1": 0.00040, "5": 0.00012, "10": 0.00008, "15": 0.00029, "20": 0.00052, "25": 0.00062, "30": 0.00074, "35": 0.00102, "40": 0.00142, "45": 0.00206, "50": 0.00305, "55": 0.00453, "60": 0.00677, "65": 0.01010, "70": 0.01547, "75": 0.02447, "80": 0.03967, "85": 0.06540, "90": 0.10800, "95": 0.17600, "100": 0.28000, "105": 0.45000, "110": 1.0 }}, "M": { "qx": { "0": 0.00559, "1": 0.00045, "5": 0.00013, "10": 0.00009, "15": 0.00037, "20": 0.00079, "25": 0.00096, "30": 0.00116, "35": 0.00157, "40": 0.00220, "45": 0.00317, "50": 0.00463, "55": 0.00693, "60": 0.01048, "65": 0.01580, "70": 0.02405, "75": 0.03733, "80": 0.05941, "85": 0.09502, "90": 0.15000, "95": 0.23000, "100": 0.35000, "105": 0.52000, "110": 1.0 }}, "source": "Arias E, Tejada-Vera B. United States Life Tables, 2022. National Vital Statistics Reports; vol 73 no 1. 2024" },
  hr_physical_activity:  { "bins_MET_h_week": [0, 7.5, 15, 22.5, 37.5, 60, 90], "HR": [1.00, 0.81, 0.69, 0.61, 0.55, 0.53, 0.53], "source": "Arem H et al. Leisure time physical activity and mortality. JAMA Intern Med 2015" },
  hr_bmi:  { "bins_BMI": [0, 18.5, 22.5, 25, 27.5, 30, 35, 40, 70], "HR": [1.22, 1.00, 1.00, 1.07, 1.20, 1.45, 1.94, 2.76], "source": "Global BMI Mortality Collaboration. Body-mass index and all-cause mortality. Lancet 2016" },
  hr_smoking:  { "current": 2.80, "former_decay": [ { "years": 0, "HR": 2.0 }, { "years": 5, "HR": 1.5 }, { "years": 10, "HR": 1.2 }, { "years": 15, "HR": 1.05 }, { "years": 20, "HR": 1.00 } ], "never": 1.00, "source": "Jha P et al. 21st-Century hazards of smoking and benefits of cessation in the United States. N Engl J Med 2013" },
  hr_alcohol:  { "gramsPerDrink": 14, "dose_HR": [ { "drinksPerDay": 0, "HR": 1.00 }, { "drinksPerDay": 1, "HR": 1.03 }, { "drinksPerDay": 2, "HR": 1.06 }, { "drinksPerDay": 3, "HR": 1.12 }, { "drinksPerDay": 4, "HR": 1.20 }, { "drinksPerDay": 6, "HR": 1.40 } ], "source": "Wood AM et al. Risk thresholds for alcohol consumption. Lancet 2018" },
  screening_crc:  { "default_schedule": { "startAge": 45, "stopAge": 75, "modality": "mixed" }, "LYG_per_1000": 260, "QALY_per_1000": 210, "source": "Knudsen AB et al. Colorectal cancer screening: updated modeling study for the USPSTF. JAMA 2021" },
  screening_breast:  { "default_schedule": { "startAge": 40, "stopAge": 74, "intervalYears": 2 }, "LYG_per_1000": 60, "QALY_per_1000": 45, "source": "U.S. Preventive Services Task Force. Screening for Breast Cancer: Recommendation Statement. Ann Intern Med. 2016" },
  hale_weights:  { "F": { "0": 0.98, "10": 0.97, "20": 0.96, "30": 0.95, "40": 0.93, "50": 0.90, "60": 0.85, "70": 0.78, "80": 0.68, "90": 0.50, "100": 0.30 }, "M": { "0": 0.98, "10": 0.97, "20": 0.96, "30": 0.95, "40": 0.92, "50": 0.88, "60": 0.82, "70": 0.74, "80": 0.63, "90": 0.45, "100": 0.28 }, "source": "IHME. Global Burden of Disease Study 2019 (HALE)" }
};

async function loadAllData(){ return datasets; }

const state = {
  age: 35, sex: 'F',
  smoking: 'never', yearsSinceQuit: 0,
  metHours: null,
  weight: 160,
  heightFt: 5,
  heightIn: 9,
  alcoholDrinks: 0,
  crc: false,
  breast: false,
  quality: false
};
const listeners = [];

function getState(){ return state; }
function setState(patch){ Object.assign(state, patch); listeners.forEach(fn=>fn(state)); }
function onStateChange(fn){ listeners.push(fn); }

function initStateFromURL(){
  const sParam = new URLSearchParams(location.search).get('s');
  let loaded = false;
  if (sParam){
    try{ Object.assign(state, JSON.parse(decodeURIComponent(atob(sParam)))); loaded=true; }catch{}
  }
  if (!loaded){
    try{
      const saved = JSON.parse(localStorage.getItem('longevity_state')||'{}');
      Object.assign(state, saved);
    }catch{}
  }
}

function saveToLocal(){
  localStorage.setItem('longevity_state', JSON.stringify(state));
}
// Map inputs -> hazard ratios. Keep simple binning + linear interpolation. Labels for UI contrib output.
const hrLabels = {
  smoking:'Smoking', activity:'Physical activity', bmi:'BMI', alcohol:'Alcohol'
};

function hrSmoking(smoking){ // {status, yearsSinceQuit}
  // Defaults if dataset missing:
  const currentHR = 2.8;
  const decay = [ // years:HR
    {years:0,HR:2.0},{years:5,HR:1.5},{years:10,HR:1.2},{years:15,HR:1.05},{years:20,HR:1.0}
  ];
  if (smoking.status==='never') return 1.0;
  if (smoking.status==='current') return currentHR;
  const t = Math.max(0, smoking.yearsSinceQuit||0);
  // piecewise linear interpolate decay
  let prev=decay[0]; for(let i=1;i<decay.length;i++){
    const cur=decay[i]; if(t<=cur.years){
      const w=(t-prev.years)/(cur.years-prev.years);
      return prev.HR + w*(cur.HR-prev.HR);
    } prev=cur;
  }
  return decay[decay.length-1].HR;
}

function hrActivity(met, table){
  // bins and HRs from dataset or fallback conservative curve
  const bins = table?.bins_MET_h_week || [0,7.5,15,22.5,37.5,60,90];
  const HRs  = table?.HR || [1.00,0.81,0.69,0.61,0.55,0.53,0.53];
  return interpolateBins(met, bins, HRs);
}

function hrBmiFn(bmi, table){
  const bins = table?.bins_BMI || [0,18.5,22.5,25,27.5,30,35,40,70];
  const HRs  = table?.HR || [1.22,1.00,1.00,1.07,1.20,1.45,1.94,2.76];
  return interpolateBins(bmi, bins, HRs);
}

function hrAlcohol(drinks, table){
  const pts = table?.dose_HR || [
    {drinksPerDay:0,HR:1.00},{drinksPerDay:1,HR:1.03},{drinksPerDay:2,HR:1.06},{drinksPerDay:3,HR:1.12},{drinksPerDay:4,HR:1.20},{drinksPerDay:6,HR:1.40}
  ];
  if (drinks<=pts[0].drinksPerDay) return pts[0].HR;
  for (let i=1;i<pts.length;i++){
    const a=pts[i-1], b=pts[i];
    if (drinks<=b.drinksPerDay){
      const w=(drinks-a.drinksPerDay)/(b.drinksPerDay-a.drinksPerDay);
      return a.HR + w*(b.HR-a.HR);
    }
  }
  // extrapolate last slope
  const a=pts[pts.length-2], b=pts[pts.length-1];
  const slope=(b.HR-a.HR)/(b.drinksPerDay-a.drinksPerDay);
  return b.HR + slope*(drinks-b.drinksPerDay);
}

function interpolateBins(x, bins, vals){
  if (x<=bins[0]) return vals[0];
  for (let i=1;i<bins.length;i++){
    if (x<=bins[i]){
      const w=(x-bins[i-1])/(bins[i]-bins[i-1]);
      const a=vals[i-1], b=vals[i];
      return a + w*(b-a);
    }
  }
  return vals[vals.length-1];
}
// Lightweight SVG line charts (no external lib). Two series max expected, but supports many.
function drawLines(containerId, series, opts={}){
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  const W = el.clientWidth || 640;
  const H = opts.height || 280;
  const m = {t:30,r:20,b:60,l:50};

  if (opts.title){
    const t = document.createElement('div');
    t.className = 'chart-title';
    t.textContent = opts.title;
    el.appendChild(t);
  }

  const svg = h('svg',{viewBox:`0 0 ${W} ${H}`,width:'100%',height:H,role:'img'});
  el.appendChild(svg);

  // Flatten domains
  const xs = series.flatMap(s=>s.x);
  const ys = series.flatMap(s=>s.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(0, ...ys);
  const yMax = opts.yPercent ? 1 : Math.max(1, ...ys);

  const sx = v => m.l + (v-xMin)/(xMax-xMin) * (W-m.l-m.r);
  const sy = v => H - m.b - (v-yMin)/(yMax-yMin) * (H-m.t-m.b);

  // axes
  line(m.l,H-m.b,W-m.r,H-m.b, '#aaa'); // x
  line(m.l,m.t,m.l,H-m.b, '#aaa');     // y
  text(W-m.r, H-m.b+40, opts.xLabel||'', 'end');

  // ticks (simple)
  for (let a = Math.ceil(xMin/10)*10; a<=xMax; a+=10){
    const x=sx(a); line(x,H-m.b,x,H-m.b+6,'#aaa'); text(x,H-m.b+24,''+a,'middle');
  }
  const yStep = opts.yPercent ? 0.25 : 0.25;
  for (let p=0; p<=1.0001; p+=yStep){
    const y=sy(p);
    const label = opts.yPercent ? `${Math.round(p*100)}%` : ''+p;
    line(m.l,y,m.l-6,y,'#aaa');
    text(m.l-12,y,label,'end','middle');
  }

  // lines
  series.forEach((s,i)=>{
    const d = s.x.map((x,j)=>`${j?'L':'M'} ${sx(x)} ${sy(s.y[j])}`).join(' ');
    const path = h('path',{d,fill:'none',stroke: i? 'currentColor' : '#888', 'stroke-width':2});
    svg.appendChild(path);
    // legend
    const ly = m.t + 16*i;
    const sw = h('rect',{x:W-m.r-100,y:ly-8,width:24,height:3,fill:i?'currentColor':'#888'}); svg.appendChild(sw);
    text(W-m.r-70, ly, s.name||`Series ${i+1}`,'start','middle');
  });

  if (opts.disclaimer){
    const note = document.createElement('div');
    note.className = 'chart-note';
    note.textContent = 'Population-level; period table; associations; see Assumptions.';
    el.appendChild(note);
  }

  function h(tag,attrs){ const e=document.createElementNS('http://www.w3.org/2000/svg',tag); for(const k in attrs) e.setAttribute(k,attrs[k]); return e; }
  function line(x1,y1,x2,y2,stroke){ const l=h('line',{x1,y1,x2,y2,stroke}); svg.appendChild(l); }
  function text(x,y,str,anchor='start',baseline='hanging',size='0.8em'){ const t=h('text',{x,y,'text-anchor':anchor,'dominant-baseline':baseline,'font-size':size,fill:'#444'}); t.textContent=str; svg.appendChild(t); }
}
// Convert per-1000 LYG/QALY to per-person delta; gate by age windows; include an effectiveness factor.
function screeningYearsGain(age, sex, flags, data){
  let le=0, qaly=0;
  const eff = 0.8; // conservative real-world adherence/effectiveness
  if (flags?.crc && age>=45 && age<=75 && data?.screening_crc){
    le  += (data.screening_crc.LYG_per_1000||260)/1000 * eff;
    qaly+= (data.screening_crc.QALY_per_1000||210)/1000 * eff;
  }
  if (flags?.breast && sex==='F' && age>=40 && age<=74 && data?.screening_breast){
    le  += (data.screening_breast.LYG_per_1000||60)/1000 * eff;
    qaly+= (data.screening_breast.QALY_per_1000||45)/1000 * eff;
  }
  return {le, qaly};
}
// Methodology descriptions for various variables

const methodologyInfo = {
  smoking: `
    <h3>Smoking</h3>
    <p><strong>Source:</strong> Jha et al., 2013</p>
    <p><strong>Implementation:</strong> js/hrModels.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Current smokers have about 2.8× the mortality of never smokers; quitting for ∼20 years returns risk to baseline.</p>
    <p><strong>Mitigation:</strong> Quit smoking and avoid secondhand exposure.</p>
    <p><strong>Population:</strong> About 9.9% of U.S. adults smoke (CDC).</p>
  `,
  physical_activity: `
    <h3>Physical Activity</h3>
    <p><strong>Source:</strong> Arem et al., 2015</p>
    <p><strong>Implementation:</strong> js/hrModels.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> ≥60 MET‑h/week corresponds to HR≈0.53 (47% lower mortality) versus inactivity.</p>
    <p><strong>Mitigation:</strong> Engage in regular moderate or vigorous exercise.</p>
    <p><strong>Population:</strong> Only 24.2% meet both aerobic and strength guidelines (CDC).</p>
  `,
  bmi: `
    <h3>BMI</h3>
    <p><strong>Source:</strong> Global BMI Mortality Collaboration, 2016</p>
    <p><strong>Implementation:</strong> js/hrModels.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> BMI 35–39.9 carries HR≈1.94; BMI≥40 reaches HR≈2.76; underweight HR≈1.22 vs BMI 22.5–&lt;25.</p>
    <p><strong>Mitigation:</strong> Maintain a healthy weight through balanced diet and activity.</p>
    <p><strong>Population:</strong> About 40.3% of adults have obesity (CDC).</p>
  `,
  alcohol: `
    <h3>Alcohol</h3>
    <p><strong>Source:</strong> Wood et al., 2018</p>
    <p><strong>Implementation:</strong> js/hrModels.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Mortality risk rises to HR≈1.40 at six drinks/day; no protective effect assumed.</p>
    <p><strong>Mitigation:</strong> Limit intake or abstain.</p>
    <p><strong>Population:</strong> About 25.1% report at least one heavy drinking day in the past year (CDC).</p>
  `,
  diet: `
    <h3>Diet</h3>
    <p><strong>Source:</strong> Not yet modeled.</p>
    <p><strong>Implementation:</strong> pending</p>
    <p><strong>Hazard-Ratio Effect:</strong> Diet quality influences cardiovascular and overall mortality.</p>
    <p><strong>Mitigation:</strong> Emphasize fruits, vegetables, whole grains, and minimal processed foods.</p>
    <p><strong>Population:</strong> Only about 10% meet fruit and vegetable recommendations.</p>
  `,
  blood_pressure_cholesterol: `
    <h3>Blood Pressure / Cholesterol</h3>
    <p><strong>Source:</strong> Not yet modeled.</p>
    <p><strong>Implementation:</strong> pending</p>
    <p><strong>Hazard-Ratio Effect:</strong> Hypertension and high LDL elevate cardiovascular mortality.</p>
    <p><strong>Mitigation:</strong> Control levels with medication and lifestyle.</p>
    <p><strong>Population:</strong> Nearly half of U.S. adults have hypertension.</p>
  `,
  diabetes: `
    <h3>Diabetes</h3>
    <p><strong>Source:</strong> Not yet modeled.</p>
    <p><strong>Implementation:</strong> pending</p>
    <p><strong>Hazard-Ratio Effect:</strong> Diabetes roughly doubles mortality risk.</p>
    <p><strong>Mitigation:</strong> Maintain glycemic control via diet, exercise, and medication.</p>
    <p><strong>Population:</strong> About 11% of U.S. adults have diabetes.</p>
  `,
  sleep: `
    <h3>Sleep</h3>
    <p><strong>Source:</strong> Not yet modeled.</p>
    <p><strong>Implementation:</strong> pending</p>
    <p><strong>Hazard-Ratio Effect:</strong> Very short or long sleep durations are linked to higher mortality.</p>
    <p><strong>Mitigation:</strong> Aim for 7–9 hours of quality sleep nightly.</p>
    <p><strong>Population:</strong> About 35% of adults sleep less than 7 hours.</p>
  `,
  socioeconomic_status: `
    <h3>Socioeconomic Status</h3>
    <p><strong>Source:</strong> Not yet modeled.</p>
    <p><strong>Implementation:</strong> pending</p>
    <p><strong>Hazard-Ratio Effect:</strong> Lower SES is associated with higher mortality risk.</p>
    <p><strong>Mitigation:</strong> Social support and policy interventions may reduce risk.</p>
    <p><strong>Population:</strong> Roughly 11% of Americans live in poverty.</p>
  `,
  colorectal_screening: `
    <h3>Colorectal Screening</h3>
    <p><strong>Source:</strong> Knudsen et al., 2021</p>
    <p><strong>Implementation:</strong> js/screening.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Modeled as life-years gained from screening participation.</p>
    <p><strong>Mitigation:</strong> Follow USPSTF screening guidelines.</p>
  `,
  breast_screening: `
    <h3>Breast Screening</h3>
    <p><strong>Source:</strong> USPSTF, 2016</p>
    <p><strong>Implementation:</strong> js/screening.js</p>
    <p><strong>Hazard-Ratio Effect:</strong> Modeled as life-years gained from routine mammography.</p>
    <p><strong>Mitigation:</strong> Participate in recommended screening intervals.</p>
    <p><strong>Population:</strong> 69.1% of women ≥40 had a mammogram within 2 years (CDC).</p>
  `
};

function loadMethodology() {
  const select = document.getElementById('methodology-select');
  const content = document.getElementById('methodology-content');
  if (!select || !content) return;
  select.addEventListener('change', (e) => {
    const key = e.target.value;
    content.innerHTML = methodologyInfo[key] || '';
  });
}

// Generic UI niceties: show/hide yearsSinceQuit, focus management, etc.

(function(){
  function closeTips(){
    document.querySelectorAll('.info-btn[data-open]').forEach(btn => btn.removeAttribute('data-open'));
  }

  document.addEventListener('change', e=>{
    if (e.target?.id==='smoking'){
      document.getElementById('ysq-wrap').hidden = (e.target.value!=='former');
    }
  });

  // initialize visibility on load based on saved state
  window.addEventListener('DOMContentLoaded', ()=>{
    const s = getState();
    document.getElementById('ysq-wrap').hidden = (s.smoking!=='former');

    // fun facts
    const facts = [
      'Regular exercise can add years to your life expectancy.',
      'Smoking can cut life expectancy by up to a decade.',
      'Healthy diets are linked to longer lifespans.'
    ];
    const ff = document.getElementById('fun-fact');
    const shuffle = document.getElementById('shuffle-fact');
    if (ff && facts.length) {
      let idx = Math.floor(Math.random() * facts.length);
      ff.textContent = facts[idx];
      if (shuffle) {
        shuffle.addEventListener('click', () => {
          idx = (idx + 1) % facts.length;
          ff.textContent = facts[idx];
        });
      }
    } else if (ff) {
      ff.textContent = 'No facts yet.';
      if (shuffle) shuffle.disabled = true;
    }

    // simple tool picker tabs
    const buttons = document.querySelectorAll('[data-tool]');
    if (buttons.length) {
      const show = val => {
        document.querySelectorAll('section.tool').forEach(sec => sec.hidden = true);
        const el = document.getElementById(val);
        if (el) el.hidden = false;
        buttons.forEach(btn => {
          const active = btn.getAttribute('data-tool') === val;
          btn.classList.toggle('bg-slate-900', active);
          btn.classList.toggle('text-white', active);
          btn.classList.toggle('bg-white', !active);
          btn.classList.toggle('hover:bg-slate-50', !active);
        });
      };
      buttons.forEach(btn => btn.addEventListener('click', () => show(btn.getAttribute('data-tool'))));
      show(buttons[0].getAttribute('data-tool'));
    }

    // info tooltip toggling
    const infos = document.querySelectorAll('.info-btn');
    infos.forEach(btn => {
      const tip = btn.querySelector('.info-tip');
      if(!tip) return;
      btn.addEventListener('click', ev => {
        ev.stopPropagation();
        const isOpen = btn.hasAttribute('data-open');
        closeTips();
        if(!isOpen){
          const rect = btn.getBoundingClientRect();
          const center = window.innerWidth / 2;
          tip.classList.toggle('right', rect.left < center);
          tip.classList.toggle('left', rect.left >= center);
          btn.setAttribute('data-open','');
        }
      });
    });

    document.addEventListener('click', closeTips);
    document.addEventListener('keydown', e => { if(e.key==='Escape') closeTips(); });
    window.addEventListener('resize', closeTips);

    // collapsible disclaimers and notes
    document.querySelectorAll('[data-toggle]').forEach(btn=>{
      const target = document.getElementById(btn.getAttribute('data-toggle'));
      if(!target) return;
      btn.addEventListener('click', ()=>{
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        target.hidden = expanded;
      });
    });
  });
})();
const workerSrc = `
// Heavy math: life table transform, proportional hazards, Sullivan HALE, attribution.
// DISCLAIMER: This model uses period life tables and literature HRs; it is simplified and does not capture interactions.
// Not medical advice. Results are sensitive to assumptions.

// importScripts; // no-op hint for bundlers (kept for bundlers, safe if undefined)

let life, hrAct, hrBmi, hrSmoke, hrAlc, haleWeights, screening_crc, screening_breast;
const ctx = typeof self !== 'undefined' ? self : globalThis;

ctx.onmessage = (e)=>{
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
    ctx.postMessage({ready:true});
    return;
  }
  if (cmd==='run'){
    ctx.postMessage(runModel(payload));
  }
};

function runModel(st){
  const ages = range(0,111);
  // Life table qx for sex; fall back to synthetic Gompertz if missing.
  const qxRaw = life?.[st.sex]?.qx || syntheticQx(st.sex);
  const qx = fillQxGaps(qxRaw);
  const muBase = ages.map(a => -Math.log(1 - qx[a]));
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
function fillQxGaps(qx){
  const out = {};
  let last = qx[0] ?? 0;
  for(let a=0;a<=110;a++){
    if(qx[a]!=null) last = qx[a];
    out[a] = last;
  }
  return out;
}

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

`;
// Bootstrap, state wiring, worker orchestration, charts, CSV/share, disclaimers.

let worker;
let currentAge = 0;

async function init() {
  const data = await loadAllData();
  // Create worker and pass datasets
  worker = new Worker(URL.createObjectURL(new Blob([workerSrc], {type:'application/javascript'})));
  worker.onmessage = onWorkerMessage;
  worker.postMessage({ cmd:'init', payload: data });

  initStateFromURL();
  wireUI();
  loadMethodology();
  run(); // initial run
}
document.addEventListener('DOMContentLoaded', init);

function wireUI() {
  const s = getState();

  // Inputs
  bindNumber('age', v => update({ age: clamp(+v,20,100) }));
  bindSelect('sex', v => update({ sex: v }));
  bindSelect('smoking', v => {
    document.getElementById('ysq-wrap').hidden = (v !== 'former');
    update({ smoking: v });
  });
  bindNumber('yearsSinceQuit', v => update({ yearsSinceQuit: Math.max(0, +v||0) }));

  const activityMap = { none:0, light:5, moderate:10, high:20 };
  const actEl = document.getElementById('activityLevel');
  const met = s.metHours ?? 10;
  actEl.value = met>=20 ? 'high' : met>=10 ? 'moderate' : met>=5 ? 'light' : 'none';
  actEl.addEventListener('change', ev => update({ metHours: activityMap[ev.target.value] }));

  bindNumber('weight', v => update({ weight: Math.max(50, +v||50) }), 'weight');
  bindNumber('heightFeet', v => update({ heightFt: Math.max(3, +v||3) }), 'heightFt');
  bindNumber('heightInches', v => update({ heightIn: Math.max(0, Math.min(11, +v||0)) }), 'heightIn');
  bindSelect('alcohol', v => update({ alcoholDrinks: Math.max(0, +v||0) }), 'alcoholDrinks');

  const crcEl = document.getElementById('crc_screen');
  crcEl.value = s.crc ? 'yes' : 'no';
  crcEl.addEventListener('change', e => update({ crc: e.target.value === 'yes' }));
  const breastEl = document.getElementById('breast_screen');
  breastEl.value = s.breast ? 'yes' : 'no';
  breastEl.addEventListener('change', e => update({ breast: e.target.value === 'yes' }));
  document.getElementById('qualityToggle').addEventListener('change', e => update({ quality: e.target.checked }));
  document.getElementById('runBtn').addEventListener('click', run);

  // Modal
  const dlg = document.getElementById('assumptionsModal');
  document.getElementById('assumptionsBtn').addEventListener('click', ()=> dlg.showModal());
  document.getElementById('closeAssumptions').addEventListener('click', ()=> dlg.close());

  // Export
  document.getElementById('downloadCsv').addEventListener('click', downloadCsv);

  // react to state changes
  onStateChange(() => {
    saveToLocal();
    updateScreeningVisibility();
    // optional auto-run on blur; explicit button kept for mobile
  });

  updateScreeningVisibility();

  // Helpers to bind inputs
  function bindNumber(id, fn, key=id){ const e=document.getElementById(id); e.value = s[key] ?? e.value; e.addEventListener('change', ev=>fn(ev.target.value)); }
  function bindSelect(id, fn, key=id){ const e=document.getElementById(id); e.value = s[key] ?? e.value; e.addEventListener('change', ev=>fn(ev.target.value)); }
  function update(p){ setState(p); }
  function clamp(x,a,b){ return Math.min(b,Math.max(a,x)); }

  function updateScreeningVisibility(){
    const { age, sex } = getState();
    const crcWrap = document.getElementById('crc_wrap');
    const breastWrap = document.getElementById('breast_wrap');
    const fs = document.getElementById('screening_fs');
    const showCRC = age>=45 && age<=75;
    const showBreast = sex==='F' && age>=40 && age<=74;
    crcWrap.hidden = !showCRC;
    breastWrap.hidden = !showBreast;
    if(!showCRC && getState().crc){ crcEl.value='no'; setState({crc:false}); }
    if(!showBreast && getState().breast){ breastEl.value='no'; setState({breast:false}); }
    fs.hidden = !showCRC && !showBreast;
  }
}

function run() {
  const st = getStateForWorker();
  currentAge = +st.age;
  worker.postMessage({ cmd:'run', payload: st });
}

function onWorkerMessage(e) {
  const msg = e.data;
  if (msg.ready) return;
  // update summary numbers
  q('#le_baseline').textContent = fix2(currentAge + msg.le_baseline);
  q('#le_adjusted').textContent = fix2(currentAge + msg.le_adj);
  q('#le_delta').textContent    = addSign(fix2(msg.le_delta));

  if (msg.hale_baseline != null) {
    q('#hale_baseline').textContent = fix2(currentAge + msg.hale_baseline);
    q('#hale_adjusted').textContent = fix2(currentAge + msg.hale_adj);
    q('#hale_delta').textContent    = addSign(fix2(msg.hale_delta));
    document.getElementById('hale-row').hidden = false;
  } else {
    document.getElementById('hale-row').hidden = true;
  }

  // contribution chips
  const c = document.getElementById('contrib'); c.innerHTML = '';
  (msg.contrib||[]).forEach(it=>{
    const span = document.createElement('span');
    span.className='chip';
    span.textContent = `${it.label}: ${addSign(fix2(it.deltaYears))}y`;
    c.appendChild(span);
  });

  // charts (conditional on current age)
  const idx = msg.survival.age.findIndex(a => a >= currentAge);
  const ages = msg.survival.age.slice(idx);
  const baseCond = msg.survival.S_base.slice(idx).map(v => v / msg.survival.S_base[idx]);
  const adjCond  = msg.survival.S_adj.slice(idx).map(v => v / msg.survival.S_adj[idx]);

  drawLines('survivalChart', [
    { name:'Baseline', x: ages, y: baseCond },
    { name:'Adjusted', x: ages, y: adjCond }
  ], { title:'Survival', xLabel:'Age', yPercent:true, disclaimer:true });

  const oneMinusS  = baseCond.map(v=>1-v);
  const oneMinusSa = adjCond.map(v=>1-v);
  drawLines('cdfChart', [
    { name:'Baseline', x: ages, y: oneMinusS },
    { name:'Adjusted', x: ages, y: oneMinusSa }
  ], { title:'Cumulative probability of death', xLabel:'Age', yPercent:true, disclaimer:true });
}

function getStateForWorker(){
  const s = getState();
  const hInches = (+s.heightFt||0)*12 + (+s.heightIn||0);
  const bmi = hInches>0 ? 703*(+s.weight||0)/(hInches*hInches) : 27.5;
  return {
    sex: s.sex,
    age: +s.age || 35,
    smoking: { status: s.smoking, yearsSinceQuit: s.yearsSinceQuit||0 },
    metHours: (s.metHours ?? 10),
    bmi: bmi,
    alcoholDrinks: +s.alcoholDrinks || 0,
    screening: { crc: !!s.crc, breast: !!s.breast },
    quality: !!s.quality
  };
}

function downloadCsv(){
  const s = getState();
  // We ask worker to recompute to get fresh arrays; but we already have them in last message.
  // For simplicity, reuse last plotted data by reading DOM dataset if you store it; here we re-run.
  worker.onmessage = (e)=>{
    if (e.data.ready) return;
    const m = e.data;
    const header = [
      'DISCLAIMER: Population-level, period life table, proportional hazards; not medical advice.',
      'See site UI for full “Assumptions & Data Sources.”',
      `Inputs: sex=${s.sex}, age=${s.age}, weight=${s.weight}lbs, height=${s.heightFt}ft${s.heightIn}in (BMI=${fix2(calcBMI(s))}), smoke=${s.smoking}${s.smoking==='former'?`(${s.yearsSinceQuit}y)`:''}, MET=${s.metHours ?? 10}, alcohol=${s.alcoholDrinks}, CRC=${!!s.crc}, Breast=${!!s.breast}, Quality=${!!s.quality}`,
      `LE baseline=${fix2(m.le_baseline)}; LE adjusted=${fix2(m.le_adj)}; Δ=${addSign(fix2(m.le_delta))}`,
      (m.hale_baseline!=null?`HALE baseline=${fix2(m.hale_baseline)}; HALE adjusted=${fix2(m.hale_adj)}; Δ=${addSign(fix2(m.hale_delta))}`:''),
      'age,S_baseline,S_adjusted'
    ].filter(Boolean).join('\n');
    const rows = m.survival.age.map((a,i)=>`${a},${m.survival.S_base[i]},${m.survival.S_adj[i]}`).join('\n');
    const blob = new Blob([header+'\n'+rows], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='longevity_lab.csv'; a.click();
    URL.revokeObjectURL(url);
    // restore handler
    worker.onmessage = onWorkerMessage;
  };
  run();
}

function q(sel){ return document.querySelector(sel); }
function fix2(x){ return Number(x).toFixed(2); }
function addSign(x){ return (x>=0?'+':'')+x; }
function calcBMI(s){ const h=(+s.heightFt||0)*12+(+s.heightIn||0); return h>0 ? 703*(+s.weight||0)/(h*h) : 0; }
