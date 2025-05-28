/* ------------------------------------------------------------------
 (스테이지 1 자동 실행 - 메뉴/선택 생략 + 전기 벽돌 포함)
------------------------------------------------------------------ */

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

const bgm = document.getElementById("bgm");
bgm.volume = 0.6;

const ballImg = new Image();
ballImg.src   = "assets/ball.png";

const paddleImg = new Image();
paddleImg.src = "assets/paddle.png";

const heartImgs = ["heart1.png","heart2.png","heart3.png"].map(f => {
  const i = new Image();
  i.src = `assets/${f}`;
  return i;
});

const STAGES = [
  { key:"1-1", bg:"assets/stage1-1.jpg", threshold: 100, speed: 0.004 },
  { key:"1-2", bg:"assets/stage1-2.jpg", threshold: 1000, speed: 0.004 }
];
const bgImg = new Image();

let stageIndex = 0;
let stage = STAGES[0].key;

const BALL_SPEED_FACTOR   = 0.002;
const PADDLE_SPEED_FACTOR = 0.01;
const HEART_SIZE_FACTOR   = 0.15;
const MAX_LIVES = 3;

let L = {
  PADDLE_W:0.25, PADDLE_H:0.1, BALL_R:0.05,
  BRICK_W:0.10, BRICK_H:0.03, BRICK_P:0.015, BRICK_OY:0.10
};
let PADDLE_W, PADDLE_H, BALL_R, BRICK_W, BRICK_H, BRICK_P, BRICK_OY;
let paddleX, ballX, ballY, ballDX, ballDY;
let bricks = [], score = 0, scoreStageStart = 0;
let lives = MAX_LIVES;
let rightPressed = false, leftPressed = false;
let sparkles = [];

function startGame(stageIdx) {
  stageIndex = stageIdx;
  stage = STAGES[stageIdx].key;
  bgImg.src = STAGES[stageIdx].bg;
  score = 0;
  lives = MAX_LIVES;
  scoreStageStart = 0;

  bgImg.onload = () => {
    resizeCanvas();
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballDX = canvas.width * BALL_SPEED_FACTOR;
    ballDY = -canvas.height * BALL_SPEED_FACTOR;
    resetBricks();
    requestAnimationFrame(gameLoop);
  };
}

function resizeCanvas() {
  const imgRatio=(bgImg.width||3)/(bgImg.height||4);
  const w=innerWidth, h=innerHeight, r=w/h;
  if(r>imgRatio){ canvas.height=h; canvas.width=h*imgRatio; }
  else{ canvas.width=w; canvas.height=w/imgRatio; }

  PADDLE_W = canvas.width  * L.PADDLE_W;
  PADDLE_H = canvas.height * L.PADDLE_H;
  BALL_R   = canvas.width  * L.BALL_R;
  BRICK_W  = canvas.width  * L.BRICK_W;
  BRICK_H  = canvas.height * L.BRICK_H;
  BRICK_P  = canvas.width  * L.BRICK_P;
  BRICK_OY = canvas.height * L.BRICK_OY;

  paddleX = (canvas.width - PADDLE_W) / 2;
}

function resetBricks() {
  bricks = [];
  for(let r=0;r<5;r++){
    bricks[r] = [];
    for(let c=0;c<8;c++) {
      const isElectric = Math.random() < 0.25; // 전기 벽돌 확률을 기존 0.1 → 0.25로 증가
      bricks[r][c] = { hit:false, x:0, y:0, electric: isElectric };
    }
  }
}


function destroySurroundingBricks(r, c) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 5 && nc >= 0 && nc < 8) {
        const nb = bricks[nr][nc];
        if (!nb.hit) {
          nb.hit = true;
          score += 100;
          createSparkle(nb.x + BRICK_W / 2, nb.y + BRICK_H / 2);
        }
      }
    }
  }
}

function drawBricks() {
  const totalW = 8 * BRICK_W + 7 * BRICK_P;
  const offsetX = (canvas.width - totalW) / 2;
  for(let r=0;r<5;r++){
    for(let c=0;c<8;c++){
      const b = bricks[r][c];
      if(b.hit) continue;
      const bx = offsetX + c * (BRICK_W + BRICK_P);
      const by = r * (BRICK_H + BRICK_P) + BRICK_OY;
      b.x = bx; b.y = by;
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(bx+2, by+2, BRICK_W, BRICK_H);
      ctx.fillStyle = b.electric ? "#00e5ff" : "#ff4081";
      ctx.fillRect(bx, by, BRICK_W, BRICK_H);
      if (b.electric) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 2, by + 2, BRICK_W - 4, BRICK_H - 4);
      }
    }
  }
}

