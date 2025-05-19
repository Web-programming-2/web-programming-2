
    const startBtn = document.getElementById('start-button');
    const menuContainer = document.getElementById('menu-container');
    const transitionScreen = document.getElementById('transition-screen');
    const transitionText = document.getElementById('transition-text');
    const gameContainer = document.getElementById('game-container');
    const canvas = document.getElementById('canvas-game');
    const ctx = canvas.getContext('2d');

    startBtn.addEventListener('click', () => {
      menuContainer.style.display = 'none';
      transitionScreen.style.display = 'flex';

      setTimeout(() => {
        transitionScreen.style.display = 'none';
        gameContainer.style.display = 'flex';
        startGame();
      }, 4000);
    });

function startGame() {
  let ball = { x: 400, y: 300, dx: 3, dy: -3, radius: 10 };
  let paddle = { 
    width: 100, 
    height: 10, 
    x: 350, 
    y: 900 // ✅ 막대 위치를 캔버스 중간보다 아래로 (600 기준)
  };

  function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ff69b4";
    ctx.fill();
    ctx.closePath();
  }

  function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height); // ✅ 음수 아님
    ctx.fillStyle = "#00bfff";
    ctx.fill();
    ctx.closePath();
  }

  document.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    paddle.x = e.clientX - rect.left - paddle.width / 2;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) {
      paddle.x = canvas.width - paddle.width;
    }
  });

  let gameRunning = true;

  function draw() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBall();
    drawPaddle();

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
      ball.dx *= -1;
    }

    if (ball.y - ball.radius < 0) {
      ball.dy *= -1;
    }

    if (ball.y + ball.radius > canvas.height) {
      gameRunning = false;
      document.location.reload();
      return;
    }

    if (
      ball.y + ball.radius >= paddle.y &&
      ball.y + ball.radius <= paddle.y + paddle.height &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width
    ) {
      ball.dy *= -1;
      ball.y = paddle.y - ball.radius;
    }

    requestAnimationFrame(draw);
  }

  draw();
}