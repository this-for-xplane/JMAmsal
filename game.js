const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');
const gameoverDiv = document.getElementById('gameover');
const restartBtn = document.getElementById('restart');

let player = { x: 300, y: 700, r: 20 };
let bullets = [];
let enemies = [];
let score = 0;
let gameOver = false;

function reset() {
  player = { x: 300, y: 700, r: 20 };
  bullets = [];
  enemies = [];
  score = 0;
  gameOver = false;
  scoreDiv.innerText = "점수: 0";
  gameoverDiv.style.display = 'none';
  restartBtn.style.display = 'none';
  spawnEnemy();
  loop();
}

// 마우스 따라가기
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  player.x = e.clientX - rect.left;
  // y는 고정
});

// 총알 자동 발사
setInterval(() => {
  if (!gameOver) bullets.push({ x: player.x, y: player.y - 20, r: 5 });
}, 200);

// 적 생성
function spawnEnemy() {
  if (gameOver) return;
  const x = Math.random() * 560 + 20;
  enemies.push({ x, y: -20, r: 20, speed: 2 + Math.random()*2 });
  setTimeout(spawnEnemy, 800);
}

function loop() {
  if (gameOver) return;
  ctx.clearRect(0, 0, 600, 800);

  // 캐릭터
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
  ctx.fillStyle = "#0f8";
  ctx.fill();

  // 총알 이동+그리기
  bullets.forEach(b => b.y -= 8);
  bullets = bullets.filter(b => b.y > -10);
  ctx.fillStyle = "#fff";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fill();
  });

  // 적 이동+그리기
  enemies.forEach(e => e.y += e.speed);
  ctx.fillStyle = "#f44";
  enemies.forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
    ctx.fill();
  });

  // 충돌 판정 (총알-적)
  enemies.forEach((e, ei) => {
    bullets.forEach((b, bi) => {
      const dx = e.x - b.x, dy = e.y - b.y, dist = Math.sqrt(dx*dx+dy*dy);
      if (dist < e.r + b.r) {
        enemies.splice(ei,1);
        bullets.splice(bi,1);
        score++;
        scoreDiv.innerText = "점수: " + score;
      }
    });
  });

  // 충돌 판정 (적-플레이어)
  for (const e of enemies) {
    const dx = e.x - player.x, dy = e.y - player.y, dist = Math.sqrt(dx*dx+dy*dy);
    if (dist < e.r + player.r) {
      gameOver = true;
      gameoverDiv.style.display = 'block';
      restartBtn.style.display = 'block';
    }
  }

  requestAnimationFrame(loop);
}

restartBtn.onclick = reset;

// 게임 시작
reset();
