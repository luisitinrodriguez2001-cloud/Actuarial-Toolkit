// Generic UI niceties: show/hide yearsSinceQuit, focus management, etc.
import { setState, getState } from './state.js';

(function(){
  function positionTooltip(btn){
    const tip = btn.querySelector('.tooltip');
    if(!tip) return;
    const rect = btn.getBoundingClientRect();
    tip.style.position = 'fixed';
    tip.style.top = `${rect.bottom + 6}px`;
    tip.style.left = `${rect.left + rect.width/2}px`;
    const tRect = tip.getBoundingClientRect();
    const vpCenter = window.innerWidth/2;
    const arrow = Math.max(8, Math.min(tRect.width-8, vpCenter - tRect.left));
    tip.style.setProperty('--arrow-left', `${arrow}px`);
  }

  function closeAll(){
    document.querySelectorAll('.icon-btn[data-open]').forEach(btn=>{
      btn.removeAttribute('data-open');
      const tip = btn.querySelector('.tooltip');
      if(tip) tip.removeAttribute('style');
    });
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
      'Honey never spoils.',
      'A group of flamingos is called a flamboyance.',
      'Bananas are berries, but strawberries are not.'
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

    // tooltip toggling
    const icons = document.querySelectorAll('.icon-btn');
    icons.forEach(btn=>{
      const tip = btn.querySelector('.tooltip');
      if(!tip) return;
      btn.addEventListener('click', ev=>{
        ev.stopPropagation();
        const open = btn.hasAttribute('data-open');
        closeAll();
        if(!open){
          btn.setAttribute('data-open','');
          positionTooltip(btn);
        }
      });
    });

    document.addEventListener('click', closeAll);
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeAll(); });

    const reposition = ()=>{
      const open = document.querySelector('.icon-btn[data-open]');
      if(open) positionTooltip(open);
    };
    window.addEventListener('scroll', reposition, { passive:true });
    window.addEventListener('resize', reposition);

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
