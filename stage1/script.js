// script.js (Stage 1 및 1-2 전용)

// ───────────────────────────────────────────────────────────────
// ❶ DOM 요소 가져오기
const canvas           = document.getElementById("gameCanvas");
const ctx              = canvas.getContext("2d");
const transitionScreen = document.getElementById("transition-screen");
const gameContainer    = document.getElementById("game-container");
const backToMenuBtn    = document.getElementById("back-to-menu");

// 모든 id="npc-screen" <div>를 배열로 가져옵니다.
const allNpcScreens = Array.from(document.querySelectorAll('div[id="npc-screen"]'));

// 초기 NPC(4개), 1-2 진입 전 NPC(2개), 스테이지2 진입 전 최종 NPC(5개)로 분리
const initialNpcCount = 4;
const midNpcCount     = 2;
const finalNpcCount   = 5;

const initialNpcScreens = allNpcScreens.slice(0, initialNpcCount);
const midNpcScreens     = allNpcScreens.slice(initialNpcCount, initialNpcCount + midNpcCount);
const finalNpcScreens   = allNpcScreens.slice(initialNpcCount + midNpcCount,
                                              initialNpcCount + midNpcCount + finalNpcCount);

const lightningImage   = new Image();
lightningImage.src     = "lightning.png";
let score = 0;

// ───────────────────────────────────────────────────────────────
// ** bgImages 배열에는 오직 스테이지1과 스테이지1-2용 이미지만 둡니다. **
const bgImages = [
  "background1.jpg",    // 스테이지1 배경
  "background1-2.jpg"   // 스테이지1-2 배경 (실제 파일명에 맞춰 교체)
].map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

let currentStage = 0;  // 0 = 스테이지1, 1 = 스테이지1-2
let bgImage      = bgImages[currentStage];

const heartImage = new Image(); heartImage.src = "heart.png";
const dogImage   = new Image(); dogImage.src   = "dog.png";

const savedSkin = localStorage.getItem("ballSkin") || "basketball.png";
const ballImage = new Image(); ballImage.src = savedSkin;

let ballRadius = 12;
const ballScale     = 0.25;
const brickWidth    = 80;
const brickHeight   = 40;
const brickRowCount = 2;
const brickOffsetTop= 150;
const paddleWidth   = 150;
const paddleHeight  = 0;
const paddleOffset  = 60;
const maxLives      = 3;
const heartSize     = 90;

let dogW = 0, dogH = 0;
dogImage.onload = () => {
  dogW = paddleWidth * 1.2;
  dogH = dogImage.naturalHeight * (dogW / dogImage.naturalWidth);
};

let ballW = 0, ballH = 0;
ballImage.onload = () => {
  ballW = ballImage.naturalWidth * ballScale;
  ballH = ballImage.naturalHeight * ballScale;
  ballRadius = ballW / 2;
};

let cw, ch;
let bgX = 0, bgY = 0, bgW = 0, bgH = 0;
let x, y, dx = 5, dy = -5;
let paddleX;
let rightPressed = false, leftPressed = false;
let bricks = [], cols, brickOffsetLeft;
let falling = [];
let lives = maxLives;
let gameOver = false;
let stageCleared = false;

// ───────────────────────────────────────────────────────────────
// ❷ 페이지 로드 시: 인트로 → 초기 NPC → 스테이지1
window.addEventListener("DOMContentLoaded", () => {
  console.log("[DOM] 로드 완료");

  // (1) NPC 화면 전부 숨김
  initialNpcScreens.forEach(div => div.style.display = "none");
  midNpcScreens.forEach(div => div.style.display = "none");
  finalNpcScreens.forEach(div => div.style.display = "none");

  // (2) 게임 컨테이너 숨김
  gameContainer.style.display = "none";

  // (3) 인트로 본 적 있는지 체크
  const introSeen = localStorage.getItem("stage1-intro-seen");
  if (!introSeen) {
    console.log("인트로 처음 본다 → transition-screen 표시");

    // transitionScreen을 화면 중앙에 flex로 띄우기 위해 display 외에 flex 속성도 지정
    transitionScreen.style.display = "flex";
    transitionScreen.style.flexDirection = "column";
    transitionScreen.style.alignItems = "center";
    transitionScreen.style.justifyContent = "center";

    localStorage.setItem("stage1-intro-seen", "true");
  } else {
    console.log("인트로 이미 봄 → 초기 NPC(0)부터 보여주기");
    transitionScreen.style.display = "none";
    showInitialNpcScreen(0);
  }

  // (4) 인트로 클릭 시 → 초기 NPC(0)부터
  transitionScreen.addEventListener("click", () => {
    console.log("[인트로 클릭] 초기 NPC(0) 보이기");
    transitionScreen.style.display = "none";
    showInitialNpcScreen(0);
  });
});


