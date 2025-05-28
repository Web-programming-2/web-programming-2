const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 이미지 로드
const bgImage     = new Image(); bgImage.src     = 'background.jpg';
const heartImage  = new Image(); heartImage.src  = 'heart.png';
const dogImage    = new Image(); dogImage.src    = 'dog.png';
const ballImage   = new Image(); ballImage.src   = 'basketball.png';

// 설정
let ballRadius      = 12;
const ballScale     = 0.2;
const brickWidth    = 75;
const brickHeight   = 20;
const brickRowCount = 3;
const brickOffsetTop= 50;
const paddleWidth   = 75;
const paddleHeight  = 10;
const paddleOffset  = 60;
const fallSpeed     = 1;
const maxLives      = 3;
const heartSize     = 50;

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
let x, y, dx = 3, dy = -3;
let paddleX;
let rightPressed = false, leftPressed = false;
let bricks = [], cols, brickOffsetLeft;
let falling = [];
let lives = maxLives;
let gameOver = false;

function init() {
  resizeCanvas();
  initBricks();
  resetBall();
  lives = maxLives;
  gameOver = false;
  requestAnimationFrame(gameLoop);
}

window.addEventListener('load', init);
window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
  const desiredRatio = 9 / 16;
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;

  let width = maxWidth;
  let height = width / desiredRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * desiredRatio;
  }

  canvas.width = width;
  canvas.height = height;

  cw = width;
  ch = height;

  bgW = width;
  bgH = height;
  bgX = 0;
  bgY = 0;

  paddleX = (width - paddleWidth) / 2;
}

function initBricks() {
  cols = Math.floor(bgW / brickWidth);
  brickOffsetLeft = bgX + (bgW - cols * brickWidth) / 2;
  bricks = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[r] = [];
    for (let c = 0; c < cols; c++) {
      const hue = Math.floor(Math.random() * 360);
      bricks[r][c] = {
        status: 1,
        color: `hsl(${hue},70%,50%)`,
        type: Math.random() < 0.1 ? 'heal' : 'normal'
      };
    }
  }
  falling = [];
}

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') rightPressed = true;
  if (e.key === 'ArrowLeft')  leftPressed  = true;
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowRight') rightPressed = false;
  if (e.key === 'ArrowLeft')  leftPressed  = false;
});
canvas.addEventListener('mousemove', e => {
  let mx = e.clientX - paddleWidth / 2;
  mx = Math.max(bgX, Math.min(mx, bgX + bgW - paddleWidth));
  paddleX = mx;
});

function circleRect(cx, cy, r, rx, ry, rw, rh) {
  const nx = Math.max(rx, Math.min(cx, rx + rw));
  const ny = Math.max(ry, Math.min(cy, ry + rh));
  const dx0 = cx - nx, dy0 = cy - ny;
  return dx0*dx0 + dy0*dy0 <= r*r;
}

function resetBall() {
  x  = bgX + bgW / 2;
  y  = bgY + bgH - paddleOffset - paddleHeight - ballRadius;
  dx = 3;
  dy = -3;
}

function drawBackground() {
  const iw = bgImage.width;
  const ih = bgImage.height;
  const cw = canvas.width;
  const ch = canvas.height;

  const scale = Math.max(cw / iw, ch / ih);
  const sw = iw * scale;
  const sh = ih * scale;
  const sx = (cw - sw) / 2;
  const sy = (ch - sh) / 2;

  ctx.drawImage(bgImage, sx, sy, sw, sh);
}

