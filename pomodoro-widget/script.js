const timerDisplay = document.getElementById("timer");
const startStopBtn = document.getElementById("startStop");
const resetBtn = document.getElementById("reset");
const resetIcon = document.getElementById("resetIcon");
const settingsBtn = document.getElementById("settings");
const settingsIcon = document.getElementById("settingsIcon");
const modal = document.getElementById("settingsModal");
const saveBtn = document.getElementById("saveSettings");
const goalText = document.getElementById("goalText");
const box = document.getElementById("pomodoro");

let timeLeft = 25 * 60;
let timer;
let running = false;
let mode = "pomodoro";

const durations = { pomodoro: 25, short: 5, long: 15 };

function updateDisplay(){
  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  timerDisplay.textContent = 
    `${minutes.toString().padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`;
}

function startStop(){
  if(running){
    clearInterval(timer);
    startStopBtn.textContent = " Start";
  } else {
    timer = setInterval(()=>{
      if(timeLeft > 0){
        timeLeft--;
        updateDisplay();
      } else {
        clearInterval(timer);
        alert("⏰ Waktu Habis!");
      }
    },1000);
    startStopBtn.textContent = "⏸ Pause";
  }
  running = !running;
}

function reset(){
  clearInterval(timer);
  running = false;
  timeLeft = durations[mode] * 60;
  updateDisplay();
  startStopBtn.textContent = " Start";
}

// Mode switch
document.querySelectorAll(".mode").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".mode").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    mode = btn.dataset.mode;
    reset();
  });
});

// Settings
settingsBtn.addEventListener("click", ()=> modal.style.display = "flex");

saveBtn.addEventListener("click", ()=>{
  // Update icons
  resetIcon.src = document.getElementById("iconReset").value;
  settingsIcon.src = document.getElementById("iconSettings").value;

  // Update goal
  goalText.textContent = document.getElementById("goalInput").value;

  // Update theme
  document.body.setAttribute("data-theme", document.getElementById("themeSelect").value);

  // Upload background
  const file = document.getElementById("bgUpload").files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = (e)=>{
      document.body.style.background = `url(${e.target.result}) no-repeat center/cover`;
    };
    reader.readAsDataURL(file);
  }

  // Update shape
  box.className = "pomodoro-box " + document.getElementById("shapeSelect").value;

  // Update warna semua teks
const color = document.getElementById("fontColor").value;
box.style.color = color;


  // Update font family
  const font = document.getElementById("fontFamily").value;
  if(font.trim() !== ""){
    box.style.fontFamily = font;
  }

  modal.style.display = "none";
});

modal.addEventListener("click",(e)=>{ if(e.target===modal) modal.style.display="none"; });

updateDisplay();
startStopBtn.addEventListener("click", startStop);
resetBtn.addEventListener("click", reset);
