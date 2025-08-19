// Lightweight SVG line charts (no external lib). Two series max expected, but supports many.
export function drawLines(containerId, series, opts={}){
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  const W = el.clientWidth || 640;
  const H = opts.height || 280;
  const m = {t:30,r:20,b:60,l:50};

  if (opts.title){
    const t = document.createElement('div');
    t.className = 'chart-title';
    t.textContent = opts.title;
    el.appendChild(t);
  }

  const svg = h('svg',{viewBox:`0 0 ${W} ${H}`,width:'100%',height:H,role:'img'});
  el.appendChild(svg);

  // Flatten domains
  const xs = series.flatMap(s=>s.x);
  const ys = series.flatMap(s=>s.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(0, ...ys);
  const yMax = opts.yPercent ? 1 : Math.max(1, ...ys);

  const sx = v => m.l + (v-xMin)/(xMax-xMin) * (W-m.l-m.r);
  const sy = v => H - m.b - (v-yMin)/(yMax-yMin) * (H-m.t-m.b);

  // axes
  line(m.l,H-m.b,W-m.r,H-m.b, '#aaa'); // x
  line(m.l,m.t,m.l,H-m.b, '#aaa');     // y
  text(W-m.r, H-m.b+30, opts.xLabel||'', 'end');

  // ticks (simple)
  for (let a = Math.ceil(xMin/10)*10; a<=xMax; a+=10){
    const x=sx(a); line(x,H-m.b,x,H-m.b+6,'#aaa'); text(x,H-m.b+24,''+a,'middle');
  }
  const yStep = opts.yPercent ? 0.25 : 0.25;
  for (let p=0; p<=1.0001; p+=yStep){
    const y=sy(p);
    const label = opts.yPercent ? `${Math.round(p*100)}%` : ''+p;
    line(m.l,y,m.l-6,y,'#aaa');
    text(m.l-12,y,label,'end','middle');
  }

  // lines
  series.forEach((s,i)=>{
    const d = s.x.map((x,j)=>`${j?'L':'M'} ${sx(x)} ${sy(s.y[j])}`).join(' ');
    const path = h('path',{d,fill:'none',stroke: i? 'currentColor' : '#888', 'stroke-width':2});
    svg.appendChild(path);
    // legend
    const ly = m.t + 16*i;
    const sw = h('rect',{x:W-m.r-100,y:ly-8,width:24,height:3,fill:i?'currentColor':'#888'}); svg.appendChild(sw);
    text(W-m.r-70, ly, s.name||`Series ${i+1}`,'start','middle');
  });

  if (opts.disclaimer){
    const note = document.createElement('div');
    note.className = 'chart-note';
    note.textContent = 'Population-level; period table; associations; see Assumptions.';
    el.appendChild(note);
  }

  function h(tag,attrs){ const e=document.createElementNS('http://www.w3.org/2000/svg',tag); for(const k in attrs) e.setAttribute(k,attrs[k]); return e; }
  function line(x1,y1,x2,y2,stroke){ const l=h('line',{x1,y1,x2,y2,stroke}); svg.appendChild(l); }
  function text(x,y,str,anchor='start',baseline='hanging',size='0.8em'){ const t=h('text',{x,y,'text-anchor':anchor,'dominant-baseline':baseline,'font-size':size,fill:'#444'}); t.textContent=str; svg.appendChild(t); }
}
