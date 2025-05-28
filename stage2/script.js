
/* ---------- canvas & transition ---------- */
const canvas            = document.getElementById("gameCanvas");
const ctx               = canvas.getContext("2d");
const transitionScreen  = document.getElementById("transition-screen");

/* ---------- stage data ---------- */
const stageBGs   = ["background1.jpg", "background2.jpg"];
let   currentStage = 0;
let   stageCleared = false;
const bgImage     = new Image();
bgImage.src       = stageBGs[currentStage];

/* ---------- sprites ---------- */
const heartImage  = new Image(); heartImage.src = "heart.png";
const dogImage    = new Image(); dogImage.src   = "dog.png";
const ballImage   = new Image(); ballImage.src  = "basketball.png";

/* ---------- constants ---------- */
const ballScale     = 0.2;
const brickWidth    = 60;
const brickHeight   = 30;
const brickRowCount = 1;
const brickOffsetTop= 100;
const paddleWidth   = 100;
const paddleHeight  = 0;
const paddleOffset  = 60;
const fallSpeed     = 1;
const maxLives      = 3;
const heartSize     = 70;
const timeLimit     = 30_000;          // 30 초

/* ---------- run-time state ---------- */
let ballW=0, ballH=0, ballR=12;
let dogW=0,  dogH=0;

let cw, ch, bgW, bgH, bgX=0, bgY=0;
let x, y, dx=6, dy=-6;
let paddleX;
let rightPressed=false, leftPressed=false;
let bricks=[], cols, brickOffsetLeft;
let falling=[];
let lives=maxLives, gameOver=false;
let startTime=0;

/* ---------- sprite sizing after load ---------- */
ballImage.onload = () => {
  ballW = ballImage.naturalWidth  * ballScale;
  ballH = ballImage.naturalHeight * ballScale;
  ballR = ballW / 2;
};
dogImage.onload = () => {
  dogW = paddleWidth * 1.2;
  dogH = dogImage.naturalHeight * (dogW / dogImage.naturalWidth);
};

/* ---------- helpers ---------- */
function resizeCanvas(){
  canvas.width  = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  cw = bgW = canvas.width;
  ch = bgH = canvas.height;
  paddleX = (bgW - paddleWidth) / 2;
}
function circleRect(cx,cy,r,rx,ry,rw,rh){
  const nx=Math.max(rx,Math.min(cx,rx+rw)),
        ny=Math.max(ry,Math.min(cy,ry+rh));
  return (cx-nx)**2 + (cy-ny)**2 <= r*r;
}
function initBricks(){
  cols = Math.floor(bgW / brickWidth);
  brickOffsetLeft = (bgW - cols*brickWidth) / 2;
  bricks = Array.from({length: brickRowCount}, () =>
    Array.from({length: cols}, () => ({
      status:1,
      color:`hsl(${Math.random()*360},70%,50%)`
    }))
  );
  falling.length = 0;
}
function resetBall(){
  x  = bgW / 2;
  y  = bgH - paddleOffset - paddleHeight - ballR;
  dx = 6;                     // 스테이지마다 동일 속도
  dy = -6;
}
function nextStage(){
  stageCleared = false;
  bgImage.src  = stageBGs[currentStage];
  initBricks();
  resetBall();
  lives      = maxLives;
  startTime  = Date.now();
  requestAnimationFrame(gameLoop);
}