function gameLoop() {
  if (gameOver) {
    setTimeout(() => { alert('GAME OVER'); location.reload(); }, 10);
    return;
  }

  ctx.clearRect(0, 0, cw, ch);
  ctx.globalAlpha = 0.4;
  ctx.drawImage(bgImage, bgX, bgY, bgW, bgH);
  ctx.globalAlpha = 1.0;

  drawBackground();

  for (let r = 0; r < brickRowCount; r++) {
    for (let c = 0; c < cols; c++) {
      const b = bricks[r][c];
      if (b.status === 1) {
        const bx = brickOffsetLeft + c * brickWidth;
        const by = bgY + brickOffsetTop + r * brickHeight;
        ctx.fillStyle = b.color;
        ctx.fillRect(bx, by, brickWidth, brickHeight);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, brickWidth, brickHeight);
      }
    }
  }

  if (falling.length === 0) {
    const candidates = [];
    for (let r = brickRowCount - 1; r >= 0; r--) {
      for (let c = 0; c < cols; c++) {
        if (bricks[r][c].status === 1 &&
            (r === brickRowCount - 1 || bricks[r+1][c].status === 0)) {
          candidates.push({ r, c });
        }
      }
      if (candidates.length) break;
    }
    if (candidates.length) {
      const { r, c } = candidates[Math.floor(Math.random() * candidates.length)];
      const fx = brickOffsetLeft + c * brickWidth;
      const fy = bgY + brickOffsetTop + r * brickHeight;
      const color = bricks[r][c].color;
      bricks[r][c].status = 0;
      falling.push({ x: fx, y: fy, w: brickWidth, h: brickHeight, color });
    }
  }

  for (let i = falling.length - 1; i >= 0; i--) {
    const f = falling[i];
    if (circleRect(x + dx, y + dy, ballRadius, f.x, f.y, f.w, f.h)) {
      const cx = f.x + f.w/2, cy = f.y + f.h/2;
      const diffX = (x + dx) - cx, diffY = (y + dy) - cy;
      if (Math.abs(diffX) > Math.abs(diffY)) dx = -dx;
      else dy = -dy;
      falling.splice(i, 1);
      continue;
    }

    f.y += fallSpeed;

    if (f.y + f.h > bgY + bgH - paddleOffset) {
      falling.splice(i, 1);
      lives--;
      resetBall();
    } else {
      ctx.fillStyle = f.color;
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.strokeRect(f.x, f.y, f.w, f.h);
    }
  }

  if (ballW && ballH) {
    ctx.drawImage(ballImage, x - ballW/2, y - ballH/2, ballW, ballH);
  } else {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
  }

  const padY = bgY + bgH - paddleOffset - paddleHeight;

  // 강아지 위치
  const dogX = paddleX + (paddleWidth - dogW) / 2;
  const dogY = padY + paddleHeight - 35;
  ctx.drawImage(dogImage, dogX, dogY, dogW, dogH);

  for (let i = 0; i < maxLives; i++) {
    ctx.globalAlpha = i < lives ? 1 : 0.3;
    const hx = bgX + bgW - (i+1)*(heartSize+5) - 10;
    const hy = bgY + 10;
    ctx.drawImage(heartImage, hx, hy, heartSize, heartSize);
  }
  ctx.globalAlpha = 1;

  const nextX = x + dx, nextY = y + dy;
  outer: for (let r = 0; r < brickRowCount; r++) {
    for (let c = 0; c < cols; c++) {
      const b = bricks[r][c];
      if (b.status !== 1) continue;
      const bx = brickOffsetLeft + c * brickWidth;
      const by = bgY + brickOffsetTop + r * brickHeight;
      if (circleRect(nextX, nextY, ballRadius, bx, by, brickWidth, brickHeight)) {
        const cx = bx + brickWidth/2, cy = by + brickHeight/2;
        if (Math.abs(nextX - cx) > Math.abs(nextY - cy)) dx = -dx;
        else dy = -dy;
        b.status = 0;
        break outer;
      }
    }
  }

  if (x + dx > bgX + bgW - ballRadius || x + dx < bgX + ballRadius) dx = -dx;
  if (y + dy < bgY + ballRadius) dy = -dy;
  else if (circleRect(x + dx, y + dy, ballRadius, dogX, dogY, dogW, dogH)) {
    dy = -dy;
  } else if (y + dy > bgY + bgH - ballRadius - paddleOffset) {
    lives--;
    resetBall();
  }

  const remaining = bricks.flat().filter(b => b.status === 1).length;
  if (remaining === 0 && falling.length === 0 && lives > 0) {
    setTimeout(() => {
      alert('YOU WIN!');
      location.reload();
    }, 10);
    return;
  }

  x += dx; y += dy;
  if (rightPressed && paddleX < bgX + bgW - paddleWidth) paddleX += 7;
  if (leftPressed  && paddleX > bgX) paddleX -= 7;

  if (lives <= 0) gameOver = true;

  requestAnimationFrame(gameLoop);
}
