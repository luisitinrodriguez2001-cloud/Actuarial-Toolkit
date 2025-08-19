// Generic UI niceties: show/hide yearsSinceQuit, focus management, etc.
import { setState, getState } from './state.js';

(function(){
  document.addEventListener('change', e=>{
    if (e.target?.id==='smoking'){
      document.getElementById('ysq-wrap').hidden = (e.target.value!=='former');
    }
  });

  // initialize visibility on load based on saved state
  window.addEventListener('DOMContentLoaded', ()=>{
    const s = getState();
    document.getElementById('ysq-wrap').hidden = (s.smoking!=='former');
  });
})();
