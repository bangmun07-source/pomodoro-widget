// ---------- Helpers ----------
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const ls = {
  get: (k, d) => { try{ const v = localStorage.getItem(k); return v? JSON.parse(v): d }catch{ return d }},
  set: (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)) }catch{} }
};
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
const fmt = (t)=>{ const m=String(Math.floor(t/60)).padStart(2,'0'); const s=String(Math.floor(t%60)).padStart(2,'0'); return `${m}:${s}` };

// ---------- Elements ----------
const timeEl = $('#time');
const barFill = $('#bar-fill');
const btnStart = $('#btn-start');
const btnReset = $('#btn-reset');
const btnSkip = $('#btn-skip');

const panel = $('#panel');
const btnSettings = $('#btn-settings');
const btnClose = $('#btn-close');

const btnPomodoro = $('#btn-mode-pomodoro');
const btnShort = $('#btn-mode-short');
const btnLong = $('#btn-mode-long');
const modeButtons = [btnPomodoro, btnShort, btnLong];

const inPomo = $('#in-duration-pomo');
const inShort = $('#in-duration-short');
const inLong = $('#in-duration-long');
const inAutoBreaks = $('#in-autostart-breaks');
const inAutoFocus = $('#in-autostart-focus');
const inTick = $('#in-sound-tick');
const inChime = $('#in-sound-chime');
const inFont = $('#in-font');
const inUpload = $('#in-upload');
const presetWrap = $('#preset-wrap');
const btnRestore = $('#btn-restore');

// ---------- Defaults ----------
const PRESETS = [
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1920&auto=format&fit=crop', // mountains
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop', // ocean
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1920&auto=format&fit=crop', // city night
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop'  // canyon
];

const defaults = {
  mode: 'pomodoro',
  durations: { pomodoro: 25, short: 5, long: 15 },
  auto: { breaks: false, focus: false },
  sounds: { tick: true, chime: true },
  font: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  background: { type: 'preset', value: PRESETS[0] }
};

// ---------- State ----------
let state = ls.get('pd.state.v2', defaults);
let running = ls.get('pd.running', false);
let remaining = ls.get('pd.remaining', state.durations[state.mode]*60);

// ---------- Audio ----------
let ctx;
const ensureAudio = () => ctx ||= new (window.AudioContext||window.webkitAudioContext)();
const playTick = () => {
  if (!state.sounds.tick || !running) return;
  const ac = ensureAudio(); const o = ac.createOscillator(); const g = ac.createGain();
  o.type='square'; o.frequency.value=1000; g.gain.value=0.02; o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime+0.02);
};
const playChime = () => {
  if (!state.sounds.chime) return;
  const ac = ensureAudio(); const o = ac.createOscillator(); const g = ac.createGain();
  o.type='sine';
  o.frequency.setValueAtTime(660, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(440, ac.currentTime+0.4);
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.06, ac.currentTime+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime+0.6);
  o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime+0.65);
};

// ---------- Render ----------
function applyBackground() {
  const url = state.background?.value;
  document.body.style.backgroundImage = url ? `url(${url})` : 'none';
}
function applyFont(){ document.body.style.fontFamily = state.font; }
function updateUI(){
  timeEl.textContent = fmt(remaining);
  const total = state.durations[state.mode]*60; 
  const progress = Math.max(0, Math.min(1, 1 - remaining/total));
  barFill.style.width = `${progress*100}%`;
  modeButtons.forEach(b=>b.classList.remove('active'));
  ({pomodoro:btnPomodoro, short:btnShort, long:btnLong})[state.mode].classList.add('active');
  inPomo.value = state.durations.pomodoro; 
  inShort.value = state.durations.short; 
  inLong.value = state.durations.long;
  inAutoBreaks.checked = state.auto.breaks; 
  inAutoFocus.checked = state.auto.focus;
  inTick.checked = state.sounds.tick; 
  inChime.checked = state.sounds.chime;
  inFont.value = state.font;
  btnStart.textContent = running? 'Pause' : 'Start';
}
function save(){ 
  ls.set('pd.state.v2', state); 
  ls.set('pd.running', running); 
  ls.set('pd.remaining', remaining); 
}

