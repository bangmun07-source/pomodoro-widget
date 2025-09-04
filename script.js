const state = {
  mode: 'focus',
  durations: { focus: 25, short: 5, long: 15 },
  timeLeft: 25 * 60,
  running: false,
  interval: null,
  startedAt: null
};

const el = {
  clock: document.getElementById('clock'),
  progress: document.getElementById('progress'),
  tabFocus: document.getElementById('tab-focus'),
  tabShort: document.getElementById('tab-short'),
  tabLong: document.getElementById('tab-long'),
  btnStart: document.getElementById('btnStart'),
  btnReset: document.getElementById('btnReset'),
  btnSkip: document.getElementById('btnSkip'),
  panel: document.getElementById('panel'),
  openSettings: document.getElementById('openSettings'),
  closeSettings: document.getElementById('closeSettings'),
  focusMin: document.getElementById('focusMin'),
  shortMin: document.getElementById('shortMin'),
  longMin: document.getElementById('longMin'),
  autoBreak: document.getElementById('autoBreak'),
  autoFocus: document.getElementById('autoFocus'),
  tick: document.getElementById('tick'),
  chime: document.getElementById('chime'),
  bgUpload: document.getElementById('bgUpload'),
  restore: document.getElementById('restore'),
};

const pad = n => n.toString().padStart(2, '0');
const format = t => `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;

function setProgress() {
  const total = state.durations[state.mode] * 60;
  const done = total - state.timeLeft;
  const pct = Math.max(0, Math.min(100, (done / total) * 100));
  el.progress.style.width = pct + '%';
}

function draw() {
  el.clock.textContent = format(state.timeLeft);
  setProgress();
  [el.tabFocus, el.tabShort, el.tabLong].forEach(t => t.classList.remove('active'));
  ({ focus: el.tabFocus, short: el.tabShort, long: el.tabLong }[state.mode]).classList.add('active');
}

function setMode(mode) {
  state.mode = mode;
  state.timeLeft = state.durations[mode] * 60;
  stop();
  draw();
  if ((mode !== 'focus' && el.autoBreak.checked) || (mode === 'focus' && el.autoFocus.checked)) start();
}

function start() {
  if (state.running) {
    stop();
    return;
  }
  state.running = true;
  state.startedAt = Date.now() - ((state.durations[state.mode] * 60 - state.timeLeft) * 1000);
  el.btnStart.textContent = 'Pause';
  state.interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
    const next = state.durations[state.mode] * 60 - elapsed;
    state.timeLeft = Math.max(0, next);
    if (el.tick.checked) doTick();
    draw();
    if (state.timeLeft <= 0) {
      stop();
      if (el.chime.checked) endChime();
      const nextMode = state.mode === 'focus' ? 'short' : 'focus';
      setMode(nextMode);
    }
  }, 1000);
}

function stop() {
  clearInterval(state.interval);
  state.interval = null;
  state.running = false;
  el.btnStart.textContent = 'Start';
}

function reset() {
  stop();
  state.timeLeft = state.durations[state.mode] * 60;
  draw();
}

function skip() {
  stop();
  state.timeLeft = 0;
  draw();
  if (el.chime.checked) endChime();
  const nextMode = state.mode === 'focus' ? 'short' : 'focus';
  setMode(nextMode);
}

// Sounds
let audioCtx;
function tickSoundInit() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function beep(freq = 880, dur = 0.025) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.value = freq;
  o.connect(g);
  g.connect(audioCtx.destination);
  g.gain.value = 0.04;
  o.start();
  setTimeout(() => o.stop(), dur * 1000);
}
function doTick() { beep(800, 0.02); }
function endChime() { beep(660, 0.12); setTimeout(() => beep(990, 0.18), 150); }

// Settings Panel
el.openSettings.addEventListener('click', () => el.panel.classList.add('open'));
el.closeSettings.addEventListener('click', () => el.panel.classList.remove('open'));

// Update Durasi
[el.focusMin, el.shortMin, el.longMin].forEach(inp =>
  inp.addEventListener('change', () => {
    state.durations.focus = parseInt(el.focusMin.value) || 25;
    state.durations.short = parseInt(el.shortMin.value) || 5;
    state.durations.long = parseInt(el.longMin.value) || 15;
    state.timeLeft = state.durations[state.mode] * 60;
    draw();
    savePrefs();
  })
);

// Upload Background & Simpan di localStorage
el.bgUpload.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.body.style.backgroundImage = `url(${ev.target.result})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    localStorage.setItem("pomodoroBg", ev.target.result);
    savePrefs();
  };
  reader.readAsDataURL(file);
});

// Restore Defaults
el.restore.addEventListener('click', () => {
  el.focusMin.value = 25;
  el.shortMin.value = 5;
  el.longMin.value = 15;
  el.autoBreak.checked = false;
  el.autoFocus.checked = false;
  el.tick.checked = true;
  el.chime.checked = true;
  document.body.style.backgroundImage = 'none';
  document.body.style.backgroundColor = '#000';
  localStorage.removeItem("pomodoroBg"); // hapus background tersimpan
  state.durations = { focus: 25, short: 5, long: 15 };
  state.timeLeft = 25 * 60;
  draw();
  savePrefs();
});

// Simpan Preferences
function savePrefs() {
  const prefs = {
    durations: state.durations,
    autoBreak: el.autoBreak.checked,
    autoFocus: el.autoFocus.checked,
    tick: el.tick.checked,
    chime: el.chime.checked,
    bg: document.body.style.backgroundImage || '',
  };
  localStorage.setItem('pomodoroPrefs', JSON.stringify(prefs));
}

// Muat Preferences Saat Reload
function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem('pomodoroPrefs') || 'null');
    if (!p) return;
    state.durations = p.durations || state.durations;
    el.focusMin.value = state.durations.focus;
    el.shortMin.value = state.durations.short;
    el.longMin.value = state.durations.long;
    el.autoBreak.checked = p.autoBreak || false;
    el.autoFocus.checked = p.autoFocus || false;
    el.tick.checked = p.tick ?? true;
    el.chime.checked = p.chime ?? true;

    // Muat background jika ada
    const savedBg = localStorage.getItem("pomodoroBg");
    if (savedBg) {
      document.body.style.backgroundImage = `url(${savedBg})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    }

    state.timeLeft = state.durations[state.mode] * 60;
    draw();
  } catch {}
}

loadPrefs();
draw();

// === Event Listener Tombol ===
el.btnStart.addEventListener('click', start);
el.btnReset.addEventListener('click', reset);
el.btnSkip.addEventListener('click', skip);

// Inisialisasi Audio
tickSoundInit();
