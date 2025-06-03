/* ====================== 공용 DOM ====================== */
const startBtn         = document.getElementById('start-button');
const shopBtn          = document.getElementById('shop-button');      // (추후)
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

/* ---------- 설정 화면 요소 ---------- */
const settingsBackBtn  = document.getElementById('settings-back-button');
const volumeSlider     = document.getElementById('volume-slider');
const volumeValue      = document.getElementById('volume-value');
const bgmToggle        = document.getElementById('bgm-toggle');
const ballSelect       = document.getElementById('ball-select');

/* ---------- 오디오 ---------- */
const bgm = document.getElementById('bgm');   // <audio>

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
  localStorage.setItem('ballSkin', e.target.value);
});

/* ====================== 스테이지 이동 ====================== */
document.querySelectorAll('#stage-select .menu-button').forEach(btn => {
  btn.addEventListener('click', e => {
    const target = e.currentTarget.dataset.stage;
    if (!target) return;

    // (선택 사항) BGM 재생 위치와 음소거 상태를 저장하려면 아래 두 줄을 추가합니다:
    // localStorage.setItem('bgm-time', bgm.currentTime);
    // localStorage.setItem('bgm-muted', bgm.muted);

    window.location.href = target;
  });
});

/* ====================== 초기화 ====================== */
window.addEventListener('DOMContentLoaded', () => {
  /* 최초 음량·뮤트 상태 */
  bgm.volume = parseFloat(volumeSlider.value);   // HTML 기본값(0.5)
  bgm.muted  = false;                            // 🔊 처음부터 켜기
  bgm.removeAttribute('muted');                  // 태그에 mute 속성 붙어 있어도 무시

  syncSettingsUI();

  /* 오디오 자동 재생 시도 */
  const playPromise = bgm.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      /* 자동 재생이 차단되면 첫 사용자 클릭에서 다시 시도 */
      const resume = () => {
        bgm.play().catch(() => {});
        document.body.removeEventListener('click', resume);
      };
      document.body.addEventListener('click', resume, { once: true });
    });
  }
});
