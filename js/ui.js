// Generic UI niceties: show/hide yearsSinceQuit, focus management, etc.
import { setState, getState } from './state.js';

(function(){
  function positionTooltip(btn){
    const tip = btn.querySelector('.tooltip');
    if(!tip) return;
    const rect = tip.getBoundingClientRect();
    const vpCenter = window.innerWidth/2;
    const arrow = Math.max(8, Math.min(rect.width-8, vpCenter - rect.left));
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

    // tooltip toggling
    const icons = document.querySelectorAll('.icon-btn');
    icons.forEach(btn=>{
      const tip = btn.querySelector('.tooltip');
      if(!tip) return;
      let openT, closeT;
      const open = ()=>{
        clearTimeout(closeT);
        if(btn.hasAttribute('data-open')) return;
        openT = setTimeout(()=>{
          closeAll();
          btn.setAttribute('data-open','');
          positionTooltip(btn);
        }, 100);
      };
      const close = ()=>{
        clearTimeout(openT);
        closeT = setTimeout(()=>{
          btn.removeAttribute('data-open');
          tip.removeAttribute('style');
        }, 100);
      };
      btn.addEventListener('mouseenter', open);
      btn.addEventListener('focus', open);
      btn.addEventListener('mouseleave', close);
      btn.addEventListener('blur', close);
      btn.addEventListener('click', ev=>{
        ev.stopPropagation();
        if(btn.hasAttribute('data-open')) close(); else open();
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
