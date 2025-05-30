/* ----------  캔버스 & 전환 화면  ---------- */
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
const trans  = document.getElementById("transition-screen");

/* ----------  스테이지 데이터  ---------- */
const stageBGs   = ["background1.jpg", "background2.jpg"];
let   curStage   = 0;
let   stageClear = false;
const bgImg      = new Image();
bgImg.src        = stageBGs[curStage];

/* ----------  스프라이트  ---------- */
const savedSkin  = localStorage.getItem('ballSkin') || 'basketball.png';
const ballImg    = new Image(); ballImg.src  = savedSkin;
const dogImg     = new Image(); dogImg.src   = "dog.png";
const heartImg   = new Image(); heartImg.src = "heart.png";

/* ----------  전역 상태  ---------- */
let cw, ch, bgW, bgH;

/* Ball */
let ballW = 0, ballH = 0, ballR = 12, ballScale = 0.2;
let x, y, dx = 3, dy = -3;

/* Paddle / Dog */
const paddleW   = 75;
const paddleH   = 10;
const paddleOff = 60;
let   paddleX;
let   dogW = 0, dogH = 0;

/* Bricks */
const brickW     = 75;
const brickH     = 20;
const brickRows  = 3;
const brickTop   = 100;
let   cols, brickLeft, bricks = [];

/* Falling blocks */
const fall      = [];     // {x,y,w,h,color}
const fallSpeed = 1;

/* Lives */
let lives    = 3;
const maxLives = 3;
const heartS   = 50;

/* Control */
let right = false, left = false, gameOver = false;

/* ----------  이미지 로드 시 크기 계산  ---------- */
ballImg.onload = () => {
  ballW = ballImg.naturalWidth  * ballScale;
  ballH = ballImg.naturalHeight * ballScale;
  ballR = ballW / 2;
};

dogImg.onload = () => {
  dogW = paddleW * 1.2;
  dogH = dogImg.naturalHeight * (dogW / dogImg.naturalWidth);
};

/* ----------  유틸리티  ---------- */
function resize() {
  const ratio  = 9 / 16;
  const winW   = window.innerWidth;
  const winH   = window.innerHeight;
  let   w      = winW;
  let   h      = w / ratio;

  if (h > winH) {
    h = winH;
    w = h * ratio;
  }
  canvas.width  = w;
  canvas.height = h;

  cw = bgW = w;
  ch = bgH = h;

  paddleX = (cw - paddleW) / 2;
}

function buildBricks() {
  cols      = Math.floor(cw / brickW);
  brickLeft = (cw - cols * brickW) / 2;

  bricks = Array.from({ length: brickRows }, () =>
      Array.from({ length: cols }, () => ({
        status: 1,
        color : `hsl(${Math.random() * 360},70%,50%)`
      }))
  );

  fall.length = 0;
}

function resetBall() {
  const cx  = paddleX + paddleW / 2;
  const padY = ch - paddleOff - paddleH;
  const top = padY;
  const gap = 0;  // 거의 붙임

  x  = cx;
  y  = top - gap - ballR;

  const speed = 4;
  const angle = Math.PI / 6 + Math.random() * Math.PI / 6; // 30°–60°
  const dir   = Math.random() < 0.5 ? -1 : 1;

  dx = Math.cos(angle) * speed * dir;
  dy = -Math.sin(angle) * speed;
}

function circRect(cx, cy, r, rx, ry, rw, rh) {
  const nx = Math.max(rx, Math.min(cx, rx + rw));
  const ny = Math.max(ry, Math.min(cy, ry + rh));
  return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r;
}

function drawBG() {
  if (!bgImg.complete || !bgImg.naturalWidth) return;

  const s  = Math.max(cw / bgImg.width, ch / bgImg.height);
  const w  = bgImg.width  * s;
  const h  = bgImg.height * s;
  const sx = (cw - w) / 2;
  const sy = (ch - h) / 2;

  ctx.filter = "blur(3px)";
  ctx.drawImage(bgImg, sx, sy, w, h);
  ctx.filter = "none";
}

function showLoad(cb) {
  if (!trans) { cb(); return; }
  trans.style.display = "flex";
  setTimeout(() => {
    trans.style.display = "none";
    cb();
  }, 2000);
}

function nextStage() {
  stageClear = false;
  bgImg.src  = stageBGs[curStage];
  buildBricks();
  resetBall();
}

/* ----------  초기화 함수  ---------- */
function init() {
  resize();
  buildBricks();
  resetBall();
  requestAnimationFrame(loop);
}

