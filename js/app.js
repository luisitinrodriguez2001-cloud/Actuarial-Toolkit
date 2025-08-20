// Bootstrap, state wiring, worker orchestration, charts, CSV/share, disclaimers.
import { loadAllData } from './dataLoader.js';
import { getState, setState, onStateChange, initStateFromURL, saveToLocal } from './state.js';
import { hrLabels } from './hrModels.js';
import { drawLines } from './charts.js';
import './ui.js'; // sets up UI listeners and exposes helpers

let worker;
let datasets;
let currentAge = 0;

async function init() {
  datasets = await loadAllData();
  // Create worker and pass datasets
  worker = new Worker('./workers/longevityWorker.js', { type:'module' });
  worker.onmessage = onWorkerMessage;
  worker.postMessage({ cmd:'init', payload: datasets });

  initStateFromURL();
  wireUI();
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

  // charts
  drawLines('survivalChart', [
    { name:'Baseline', x: msg.survival.age, y: msg.survival.S_base },
    { name:'Adjusted', x: msg.survival.age, y: msg.survival.S_adj }
  ], { title:'Survival', xLabel:'Age', yPercent:true, disclaimer:true });

  const oneMinusS = msg.survival.S_base.map((v,i)=>1-v);
  const oneMinusSa= msg.survival.S_adj.map((v,i)=>1-v);
  drawLines('cdfChart', [
    { name:'Baseline', x: msg.survival.age, y: oneMinusS },
    { name:'Adjusted', x: msg.survival.age, y: oneMinusSa }
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
