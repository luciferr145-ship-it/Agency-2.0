import Lenis from 'lenis';

/* ============ Adaptive grid scale-up ============ */
function applyAdaptiveGrid(){
  const FONT_BASE = 16, baseWidth = 1920, coef = 0.6666;
  const w = window.innerWidth;
  const widthReduction = ((baseWidth - w) / baseWidth) * 100;
  const size = FONT_BASE - (FONT_BASE * (widthReduction * coef)) / 100;
  if (size > FONT_BASE) document.documentElement.style.fontSize = size + 'px';
  else document.documentElement.style.removeProperty('font-size');
}
applyAdaptiveGrid();
window.addEventListener('resize', applyAdaptiveGrid);

/* ============ Lenis ============ */
window.scrollTo(0, 0);
const lenis = new Lenis({ smoothWheel: true });
function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

/* ============ Scroll lock model ============ */
let scrollEnabled = true;
function stopScroll(){
  scrollEnabled = false;
  lenis.stop();
  document.documentElement.classList.add('no-scroll');
}
function startScroll(){
  scrollEnabled = true;
  lenis.start();
  document.documentElement.classList.remove('no-scroll');
}

function scrollToId(id){
  const el = document.getElementById(id);
  if (!el) return;
  const wasEnabled = scrollEnabled;
  scrollEnabled = false;
  setTimeout(()=>{
    const top = el.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 50);
  setTimeout(()=>{ scrollEnabled = wasEnabled; }, 100);
}
document.querySelectorAll('[data-scroll]').forEach(btn=>{
  btn.addEventListener('click', ()=> scrollToId(btn.getAttribute('data-scroll')));
});

/* ============ PageLoader (home only) ============ */
const loader = document.getElementById('loader');
let ready = false;

function easeInOutCubic(t){ return t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }

if (loader){
  const loaderFill = document.getElementById('loader-fill');
  const loaderCount = document.getElementById('loader-count');
  stopScroll();
  const FILL_MS = 1300;
  const loaderStart = performance.now();
  function loaderTick(now){
    const t = Math.min((now - loaderStart)/FILL_MS, 1);
    const progress = Math.round(easeInOutCubic(t)*100);
    loaderFill.style.width = progress + '%';
    loaderCount.textContent = String(progress).padStart(3,'0');
    if (t < 1){
      requestAnimationFrame(loaderTick);
    } else {
      finishLoader();
    }
  }
  requestAnimationFrame(loaderTick);

  function finishLoader(){
    loader.classList.add('exit');
    setTimeout(()=>{
      ready = true;
      startScroll();
      loader.remove();
      playReadyReveals();
    }, 720);
  }
} else {
  // subpages: simple fade-in, no counting loader
  ready = true;
  document.body.classList.add('subpage');
  requestAnimationFrame(()=> requestAnimationFrame(()=> document.body.classList.add('loaded')));
  window.addEventListener('DOMContentLoaded', playReadyReveals, { once:true });
  if (document.readyState !== 'loading') playReadyReveals();
}

function playReadyReveals(){
  const header = document.getElementById('site-header');
  if (header) setTimeout(()=> header.classList.add('in-view'), 150);
  document.querySelectorAll('[data-ready-delay]').forEach(el=>{
    const delay = parseInt(el.getAttribute('data-ready-delay'),10) || 0;
    setTimeout(()=> el.classList.add('in-view'), delay);
  });
  const heroH1 = document.getElementById('hero-h1');
  if (heroH1){
    setTimeout(()=>{
      heroH1.querySelectorAll('.line-wrap').forEach((l,i)=>{
        setTimeout(()=> l.classList.add('in-view'), i*120);
      });
    }, 250);
  }
}

/* ============ Scroll-triggered reveals ============ */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if (entry.isIntersecting){
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el=>{
  if (!el.hasAttribute('data-ready-delay')) io.observe(el);
});

function staggerList(selector, gap){
  document.querySelectorAll(selector).forEach((el,i)=>{
    el.style.transitionDelay = (i*gap) + 'ms';
  });
}
staggerList('#create li', 120);
staggerList('.works-grid > li', 90);
staggerList('.service-item', 80);
staggerList('.stats-grid > li', 90);
staggerList('.value-card', 100);
staggerList('.process-step', 100);
staggerList('.position-row', 70);
staggerList('.service-card', 90);

/* line reveal for standalone headings (skip the hero h1, handled above) */
const lineObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if (entry.isIntersecting){
      entry.target.classList.add('in-view');
      lineObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.line-wrap').forEach(l=>{
  if (l.closest('#hero-h1')) return;
  lineObserver.observe(l);
});