// ───────────────────────────────────────────────────────────────
// ❸ 초기 NPC(4개) 순차 표시 함수
function showInitialNpcScreen(index) {
  console.log("showInitialNpcScreen:", index);
  initialNpcScreens.forEach(div => div.style.display = "none");

  if (index < initialNpcScreens.length) {
    const currentDiv = initialNpcScreens[index];
    currentDiv.style.display = "flex";
    currentDiv.onclick = () => {
      console.log(`초기 NPC${index} 클릭 → 다음 ${index + 1}`);
      currentDiv.style.display = "none";
      showInitialNpcScreen(index + 1);
    };
  } else {
    console.log("초기 NPC 모두 완료 → startGame()");
    startGame();
  }
}

// ───────────────────────────────────────────────────────────────
// ❹ mid NPC(2개) 순차 표시 함수 (스테이지1 클리어 후)
function showMidNpcScreen(index) {
  console.log("showMidNpcScreen:", index);
  midNpcScreens.forEach(div => div.style.display = "none");

  if (index < midNpcScreens.length) {
    const currentDiv = midNpcScreens[index];
    currentDiv.style.display = "flex";
    currentDiv.onclick = () => {
      console.log(`mid NPC${index} 클릭 → 다음 ${index + 1}`);
      currentDiv.style.display = "none";
      showMidNpcScreen(index + 1);
    };
  } else {
    console.log("mid NPC 모두 완료 → startStage1_2()");
    startStage1_2();
  }
}

// ───────────────────────────────────────────────────────────────
// ❺ final NPC(5개) 순차 표시 함수 (스테이지1-2 클리어 후)
function showFinalNpcScreen(index) {
  console.log("showFinalNpcScreen:", index);
  finalNpcScreens.forEach(div => div.style.display = "none");

  if (index < finalNpcScreens.length) {
    const currentDiv = finalNpcScreens[index];
    currentDiv.style.display = "flex";
    currentDiv.onclick = () => {
      console.log(`final NPC${index} 클릭 → 다음 ${index + 1}`);
      currentDiv.style.display = "none";
      showFinalNpcScreen(index + 1);
    };
  } else {
    console.log("final NPC 모두 완료 → 스테이지2 페이지 이동");
    window.location.href = "../stage2/index.html";
  }
}

// ───────────────────────────────────────────────────────────────
// ❻ startGame(): 스테이지1 시작
function startGame() {
  console.log("startGame(): 스테이지1 배경 세팅 및 init()");
  // NPC 전부 숨김
  initialNpcScreens.forEach(div => div.style.display = "none");
  midNpcScreens.forEach(div => div.style.display = "none");
  finalNpcScreens.forEach(div => div.style.display = "none");

  // 게임 컨테이너 표시
  gameContainer.style.display = "flex";

  // 배경 = 스테이지1
  currentStage = 0;
  bgImage = bgImages[currentStage];

  if (typeof init === "function") init();
}

// ───────────────────────────────────────────────────────────────
// ❼ startStage1_2(): 스테이지1-2 시작
function startStage1_2() {
  console.log("startStage1_2(): 스테이지1-2 배경 세팅 및 init()");
  initialNpcScreens.forEach(div => div.style.display = "none");
  midNpcScreens.forEach(div => div.style.display = "none");
  finalNpcScreens.forEach(div => div.style.display = "none");

  gameContainer.style.display = "flex";

  // 배경 = 스테이지1-2
  currentStage = 1;
  bgImage = bgImages[currentStage];

  init();
}

// ───────────────────────────────────────────────────────────────
// ❽ init(): 실제 게임 초기화 (공통)
function init() {
  console.log("init(): resizeCanvas, initBricks, resetBall, gameLoop 시작");
  resizeCanvas();
  initBricks();
  resetBall();

  lives = maxLives;
  gameOver = false;
  stageCleared = false;

  transitionScreen.style.display = "none";
  initialNpcScreens.forEach(div => div.style.display = "none");
  midNpcScreens.forEach(div => div.style.display = "none");
  finalNpcScreens.forEach(div => div.style.display = "none");

  requestAnimationFrame(gameLoop);
}

