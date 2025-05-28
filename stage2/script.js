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
const brickWidth    = 60;
const brickHeight   = 30;
const brickRowCount = 2; // 줄임
const brickOffsetTop= 100;
const paddleWidth   = 100;
const paddleHeight  = 0;
const paddleOffset  = 60;
const fallSpeed     = 1;
const maxLives      = 3;
const heartSize     = 70;

// 시간 제한
let startTime = 0;
const timeLimit = 20 * 1000;

// 강아지 크기
let dogW = 0, dogH = 0;
dogImage.onload = () => {
  dogW = paddleWidth * 1.2;
  dogH = dogImage.naturalHeight * (dogW / dogImage.naturalWidth);
};

// 공 이미지 + 반지름
let ballW = 0, ballH = 0;
ballImage.onload = () => {
  ballW = ballImage.naturalWidth * ballScale;
  ballH = ballImage.naturalHeight * ballScale;
  ballRadius = ballW / 2;
};

// 상태 변수
let cw, ch;
let bgX = 0, bgY = 0, bgW = 0, bgH = 0;
let x, y, dx = 6, dy = -6; // 빠르게 시작
let paddleX;
let rightPressed = false, leftPressed = false;
let bricks = [], cols, brickOffsetLeft;
let falling = [];
let lives = maxLives;
let gameOver = false;

// 초기화
function init() {
  resizeCanvas();
  initBricks();
  resetBall();
  lives = maxLives;
  gameOver = false;
  startTime = Date.now();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('load', init);
window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
  canvas.width  = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  cw = canvas.width;
  ch = canvas.height;

  bgW = cw;
  bgH = ch;
  bgX = 0;
  bgY = 0;

  paddleX = (bgW - paddleWidth) / 2;
}

// 벽돌
function initBricks() {
  cols = Math.floor(bgW / brickWidth);
  brickOffsetLeft = bgX + (bgW - cols * brickWidth) / 2;
  bricks = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[r] = [];
    for (let c = 0; c < cols; c++) {
      const hue = Math.floor(Math.random() * 360);
      bricks[r][c] = { status: 1, color: `hsl(${hue},70%,50%)` };
    }
  }
  falling = [];
}

// 입력
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') rightPressed = true;
  if (e.key === 'ArrowLeft')  leftPressed  = true;
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowRight') rightPressed = false;
  if (e.key === 'ArrowLeft')  leftPressed  = false;
});

// 충돌 검사
function circleRect(cx, cy, r, rx, ry, rw, rh) {
  const nx = Math.max(rx, Math.min(cx, rx + rw));
  const ny = Math.max(ry, Math.min(cy, ry + rh));
  const dx0 = cx - nx, dy0 = cy - ny;
  return dx0*dx0 + dy0*dy0 <= r*r;
}

// 공 위치 초기화
function resetBall() {
  x  = bgX + bgW / 2;
  y  = bgY + bgH - paddleOffset - paddleHeight - ballRadius;
  dx = 6;
  dy = -6;
}

// 메인 루프
function gameLoop() {
  const elapsed = Date.now() - startTime;
  if (elapsed > timeLimit) {
    setTimeout(() => { alert('TIME OVER'); location.reload(); }, 10);
    return;
  }

  if (gameOver) {
    setTimeout(() => { alert('GAME OVER'); location.reload(); }, 10);
    return;
  }
  ctx.clearRect(0, 0, cw, ch);
// 배경만 투명하게
ctx.globalAlpha = 0.4;
ctx.drawImage(bgImage, bgX, bgY, bgW, bgH);
ctx.globalAlpha = 1.0;


  // 벽돌
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

  // 공
  if (ballW && ballH) {
    ctx.drawImage(ballImage, x - ballW/2, y - ballH/2, ballW, ballH);
  } else {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
  }

  // 패들(강아지)
  const padY = bgY + bgH - paddleOffset - paddleHeight;
  const dogX = paddleX + (paddleWidth - dogW) / 2;
  const dogY = padY + paddleHeight - 35;
  ctx.drawImage(dogImage, dogX, dogY, dogW, dogH);

  // 하트
  for (let i = 0; i < maxLives; i++) {
    ctx.globalAlpha = i < lives ? 1 : 0.3;
    const hx = bgX + bgW - (i+1)*(heartSize+5) - 10;
    const hy = bgY + 10;
    ctx.drawImage(heartImage, hx, hy, heartSize, heartSize);
  }
  ctx.globalAlpha = 1;

  // 남은 시간 시계 표시
  const remainingTime = Math.max(0, Math.ceil((timeLimit - elapsed) / 1000));
  ctx.font = "bold 32px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(`Time: ${remainingTime}s`, bgX + 20, bgY + 45);

  // 벽돌 충돌
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

  // 벽, 패들, 바닥 충돌
  if (x + dx > bgX + bgW - ballRadius || x + dx < bgX + ballRadius) dx = -dx;
  if (y + dy < bgY + ballRadius) dy = -dy;
  else if (circleRect(x + dx, y + dy, ballRadius, paddleX, padY, paddleWidth, paddleHeight)) {
    dy = -dy;
  } else if (y + dy > bgY + bgH - ballRadius - paddleOffset) {
    lives--;
    resetBall();
  }

  // 승리
  const remaining = bricks.flat().filter(b => b.status === 1).length;
  if (remaining === 0 && falling.length === 0 && lives > 0) {
    setTimeout(() => {
      alert('YOU WIN!');
      location.reload();
    }, 10);
    return;
  }

  // 위치 이동
  x += dx; y += dy;
  if (rightPressed && paddleX < bgX + bgW - paddleWidth) paddleX += 7;
  if (leftPressed  && paddleX > bgX) paddleX -= 7;

  if (lives <= 0) gameOver = true;

  requestAnimationFrame(gameLoop);
}
