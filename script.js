const timeDisplay = document.getElementById("time");
const progressBar = document.getElementById("progress");
const startBtn = document.getElementById("start");
const resetBtn = document.getElementById("reset");
const skipBtn = document.getElementById("skip");
const settingsPanel = document.getElementById("settingsPanel");
const openSettings = document.getElementById("openSettings");
const closeSettings = document.getElementById("closeSettings");
const bgUpload = document.getElementById("bgUpload");
const restoreDefault = document.getElementById("restoreDefault");

let focusDuration = 25;
let shortBreak = 5;
let longBreak = 15;
let timeLeft = focusDuration * 60;
let timer = null;
let isRunning = false;

// Load background from localStorage
const savedBg = localStorage.getItem("backgroundImage");
if (savedBg) {
  document.body.style.backgroundImage = `url(${savedBg})`;
}

// Open settings panel
openSettings.addEventListener("click", () => {
  settingsPanel.classList.add("open");
});

// Close settings panel
closeSettings.addEventListener("click", () => {
  settingsPanel.classList.remove("open");
});

// Upload and save background
bgUpload.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      document.body.style.backgroundImage = `url(${base64})`;
      localStorage.setItem("backgroundImage", base64);
    };
    reader.readAsDataURL(file);
  }
});

// Restore default background
restoreDefault.addEventListener("click", () => {
  document.body.style.backgroundImage = "none";
  localStorage.removeItem("backgroundImage");
});

// Start / Pause timer
startBtn.addEventListener("click", () => {
  if (!isRunning) {
    isRunning = true;
    startBtn.textContent = "Pause";
    timer = setInterval(updateTimer, 1000);
  } else {
    isRunning = false;
    startBtn.textContent = "Start";
    clearInterval(timer);
  }
});

// Reset timer
resetBtn.addEventListener("click", () => {
  clearInterval(timer);
  isRunning = false;
  startBtn.textContent = "Start";
  timeLeft = focusDuration * 60;
  updateDisplay();
});

// Skip timer
skipBtn.addEventListener("click", () => {
  clearInterval(timer);
  isRunning = false;
  startBtn.textContent = "Start";
  timeLeft = shortBreak * 60;
  updateDisplay();
});

// Update timer display
function updateTimer() {
  if (timeLeft > 0) {
    timeLeft--;
    updateDisplay();
  } else {
    clearInterval(timer);
    isRunning = false;
    startBtn.textContent = "Start";
  }
}

// Update display and progress bar
function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timeDisplay.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  const progress = ((focusDuration * 60 - timeLeft) / (focusDuration * 60)) * 100;
  progressBar.style.width = `${progress}%`;
}

updateDisplay();
