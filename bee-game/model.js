/* A small deterministic game model, independent of canvas and browser timers. */
(function () {
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const overlaps = (a, b, radius) => Math.hypot(a.x - b.x, a.y - b.y) < radius;

  class BeeGame {
    constructor(width = 900, random = Math.random) {
      this.width = width;
      this.random = random;
      this.reset();
    }

    reset() {
      this.status = 'ready';
      this.level = 1;
      this.score = 0;
      this.hearts = 3;
      this.time = 0;
      this.player = { x: this.width / 2, y: 530, shield: 0 };
      this.shots = [];
      this.bubbles = [];
      this.effects = [];
      this.events = [];
      this.fireIn = 0;
      this.bubbleIn = 2;
      this.transitionIn = 0;
      this.makeWave();
    }

    makeWave() {
      const rows = this.level + 1;
      this.enemies = Array.from({ length: rows * 5 }, (_, id) => ({
        id,
        column: id % 5,
        row: Math.floor(id / 5),
        x: 0,
        y: 0,
      }));
      this.placeEnemies();
    }

    placeEnemies() {
      const gap = Math.min(100, (this.width - 115) / 5);
      const sway = Math.sin(this.time * 0.85) * Math.min(35, this.width * 0.05);
      for (const enemy of this.enemies) {
        enemy.x = this.width / 2 + (enemy.column - 2) * gap + sway;
        enemy.y = 83 + enemy.row * 66 + Math.sin(this.time + enemy.column) * 7;
      }
    }

    resize(width) {
      const ratio = width / this.width;
      this.player.x *= ratio;
      for (const item of [...this.shots, ...this.bubbles, ...this.effects]) item.x *= ratio;
      this.width = width;
      this.placeEnemies();
    }

    start() {
      if (this.status === 'ready') this.status = 'playing';
    }

    pause() {
      if (this.status === 'playing') this.status = 'paused';
    }

    resume() {
      if (this.status === 'paused') this.status = 'playing';
    }

    moveTo(x) {
      if (this.status === 'playing') this.player.x = clamp(x, 30, this.width - 30);
    }

    hit() {
      if (this.player.shield > 0 || this.status !== 'playing') return;
      this.hearts -= 1;
      this.player.shield = 2.5;
      this.bubbles = [];
      this.events.push('hurt');
      if (this.hearts === 0) this.status = 'rest';
    }

    update(seconds, direction = 0) {
      if (this.status !== 'playing') return;
      const dt = clamp(seconds, 0, 0.05);
      this.time += dt;
      this.moveTo(this.player.x + direction * 330 * dt);
      this.player.shield = Math.max(0, this.player.shield - dt);
      this.effects = this.effects.filter((effect) => (effect.life -= dt) > 0);
      this.placeEnemies();

      if (this.transitionIn > 0) {
        this.transitionIn = Math.max(0, this.transitionIn - dt);
        if (this.transitionIn === 0) {
          this.level += 1;
          this.makeWave();
          this.bubbleIn = 2;
          this.events.push('wave');
        }
        return;
      }

      this.fireIn -= dt;
      if (this.fireIn <= 0) {
        this.shots.push({ x: this.player.x, y: this.player.y - 28 });
        this.fireIn = 0.3;
      }
      for (const shot of this.shots) shot.y -= 410 * dt;
      for (const bubble of this.bubbles) bubble.y += (77 + this.level * 12) * dt;
      this.shots = this.shots.filter((shot) => shot.y > -20);
      this.bubbles = this.bubbles.filter((bubble) => bubble.y < 640);

      for (const shot of this.shots) {
        const enemy = this.enemies.find((target) => overlaps(shot, target, 28));
        if (!enemy) continue;
        this.enemies = this.enemies.filter((target) => target !== enemy);
        shot.y = -100;
        this.score += 10;
        this.effects.push({ x: enemy.x, y: enemy.y, life: 0.55, color: enemy.row });
        this.events.push('pop');
      }
      this.shots = this.shots.filter((shot) => shot.y > -20);
      if (this.bubbles.some((bubble) => overlaps(bubble, this.player, 28))) this.hit();
      if (this.status !== 'playing') return;

      if (this.enemies.length === 0) {
        this.bubbles = [];
        this.shots = [];
        if (this.level === 3) {
          this.status = 'won';
          this.events.push('win');
        } else {
          this.transitionIn = 1.5;
          this.events.push('clear');
        }
        return;
      }

      this.bubbleIn -= dt;
      if (this.bubbleIn <= 0) {
        const enemy = this.enemies[Math.floor(this.random() * this.enemies.length)];
        this.bubbles.push({ x: enemy.x, y: enemy.y + 25 });
        this.bubbleIn = 1.9 - this.level * 0.25;
      }
    }
  }

  window.BeeGameModel = BeeGame;
})();
