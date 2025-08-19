const state = {
  age: 35, sex: 'F',
  smoking: 'never', yearsSinceQuit: 0,
  metHours: 10,
  weight: 160,
  heightFt: 5,
  heightIn: 9,
  alcoholDrinks: 0,
  crc: false,
  breast: false,
  quality: false
};
const listeners = [];

export function getState(){ return state; }
export function setState(patch){ Object.assign(state, patch); listeners.forEach(fn=>fn(state)); }
export function onStateChange(fn){ listeners.push(fn); }

export function initStateFromURL(){
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

export function saveToLocal(){
  localStorage.setItem('longevity_state', JSON.stringify(state));
}