window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();  // 정확한 픽셀 크기
  canvas.width  = rect.width;
  canvas.height = rect.height;
  cw = canvas.width;
  ch = canvas.height;
  bgX = 0;
  bgY = 0;
  bgW = canvas.width;
  bgH = canvas.height;
  paddleX = (bgW - paddleWidth) / 2;
}


function initBricks() {
  cols = Math.floor(bgW / brickWidth);
  brickOffsetLeft = bgX + (bgW - cols * brickWidth) / 2;
  bricks = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[r] = [];
    for (let c = 0; c < cols; c++) {
      const hue = Math.floor(Math.random() * 360);
      const isElectric = Math.random() < 0.2;
      bricks[r][c] = {
        status: 1,
        color: isElectric ? "#ffff00" : `hsl(${hue},70%,50%)`,
        type: isElectric ? "electric" : "normal"
      };
    }
  }
  falling = [];
}

function circleRect(cx, cy, r, rx, ry, rw, rh) {
  const nx = Math.max(rx, Math.min(cx, rx + rw));
  const ny = Math.max(ry, Math.min(cy, ry + rh));
  const dx0 = cx - nx, dy0 = cy - ny;
  return dx0*dx0 + dy0*dy0 <= r*r;
}

function resetBall() {
  x = bgX + bgW / 2;
  y = bgY + bgH - paddleOffset - paddleHeight - ballRadius;
  dx = 5; dy = -5;
}

function explodeBricks(r, c) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (
        nr >= 0 && nr < brickRowCount &&
        nc >= 0 && nc < cols &&
        bricks[nr][nc].status === 1
      ) {
        bricks[nr][nc].status = 0;
      }
    }
  }
}

// ───────────────────────────────────────────────────────────────
// ❾ nextStage(): 스테이지 전환 로직
function nextStage() {
  if (currentStage === 0) {
    console.log("nextStage(): 스테이지1 클리어 → mid NPC 호출");
    stageCleared = true;
    dx = 0; dy = 0;
    //gameContainer.style.display = "none";
    showMidNpcScreen(0);
    return;
  }
  else if (currentStage === 1) {
    console.log("nextStage(): 스테이지1-2 클리어 → final NPC 호출");
    stageCleared = true;
    dx = 0; dy = 0;
    showFinalNpcScreen(0);
    return;
  }
  else {
    alert("🎉 모든 스테이지를 클리어했습니다!");
    location.reload();
  }
}

// ───────────────────────────────────────────────────────────────
// ❿키보드 이벤트 처리
window.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") rightPressed = true;
  if (e.key === "ArrowLeft")  leftPressed  = true;

  if (e.key === "k" || e.key === "K") {
    // “K” 키로 모든 벽돌 제거
    for (let r = 0; r < bricks.length; r++) {
      for (let c = 0; c < bricks[r].length; c++) {
        bricks[r][c].status = 0;
      }
    }
    stageCleared = true;
    nextStage();
  }
});
window.addEventListener("keyup", e => {
  if (e.key === "ArrowRight") rightPressed = false;
  if (e.key === "ArrowLeft")  leftPressed  = false;
});

