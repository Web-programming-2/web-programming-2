const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 800;
let currentScreen = "menu";
const BALL_SPEED_FACTOR   = 0.008;
const PADDLE_SPEED_FACTOR = 0.02;
const HEART_SIZE_FACTOR   = 0.15;
const MAX_LIVES = 3;
let sparkles = []; // 전역에 이거 반드시 있어야 함

//이미지 가져오기기
const ballImg = new Image();
ballImg.src   = "assets/ball.png";
const paddleImg = new Image();
paddleImg.src = "assets/paddle.png";
const heartImgs = ["heart1.png", "heart2.png", "heart3.png"].map(f => {
  const i = new Image();
  i.src = `assets/${f}`;
  return i;
});
// 초기 배경 설정
const STAGES = [
  { key: "1-1", bg: "assets/level2_1.png", threshold: 100, speed: 0.004 },
  { key: "1-2", bg: "assets/level2_2.png", threshold: 1000, speed: 0.004 }
];
let stageIndex = 0;
let stage = STAGES[stageIndex];
const bgImg = new Image();
bgImg.src = STAGES[stageIndex].bg; 
if (bgImg.complete) {
  initStage();
} else {
  bgImg.onload = initStage;
}
//게임창 
function initStage() {
  paddleX = (canvas.width - PADDLE_W) / 2;
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;

  const angle = (Math.random() - 0.5) * Math.PI / 2; // -45도 ~ +45도
  const speed = canvas.height * BALL_SPEED_FACTOR;
  ballDX = speed * Math.sin(angle);
  ballDY = -speed * Math.cos(angle); // 위쪽 방향

  resetBricks();
  currentScreen = "game";
  requestAnimationFrame(gameLoop);
}
// 패들 벽돌 고정크기 
const PADDLE_W = 100;
const PADDLE_H = 100;
const BALL_R   = 20;
const BRICK_W  = 80;
const BRICK_H  = 20;
const BRICK_P  = 12;   // 벽돌 간격 padding
const BRICK_OY = 120;   // 벽돌 시작 y 좌표

let paddleX, ballX, ballY, ballDX, ballDY;
let bricks = [], score = 0, scoreStageStart = 0;
let lives = MAX_LIVES;
let rightPressed = false, leftPressed = false;

function startGame(stageIdx) {
  stageIndex = stageIdx;
  stage = STAGES[stageIdx];           // key 대신 객체 전체 저장
  bgImg.src = stage.bg;               // 배경 이미지 설정
  score = 0;
  lives = MAX_LIVES;
  scoreStageStart = 0;
  if (bgImg.complete) {
    initStage();
  } else {
    bgImg.onload = initStage;
  }
}

function resetBricks() {
  bricks = [];
  for(let r=0;r<5;r++){
    bricks[r] = [];
    for(let c=0;c<8;c++) bricks[r][c] = { hit:false, x:0, y:0 };
  }
}

let moveDirection = null;   // "left" or "right"
let moveInterval = null;    // setInterval ID

addEventListener("keydown", e => {
  if (e.repeat) return; // 키보드 꾹 누를 때 중복 방지

  if (e.key === "ArrowLeft" || e.key === "Left") {
    moveDirection = "left";
  } else if (e.key === "ArrowRight" || e.key === "Right") {
    moveDirection = "right";
  }

  if (!moveInterval) {
    moveInterval = setInterval(() => {
      movePaddle(moveDirection);
    }, 50); // ✅ 이 간격이 반응 속도 (ms). 더 느리게 하고 싶으면 70, 100으로
  }
});

addEventListener("keyup", e => {
  if (
    e.key === "ArrowLeft" || e.key === "Left" ||
    e.key === "ArrowRight" || e.key === "Right"
  ) {
    moveDirection = null;
    clearInterval(moveInterval);
    moveInterval = null;
  }
});

// 실제 패들 이동 함수
function movePaddle(dir) {
  const vPad = canvas.width * PADDLE_SPEED_FACTOR;
  if (dir === "left" && paddleX > 0) {
    paddleX -= vPad;
  } else if (dir === "right" && paddleX < canvas.width - PADDLE_W) {
    paddleX += vPad;
  }
}


