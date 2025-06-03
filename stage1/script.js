// ───────────────────────────────────────────────────────────────
// ❶ 상단에 DOM 요소 가져오기 (반드시 gameContainer, npcScreen도 선언해야 합니다)
const canvas           = document.getElementById("gameCanvas");
const ctx              = canvas.getContext("2d");
const transitionScreen = document.getElementById("transition-screen");
const gameContainer    = document.getElementById("game-container");
const npcScreen        = document.getElementById("npc-screen");
const backToMenuBtn    = document.getElementById("back-to-menu");

const lightningImage   = new Image();
lightningImage.src     = "lightning.png";

const bgImages = ["background1.jpg", "background2.jpg"].map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

let currentStage = 0;
let bgImage      = bgImages[currentStage];

const heartImage = new Image(); heartImage.src = "heart.png";
const dogImage   = new Image(); dogImage.src   = "dog.png";

const savedSkin = localStorage.getItem("ballSkin") || "basketball.png";
const ballImage = new Image(); ballImage.src = savedSkin;

let ballRadius = 12;
const ballScale     = 0.2;
const brickWidth    = 60;
const brickHeight   = 30;
const brickRowCount = 2;
const brickOffsetTop= 100;
const paddleWidth   = 100;
const paddleHeight  = 0;
const paddleOffset  = 60;
const maxLives      = 3;
const heartSize     = 70;

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
// ❷ init: 페이지 로드 시 한 번 실행
function init() {
  bgImage = bgImages[currentStage];
  resizeCanvas();
  initBricks();
  resetBall();

  lives = maxLives;
  gameOver = false;
  stageCleared = false;

  // “게임 화면”을 보여주고, NPC 화면이나 로딩 화면은 숨기기
  transitionScreen.style.display = "none";
  gameContainer.style.display    = "block";
  npcScreen.style.display        = "none";

  requestAnimationFrame(gameLoop);
}

window.addEventListener("load", init);
window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
  canvas.width  = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  cw = canvas.width; ch = canvas.height;
  const ratio = bgImage.naturalWidth / bgImage.naturalHeight || (16/9);
  bgW = cw; bgH = ch;
  bgX = 0; bgY = 0;
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
// ❸ nextStage: 스테이지가 바뀔 때 호출
function nextStage() {
  if (currentStage === 0) {
    // ───────────────────────────────────
    // 1단계 클리어: 배경은 그대로 두고, NPC 화면만 띄우기
    transitionScreen.style.display = "none";
    // gameContainer는 숨기지 않음 → 게임 배경 그대로 유지
    npcScreen.style.display = "flex";

    // ❶ gameLoop()를 멈추기 위해 stageCleared를 true로 유지해 둡니다.
    // → return으로 인해 gameLoop가 실행되지 않으므로, 배경이 그대로 “멈춘” 상태로 남습니다.
    // (❷ 이후 4초 뒤에 NPC를 닫고 2단계를 재개)
    setTimeout(() => {
      // (2) NPC 창 숨기기 → 뒤에 2단계 게임 재개
      npcScreen.style.display = "none";

      currentStage++;                 
      bgImage = bgImages[currentStage]; 
      initBricks();                   
      resetBall();                    
      stageCleared = false;           // 클리어 플래그 리셋
      requestAnimationFrame(gameLoop); // 2단계 게임 루프 재개
    }, 4000);

    return;
  }
  else if (currentStage === 1) {
    // ───────────────────────────────────
    // 2단계 클리어: 바로 다른 페이지로 이동
    window.location.href = "../stage2/index.html";
  }
  else {
    alert("🎉 모든 스테이지를 클리어했습니다!");
    location.reload();
  }
}

