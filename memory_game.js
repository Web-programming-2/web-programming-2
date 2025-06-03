/* ====================== 공용 DOM ====================== */
const startBtn         = document.getElementById('start-button');
const settingsBtn      = document.getElementById('settings-button');
const menuContainer    = document.getElementById('menu-container');
const transitionScreen = document.getElementById('transition-screen');
const stageSelect      = document.getElementById('stage-select');
const settingsScreen   = document.getElementById('settings-screen');

const skipBtn          = document.getElementById('skip-button');
const settingsBackBtn  = document.getElementById('settings-back-button');
const volumeSlider     = document.getElementById('volume-slider');
const volumeValue      = document.getElementById('volume-value');
const bgmToggle        = document.getElementById('bgm-toggle');
const ballSelect       = document.getElementById('ball-select');

const bgm              = document.getElementById('bgm');   // <audio id="bgm">

/* ====================== UI 동기화 함수 ====================== */
function syncSettingsUI() {
  // 현재 슬라이더 값(0.0~1.0) → bgm.volume, 화면 텍스트에 % 표시
  const vol = parseFloat(volumeSlider.value);
  bgm.volume = vol;
  volumeValue.textContent = `${Math.round(vol * 100)}%`;

  // 토글 체크 여부에 따라 muted 설정
  // checked === true → 소리 켜짐, false → 소리 꺼짐
  bgm.muted = !bgmToggle.checked;

  // 로컬스토리지에 저장된 공 스킨이 있으면 선택 창 UI에도 반영
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

const bgLayer1 = document.getElementById('bg-layer-1');
const bgLayer2 = document.getElementById('bg-layer-2');
const bgLayers = [bgLayer1, bgLayer2];

function rotateBackground() {
  const nextLayer = bgLayers[1 - layerIndex];
  const imageURL  = slideBackgrounds[currentBgIdx];

  nextLayer.style.backgroundImage = `url('${imageURL}')`;
  bgLayers[layerIndex].style.opacity = '0';
  nextLayer.style.opacity            = '1';

  layerIndex   = 1 - layerIndex;
  currentBgIdx = (currentBgIdx + 1) % slideBackgrounds.length;
}

/* ====================== 초기화 (DOMContentLoaded) ====================== */
window.addEventListener('DOMContentLoaded', () => {
  /* 1) BGM 초기 설정 */
  // ───────────────────────────────────────────────────────────────────
  // HTML <audio> 에서 muted 속성은 제거했으므로,
  // JS에서 한 번 syncSettingsUI() 로 토글 체크 상태를 읽어 실제 muted 상태를 지정합니다.
  syncSettingsUI();

  // 자동 재생 차단 정책 대응: 클릭 시 재생 재시도
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

  /* 3) “바로 스테이지” 버튼 클릭 */
  skipBtn.addEventListener('click', () => {
    menuContainer.style.display = 'none';
    stageSelect.style.display   = 'flex';
  });

  /* 4) “게임 시작” 버튼 클릭 */
  startBtn.addEventListener('click', () => {
    menuContainer.style.display    = 'none';
    transitionScreen.style.display = 'flex';

    setTimeout(() => {
      transitionScreen.style.display = 'none';
      stageSelect.style.display      = 'flex';
    }, 4000);
  });

  /* 5) “설정” 버튼 클릭 */
  settingsBtn.addEventListener('click', () => {
    menuContainer.style.display   = 'none';
    settingsScreen.style.display  = 'flex';
    syncSettingsUI();  // 설정 화면 열 때마다 최신 상태 동기화
  });

  /* 6) 설정 화면 “돌아가기” 버튼 클릭 */
  settingsBackBtn.addEventListener('click', () => {
    settingsScreen.style.display = 'none';
    menuContainer.style.display  = 'flex';
  });

  /* 7) 스테이지 버튼(data-stage) 클릭 시 페이지 이동 */
  const stageButtons = stageSelect.querySelectorAll('button[data-stage]');
  stageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetUrl = btn.getAttribute('data-stage');
      window.location.href = targetUrl;
    });
  });

  /* 8) 볼륨 슬라이더(input) 이벤트 바인딩 */
  volumeSlider.addEventListener('input', () => {
    const newVol = parseFloat(volumeSlider.value);
    bgm.volume = newVol;
    volumeValue.textContent = `${Math.round(newVol * 100)}%`;
  });

  /* 9) BGM 토글(checkbox) 이벤트 바인딩 */
  bgmToggle.addEventListener('change', () => {
    // checked === true → 소리 켜기(false), checked === false → 소리 끄기(true)
    bgm.muted = !bgmToggle.checked;
  });

  /* 10) 공 스킨 선택 시 localStorage에 저장 */
  ballSelect.addEventListener('change', () => {
    localStorage.setItem('ballSkin', ballSelect.value);
  });
});
