function restartFiring() {
  if (fireTimer) clearInterval(fireTimer);
  fireTimer = setInterval(() => {
    if (!gameOver && !popup.classList.contains('show')) {
      if (enemies.length === 0) return;

      // 가장 가까운 적 찾기
      let nearest = null;
      let minDist = Infinity;
      for (let e of enemies) {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = dx * dx + dy * dy; // √ 생략 (빠름)
        if (dist < minDist) {
          minDist = dist;
          nearest = e;
        }
      }

      // 방향 벡터 계산
      const dx = nearest.x - player.x;
      const dy = nearest.y - player.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const vx = dx / len;
      const vy = dy / len;

      // 총알 생성
      bullets.push({
        x: player.x + vx * player.r,
        y: player.y + vy * player.r,
        r: player.bulletSize || 5,
        dmg: player.dmg,
        vx: vx,
        vy: vy
      });
    }
  }, player.fireRate);
}
