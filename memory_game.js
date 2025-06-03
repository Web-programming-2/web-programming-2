/* ====================== 공용 DOM ====================== */
const startBtn         = document.getElementById('start-button');
const settingsBtn      = document.getElementById('settings-button');

const menuContainer    = document.getElementById('menu-container');
const transitionScreen = document.getElementById('transition-screen');
const stageSelect      = document.getElementById('stage-select');
const settingsScreen   = document.getElementById('settings-screen');

const skipBtn = document.getElementById('skip-button');
skipBtn.addEventListener('click', () => {
  menuContainer.style.display = 'none';
  stageSelect.style.display   = 'flex';
});

const settingsBackBtn  = document.getElementById('settings-back-button');
const volumeSlider     = document.getElementById('volume-slider');
const volumeValue      = document.getElementById('volume-value');
const bgmToggle        = document.getElementById('bgm-toggle');
const ballSelect       = document.getElementById('ball-select');

/* ====================== 오디오 ====================== */
const bgm = document.getElementById('bgm');   // <audio>

/* ====================== UI 동기화 함수 (예시) ====================== */
function syncSettingsUI () {
  volumeSlider.value      = bgm.volume.toString();
  volumeValue.textContent = `${Math.round(bgm.volume * 100)}%`;
  bgmToggle.checked = !bgm.muted;
  const savedSkin = localStorage.getItem('ballSkin') || 'basketball.png';
  ballSelect.value = savedSkin;
}

/* ====================== 배경 슬라이드 기능 ====================== */
const slideBackgrounds = [
  'images/bg1.jpg',
  'images/bg2.jpg',
  'images/bg3.jpg',
  'images/bg4.jpg'
];
let currentBgIdx = 0;
let layerIndex   = 0;
const CHANGE_INTERVAL = 4000;

// 레이어 DOM 참조
const bgLayer1 = document.getElementById('bg-layer-1');
const bgLayer2 = document.getElementById('bg-layer-2');
const bgLayers = [bgLayer1, bgLayer2];

function rotateBackground() {
  const nextLayer   = bgLayers[1 - layerIndex];
  const imageURL    = slideBackgrounds[currentBgIdx];

  nextLayer.style.backgroundImage = `url('${imageURL}')`;
  bgLayers[layerIndex].style.opacity = '0';
  nextLayer.style.opacity            = '1';

  layerIndex   = 1 - layerIndex;
  currentBgIdx = (currentBgIdx + 1) % slideBackgrounds.length;
}

/* ====================== 초기화 ====================== */
window.addEventListener('DOMContentLoaded', () => {
  /* 1) BGM 초기 설정 */
  bgm.volume = parseFloat(volumeSlider.value);
  bgm.muted  = false;
  bgm.removeAttribute('muted');
  syncSettingsUI();
  const playPromise = bgm.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      const resume = () => {
        bgm.play().catch(() => {});
        document.body.removeEventListener('click', resume);
      };
      document.body.addEventListener('click', resume, { once: true });
    });
  }

  /* 2) 배경 슬라이드 첫 세팅 및 타이머 시작 */
  bgLayer1.style.backgroundImage = `url('${slideBackgrounds[0]}')`;
  bgLayer1.style.opacity         = '1';
  bgLayer2.style.opacity         = '0';
  currentBgIdx = 1;
  layerIndex   = 0;
  setInterval(rotateBackground, CHANGE_INTERVAL);


  /* 3) “게임 시작” 버튼 클릭 → 메뉴 숨기고 transition 화면 → 4초 뒤 transition 사라지고 스테이지 선택 화면 보여주기 */
  startBtn.addEventListener('click', () => {
    menuContainer.style.display    = 'none';
    transitionScreen.style.display = 'flex';

    setTimeout(() => {
      transitionScreen.style.display = 'none';
      stageSelect.style.display      = 'flex';
    }, 4000);
  });

  /* 4) “설정” 버튼 클릭 → 메뉴 숨기고 설정 화면 띄우기 */
  settingsBtn.addEventListener('click', () => {
    menuContainer.style.display  = 'none';
    settingsScreen.style.display = 'flex';
    syncSettingsUI();
  });
  settingsBackBtn.addEventListener('click', () => {
    settingsScreen.style.display = 'none';
    menuContainer.style.display  = 'flex';
  });

  /* ───────────────────────────────────────────────────────
   * 5) “스테이지 버튼” 클릭 시 data-stage URL 로 페이지 이동
   *─────────────────────────────────────────────────────── */
  const stageButtons = stageSelect.querySelectorAll('button[data-stage]');
  stageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetUrl = btn.getAttribute('data-stage');
      // 바로 해당 스테이지 페이지로 이동
      window.location.href = targetUrl;
    });
  });
});
