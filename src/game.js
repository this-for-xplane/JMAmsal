const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');
const expDiv = document.getElementById('exp');
const gameoverDiv = document.getElementById('gameover');
const restartBtn = document.getElementById('restart');
const popup = document.getElementById('levelup-popup');
const upgradeOptionsDiv = document.getElementById('upgrade-options');

let player, bullets, enemies, score, gameOver;
let exp, level, expToLevelUp, upgrades, selectedUpgrades, maxLevel;

function reset() {
  player = { x: 300, y: 700, r: 20, hp: 1, speed: 1, fireRate: 200, dmg: 1 };
  bullets = [];
  enemies = [];
  score = 0;
  gameOver = false;
  level = 1;
  maxLevel = 5;
  exp = 0;
  expToLevelUp = getLevelUpExp(level);
  selectedUpgrades = [];
  upgrades = [
    { name: "공격력 +1", apply: p => p.dmg += 1 },
    { name: "연사속도 ↑", apply: p => p.fireRate = Math.max(80, p.fireRate - 40) },
    { name: "이동속도 +0.5", apply: p => p.speed += 0.5 },
    { name: "체력 +1", apply: p => p.hp += 1 },
    { name: "총알 크기 ↑", apply: p => p.bulletSize = (p.bulletSize||5) + 2 },
    { name: "적중시 점수 +2", apply: p => p.scoreBonus = (p.scoreBonus||0) + 2 }
  ];
  scoreDiv.innerText = "점수: 0";
  expDiv.innerText = `경험치: 0 / ${expToLevelUp} | 레벨: 1`;
  gameoverDiv.style.display = 'none';
  restartBtn.style.display = 'none';
  popup.classList.remove('show');
  spawnEnemy();
  loop();
}

// 마우스 따라가기
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  player.x = e.clientX - rect.left;
});

// 총알 자동 발사
let fireTimer = null;
function startFiring() {
  if(fireTimer) clearInterval(fireTimer);
  fireTimer = setInterval(() => {
    if (!gameOver && !popup.classList.contains('show')) {
      bullets.push({ x: player.x, y: player.y - 20, r: player.bulletSize || 5, dmg: player.dmg });
    }
  }, player.fireRate);
}

// 적 생성
function spawnEnemy() {
  if (gameOver) return;
  const x = Math.random() * 560 + 20;
  enemies.push({ x, y: -20, r: 20, speed: 2 + Math.random()*2, hp: 1 });
  setTimeout(spawnEnemy, 800);
}

function getLevelUpExp(level) {
  return 50 + (level - 1) * 40;
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
        e.hp -= b.dmg;
        bullets.splice(bi,1);
        if(e.hp<=0) {
          enemies.splice(ei,1);
          let gain = 10;
          if(player.scoreBonus) gain += player.scoreBonus;
          score += gain;
          scoreDiv.innerText = "점수: " + score;
          // 경험치 증가
          gainExp(10);
        }
      }
    });
  });

  // 충돌 판정 (적-플레이어)
  for (const e of enemies) {
    const dx = e.x - player.x, dy = e.y - player.y, dist = Math.sqrt(dx*dx+dy*dy);
    if (dist < e.r + player.r) {
      player.hp -= 1;
      if(player.hp <= 0) {
        gameOver = true;
        gameoverDiv.style.display = 'block';
        restartBtn.style.display = 'block';
        if(fireTimer) clearInterval(fireTimer);
      }
      break;
    }
  }

  requestAnimationFrame(loop);
}

// 경험치 추가 및 레벨업
function gainExp(amount) {
  if(level >= maxLevel) return;
  exp += amount;
  if(exp >= expToLevelUp) {
    exp -= expToLevelUp;
    level += 1;
    expToLevelUp = getLevelUpExp(level);
    expDiv.innerText = `경험치: ${exp} / ${expToLevelUp} | 레벨: ${level}`;
    if(level > maxLevel) return;
    showLevelUpPopup();
  } else {
    expDiv.innerText = `경험치: ${exp} / ${expToLevelUp} | 레벨: ${level}`;
  }
}

// 레벨업 팝업 표시
function showLevelUpPopup() {
  popup.classList.add('show');
  // 업그레이드 3개 랜덤
  let candidates = [];
  while (candidates.length < 3) {
    const idx = Math.floor(Math.random() * upgrades.length);
    if (!candidates.includes(idx)) candidates.push(idx);
  }
  upgradeOptionsDiv.innerHTML = '';
  candidates.forEach(idx => {
    const opt = upgrades[idx];
    const btn = document.createElement('button');
    btn.className = 'upgrade-btn';
    btn.innerText = opt.name;
    btn.onclick = () => {
      // 적용
      opt.apply(player);
      selectedUpgrades.push(opt.name);
      popup.classList.remove('show');
      if(level < maxLevel) startFiring();
    };
    upgradeOptionsDiv.appendChild(btn);
  });
  if(fireTimer) clearInterval(fireTimer);
}

// 레벨업 중에는 총알 멈춤
popup.addEventListener('transitionend', () => {
  if(!popup.classList.contains('show')) startFiring();
});

restartBtn.onclick = reset;

// 게임 시작
reset();
startFiring();