/* ============ Word reveal (About statements) ============ */
function buildWordReveal(container, text, extraClass){
  const words = text.split(' ').filter(Boolean);
  words.forEach((w)=>{
    const span = document.createElement('span');
    span.className = 'word';
    const inner = document.createElement('span');
    inner.className = 'word-inner' + (extraClass ? ' ' + extraClass : '');
    inner.textContent = w;
    inner.style.transitionDelay = (container.childElementCount * 35) + 'ms';
    span.appendChild(inner);
    container.appendChild(span);
    container.appendChild(document.createTextNode(' '));
  });
}
document.querySelectorAll('.word-reveal[data-text]').forEach(el=>{
  const text1 = el.getAttribute('data-text') || '';
  const text2 = el.getAttribute('data-text-muted') || '';
  buildWordReveal(el, text1, '');
  if (text2){
    const mutedSpan = document.createElement('span');
    mutedSpan.className = 'muted-words';
    el.appendChild(mutedSpan);
    buildWordReveal(mutedSpan, text2, 'muted');
  }
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting){
        el.classList.add('in-view');
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.2 });
  obs.observe(el);
});

/* ============ Live clock ============ */
function pad(n){ return String(n).padStart(2,'0'); }
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function updateClock(){
  const d = new Date();
  const h = d.getHours()%12 || 12;
  const m = pad(d.getMinutes());
  const meridiem = d.getHours() < 12 ? 'am' : 'pm';
  const timeStr = `${h}:${m}${meridiem}`;
  const dateStr = `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
  const timeEl = document.getElementById('clock-time');
  const dateEl = document.getElementById('clock-date');
  if (timeEl) timeEl.textContent = timeStr;
  if (dateEl) dateEl.textContent = dateStr;
  const menuTime = document.getElementById('menu-local-time');
  if (menuTime) menuTime.textContent = 'Local time — ' + timeStr;
}
updateClock();
setInterval(updateClock, 1000);

/* ============ Hero carousel (home only) ============ */
(function(){
  const card = document.getElementById('hero-carousel');
  if (!card) return;
  const items = [
    { caption:'Conversion design', title:'Crafted to convert.' },
    { caption:'Engineering', title:'Built to scale.' },
    { caption:'Brand systems', title:'Designed to last.' }
  ];
  const slot = document.getElementById('carousel-slot');
  const dots = card.querySelectorAll('.dots span');
  let idx = 0;
  function render(){
    const itemEls = slot.querySelectorAll('.item');
    itemEls.forEach((el,i)=>{
      if (i === idx){
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        el.querySelector('.caption').textContent = items[idx].caption;
        el.querySelector('.title').textContent = items[idx].title;
      } else {
        el.style.opacity = '0';
      }
    });
    dots.forEach((d,i)=> d.classList.toggle('active', i===idx));
  }
  function advance(step){
    idx = (idx + step + items.length) % items.length;
    render();
  }
  card.querySelector('.next').addEventListener('click', (e)=>{ e.stopPropagation(); advance(1); });
  card.querySelector('.prev').addEventListener('click', (e)=>{ e.stopPropagation(); advance(-1); });
  card.addEventListener('click', ()=> advance(1));
  render();
})();

/* ============ Nav Menu ============ */
const navMenu = document.getElementById('nav-menu');
if (navMenu){
  document.querySelectorAll('[data-menu="open"]').forEach(b=> b.addEventListener('click', openMenu));
  document.querySelectorAll('[data-menu="close"]').forEach(b=> b.addEventListener('click', closeMenu));
  navMenu.querySelectorAll('a, [data-scroll]').forEach(link=>{
    link.addEventListener('click', ()=>{ closeMenu(); });
  });
}
function openMenu(){
  navMenu.classList.add('open');
  navMenu.setAttribute('aria-hidden','false');
  stopScroll();
  document.addEventListener('keydown', onMenuKey);
}
function closeMenu(){
  navMenu.classList.remove('open');
  navMenu.setAttribute('aria-hidden','true');
  startScroll();
  document.removeEventListener('keydown', onMenuKey);
}
function onMenuKey(e){ if (e.key === 'Escape') closeMenu(); }

/* ============ Request Modal ============ */
const modal = document.getElementById('request-modal');
if (modal){
  const modalHead = document.getElementById('modal-head');
  const form = document.getElementById('request-form');
  const successBlock = document.getElementById('modal-success');
  document.querySelectorAll('[data-modal="open"]').forEach(b=> b.addEventListener('click', openModal));
  document.querySelectorAll('[data-modal="close"]').forEach(b=> b.addEventListener('click', closeModal));
  const successClose = document.getElementById('success-close');
  if (successClose) successClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if (e.target === modal) closeModal(); });

  function openModal(e){
    if (e) e.preventDefault();
    if (navMenu && navMenu.classList.contains('open')) closeMenu();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    stopScroll();
    document.addEventListener('keydown', onModalKey);
  }
  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    startScroll();
    document.removeEventListener('keydown', onModalKey);
    setTimeout(()=>{
      form.reset();
      form.classList.remove('hide');
      modalHead.classList.remove('hide');
      successBlock.classList.remove('show');
    }, 300);
  }
  function onModalKey(e){ if (e.key === 'Escape') closeModal(); }

  const submitLabel = document.getElementById('submit-label');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    submitLabel.childNodes[0].textContent = 'Sending…';
    setTimeout(()=>{
      form.classList.add('hide');
      modalHead.classList.add('hide');
      successBlock.classList.add('show');
      submitLabel.childNodes[0].textContent = 'Send request';
    }, 600);
  });
}

/* ============ Inline contact form (contact.html) ============ */
(function(){
  const form = document.getElementById('contact-page-form');
  if (!form) return;
  const successBlock = document.getElementById('contact-page-success');
  const btnLabel = document.getElementById('contact-submit-label');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    if (btnLabel) btnLabel.childNodes[0].textContent = 'Sending…';
    setTimeout(()=>{
      form.classList.add('hide');
      if (successBlock) successBlock.classList.add('show');
      if (btnLabel) btnLabel.childNodes[0].textContent = 'Send message';
    }, 600);
  });
})();

/* ============ Stats count-up ============ */
(function(){
  const counts = document.querySelectorAll('.stat-count');
  if (!counts.length) return;
  let ticking = false;
  function updateStats(){
    counts.forEach(el=>{
      const value = parseFloat(el.getAttribute('data-value'));
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      let progress;
      const start = vh;
      const end = vh/2;
      const elCenter = rect.top + rect.height/2;
      if (rect.top >= start) progress = 0;
      else if (elCenter <= end) progress = 1;
      else {
        progress = (start - rect.top) / (start - (end - rect.height/2));
        progress = Math.min(Math.max(progress,0),1);
      }
      el.textContent = Math.round(progress * value);
    });
  }
  window.addEventListener('scroll', ()=>{
    if (!ticking){
      ticking = true;
      setTimeout(()=>{ updateStats(); ticking = false; }, 30);
    }
  }, { passive:true });
  window.addEventListener('resize', updateStats);
  updateStats();
})();

/* ============ Liquid Reveal (home hero only) ============ */
class LiquidReveal {
  constructor(container){
    this.container = container;
    this.canvas = container.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.brushRadius = 143;
    this.decay = 0.016;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.points = [];
    this.last = null;
    this.idle = 0;
    this.rect = null;
    this.ready = false;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.cover = document.createElement('canvas');
    this.coverCtx = this.cover.getContext('2d');
    this.brush = document.createElement('canvas');
    this.brushCtx = this.brush.getContext('2d');

    this.afterImg = new Image();
    this.afterImg.crossOrigin = 'anonymous';
    this.afterImg.onload = ()=>{ this.ready = true; this.buildCover(); };
    this.afterImg.src = 'https://api.getlayers.ai/storage/v1/object/public/public/assets/lumora-e8b711fc68/hero/before.jpg';

    this.resize();
    this.ro = new ResizeObserver(()=> this.resize());
    this.ro.observe(this.container);

    if (!this.reduced){
      window.addEventListener('pointermove', this.onMove.bind(this));
      requestAnimationFrame(this.tick.bind(this));
    }
  }
  resize(){
    const rect = this.container.getBoundingClientRect();
    this.rect = rect;
    if (rect.width < 1 || rect.height < 1) return;
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.buildCover();
  }
  buildCover(){
    if (!this.ready || !this.rect || this.canvas.width < 1) return;
    const w = this.canvas.width, h = this.canvas.height;
    this.cover.width = w; this.cover.height = h;
    const iw = this.afterImg.naturalWidth, ih = this.afterImg.naturalHeight;
    if (!iw || !ih) return;
    const scale = Math.max(w/iw, h/ih);
    const sw = iw*scale, sh = ih*scale;
    const dx = (w-sw)/2, dy = (h-sh)/2;
    this.coverCtx.clearRect(0,0,w,h);
    this.coverCtx.drawImage(this.afterImg, dx, dy, sw, sh);
  }
  onMove(e){
    if (!this.rect) return;
    const x = (e.clientX - this.rect.left) * this.dpr;
    const y = (e.clientY - this.rect.top) * this.dpr;
    const radius = this.brushRadius * this.dpr;
    if (x < -radius || y < -radius || x > this.canvas.width + radius || y > this.canvas.height + radius){
      this.last = null;
      return;
    }
    if (this.last){
      const dx = x - this.last.x, dy = y - this.last.y;
      const dist = Math.hypot(dx,dy);
      const step = Math.max(radius*0.3, 1);
      const n = Math.min(Math.ceil(dist/step), 60);
      for (let i=1;i<=n;i++){
        this.points.push({ x: this.last.x + dx*(i/n), y: this.last.y + dy*(i/n) });
      }
    } else {
      this.points.push({ x, y });
    }
    this.last = { x, y };
  }
  stamp(x,y){
    const radius = this.brushRadius * this.dpr;
    const diam = Math.ceil(radius*2);
    if (this.brush.width !== diam){ this.brush.width = diam; this.brush.height = diam; }
    const bctx = this.brushCtx;
    bctx.clearRect(0,0,diam,diam);
    bctx.globalCompositeOperation = 'source-over';
    const grad = bctx.createRadialGradient(diam/2,diam/2,0,diam/2,diam/2,diam/2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.82)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    bctx.fillStyle = grad;
    bctx.fillRect(0,0,diam,diam);
    bctx.globalCompositeOperation = 'source-in';
    if (this.ready){
      bctx.drawImage(this.cover, x-diam/2, y-diam/2, diam, diam, 0, 0, diam, diam);
    }
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.drawImage(this.brush, x-diam/2, y-diam/2);
  }
  tick(){
    requestAnimationFrame(this.tick.bind(this));
    if (!this.canvas.width) return;
    const drawing = this.points.length > 0;
    if (drawing) this.idle = 0;
    else { this.idle++; if (this.idle > 120) return; }
    const fade = drawing ? this.decay : Math.min(this.decay + this.idle*0.004, 0.5);
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.fillStyle = `rgba(0,0,0,${fade})`;
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    if (drawing){
      const pts = this.points.slice();
      this.points.length = 0;
      pts.forEach(p => this.stamp(p.x, p.y));
    }
    if (this.idle === 120){
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }
  }
}
const liquidEl = document.getElementById('liquid-reveal');
if (liquidEl) new LiquidReveal(liquidEl);
