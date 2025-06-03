/* ---------- canvas & transition ---------- */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const transitionScreen = document.getElementById("transition-screen");
const lightningImage = new Image();
lightningImage.src = 'lightning.png'; // 실제 번개 아이콘 경로 확인


/* ---------- stage data ---------- */
const stageBGs = ["background1.jpg", "background2.jpg"];
let currentStage = 0;
let stageCleared = false;
const bgImage = new Image();
bgImage.src = stageBGs[currentStage];

/* ---------- sprites ---------- */

const heartImage  = new Image(); heartImage.src = "heart.png";
const dogImage    = new Image(); dogImage.src   = "dog.png";


const savedSkin  = localStorage.getItem('ballSkin') || 'basketball.png';
const ballImage  = new Image(); ballImage.src   = savedSkin;


/* ---------- constants ---------- */
const ballScale = 0.2;
const brickWidth = 60;
const brickHeight = 30;
const brickOffsetTop = 100;
const paddleWidth = 100;
const paddleHeight = 0;
const paddleOffset = 60;
const fallSpeed = 1;
const maxLives = 3;
const heartSize = 70;
const timeLimit = 30_000;

let hourglasses = []; // 모래시계 아이템 목록
let extraTime = 0; // 추가된 시간 저장

/* ---------- run-time state ---------- */
let ballW = 0, ballH = 0, ballR = 12;
let dogW = 0, dogH = 0;
let cw, ch, bgW, bgH, bgX = 0, bgY = 0;
let x, y, dx = 6, dy = -6;
let paddleX;
let rightPressed = false, leftPressed = false;
let bricks = [], cols, brickLeft, brickTop, brickW, brickH;
let brickRows = 3;
let fall = [];
let paddleOff = paddleOffset;
let lives = maxLives, gameOver = false;
let startTime = 0;

/* ---------- sprite sizing ---------- */
ballImage.onload = () => {
  ballW = ballImage.naturalWidth * ballScale;
  ballH = ballImage.naturalHeight * ballScale;
  ballR = ballW / 2;
};
dogImage.onload = () => {
  dogW = paddleWidth * 1.2;
  dogH = dogImage.naturalHeight * (dogW / dogImage.naturalWidth);
};

/* ---------- helpers ---------- */
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  cw = bgW = canvas.width;
  ch = bgH = canvas.height;
  paddleX = (bgW - paddleWidth) / 2;
}
function drawHourglass(ctx, x, y, width, height) {
  const w = width;
  const h = height;

  // 외곽선 + 모래시계 모양
  ctx.strokeStyle = "goldenrod";     // 외곽 테두리 색
  ctx.lineWidth = 2;
  ctx.fillStyle = "moccasin";        // 내부 모래 색

  ctx.beginPath();
  ctx.moveTo(x, y);                   // 좌상단
  ctx.lineTo(x + w, y);              // 우상단
  ctx.lineTo(x + w / 2, y + h / 2);  // 중앙 (교차점)
  ctx.lineTo(x + w, y + h);          // 우하단
  ctx.lineTo(x, y + h);              // 좌하단
  ctx.lineTo(x + w / 2, y + h / 2);  // 중앙
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 중앙 모래 점 표현
  ctx.fillStyle = "orange";
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, 3, 0, Math.PI * 2);
  ctx.fill();
}

function circRect(cx, cy, r, rx, ry, rw, rh) {
  const nx = Math.max(rx, Math.min(cx, rx + rw));
  const ny = Math.max(ry, Math.min(cy, ry + rh));
  return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r;
}

function initBricks() {
  brickRows = currentStage === 1 ? 3 : 1;
  cols = Math.floor(bgW / brickWidth);
  brickLeft = (bgW - cols * brickWidth) / 2;
  brickTop = brickOffsetTop;
  brickW = brickWidth;
  brickH = brickHeight;

  bricks = Array.from({ length: brickRows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      status: 1,
      color: getPastelColor(r, c)
    }))
  );
  fall.length = 0;
}


function getPastelColor(row, col) {
  const hue = ((row + col) * 40) % 360;
  return `hsl(${hue}, 90%, 60%)`;
}

