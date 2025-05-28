/* ====================== 공용 DOM ====================== */
const startBtn         = document.getElementById('start-button');
const shopBtn          = document.getElementById('shop-button');      // (추후)
const settingsBtn      = document.getElementById('settings-button');

const menuContainer    = document.getElementById('menu-container');
const transitionScreen = document.getElementById('transition-screen');
const stageSelect      = document.getElementById('stage-select');
const settingsScreen   = document.getElementById('settings-screen');

/* ---------- 설정 화면 요소 ---------- */
const settingsBackBtn  = document.getElementById('settings-back-button');
const volumeSlider     = document.getElementById('volume-slider');
const volumeValue      = document.getElementById('volume-value');
const bgmToggle        = document.getElementById('bgm-toggle');
const ballSelect       = document.getElementById('ball-select');      // ⬅️ NEW

/* ---------- 오디오 ---------- */
const bgm              = document.getElementById('bgm');   // <audio>

/* ====================== UI 동기화 함수 ====================== */
function syncSettingsUI () {
  /* 볼륨 */
  volumeSlider.value      = bgm.volume.toString();
  volumeValue.textContent = `${Math.round(bgm.volume * 100)}%`;

  /* BGM 토글 */
  bgmToggle.checked = !bgm.muted;

  /* 공 모양 드롭다운 */
  const savedSkin = localStorage.getItem('ballSkin') || 'basketball.png';
  ballSelect.value = savedSkin;
}

/* ====================== 메인 메뉴 흐름 ====================== */
startBtn.addEventListener('click', () => {
  menuContainer.style.display    = 'none';
  transitionScreen.style.display = 'flex';

  /* 4초 로딩 후 스테이지 선택 */
  setTimeout(() => {
    transitionScreen.style.display = 'none';
    stageSelect.style.display      = 'flex';
  }, 4000);
});

/* ---------- 메뉴 → 설정 ---------- */
settingsBtn.addEventListener('click', () => {
  menuContainer.style.display  = 'none';
  settingsScreen.style.display = 'flex';
  syncSettingsUI();
});

/* ---------- 설정 → 메뉴 ---------- */
settingsBackBtn.addEventListener('click', () => {
  settingsScreen.style.display = 'none';
  menuContainer.style.display  = 'flex';
});

/* ====================== 볼륨 슬라이더 ====================== */
volumeSlider.addEventListener('input', e => {
  const v = parseFloat(e.target.value);      // 0‒1
  bgm.volume = v;
  volumeValue.textContent = `${Math.round(v * 100)}%`;
});

/* ====================== BGM 토글 ====================== */
bgmToggle.addEventListener('change', e => {
  bgm.muted = !e.target.checked;
  if (!bgm.muted) {
    bgm.play().catch(() => {});              // 자동재생 정책 대응
  } else {
    bgm.pause();
  }
});

/* ====================== 공 모양 선택 ====================== */
ballSelect.addEventListener('change', e => {
  /* 선택 값을 로컬스토리지에 저장 – 스테이지에서 읽어감 */
  localStorage.setItem('ballSkin', e.target.value);
});

/* ====================== 초기화 ====================== */
window.addEventListener('DOMContentLoaded', () => {
  /* 최초 음량‧뮤트 상태 */
  bgm.volume = parseFloat(volumeSlider.value);   // HTML 기본값(0.5)
  bgm.muted  = true;                            // 자동재생 방지용
  syncSettingsUI();
});
