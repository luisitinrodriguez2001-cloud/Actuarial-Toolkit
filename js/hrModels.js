// Map inputs -> hazard ratios. Keep simple binning + linear interpolation. Labels for UI contrib output.
export const hrLabels = {
  smoking:'Smoking', activity:'Physical activity', bmi:'BMI', alcohol:'Alcohol'
};

export function hrSmoking(smoking){ // {status, yearsSinceQuit}
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

export function hrActivity(met, table){
  // bins and HRs from dataset or fallback conservative curve
  const bins = table?.bins_MET_h_week || [0,7.5,15,22.5,37.5,60,90];
  const HRs  = table?.HR || [1.00,0.81,0.69,0.61,0.55,0.53,0.53];
  return interpolateBins(met, bins, HRs);
}

export function hrBmiFn(bmi, table){
  const bins = table?.bins_BMI || [0,18.5,22.5,25,27.5,30,35,40,70];
  const HRs  = table?.HR || [1.22,1.00,1.00,1.07,1.20,1.45,1.94,2.76];
  return interpolateBins(bmi, bins, HRs);
}

export function hrAlcohol(drinks, table){
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