function drawBackground() {
  if(!bgImg.complete) return;
  const iw=bgImg.width, ih=bgImg.height, cw=canvas.width, ch=canvas.height;
  const s=Math.min(cw/iw, ch/ih);
  ctx.drawImage(bgImg,(cw-iw*s)/2,(ch-ih*s)/2, iw*s, ih*s);
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
      ctx.fillStyle = "#ff4081";
      ctx.fillRect(bx, by, BRICK_W, BRICK_H);
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
  const gap=size*0.3, y=1;
  for(let i=0;i<MAX_LIVES;i++){
    const img=heartImgs[i];
    if(!img.complete) continue;
    const x=canvas.width-(size+gap)*(MAX_LIVES-i)+gap/2;
    ctx.globalAlpha = i < lives ? 1 : 0.25;
    ctx.drawImage(img,x,y,size,size);
  }
  ctx.globalAlpha = 1;
}

function updateScoreBoard() {
  document.getElementById("scoreBoard").textContent = `점수 ${score}`;
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
function countBrokenBricks() {
  let broken = 0;
  for (let r = 0; r < bricks.length; r++) {
    for (let c = 0; c < bricks[r].length; c++) {
      if (bricks[r][c].hit) broken++;
    }
  }
  return broken;
}
function isGameCleared() {
  for (let r = 0; r < bricks.length; r++) {
    for (let c = 0; c < bricks[r].length; c++) {
      if (!bricks[r][c].hit) return false;
    }
  }
  return true;
}


function collision() {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 8; c++) {
      const b = bricks[r][c];
      if (b.hit) continue;

      if (
        ballX > b.x && ballX < b.x + BRICK_W &&
        ballY > b.y && ballY < b.y + BRICK_H
      ) {
        b.hit = true;
        score += 100;
        updateScoreBoard();
        createSparkle(ballX, ballY);
        
        // 충돌 반사
        ballDY = -ballDY;

        // 클리어 판정
        if (countBrokenBricks() >= 20 && bgImg.src.includes("level2_1.png")) {
          bgImg.src = "assets/level2_2.png";
        }

        if (isGameCleared()) {
          setTimeout(() => {
            alert("🎉 게임 클리어! 축하합니다!");
            currentScreen = "menu";
            mainLoop();
          }, 100);
        }
        return;
      }
    }
  }
}


function gameLoop() {
  // 화면 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawBricks();
  drawBall();
  drawPaddle();
  drawLives();
  drawSparkles();

  // ✅ 벽돌 충돌 처리
  collision();

  // ✅ 공이 천장에 부딪히면 위로 반사
  if (ballY + ballDY < BALL_R) {
    ballDY = -ballDY;
  }

  // ✅ 왼쪽 또는 오른쪽 벽에 부딪히면 X 방향 반사
  if (ballX + ballDX > canvas.width - BALL_R || ballX + ballDX < BALL_R) {
    ballDX = -ballDX;
  }

  // ✅ 패들 충돌 처리
  const paddleTop = canvas.height - PADDLE_H;
  const isHitPaddle =
    ballY + ballDY >= paddleTop - BALL_R &&
    ballY + ballDY <= paddleTop + BALL_R &&
    ballX + BALL_R > paddleX &&
    ballX - BALL_R < paddleX + PADDLE_W;

  if (isHitPaddle) {
    const speed = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
    let ratio = (ballX - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
    if (Math.abs(ratio) < 0.05) ratio = (Math.random() - 0.5) * 0.3;
    const angle = ratio * Math.PI / 3;
    ballDX = speed * Math.sin(angle);
    ballDY = -speed * Math.cos(angle);
  }

  // ❌ 바닥에 닿았으면 생명 감소
  else if (ballY + ballDY > canvas.height - BALL_R) {
lives--; // 먼저 감소
if (lives === 0) {
  alert("GAME OVER");
  currentScreen = "menu";
  mainLoop();
  return;
}
    resetBall();
    return;
  }


  // ✅ 공 위치 업데이트
  ballX += ballDX;
  ballY += ballDY;

  // ✅ 패들 이동 처리
  const vPad = canvas.width * PADDLE_SPEED_FACTOR;
  if (rightPressed && paddleX < canvas.width - PADDLE_W) {
    paddleX += vPad;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= vPad;
  }

  // 다음 프레임 요청
  requestAnimationFrame(gameLoop);
}

// 공 초기화 함수
function resetBall() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  const angle = (Math.random() - 0.5) * Math.PI / 2;
  const speed = canvas.height * BALL_SPEED_FACTOR;
  ballDX = speed * Math.sin(angle);
  ballDY = -speed * Math.cos(angle);
}





document.getElementById("startBtn").addEventListener("click", () => {
      startGame(0); // 첫 번째 스테이지로 시작
    });

    // 💡 오류 방지를 위한 더미 mainLoop
function mainLoop() {
      // 현재는 메뉴 없음 → 아무것도 안 해도 됨
      console.log("메뉴 상태 (mainLoop)");
    }
