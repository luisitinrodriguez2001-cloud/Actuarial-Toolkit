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

    // fun facts ribbon
    const facts = [
      'Honey never spoils.',
      'A group of flamingos is called a flamboyance.',
      'Bananas are berries, but strawberries are not.'
    ];
    const ff = document.getElementById('fun-fact');
    if (ff) {
      ff.textContent = facts[Math.floor(Math.random()*facts.length)];
    }

    // simple tool picker
    const picker = document.getElementById('toolSelect');
    if (picker) {
      const show = val=>{
        document.querySelectorAll('section.tool').forEach(sec=>sec.hidden=true);
        const el = document.getElementById(val);
        if (el) el.hidden=false;
      };
      picker.addEventListener('change', e=> show(e.target.value));
      show(picker.value);
    }
  });
})();
