// Convert per-1000 LYG/QALY to per-person delta; gate by age windows; include an effectiveness factor.
export function screeningYearsGain(age, sex, flags, data){
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

