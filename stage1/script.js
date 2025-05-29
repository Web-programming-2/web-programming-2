const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const transitionScreen = document.getElementById('transition-screen');
const lightningImage = new Image();
lightningImage.src = 'lightning.png'; // 실제 경로와 파일 이름 확인 필요


/* 전환용 함수 추가 */
function showStageLoading(cb, delay = 2000) {   // delay: 로딩 화면 표시 시간(ms)
  transitionScreen.style.display = 'flex';
  setTimeout(() => {
    transitionScreen.style.display = 'none';
    cb();                                       // 로딩 끝나면 콜백 실행
  }, delay);
}

const bgImages = ['background1.jpg', 'background2.jpg'].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

let currentStage = 0;
let bgImage = bgImages[currentStage];

const heartImage = new Image(); heartImage.src = 'heart.png';
const dogImage = new Image(); dogImage.src = 'dog.png';

const savedSkin  = localStorage.getItem('ballSkin') || 'basketball.png';
const ballImage  = new Image(); ballImage.src   = savedSkin;

let ballRadius = 12;
const ballScale = 0.2;
const brickWidth = 60;
const brickHeight = 30;
const brickRowCount = 2;
const brickOffsetTop = 100;
const paddleWidth = 100;

const paddleHeight = 0;
const paddleOffset = 60;
const fallSpeed = 1;
const maxLives = 3;
const heartSize = 70;

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
let bgX = 0, bgY = 0, bgW = 0, bgH = 0, aspectRatio = 16/9;
let x, y, dx = 5, dy = -5;
let paddleX;
let rightPressed = false, leftPressed = false;
let bricks = [], cols, brickOffsetLeft;
let falling = [];
let lives = maxLives;
let gameOver = false;
let stageCleared = false;

function init() {
  bgImage = bgImages[currentStage];
  resizeCanvas();
  initBricks();
  resetBall();
  lives = maxLives;
  gameOver = false;
  stageCleared = false;
  requestAnimationFrame(gameLoop);
}

window.addEventListener('load', init);
window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  cw = canvas.width;
  ch = canvas.height;
  aspectRatio = bgImage.naturalWidth / bgImage.naturalHeight || 16 / 9;
  bgW = cw;
  bgH = ch;
  bgX = 0;
  bgY = 0;
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
        color: isElectric ? '#ffff00' : `hsl(${hue},70%,50%)`,
        type: isElectric ? 'electric' : 'normal'
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
  dx = 5;
  dy = -5;
}

function explodeBricks(r, c) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr;
      const nc = c + dc;
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

function nextStage() {
  if (currentStage < bgImages.length - 1) {
    currentStage++;
    console.log(currentStage);
    bgImage = bgImages[currentStage];
    console.log(bgImage);
    initBricks();
    resetBall();
    stageCleared = false;
  } else {
    alert('🎉 모든 스테이지를 클리어했습니다!');
    location.reload();
  }
}

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') rightPressed = true;
  if (e.key === 'ArrowLeft') leftPressed = true;
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowRight') rightPressed = false;
  if (e.key === 'ArrowLeft') leftPressed = false;
});

function gameLoop() {
  if (gameOver) {
    setTimeout(() => { alert('GAME OVER'); location.reload(); }, 10);
    return;
  }

  ctx.clearRect(0, 0, cw, ch);

  ctx.globalAlpha = 0.4;
  ctx.drawImage(bgImage, bgX, bgY, bgW, bgH);
  ctx.globalAlpha = 1.0;

  for (let r = 0; r < brickRowCount; r++) {
  for (let c = 0; c < cols; c++) {
    const b = bricks[r][c];
    if (b.status === 1) {
      const bx = brickOffsetLeft + c * brickWidth;
      const by = bgY + brickOffsetTop + r * brickHeight;

      // 배경 색상: 파스텔톤 또는 전기 벽돌 노란색
      ctx.fillStyle = b.type === 'electric' ? '#ffff99' : getPastelColor(r, c);
      ctx.lineJoin = "round";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect?.(bx, by, brickWidth, brickHeight, 10); // 둥근 모서리
      ctx.fill();
      ctx.strokeStyle = "#aaa";
      ctx.stroke();
      ctx.closePath();

      // 전기 벽돌이면 번개 이미지 그리기
      if (b.type === 'electric') {
        const iconSize = brickHeight * 0.8;
        const iconX = bx + (brickWidth - iconSize) / 2;
        const iconY = by + (brickHeight - iconSize) / 2;
        ctx.drawImage(lightningImage, iconX, iconY, iconSize, iconSize);
      }
    }
  }
}




  if (ballW && ballH) {
    ctx.drawImage(ballImage, x - ballW / 2, y - ballH / 2, ballW, ballH);
  } else {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
  }

  const padY = bgY + bgH - paddleOffset - paddleHeight;
  const dogX = paddleX + (paddleWidth - dogW) / 2;
  const dogY = padY + paddleHeight - 35;
  ctx.drawImage(dogImage, dogX, dogY, dogW, dogH);

  for (let i = 0; i < maxLives; i++) {
    ctx.globalAlpha = i < lives ? 1 : 0.3;
    const hx = bgX + bgW - (i + 1) * (heartSize + 5) - 10;
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
        const cx = bx + brickWidth / 2, cy = by + brickHeight / 2;
        if (Math.abs(nextX - cx) > Math.abs(nextY - cy)) dx = -dx;
        else dy = -dy;
        if (b.type === 'electric') {
          explodeBricks(r, c);
          b.status = 0;
        } else {
          b.status = 0;
        }
        break outer;
      }
    }
  }

  if (x + dx > bgX + bgW - ballRadius || x + dx < bgX + ballRadius) dx = -dx;
  if (y + dy < bgY + ballRadius) dy = -dy;
  else if (circleRect(x + dx, y + dy, ballRadius, paddleX, padY, paddleWidth, paddleHeight)) {
    dy = -dy;
  } else if (y + dy > bgY + bgH - ballRadius - paddleOffset) {
    lives--;
    resetBall();
  }

  const remaining = bricks.flat().filter(b => b.status === 1).length;
  if (remaining === 0 && lives > 0 && !stageCleared) {
    stageCleared = true;

      // 다음 스테이지가 있으면 로딩 화면 → 다음 스테이지
    if (currentStage < bgImages.length - 1) {
      showStageLoading(() => {
        nextStage();
        stageCleared = false;
        requestAnimationFrame(gameLoop);
      }, 2000);       // 로딩 화면 2초
    }
    // 마지막 스테이지였다면 로딩 화면 없이 바로 nextStage()
    else {
      nextStage();    // 여기서 alert 후 location.reload()
    }

    return;           // 현재 루프 종료
  }


  x += dx;
  y += dy;
  if (rightPressed && paddleX < bgX + bgW - paddleWidth) paddleX += 7;
  if (leftPressed && paddleX > bgX) paddleX -= 7;

  if (lives <= 0) gameOver = true;

  requestAnimationFrame(gameLoop);
} 
  function goToMenu() {
    window.location.href = "../memory_game.html";
  }

  function getPastelColor(row, col) {
  const hue = ((row + col) * 40) % 360;
  return `hsl(${hue}, 90%, 60%)`;  // 밝고 부드러운 색상
}