/* ----------  메인 루프  ---------- */
function loop() {
  if (gameOver) {
    alert("GAME OVER");
    location.reload();
    return;
  }

  ctx.clearRect(0, 0, cw, ch);
  drawBG();

  /* bricks */
  for (let r = 0; r < brickRows; r++) {
    for (let c = 0; c < cols; c++) {
      const b = bricks[r][c];
      if (!b.status) continue;

      const bx = brickLeft + c * brickW;
      const by = brickTop  + r * brickH;

      ctx.fillStyle   = b.color;
      ctx.strokeStyle = "#333";
      ctx.fillRect(bx, by, brickW, brickH);
      ctx.strokeRect(bx, by, brickW, brickH);
    }
  }

  /* falling blocks 생성 */
  if (fall.length === 0) {
    const cand = [];
    for (let r = brickRows - 1; r >= 0; r--) {
      for (let c = 0; c < cols; c++) {
        if (
            bricks[r][c].status &&
            (r === brickRows - 1 || !bricks[r + 1][c].status)
        ) {
          cand.push({ r, c });
        }
      }
      if (cand.length) break;
    }

    if (cand.length) {
      const { r, c } = cand[(Math.random() * cand.length) | 0];
      const fx  = brickLeft + c * brickW;
      const fy  = brickTop  + r * brickH;
      const col = bricks[r][c].color;

      bricks[r][c].status = 0;
      fall.push({ x: fx, y: fy, w: brickW, h: brickH, color: col });
    }
  }

  /* falling blocks 이동 & 충돌 */
  for (let i = fall.length - 1; i >= 0; i--) {
    const f = fall[i];

    if (circRect(x + dx, y + dy, ballR, f.x, f.y, f.w, f.h)) {
      Math.abs((x + dx) - (f.x + f.w / 2)) >
      Math.abs((y + dy) - (f.y + f.h / 2))
          ? (dx = -dx)
          : (dy = -dy);
      fall.splice(i, 1);
      continue;
    }

    f.y += fallSpeed;

    const padY = ch - paddleOff - paddleH;
    if (f.y + f.h > padY) {
      fall.splice(i, 1);
      lives--;
      resetBall();
    } else {
      ctx.fillStyle   = f.color;
      ctx.strokeStyle = "#333";
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.strokeRect(f.x, f.y, f.w, f.h);
    }
  }

  /* ball */
  if (ballW) ctx.drawImage(ballImg, x - ballW / 2, y - ballH / 2, ballW, ballH);
  else {
    ctx.beginPath();
    ctx.arc(x, y, ballR, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
  }

  /* paddle & dog */
  const padY  = ch - paddleOff - paddleH;
  const dogX  = paddleX + (paddleW - dogW) / 2;
  const dogY  = padY - 35;  // 시각적 오프셋
  ctx.drawImage(dogImg, dogX, dogY, dogW, dogH);

  /* hearts */
  for (let i = 0; i < maxLives; i++) {
    ctx.globalAlpha = i < lives ? 1 : 0.3;
    ctx.drawImage(
        heartImg,
        cw - (i + 1) * (heartS + 5) - 10,
        10,
        heartS,
        heartS
    );
  }
  ctx.globalAlpha = 1;

  /* collision with bricks */
  const nx = x + dx;
  const ny = y + dy;

  outer: for (let r = 0; r < brickRows; r++) {
    for (let c = 0; c < cols; c++) {
      const b = bricks[r][c];
      if (!b.status) continue;

      const bx = brickLeft + c * brickW;
      const by = brickTop  + r * brickH;

      if (circRect(nx, ny, ballR, bx, by, brickW, brickH)) {
        Math.abs(nx - (bx + brickW / 2)) >
        Math.abs(ny - (by + brickH / 2))
            ? (dx = -dx)
            : (dy = -dy);
        b.status = 0;
        break outer;
      }
    }
  }

  /* walls & paddle collision */
  if (nx < ballR || nx > cw - ballR) dx = -dx;
  if (ny < ballR)                    dy = -dy;
  else if (circRect(nx, ny, ballR,
      paddleX, padY, paddleW, paddleH)) {
    dy = -dy;
  }
  else if (ny > ch - ballR - paddleOff) {
    lives--;
    resetBall();
  }

  /* stage clear */
  const bricksLeft = bricks.flat().some(b => b.status);
  if (!bricksLeft && !fall.length && !stageClear) {
    stageClear = true;

    if (curStage < stageBGs.length - 1) {
      showLoad(() => {
        curStage++;
        nextStage();
      });
    } else {
      alert("YOU WIN!");
      location.reload();
      return;
    }
  }

  /* move */
  x += dx;
  y += dy;

  if (right && paddleX < cw - paddleW) paddleX += 7;
  if (left  && paddleX > 0          ) paddleX -= 7;

  if (lives <= 0) gameOver = true;
  requestAnimationFrame(loop);
}

function goToMenu() {
  window.location.href = "../memory_game.html";
}

/* ----------  이벤트 ---------- */
window.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") right = true;
  if (e.key === "ArrowLeft")  left  = true;
});
window.addEventListener("keyup", e => {
  if (e.key === "ArrowRight") right = false;
  if (e.key === "ArrowLeft")  left  = false;
});
canvas.addEventListener("mousemove", e => {
  paddleX = Math.max(0, Math.min(e.clientX - paddleW / 2, cw - paddleW));
});
window.addEventListener("resize", resize);
window.addEventListener("load", init);
