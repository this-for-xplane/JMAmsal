const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');
const expDiv = document.getElementById('exp');
const gameoverDiv = document.getElementById('gameover');
const restartBtn = document.getElementById('restart');
const popup = document.getElementById('levelup-popup');
const upgradeOptionsDiv = document.getElementById('upgrade-options');

// 맵 설정 (허용 영역 및 금지 영역)
const MAP_WIDTH = 600, MAP_HEIGHT = 800;
// 허용 범위: 가운데 큰 원(중앙: 300,400, 반지름 260)
function isAllowed(x, y) {
  const cx = 300, cy = 400, r = 260;
  return ((x-cx)*(x-cx) + (y-cy)*(y-cy)) < (r*r);
}

let player, bullets, enemies, score, gameOver;
let exp, level, expToLevelUp, upgrades, selectedUpgrades, maxLevel;

// 키 입력 상태 저장
let keyState = {};
window.addEventListener('keydown', e => { keyState[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { keyState[e.key.toLowerCase()] = false; });

function reset() {
  player = {
    x: 300, y: 400, r: 20,
    hp: 5, maxHp: 5,
    speed: 2.2, angle: 0, // 각도(라디안)
    fireRate: 200, dmg: 1,
    bulletSize: 7,
  };
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
    { name: "체력 +1", apply: p => { p.maxHp += 1; p.hp = p.maxHp; } },
    { name: "총알 크기 ↑", apply: p => p.bulletSize += 2 },
    { name: "적중시 점수 +2", apply: p => p.scoreBonus = (p.scoreBonus||0) + 2 }
  ];
  scoreDiv.innerText = "점수: 0";
  expDiv.innerText = `경험치: 0 / ${expToLevelUp} | 레벨: 1 | 체력: ${player.hp}/${player.maxHp}`;
  gameoverDiv.style.display = 'none';
  restartBtn.style.display = 'none';
  popup.classList.remove('show');
  enemies = []; // 리셋
  spawnEnemy();
  loop();
  startFiring();
}

// 총알 자동 발사 (가장 가까운 적 추적)
let fireTimer = null;
function startFiring() {
  if(fireTimer) clearInterval(fireTimer);
  fireTimer = setInterval(() => {
    if (!gameOver && !popup.classList.contains('show')) {
      // 가장 가까운 적 찾기
      let target = null, minDist = Infinity;
      for (const e of enemies) {
        const dx = e.x - player.x, dy = e.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDist) { minDist = dist; target = e; }
      }
      let angle = player.angle;
      if (target) {
        angle = Math.atan2(target.y - player.y, target.x - player.x);
      }
      bullets.push({
        x: player.x + Math.cos(angle)*player.r,
        y: player.y + Math.sin(angle)*player.r,
        r: player.bulletSize || 5, dmg: player.dmg,
        vx: Math.cos(angle), vy: Math.sin(angle)
      });
    }
  }, player.fireRate);
}

// 적 생성 (허용영역 내 임의 위치 출현)
function spawnEnemy() {
  if (gameOver) return;
  let ex = 0, ey = 0;
  while (true) {
    ex = Math.random() * MAP_WIDTH;
    ey = Math.random() * MAP_HEIGHT;
    if (isAllowed(ex, ey) && Math.hypot(ex - player.x, ey - player.y) > 120) break;
  }
  let angle = Math.random() * Math.PI * 2;
  enemies.push({
    x: ex, y: ey, r: 20, speed: 1.4 + Math.random()*0.8, hp: 1,
    angle: angle, turnTimer: 0
  });
  setTimeout(spawnEnemy, 1000);
}

function getLevelUpExp(level) {
  return 50 + (level - 1) * 40;
}

// 플레이어 이동 (WASD/화살표, 회전)
function updatePlayerMove() {
  let dx = 0, dy = 0;
  if (keyState['arrowleft'] || keyState['a']) dx -= 1;
  if (keyState['arrowright'] || keyState['d']) dx += 1;
  if (keyState['arrowup'] || keyState['w']) dy -= 1;
  if (keyState['arrowdown'] || keyState['s']) dy += 1;
  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    let nx = player.x + (dx/len) * (player.speed*3);
    let ny = player.y + (dy/len) * (player.speed*3);
    // 허용 영역만 이동
    if (isAllowed(nx, ny)) {
      player.x = nx;
      player.y = ny;
      // 회전(이동 방향)
      player.angle = Math.atan2(dy, dx);
    }
  }
}