function resetBall() {
  x = bgW / 2;
  y = bgH - paddleOffset - paddleHeight - ballR;
  dx = 6;
  dy = -6;
  fall.length = 0;
}
function nextStage() {
  stageCleared = false;
  bgImage.src = stageBGs[currentStage];
  initBricks();
  resetBall();
  lives = maxLives;
  startTime = Date.now();
  requestAnimationFrame(gameLoop);
}
/* ---------- game loop ---------- */
function gameLoop() {
  const elapsed = Date.now() - startTime;

  if (elapsed > timeLimit + extraTime) {
    alert("TIME OVER");
    location.reload();
    return;
  }
  if (gameOver) {
    alert("GAME OVER");
    location.reload();
    return;
  }
  const remain = Math.max(0, Math.ceil((timeLimit + extraTime - elapsed) / 1000));
  ctx.clearRect(0, 0, cw, ch);
  ctx.globalAlpha = 0.4;
  ctx.drawImage(bgImage, bgX, bgY, bgW, bgH);
  ctx.globalAlpha = 1;
  // draw timer
  ctx.font = "bold 28px sans-serif";
  ctx.fillStyle = "yellow";
  ctx.fillText(`TIME: ${remain}s`, 20, 40);
  // draw bricks
  // draw bricks
  for (let r = 0; r < brickRows; r++) {
    for (let c = 0; c < cols; c++) {
      const b = bricks[r][c]; if (!b.status) continue;
      const bx = brickLeft + c * brickW;
      const by = brickTop + r * brickH;

      ctx.fillStyle = b.color;
      ctx.lineJoin = "round";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect?.(bx, by, brickW, brickH, 10);
      ctx.fill();
      ctx.strokeStyle = "#aaa";
      ctx.stroke();
      ctx.closePath();
    }
  }
  // draw ball
  ballW
    ? ctx.drawImage(ballImage, x - ballW / 2, y - ballH / 2, ballW, ballH)
    : (ctx.beginPath(), ctx.arc(x, y, ballR, 0, Math.PI * 2),
      ctx.fillStyle = "#0095DD", ctx.fill());
  // draw dog paddle
  const padY = bgH - paddleOffset - paddleHeight;
  const dogX = paddleX + (paddleWidth - dogW) / 2;
  const dogY = padY - 35;
  ctx.drawImage(dogImage, dogX, dogY, dogW, dogH);
  for (let i = hourglasses.length - 1; i >= 0; i--) {
  const hg = hourglasses[i];
  hg.y += 2;

  //모래시계
  drawHourglass(ctx, hg.x, hg.y, hg.w, hg.h);


  // 충돌 검사
  if (circRect(x, y, ballR, hg.x, hg.y, hg.w, hg.h)) {
    extraTime += 5000; // 5초 추가
    hourglasses.splice(i, 1);
    continue;
  }

  // 화면 벗어나면 제거
  if (hg.y > ch) hourglasses.splice(i, 1);
}

  // draw hearts
  for (let i = 0; i < maxLives; i++) {
    ctx.globalAlpha = i < lives ? 1 : .3;
    const hx = bgW - (i + 1) * (heartSize + 5) - 10;
    ctx.drawImage(heartImage, hx, 10, heartSize, heartSize);
  }
  ctx.globalAlpha = 1;

  // draw timer
  ctx.font = "bold 28px sans-serif";
  ctx.fillStyle = "yellow";
  ctx.fillText(`TIME: ${remain}s`, 20, 40);

  // collision with bricks
  const nx = x + dx, ny = y + dy;
  outer: for (let r = 0; r < brickRows; r++) {
    for (let c = 0; c < cols; c++) {
      const b = bricks[r][c]; if (!b.status) continue;
      const bx = brickLeft + c * brickW;
      const by = brickTop + r * brickH;
      if (circRect(nx, ny, ballR, bx, by, brickW, brickH)) {
        Math.abs(nx - (bx + brickW / 2)) > Math.abs(ny - (by + brickH / 2)) ? dx = -dx : dy = -dy;
        b.status = 0;
        break outer;
      }
    }
  }

  // wall and paddle
  if (nx < ballR || nx > bgW - ballR) dx = -dx;
  if (ny < ballR) dy = -dy;
  else if (circRect(nx, ny, ballR, paddleX, padY, paddleWidth, paddleHeight)) dy = -dy;
  else if (ny > bgH - ballR - paddleOffset) { lives--; resetBall(); }

  // stage 2 falling blocks
  if (currentStage === 1) {
    if (fall.length === 0) {
      const cand = [];
      for (let r = brickRows - 1; r >= 0; r--) {
        for (let c = 0; c < cols; c++) {
          if (
            bricks[r][c].status &&
            (r === brickRows - 1 || !bricks[r + 1]?.[c]?.status)
          ) {
            cand.push({ r, c });
          }
        }
        if (cand.length) break;
      }

      if (cand.length) {
        const { r, c } = cand[Math.floor(Math.random() * cand.length)];
        const fx = brickLeft + c * brickW;
        const fy = brickTop + r * brickH;
        const col = bricks[r][c].color;
        bricks[r][c].status = 0;
        fall.push({ x: fx, y: fy, w: brickW, h: brickH, color: col });
      }
    }

      for (let i = fall.length - 1; i >= 0; i--) {
        const f = fall[i];
      if (circRect(x + dx, y + dy, ballR, f.x, f.y, f.w, f.h)) {
        Math.abs((x + dx) - (f.x + f.w / 2)) > Math.abs((y + dy) - (f.y + f.h / 2))
          ? (dx = -dx) : (dy = -dy);
        fall.splice(i, 1);
        continue;
      }

      f.y += fallSpeed;

      if (f.y + f.h > ch - paddleOff) {
        fall.splice(i, 1);
        lives--;
        resetBall();
      } else {
        ctx.fillStyle = f.color;
        ctx.lineJoin = "round";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect?.(f.x, f.y, f.w, f.h, 10);
        ctx.fill();
        ctx.strokeStyle = "#aaa";
        ctx.stroke();
        ctx.closePath();
      }
    }
  }
  if (currentStage === 1 && Math.random() < 0.003) { // 확률 조절
  const hx = Math.random() * (bgW - 40) + 20;
  hourglasses.push({ x: hx, y: -30, w: 30, h: 30 });
}


  // stage clear
// stage clear
const bricksRemain = bricks.flat().some(b => b.status);
if (!bricksRemain && !stageCleared) {
  stageCleared = true;
  if (currentStage < stageBGs.length - 1) {
    transitionScreen.style.display = 'flex';
    setTimeout(() => {
      transitionScreen.style.display = 'none';
      currentStage++;
      nextStage();
    }, 2000);
    return;
  } else {
    transitionScreen.style.display = 'flex';
    setTimeout(() => {
      transitionScreen.style.display = 'none';
      // Stage 2가 끝났으므로 Stage 3로 이동
      window.location.href = "../stage3/index.html";
    }, 2000);
    return;
  }
}


  x += dx; y += dy;
  if (rightPressed && paddleX < bgW - paddleWidth) paddleX += 7;
  if (leftPressed && paddleX > 0) paddleX -= 7;
  if (lives <= 0) gameOver = true;

  requestAnimationFrame(gameLoop);
}

/* ---------- menu ---------- */
function goToMenu() {
  window.location.href = "../memory_game.html";
}

/* ---------- input ---------- */
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') rightPressed = true;
  if (e.key === 'ArrowLeft') leftPressed = true;
    if (e.key === 'k' || e.key === 'K') {
    for (let r = 0; r < bricks.length; r++) {
      for (let c = 0; c < bricks[r].length; c++) {
        bricks[r][c].status = 0;
      }
    }
  }
  
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowRight') rightPressed = false;
  if (e.key === 'ArrowLeft') leftPressed = false;
});

/* ---------- start ---------- */
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
  resizeCanvas();
  initBricks();
  resetBall();
  startTime = Date.now();
  requestAnimationFrame(gameLoop);
});
