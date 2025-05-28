// 🔊 배경음 초기화 (1번만 선언!)
const bgmAudio = new Audio("bgm.mp3");
bgmAudio.loop = true;
bgmAudio.volume = 0.5;

// 🎮 공통 요소 선택
const startBtn = document.getElementById("start-button");
const menuContainer = document.getElementById("menu-container");
const transitionScreen = document.getElementById("transition-screen");
const transitionText = document.getElementById("transition-text");
const stageSelect = document.getElementById("stage-select");
const settingsBtn = document.getElementById("settings-button");
const settingsScreen = document.getElementById("settings-screen");
const settingsBackBtn = document.getElementById("settings-back-button");
const volumeSlider = document.getElementById("volume-slider");
const volumeValue = document.getElementById("volume-value");

// ▶️ 게임 시작 버튼 (1번만 등록!)
startBtn.addEventListener("click", () => {
  menuContainer.style.display = "none";
  transitionScreen.style.display = "flex";

startBtn.addEventListener("click", () => {
  bgmAudio.play();  // 사용자 클릭 이후 실행되므로 OK
});

  setTimeout(() => {
    transitionScreen.style.display = "none";
    stageSelect.style.display = "flex";
  }, 4000);
});

// ⚙️ 설정 버튼 → 설정 화면 진입
settingsBtn.addEventListener("click", () => {
  menuContainer.style.display = "none";
  settingsScreen.style.display = "flex";
});

// ⬅️ 설정 → 메뉴 돌아가기
settingsBackBtn.addEventListener("click", () => {
  settingsScreen.style.display = "none";
  menuContainer.style.display = "flex";
});

// 🔊 볼륨 슬라이더 조절
volumeSlider.addEventListener("input", () => {
  const percent = Math.round(volumeSlider.value * 100);
  volumeValue.textContent = percent + "%";

  bgmAudio.volume = volumeSlider.value;
});