// 적 움직임 (플레이어 추적 + 랜덤 회전)
function updateEnemies() {
  for (let e of enemies) {
    let dx = player.x - e.x, dy = player.y - e.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    // 일정 확률로 플레이어 방향으로 회전(60% 추적, 40% 랜덤)
    if (Math.random() < 0.6) {
      e.angle = Math.atan2(dy, dx);
    } else {
      if (e.turnTimer <= 0) {
        e.angle = Math.random() * Math.PI * 2;
        e.turnTimer = 20 + Math.random()*30;
      } else {
        e.turnTimer--;
      }
    }
    // 이동
    let nx = e.x + Math.cos(e.angle) * e.speed;
    let ny = e.y + Math.sin(e.angle) * e.speed;
    // 허용된 영역만 이동
    if (isAllowed(nx, ny)) {
      e.x = nx;
      e.y = ny;
    }
  }
}

function loop() {
  if (gameOver) return;
  updatePlayerMove();
  updateEnemies();

  // 맵 배경
  ctx.fillStyle = "#111"; // 금지영역(검정)
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  // 허용영역(회색)
  ctx.save();
  ctx.beginPath();
  ctx.arc(300, 400, 260, 0, Math.PI*2);
  ctx.clip();
  ctx.fillStyle = "#aaa";
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  ctx.restore();

  // 캐릭터(플레이어)
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.beginPath();
  ctx.arc(0, 0, player.r, 0, Math.PI*2);
  ctx.fillStyle = "#0f8";
  ctx.fill();
  // 방향 표시(앞부분)
  ctx.beginPath();
  ctx.moveTo(player.r, 0);
  ctx.lineTo(player.r-8, -7);
  ctx.lineTo(player.r-8, 7);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();

  // 체력바
  drawHpBar();

  // 총알 이동+그리기
  bullets.forEach(b => {
    if (b.vx !== undefined && b.vy !== undefined) {
      let nx = b.x + b.vx * 10, ny = b.y + b.vy * 10;
      if (isAllowed(nx, ny)) {
        b.x = nx; b.y = ny;
      } else {
        b.destroy = true;
      }
    } else {
      b.y -= 8;
    }
  });
  bullets = bullets.filter(b => !b.destroy && b.y > -10 && b.x > -10 && b.x < 610 && b.y < 810);
  ctx.fillStyle = "#fff";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fill();
  });

  // 적 이동+그리기
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);
    ctx.beginPath();
    ctx.arc(0, 0, e.r, 0, Math.PI*2);
    ctx.fillStyle = "#f44";
    ctx.fill();
    // 방향 표시
    ctx.beginPath();
    ctx.moveTo(e.r, 0);
    ctx.lineTo(e.r-7, -6);
    ctx.lineTo(e.r-7, 6);
    ctx.closePath();
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
  }

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
      expDiv.innerText = `경험치: ${exp} / ${expToLevelUp} | 레벨: ${level} | 체력: ${player.hp}/${player.maxHp}`;
      // 피격 효과
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#f44";
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r+3, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      if(player.hp <= 0) {
        gameOver = true;
        gameoverDiv.style.display = 'block';
        restartBtn.style.display = 'block';
        if(fireTimer) clearInterval(fireTimer);
      }
      enemies.splice(enemies.indexOf(e), 1);
      break;
    }
  }

  requestAnimationFrame(loop);
}

function drawHpBar() {
  // HP 바 (플레이어 위에 표시)
  let barW = 50, barH = 7;
  let pct = player.hp/player.maxHp;
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "#222";
  ctx.fillRect(player.x-barW/2, player.y-player.r-22, barW, barH);
  ctx.fillStyle = "#f44";
  ctx.fillRect(player.x-barW/2, player.y-player.r-22, barW*pct, barH);
  ctx.restore();
}

// 경험치 추가 및 레벨업
function gainExp(amount) {
  if(level >= maxLevel) return;
  exp += amount;
  if(exp >= expToLevelUp) {
    exp -= expToLevelUp;
    level += 1;
    expToLevelUp = getLevelUpExp(level);
    expDiv.innerText = `경험치: ${exp} / ${expToLevelUp} | 레벨: ${level} | 체력: ${player.hp}/${player.maxHp}`;
    if(level > maxLevel) return;
    showLevelUpPopup();
  } else {
    expDiv.innerText = `경험치: ${exp} / ${expToLevelUp} | 레벨: ${level} | 체력: ${player.hp}/${player.maxHp}`;
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
      // 체력업일 때 maxHp 증가, hp도 풀로 회복
      if(opt.name.includes("체력")) player.hp = player.maxHp;
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