function drawPaddle() {
  if (paddleImg.complete) {
    ctx.drawImage(paddleImg, paddleX, canvas.height - PADDLE_H, PADDLE_W, PADDLE_H);
  } else {
    ctx.fillStyle = "#fff";
    ctx.fillRect(paddleX, canvas.height - PADDLE_H, PADDLE_W, PADDLE_H);
  }
}

function drawBall() {
  if (ballImg.complete) {
    ctx.drawImage(ballImg, ballX - BALL_R, ballY - BALL_R, BALL_R*2, BALL_R*2);
  } else {
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = "#ffeb3b";
    ctx.fill();
    ctx.closePath();
  }
}

function drawLives() {
  const size=canvas.width*HEART_SIZE_FACTOR;
  const gap=size*0.3, y=10;
  for(let i=0;i<MAX_LIVES;i++){
    const img=heartImgs[i];
    if(!img.complete) continue;
    const x=canvas.width-(size+gap)*(MAX_LIVES-i)+gap/2;
    ctx.globalAlpha = i < lives ? 1 : 0.25;
    ctx.drawImage(img,x,y,size,size);
  }
  ctx.globalAlpha = 1;
}

function drawScore() {
  const text = `점수 ${score}`;
  const fontSize = canvas.width * 0.045;
  const padding = 10;
  ctx.font = `bold ${fontSize}px sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const x = 10, y = 10;
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(x, y, textWidth + padding * 2, fontSize + padding);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.textBaseline = "top";
  ctx.strokeText(text, x + padding, y + padding / 2);
  ctx.fillText(text, x + padding, y + padding / 2);
}

function createSparkle(x, y) {
  sparkles.push({ x, y, radius: 0, max: 15 });
}

function drawSparkles() {
  sparkles.forEach((s, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 0, ${1 - s.radius / s.max})`;
    ctx.fill();
    ctx.restore();
    s.radius++;
    if (s.radius >= s.max) sparkles.splice(i, 1);
  });
}

function collision() {
  for(let r=0;r<5;r++){
    for(let c=0;c<8;c++){
      const b = bricks[r][c]; if(b.hit) continue;
      if(ballX > b.x && ballX < b.x + BRICK_W &&
         ballY > b.y && ballY < b.y + BRICK_H){
        ballDY = -ballDY;
        if (b.electric) {
          destroySurroundingBricks(r, c);
        } else {
          b.hit = true;
          score += 100;
          createSparkle(ballX, ballY);
        }
        if (stageIndex + 1 < STAGES.length && score - scoreStageStart >= STAGES[stageIndex].threshold) {
          stageIndex++;
          startGame(stageIndex);
        }
      }
    }
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawBricks();
  drawBall();
  drawPaddle();
  drawLives();
  drawScore();
  drawSparkles();
  collision();

  if(ballX + ballDX > canvas.width - BALL_R || ballX + ballDX < BALL_R) ballDX = -ballDX;
  if(ballY + ballDY < BALL_R) ballDY = -ballDY;
  else if(ballY + ballDY > canvas.height - BALL_R - 15) {
    if(ballX > paddleX && ballX < paddleX + PADDLE_W) ballDY = -ballDY;
    else {
      if(--lives === 0) {
        alert("GAME OVER");
        startGame(0);
        return;
      }
      ballX = canvas.width / 2;
      ballY = canvas.height / 2;
    }
  }

  ballX += ballDX;
  ballY += ballDY;

  const vPad = canvas.width * PADDLE_SPEED_FACTOR;
  if(rightPressed && paddleX < canvas.width - PADDLE_W) paddleX += vPad;
  else if(leftPressed && paddleX > 0) paddleX -= vPad;

  requestAnimationFrame(gameLoop);
}

addEventListener("keydown", e => {
  if(e.key === "ArrowRight" || e.key === "Right") rightPressed = true;
  else if(e.key === "ArrowLeft" || e.key === "Left") leftPressed = true;
});
addEventListener("keyup", e => {
  if(e.key === "ArrowRight" || e.key === "Right") rightPressed = false;
  else if(e.key === "ArrowLeft" || e.key === "Left") leftPressed = false;
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  paddleX = e.clientX - rect.left - PADDLE_W / 2;
  if (paddleX < 0) paddleX = 0;
  if (paddleX + PADDLE_W > canvas.width) paddleX = canvas.width - PADDLE_W;
});

function drawBackground() {
  if(!bgImg.complete) return;
  const iw=bgImg.width, ih=bgImg.height, cw=canvas.width, ch=canvas.height;
  const s=Math.min(cw/iw, ch/ih);
  ctx.drawImage(bgImg,(cw-iw*s)/2,(ch-ih*s)/2, iw*s, ih*s);
}

window.addEventListener("DOMContentLoaded", () => {
  startGame(0);
});