/* ---------- game loop ---------- */
function gameLoop(){
  const elapsed = Date.now() - startTime;
  if(elapsed > timeLimit){ alert("TIME OVER"); location.reload(); return; }
  if(gameOver)            { alert("GAME OVER"); location.reload(); return; }

  ctx.clearRect(0,0,cw,ch);
  ctx.globalAlpha = .4;
  ctx.drawImage(bgImage,bgX,bgY,bgW,bgH);
  ctx.globalAlpha = 1;

  /* bricks */
  for(let r=0;r<brickRowCount;r++){
    for(let c=0;c<cols;c++){
      const b=bricks[r][c]; if(!b.status) continue;
      const bx=brickOffsetLeft+c*brickWidth,
            by=brickOffsetTop +r*brickHeight;
      ctx.fillStyle=b.color;
      ctx.fillRect(bx,by,brickWidth,brickHeight);
      ctx.strokeStyle="#333"; ctx.lineWidth=2;
      ctx.strokeRect(bx,by,brickWidth,brickHeight);
    }
  }

  /* ball */
  ballW
    ? ctx.drawImage(ballImage,x-ballW/2,y-ballH/2,ballW,ballH)
    : (ctx.beginPath(),ctx.arc(x,y,ballR,0,Math.PI*2),
       ctx.fillStyle="#0095DD",ctx.fill());

  /* dog paddle */
  const padY = bgH - paddleOffset - paddleHeight;
  const dogX = paddleX + (paddleWidth-dogW)/2;
  const dogY = padY - 35;
  ctx.drawImage(dogImage,dogX,dogY,dogW,dogH);

  /* hearts */
  for(let i=0;i<maxLives;i++){
    ctx.globalAlpha = i < lives ? 1 : .3;
    const hx = bgW - (i+1)*(heartSize+5) - 10;
    ctx.drawImage(heartImage,hx,10,heartSize,heartSize);
  }
  ctx.globalAlpha = 1;

  /* timer text */
  const remain = Math.max(0,Math.ceil((timeLimit-elapsed)/1000));
  ctx.font="bold 28px sans-serif";
  ctx.fillStyle="yellow";
  ctx.fillText(`TIME: ${remain}s`, 20, 40);

  /* collisions with bricks */
  const nx=x+dx, ny=y+dy;
  outer: for(let r=0;r<brickRowCount;r++){
    for(let c=0;c<cols;c++){
      const b=bricks[r][c]; if(!b.status) continue;
      const bx=brickOffsetLeft+c*brickWidth,
            by=brickOffsetTop +r*brickHeight;
      if(circleRect(nx,ny,ballR,bx,by,brickWidth,brickHeight)){
        Math.abs(nx-(bx+brickWidth/2))>Math.abs(ny-(by+brickHeight/2))?dx=-dx:dy=-dy;
        b.status=0;
        break outer;
      }
    }
  }

  /* walls & paddle */
  if(nx<ballR||nx>bgW-ballR) dx=-dx;
  if(ny<ballR)              dy=-dy;
  else if(circleRect(nx,ny,ballR,paddleX,padY,paddleWidth,paddleHeight)) dy=-dy;
  else if(ny>bgH-ballR-paddleOffset){ lives--; resetBall(); }

  /* stage clear */
  const bricksRemain = bricks.flat().some(b=>b.status);
  if(!bricksRemain && !stageCleared){
    stageCleared = true;
    if(currentStage < stageBGs.length-1){
      transitionScreen.style.display='flex';
      setTimeout(()=>{
        transitionScreen.style.display='none';
        currentStage++;
        nextStage();
      },2000);
      return;                // 로딩 동안 루프 일시 중단
    }else{
      alert("YOU WIN!");
      location.reload();
      return;
    }
  }

  /* move */
  x+=dx; y+=dy;
  if(rightPressed && paddleX<bgW-paddleWidth) paddleX+=7;
  if(leftPressed  && paddleX>0)               paddleX-=7;
  if(lives<=0) gameOver=true;

  requestAnimationFrame(gameLoop);
}

function goToMenu() {
  window.location.href = "../memory_game.html";
}
/* ---------- input ---------- */
window.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight') rightPressed=true;
  if(e.key==='ArrowLeft')  leftPressed=true;
});
window.addEventListener('keyup',e=>{
  if(e.key==='ArrowRight') rightPressed=false;
  if(e.key==='ArrowLeft')  leftPressed=false;
});

/* ---------- start ---------- */
window.addEventListener('resize',resizeCanvas);
window.addEventListener('load', ()=>{ resizeCanvas(); initBricks(); resetBall(); startTime=Date.now(); requestAnimationFrame(gameLoop); });

