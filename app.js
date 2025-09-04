// ---------- Helpers ----------
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const fmt = (t) => {
  const m = String(Math.floor(t/60)).padStart(2,'0');
  const s = String(Math.floor(t%60)).padStart(2,'0');
  return `${m}:${s}`;
};

// ---------- Elements ----------
const timeEl   = $('#time');
const barFill  = $('#bar-fill');
const btnStart = $('#btn-start');
const btnReset = $('#btn-reset');
const btnSkip  = $('#btn-skip');
const btnSettings = $('#btn-settings');
const btnClose    = $('#btn-close');
const panel = $('#panel');

const btnModeP = $('#mode-pomo');
const btnModeS = $('#mode-short');
const btnModeL = $('#mode-long');

const inPomo  = $('#in-pomo');
const inShort = $('#in-short');
const inLong  = $('#in-long');
const inFont  = $('#in-font');

const inUpload   = $('#in-upload');
const presetWrap = $('#preset-wrap');
const btnRestore = $('#btn-restore');

// ---------- State ----------
const durations = { pomodoro: 25, short: 5, long: 15 };
let mode = 'pomodoro';
let remaining = durations[mode] * 60;
let running = false;

// RAF-based timer
let endTimeMs = null; // timestamp (ms) when the period ends
let raf = null;

function startTimer() {
  if (running) return;
  running = true;
  endTimeMs = performance.now() + remaining * 1000;
  btnStart.textContent = 'Pause';
  tick(); // kick
}

function pauseTimer() {
  if (!running) return;
  running = false;
  cancelAnimationFrame(raf);
  remaining = Math.max(0, (endTimeMs - performance.now()) / 1000);
  btnStart.textContent = 'Start';
  render();
}

function resetTimer() {
  running = false;
  cancelAnimationFrame(raf);
  remaining = durations[mode] * 60;
  btnStart.textContent = 'Start';
  render();
}

function skipTimer() {
  running = false;
  cancelAnimationFrame(raf);
  remaining = 0;
  render();
}

// RAF loop
function tick(now = performance.now()) {
  if (!running) return;
  const left = (endTimeMs - now) / 1000;
  remaining = Math.max(0, left);
  render();

  if (remaining <= 0) {
    running = false;
    btnStart.textContent = 'Start';
    // (opsional) auto switch ke break/focus
    return;
  }
  raf = requestAnimationFrame(tick);
}

// ---------- UI ----------
function render() {
  timeEl.textContent = fmt(remaining);
  const total = durations[mode] * 60;
  const progress = Math.max(0, Math.min(1, 1 - remaining/total));
  barFill.style.width = `${progress*100}%`;

  [btnModeP, btnModeS, btnModeL].forEach(b=>b.classList.remove('active'));
  ({pomodoro:btnModeP, short:btnModeS, long:btnModeL}[mode]).classList.add('active');
}

function setMode(next) {
  mode = next;
  running = false;
  cancelAnimationFrame(raf);
  remaining = durations[mode] * 60;
  btnStart.textContent = 'Start';
  render();
}

// ---------- Events ----------
btnStart.addEventListener('click', () => running ? pauseTimer() : startTimer());
btnReset.addEventListener('click', resetTimer);
btnSkip .addEventListener('click', skipTimer);

btnModeP.addEventListener('click', () => setMode('pomodoro'));
btnModeS.addEventListener('click', () => setMode('short'));
btnModeL.addEventListener('click', () => setMode('long'));

btnSettings.addEventListener('click', () => panel.classList.add('open'));
btnClose.addEventListener('click', () => panel.classList.remove('open'));

[inPomo, inShort, inLong].forEach(input=>{
  input.addEventListener('input', ()=>{
    durations.pomodoro = clamp(parseInt(inPomo.value||'0'),1,180);
    durations.short    = clamp(parseInt(inShort.value||'0'),1,60);
    durations.long     = clamp(parseInt(inLong.value||'0'),1,60);
    remaining = durations[mode]*60;
    render();
  });
});

inFont.addEventListener('change', ()=>{ document.body.style.fontFamily = inFont.value; });

// Background presets
presetWrap.querySelectorAll('.preset').forEach(img=>{
  img.addEventListener('click', ()=>{ document.body.style.backgroundImage = `url(${img.src})`; });
});

// Upload custom background
inUpload.addEventListener('change', (e)=>{
  const file = e.target.files?.[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{ document.body.style.backgroundImage = `url(${reader.result})`; };
  reader.readAsDataURL(file);
});

// Restore default background
btnRestore.addEventListener('click', ()=>{
  document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1920&auto=format&fit=crop')";
});

// Keyboard shortcuts
window.addEventListener('keydown', (e)=>{
  if (['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
  if (e.code === 'Space'){ e.preventDefault(); running ? pauseTimer() : startTimer(); }
  if (e.key.toLowerCase() === 'r'){ e.preventDefault(); resetTimer(); }
  if (e.key.toLowerCase() === 's'){ e.preventDefault(); skipTimer(); }
});

// First paint
render();
