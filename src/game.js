// ... (생략)

// 키 입력 상태 저장
let keyState = {};
window.addEventListener('keydown', e => { keyState[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { keyState[e.key.toLowerCase()] = false; });

// 총알 자동 발사
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
      let vx = 0, vy = -1; // 기본 위쪽
      if (target) {
        vx = target.x - player.x;
        vy = target.y - player.y;
        const vlen = Math.sqrt(vx*vx + vy*vy);
        if (vlen > 0) { vx /= vlen; vy /= vlen; }
      }
      bullets.push({
        x: player.x, y: player.y - 20,
        r: player.bulletSize || 5, dmg: player.dmg,
        vx, vy
      });
    }
  }, player.fireRate);
}

// 총알 이동(방향 적용)
bullets.forEach(b => {
  if (b.vx !== undefined && b.vy !== undefined) {
    b.x += b.vx * 8; b.y += b.vy * 8;
  } else {
    b.y -= 8;
  }
});
bullets = bullets.filter(b => b.y > -10 && b.x > -10 && b.x < 610 && b.y < 810);

// 플레이어 이동(키 입력)
function updatePlayerMove() {
  let dx = 0, dy = 0;
  if (keyState['arrowleft'] || keyState['a']) dx -= 1;
  if (keyState['arrowright'] || keyState['d']) dx += 1;
  if (keyState['arrowup'] || keyState['w']) dy -= 1;
  if (keyState['arrowdown'] || keyState['s']) dy += 1;
  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    player.x += (dx/len) * (player.speed*4);
    player.y += (dy/len) * (player.speed*4);
    // 화면 밖으로 못 나가게
    player.x = Math.max(player.r, Math.min(600-player.r, player.x));
    player.y = Math.max(player.r, Math.min(800-player.r, player.y));
  }
}

// --- 루프 내에서 updatePlayerMove 호출 추가
function loop() {
  if (gameOver) return;
  updatePlayerMove();
  // ... 이하 동일
}
