export async function loadAllData(){
  const files = [
    'data/lifetable_US_2022.json',
    'data/hr_physical_activity.json',
    'data/hr_bmi.json',
    'data/hr_smoking.json',
    'data/hr_alcohol.json',
    'data/screening_crc.json',
    'data/screening_breast.json',
    'data/hale_weights.json'
  ];
  const out = {};
  await Promise.all(files.map(async f=>{
    try{
      const r = await fetch(f); if(!r.ok) throw new Error(f);
      out[fileKey(f)] = await r.json();
    }catch(e){
      console.warn('Missing or failed dataset', f, e);
    }
  }));
  return out;
}
function fileKey(path){ return path.replace('data/','').replace('.json',''); }