// ---------- Timer loop ----------
let lastSecond = Math.floor(remaining);
setInterval(()=>{
  if (!running) return;
  remaining = Math.max(0, remaining - 1);
  const thisSecond = Math.floor(remaining);
  if (thisSecond !== lastSecond) playTick();
  lastSecond = thisSecond;
  if (remaining<=0){
    running=false; playChime();
    // auto-next
    if (state.mode==='pomodoro'){
      state.mode='short'; 
      remaining = state.durations.short*60;
      if (state.auto.breaks) running = true;
    } else {
      state.mode='pomodoro';
      remaining = state.durations.pomodoro*60;
      if (state.auto.focus) running = true;
    }
  }
  updateUI(); save();
}, 1000);

// ---------- Events ----------
btnStart.addEventListener('click', ()=>{ running=!running; if (running) ensureAudio(); updateUI(); save(); });
btnReset.addEventListener('click', ()=>{ remaining = state.durations[state.mode]*60; running=false; updateUI(); save(); });
btnSkip.addEventListener('click', ()=>{ remaining = 0; });

[btnPomodoro, btnShort, btnLong].forEach((btn)=>{
  btn.addEventListener('click', ()=>{
    state.mode = btn===btnPomodoro? 'pomodoro' : btn===btnShort? 'short' : 'long';
    running = false; remaining = state.durations[state.mode]*60; updateUI(); save();
  });
});

btnSettings.addEventListener('click', ()=> panel.classList.add('open'));
btnClose.addEventListener('click', ()=> panel.classList.remove('open'));

;[inPomo,inShort,inLong].forEach((input)=>{
  input.addEventListener('input', ()=>{
    state.durations.pomodoro = clamp(parseInt(inPomo.value||'0'),1,180);
    state.durations.short = clamp(parseInt(inShort.value||'0'),1,60);
    state.durations.long = clamp(parseInt(inLong.value||'0'),1,60);
    remaining = state.durations[state.mode]*60; updateUI(); save();
  });
});

inAutoBreaks.addEventListener('change', ()=>{ state.auto.breaks = inAutoBreaks.checked; save(); });
inAutoFocus.addEventListener('change', ()=>{ state.auto.focus = inAutoFocus.checked; save(); });
inTick.addEventListener('change', ()=>{ state.sounds.tick = inTick.checked; save(); });
inChime.addEventListener('change', ()=>{ state.sounds.chime = inChime.checked; save(); });

inFont.addEventListener('change', ()=>{ state.font = inFont.value; applyFont(); save(); });

$$('.preset', presetWrap).forEach((img)=>{
  img.addEventListener('click', ()=>{ state.background = {type:'preset', value: img.src}; applyBackground(); save(); });
});

// Upload background -> base64
inUpload.addEventListener('change', (e)=>{
  const file = e.target.files?.[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{ state.background = {type:'upload', value: reader.result}; applyBackground(); save(); };
  reader.readAsDataURL(file);
});

btnRestore.addEventListener('click', ()=>{
  state = JSON.parse(JSON.stringify(defaults));
  running = false;
  remaining = state.durations[state.mode]*60;
  applyFont(); applyBackground(); updateUI(); save();
});

// Shortcuts
window.addEventListener('keydown', (e)=>{
  if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
  if (e.code==='Space'){ e.preventDefault(); btnStart.click(); }
  if (e.key.toLowerCase()==='r'){ e.preventDefault(); btnReset.click(); }
  if (e.key.toLowerCase()==='s'){ e.preventDefault(); btnSkip.click(); }
});

// ---------- First paint ----------
applyFont();
if (!state.background?.value){ state.background = { type:'preset', value: PRESETS[0] }; }
applyBackground();
updateUI();
