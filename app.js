// ===== Utilities =====
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
const fmt = (t)=>{ const m=String(Math.floor(t/60)).padStart(2,'0'); const s=String(Math.floor(t%60)).padStart(2,'0'); return `${m}:${s}` };

// ===== Elements =====
const timeEl = $('#time');
const barFill = $('#bar-fill');
const btnStart = $('#btn-start');
const btnReset = $('#btn-reset');
const btnSkip = $('#btn-skip');
const panel = $('#panel');
const btnSettings = $('#btn-settings');
const btnClose = $('#btn-close');

// Modes
const btnPomodoro = $('#btn-mode-pomodoro');
const btnShort = $('#btn-mode-short');
const btnLong = $('#btn-mode-long');

// Settings inputs
const inPomo = $('#in-duration-pomo');
const inShort = $('#in-duration-short');
const inLong = $('#in-duration-long');
const inFont = $('#in-font');
const inUpload = $('#in-upload');
const presetWrap = $('#preset-wrap');
const btnRestore = $('#btn-restore');

// ===== Defaults =====
const PRESETS = [
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1920&auto=format&fit=crop', // mountains
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop', // ocean
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1920&auto=format&fit=crop', // city night
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop', // canyon
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1920&auto=format&fit=crop'  // forest mist (baru, beda dari yang ganda)
];

const defaults = {
  mode: 'pomodoro',
  durations: { pomodoro: 25, short: 5, long: 15 },
  font: "'Inter', sans-serif",
  background: { type: 'preset', value: PRESETS[0] }
};

// ===== State =====
let state = JSON.parse(localStorage.getItem('pd.state')||'null') || defaults;
let running = false;
let remaining = state.durations[state.mode]*60;

// ===== Render helpers =====
function applyBackground(){ document.body.style.backgroundImage = `url(${state.background?.value})`; }
function applyFont(){ document.body.style.fontFamily = state.font; }
function save(){ localStorage.setItem('pd.state', JSON.stringify(state)); }

function updateUI(){
  timeEl.textContent = fmt(remaining);
  const total = state.durations[state.mode]*60; const progress = Math.max(0, Math.min(1, 1 - remaining/total));
  barFill.style.width = `${progress*100}%`;
  [btnPomodoro,btnShort,btnLong].forEach(b=>b.classList.remove('active'));
  ({pomodoro:btnPomodoro, short:btnShort, long:btnLong})[state.mode].classList.add('active');
  inPomo.value = state.durations.pomodoro; inShort.value = state.durations.short; inLong.value = state.durations.long; inFont.value = state.font;
}

// ===== Timer (requestAnimationFrame) =====
let raf, endAtMs;
function startTimer(){
  if (running) return; running = true; endAtMs = performance.now() + remaining*1000; btnStart.textContent='Pause'; tick();
}
function pauseTimer(){
  if (!running) return; running=false; cancelAnimationFrame(raf); remaining = Math.max(0, (endAtMs - performance.now())/1000); btnStart.textContent='Start'; updateUI();
}
function resetTimer(){ running=false; cancelAnimationFrame(raf); remaining = state.durations[state.mode]*60; btnStart.textContent='Start'; updateUI(); }
function skipTimer(){ running=false; cancelAnimationFrame(raf); remaining = 0; updateUI(); }

function tick(now=performance.now()){
  if (!running) return; remaining = Math.max(0, (endAtMs - now)/1000); updateUI();
  if (remaining<=0){ running=false; btnStart.textContent='Start'; return; }
  raf = requestAnimationFrame(tick);
}

// ===== Event bindings =====
btnStart.addEventListener('click', ()=> running ? pauseTimer() : startTimer());
btnReset.addEventListener('click', resetTimer);
btnSkip .addEventListener('click', skipTimer);

btnPomodoro.addEventListener('click', ()=>{ state.mode='pomodoro'; resetTimer(); save(); });
btnShort   .addEventListener('click', ()=>{ state.mode='short';    resetTimer(); save(); });
btnLong    .addEventListener('click', ()=>{ state.mode='long';     resetTimer(); save(); });

btnSettings.addEventListener('click', ()=> panel.classList.add('open'));
btnClose   .addEventListener('click', ()=> panel.classList.remove('open'));

;[inPomo,inShort,inLong].forEach((input)=>{
  input.addEventListener('input', ()=>{
    state.durations.pomodoro = clamp(parseInt(inPomo.value||'0'),1,180);
    state.durations.short    = clamp(parseInt(inShort.value||'0'),1,60);
    state.durations.long     = clamp(parseInt(inLong.value||'0'),1,60);
    remaining = state.durations[state.mode]*60; save(); updateUI();
  });
});

inFont.addEventListener('change', ()=>{ state.font = inFont.value; applyFont(); save(); });

presetWrap.querySelectorAll('.preset').forEach(img=>{
  img.addEventListener('click', ()=>{ state.background = {type:'preset', value: img.src}; applyBackground(); save(); });
});

inUpload.addEventListener('change', (e)=>{
  const file = e.target.files?.[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{ state.background = {type:'upload', value: reader.result}; applyBackground(); save(); };
  reader.readAsDataURL(file);
});

btnRestore.addEventListener('click', ()=>{ state.background = { type:'preset', value: PRESETS[0] }; applyBackground(); save(); });

// Shortcuts
window.addEventListener('keydown', (e)=>{
  if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
  if (e.code==='Space'){ e.preventDefault(); running ? pauseTimer() : startTimer(); }
  if (e.key.toLowerCase()==='r'){ e.preventDefault(); resetTimer(); }
  if (e.key.toLowerCase()==='s'){ e.preventDefault(); skipTimer(); }
});

// ===== First paint =====
applyFont(); if (!state.background?.value){ state.background = { type:'preset', value: PRESETS[0] }; }
applyBackground(); updateUI(); btnStart.textContent = running? 'Pause' : 'Start';
```
