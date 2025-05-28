const startBtn = document.getElementById('start-button');
const menuContainer = document.getElementById('menu-container');
const transitionScreen = document.getElementById('transition-screen');
const transitionText = document.getElementById('transition-text');
const gameContainer = document.getElementById('game-container');

// 게임 기능 제거: canvas, ctx, startGame() 제거

startBtn.addEventListener('click', () => {
  menuContainer.style.display = 'none';
  transitionScreen.style.display = 'flex';

  setTimeout(() => {
    transitionScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    // startGame(); ← 제거
  }, 4000);
});
