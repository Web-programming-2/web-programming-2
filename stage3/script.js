const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 이미지 로드
const bgImage     = new Image(); bgImage.src     = 'background.jpg';
const heartImage  = new Image(); heartImage.src  = 'heart.png';
const dogImage    = new Image(); dogImage.src    = 'dog.png';
const ballImage   = new Image(); ballImage.src   = 'basketball.png';

// 설정
let ballRadius      = 12;    // 기본 반지름 (이미지 로드 후 override)
const ballScale     = 0.2;   // 1:1 이미지 기준 배율 (조정 시 변경)
const brickWidth    = 75;
const brickHeight   = 20;
const brickRowCount = 3;
const brickOffsetTop= 50;
const paddleWidth   = 75;
const paddleHeight  = 10;
const paddleOffset  = 60;    // 바닥에서 패들 위로 띄움
const fallSpeed     = 1;
const maxLives      = 3;
const heartSize     = 20;    // 하트 아이콘 크기

// 강아지 크기
let dogW = 0, dogH = 0;
dogImage.onload = () => {
  dogW = paddleWidth * 1.2;
  dogH = dogImage.naturalHeight * (dogW / dogImage.naturalWidth);
};

// 공 이미지 + 크기 및 반지름 재설정
let ballW = 0, ballH = 0;
ballImage.onload = () => {
  ballW = ballImage.naturalWidth * ballScale;
  ballH = ballImage.naturalHeight * ballScale;
  ballRadius = ballW / 2;  // 반지름을 이미지 절반으로 맞춤
};

// 상태 변수
let cw, ch;
let bgX = 0, bgY = 0, bgW = 0, bgH = 0, aspectRatio = 16/9;
let x, y, dx = 3, dy = -3;
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
  requestAnimationFrame(gameLoop);
}

window.addEventListener('load', init);
window.addEventListener('resize', resizeCanvas);

// 캔버스 크기 및 배경 비율 조정
function resizeCanvas() {
  cw = window.innerWidth;
  ch = window.innerHeight;
  canvas.width  = cw;
  canvas.height = ch;

  if (bgImage.naturalWidth && bgImage.naturalHeight) {
    aspectRatio = bgImage.naturalWidth / bgImage.naturalHeight;
  }

  // 배경만 넓히기 
  const expandRatio = 1.4;
  bgH = ch;
  bgW = (ch * aspectRatio) * expandRatio; // 가로만 확대

  bgX = (cw - bgW) / 2;
  bgY = 0;

  // 패들 초기 X
  paddleX = bgX + (bgW - paddleWidth) / 2;
}

// 벽돌 초기화
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

// 입력 처리
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

// 원-사각 충돌 검사
function circleRect(cx, cy, r, rx, ry, rw, rh) {
  const nx = Math.max(rx, Math.min(cx, rx + rw));
  const ny = Math.max(ry, Math.min(cy, ry + rh));
  const dx0 = cx - nx, dy0 = cy - ny;
  return dx0*dx0 + dy0*dy0 <= r*r;
}

// 공 초기 위치 재설정
function resetBall() {
  x  = bgX + bgW / 2;
  y  = bgY + bgH - paddleOffset - paddleHeight - ballRadius;
  dx = 3;
  dy = -3;
}

// 메인 루프
function gameLoop() {
  if (gameOver) {
    setTimeout(() => { alert('GAME OVER'); location.reload(); }, 10);
    return;
  }
  ctx.clearRect(0, 0, cw, ch);

  // 배경
  ctx.drawImage(bgImage, bgX, bgY, bgW, bgH);

  // 정적 벽돌 그리기
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

  // 떨어지는 블록 스폰 (한 번에 하나)
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

  // 떨어지는 블록 업데이트 및 충돌/생명 처리
  for (let i = falling.length - 1; i >= 0; i--) {
    const f = falling[i];

    // 예측 위치로 블록 충돌 검사
    if (circleRect(x + dx, y + dy, ballRadius, f.x, f.y, f.w, f.h)) {
      const cx = f.x + f.w/2, cy = f.y + f.h/2;
      const diffX = (x + dx) - cx, diffY = (y + dy) - cy;
      if (Math.abs(diffX) > Math.abs(diffY)) dx = -dx;
      else dy = -dy;
      falling.splice(i, 1);
      continue;
    }

    // 중력 적용
    f.y += fallSpeed;

    // 바닥 닿으면 생명 차감
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

  // 공 그리기 (이미지 or 원)
  if (ballW && ballH) {
    ctx.drawImage(ballImage, x - ballW/2, y - ballH/2, ballW, ballH);
  } else {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
  }

  // 패들 그리기
  const padY = bgY + bgH - paddleOffset - paddleHeight;
  ctx.fillStyle = '#0095DD';
  ctx.fillRect(paddleX, padY, paddleWidth, paddleHeight);

  // 강아지 그리기 (패들 아래)
  const dogX = paddleX + (paddleWidth - dogW) / 2;
  const dogY = padY + paddleHeight - 35;
  ctx.drawImage(dogImage, dogX, dogY, dogW, dogH);

  // 생명 하트 그리기
  for (let i = 0; i < maxLives; i++) {
    ctx.globalAlpha = i < lives ? 1 : 0.3;
    const hx = bgX + bgW - (i+1)*(heartSize+5) - 10;
    const hy = bgY + 10;
    ctx.drawImage(heartImage, hx, hy, heartSize, heartSize);
  }
  ctx.globalAlpha = 1;

  // 정적 벽돌 충돌 검사 (예측 위치 사용, 완전 탈출)
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

  // 벽 & 패들 충돌
  if (x + dx > bgX + bgW - ballRadius || x + dx < bgX + ballRadius) dx = -dx;
  if (y + dy < bgY + ballRadius) dy = -dy;
  else if (circleRect(x + dx, y + dy, ballRadius, paddleX, padY, paddleWidth, paddleHeight)) {
    dy = -dy;
  } else if (y + dy > bgY + bgH - ballRadius - paddleOffset) {
    lives--;
    resetBall();
  }

  // 승리 조건
  const remaining = bricks.flat().filter(b => b.status === 1).length;
  if (remaining === 0 && falling.length === 0 && lives > 0) {
    setTimeout(() => {
      alert('YOU WIN!');
      location.reload();
    }, 10);
    return;
  }

  // 위치 업데이트
  x += dx; y += dy;
  if (rightPressed && paddleX < bgX + bgW - paddleWidth) paddleX += 7;
  if (leftPressed  && paddleX > bgX)                paddleX -= 7;

  // 게임 오버 체크
  if (lives <= 0) gameOver = true;

  requestAnimationFrame(gameLoop);
}