// ───────────────────────────────────────────────────────────────
// ❹ 키보드 이벤트 처리
window.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") rightPressed = true;
  if (e.key === "ArrowLeft")  leftPressed  = true;

  if (e.key === "k" || e.key === "K") {
    // “K”를 누를 때:
    // → 모든 벽돌을 전부 0 상태로 바꿔 직관적으로 깨진 상태로 만든 뒤,
    // → stageCleared를 true로 설정하여 gameLoop가 더 이상 벽돌 체크를 안하도록 합니다.
    for (let r = 0; r < bricks.length; r++) {
      for (let c = 0; c < bricks[r].length; c++) {
        bricks[r][c].status = 0;
      }
    }
    stageCleared = true;

    // → 그리고 즉시 nextStage() 호출
    nextStage();
  }
});
window.addEventListener("keyup", e => {
  if (e.key === "ArrowRight") rightPressed = false;
  if (e.key === "ArrowLeft")  leftPressed  = false;
});

// ───────────────────────────────────────────────────────────────
// ❺ 본 게임 루프
function gameLoop() {
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
    ctx.drawImage(ballImage, x - ballW / 2, y - ballH / 2, ballW, ballH);
  } else {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
  }

  // (D) 패들(강아지) 그리기
  const padY = bgY + bgH - paddleOffset - paddleHeight;
  const dogX = paddleX + (paddleWidth - dogW) / 2;
  const dogY = padY + paddleHeight - 35;
  ctx.drawImage(dogImage, dogX, dogY, dogW, dogH);

  // (E) 목숨(하트) 그리기
  for (let i = 0; i < maxLives; i++) {
    ctx.globalAlpha = i < lives ? 1 : 0.3;
    const hx = bgX + bgW - (i + 1) * (heartSize + 5) - 10;
    const hy = bgY + 10;
    ctx.drawImage(heartImage, hx, hy, heartSize, heartSize);
  }
  ctx.globalAlpha = 1;

  // (F) 벽돌 충돌 체크
  const nextX = x + dx, nextY = y + dy;
  outer: for (let r = 0; r < brickRowCount; r++) {
    for (let c = 0; c < cols; c++) {
      const b = bricks[r][c];
      if (b.status !== 1) continue;
      const bx = brickOffsetLeft + c * brickWidth;
      const by = bgY + brickOffsetTop + r * brickHeight;
      if (circleRect(nextX, nextY, ballRadius, bx, by, brickWidth, brickHeight)) {
        const cx = bx + brickWidth / 2, cy = by + brickHeight / 2;
        if (Math.abs(nextX - cx) > Math.abs(nextY - cy)) dx = -dx;
        else dy = -dy;
        if (b.type === "electric") {
          explodeBricks(r, c);
          b.status = 0;
        } else {
          b.status = 0;
        }
        break outer;
      }
    }
  }

  // (G) 벽 반사/패들 충돌 처리
  if (x + dx > bgX + bgW - ballRadius || x + dx < bgX + ballRadius) dx = -dx;
  if (y + dy < bgY + ballRadius) dy = -dy;
  else if (circleRect(x + dx, y + dy, ballRadius, paddleX, padY, paddleWidth, paddleHeight)) {
    dy = -dy;
  } else if (y + dy > bgY + bgH - ballRadius - paddleOffset) {
    lives--;
    resetBall();
  }

  // (H) 남은 벽돌 검사 → 모두 깨면 nextStage() 호출 후 return
  const remaining = bricks.flat().filter(b => b.status === 1).length;
  if (remaining === 0 && lives > 0 && !stageCleared) {
    stageCleared = true;
    nextStage();
    return; // 여기서 게임 루프 멈추기
  }

  // (I) 공 위치 업데이트 · 패들 이동 · 목숨 체크
  x += dx;  y += dy;
  if (rightPressed && paddleX < bgX + bgW - paddleWidth) paddleX += 7;
  if (leftPressed  && paddleX > bgX)             paddleX -= 7;
  if (lives <= 0) gameOver = true;

  requestAnimationFrame(gameLoop);
}

// ───────────────────────────────────────────────────────────────
// (6) “메뉴로 돌아가기” 버튼 클릭 시
backToMenuBtn.addEventListener("click", () => {
  window.location.href = "../memory_game.html";
});

function getPastelColor(row, col) {
  const hue = ((row + col) * 40) % 360;
  return `hsl(${hue}, 90%, 60%)`;
}