// ───────────────────────────────────────────────────────────────
// ⓫ 본 게임 루프
function gameLoop() {
ctx.clearRect(0, 0, canvas.width, canvas.height); 
bgW = canvas.width;
bgH = canvas.height;

  if (gameOver) {
    setTimeout(() => { alert("GAME OVER"); location.reload(); }, 10);
    return;
  }

  ctx.clearRect(0, 0, cw, ch);

  // (A) 배경 반투명 그리기
  ctx.globalAlpha = 0.4;
  ctx.drawImage(bgImage, bgX, bgY, bgW, bgH);
  ctx.globalAlpha = 1.0;

  // (B) 벽돌 그리기
  for (let r = 0; r < brickRowCount; r++) {
    for (let c = 0; c < cols; c++) {
      const b = bricks[r][c];
      if (b.status === 1) {
        const bx = brickOffsetLeft + c * brickWidth;
        const by = bgY + brickOffsetTop + r * brickHeight;
        ctx.fillStyle = b.type === "electric" ? "#ffff99" : getPastelColor(r, c);
        ctx.lineJoin = "round";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect?.(bx, by, brickWidth, brickHeight, 10);
        ctx.fill();
        ctx.strokeStyle = "#aaa";
        ctx.stroke();
        ctx.closePath();
        if (b.type === "electric") {
          const iconSize = brickHeight * 0.8;
          const iconX = bx + (brickWidth - iconSize) / 2;
          const iconY = by + (brickHeight - iconSize) / 2;
          ctx.drawImage(lightningImage, iconX, iconY, iconSize, iconSize);
        }
      }
    }
  }

  // (C) 공 그리기
  if (ballW && ballH) {
    ctx.drawImage(ballImage, x - ballW/2, y - ballH/2, ballW, ballH);
  } else {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
  }

  // (D) 패들(강아지) 그리기
  const padY = bgY + bgH - paddleOffset - paddleHeight;
  const dogX = paddleX + (paddleWidth - dogW)/2;
  const dogY = padY + paddleHeight - 70;
  ctx.drawImage(dogImage, dogX, dogY, dogW, dogH);

  // (E) 목숨(하트) 그리기
  for (let i = 0; i < maxLives; i++) {
    ctx.globalAlpha = i < lives ? 1 : 0.3;
    const hx = bgX + bgW - (i+1)*(heartSize+5) - 10;
    const hy = bgY + 10;
    ctx.drawImage(heartImage, hx, hy, heartSize, heartSize);
  }
  ctx.globalAlpha = 1;
  // (E2) 점수판 그리기
  ctx.font = "bold 35px sans-serif";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Score: ${score}`, bgX + 20, bgY + 65);

  // (F) 벽돌 충돌 체크
  const nextX = x + dx, nextY = y + dy;
  outer: for (let r = 0; r < brickRowCount; r++) {
    for (let c = 0; c < cols; c++) {
      const b = bricks[r][c];
      if (b.status !== 1) continue;
      const bx = brickOffsetLeft + c * brickWidth;
      const by = bgY + brickOffsetTop + r * brickHeight;
      if (circleRect(nextX, nextY, ballRadius, bx, by, brickWidth, brickHeight)) {
        const cx = bx + brickWidth/2, cy = by + brickHeight/2;
        if (Math.abs(nextX - cx) > Math.abs(nextY - cy)) dx = -dx; else dy = -dy;
        if (b.type === "electric") {
          explodeBricks(r, c);
          b.status = 0;
        } else {
          b.status = 0;
        }
        if (b.type === "electric") {
  explodeBricks(r, c);
  b.status = 0;
  score += 10;  // 점수 증가
} else {
  b.status = 0;
  score += 10;  // 점수 증가
}

        break outer;
      }
    }
  }

  // (G) 벽 반사 / 패들 충돌 처리
  if (x + dx > bgX + bgW - ballRadius || x + dx < bgX + ballRadius) dx = -dx;
  if (y + dy < bgY + ballRadius) dy = -dy;
  else if (circleRect(x + dx, y + dy, ballRadius, paddleX, padY, paddleWidth, paddleHeight)) {
    dy = -dy;
  } else if (y + dy > bgY + bgH - ballRadius - paddleOffset) {
    lives--;
    resetBall();
  }

  // (H) 남은 벽돌 검사 → 모두 깨면 nextStage() 호출
  const remaining = bricks.flat().filter(b => b.status === 1).length;
  if (remaining === 0 && lives > 0 && !stageCleared) {
    console.log("모든 벽돌 제거됨 → nextStage()"); 
    stageCleared = true;
    nextStage();
    return;
  }

  // (I) 공 위치 업데이트 · 패들 이동 · 목숨 체크
  x += dx;  y += dy;
  if (rightPressed && paddleX < bgX + bgW - paddleWidth) paddleX += 7;
  if (leftPressed && paddleX > bgX)            paddleX -= 7;
  if (lives <= 0) gameOver = true;

  requestAnimationFrame(gameLoop);
}

function getPastelColor(row, col) {
  const hue = ((row + col) * 40) % 360;
  return `hsl(${hue}, 90%, 60%)`;
}

// ───────────────────────────────────────────────────────────────
// ⓬ 메뉴로 돌아가기 버튼 클릭 시
backToMenuBtn.addEventListener("click", () => {
  window.location.href = "../memory_game.html";
});