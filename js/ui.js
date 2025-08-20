// Generic UI niceties: show/hide yearsSinceQuit, focus management, etc.
import { setState, getState } from './state.js';

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
