(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const game = new window.BeeGameModel();
  const overlay = document.getElementById('overlay');
  const start = document.getElementById('start');
  const pause = document.getElementById('pause');
  const sound = document.getElementById('sound');
  const announcement = document.getElementById('announcement');
  const help = document.getElementById('help-dialog');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const held = new Set();
  let pointer = null;
  let audio;
  let soundOn = true;
  let previousStatus = '';
  let previousScore = -1;
  let lastTime = 0;
  let resumeAfterHelp = false;

  function ellipse(x, y, rx, ry, fill, rotation = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function line(points, color, width = 3) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (const point of points.slice(1)) ctx.lineTo(point[0], point[1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function star(x, y, size, fill, angle = 0) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? size : size * 0.46;
      const theta = -Math.PI / 2 + (i * Math.PI) / 5 + angle;
      const px = x + Math.cos(theta) * radius;
      const py = y + Math.sin(theta) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function bee(x, y, scale = 1, time = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const flap = reducedMotion ? 0 : Math.sin(time * 22) * 0.12;
    ellipse(-22, -8, 15, 25, '#fffcf1', -0.65 + flap);
    ellipse(22, -8, 15, 25, '#fffcf1', 0.65 - flap);
    ellipse(-23, -11, 7, 14, '#dcebe3', -0.65 + flap);
    ellipse(23, -11, 7, 14, '#dcebe3', 0.65 - flap);
    ellipse(0, 6, 24, 29, '#edb849');
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 6, 24, 29, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#726044';
    ctx.fillRect(-27, 9, 54, 8);
    ctx.fillRect(-27, 25, 54, 7);
    ctx.restore();
    ellipse(0, -12, 25, 21, '#ffd777');
    line(
      [
        [-11, -27],
        [-16, -38],
      ],
      '#726044',
      2.5,
    );
    line(
      [
        [11, -27],
        [16, -38],
      ],
      '#726044',
      2.5,
    );
    ellipse(-16, -38, 3, 3, '#726044');
    ellipse(16, -38, 3, 3, '#726044');
    ellipse(-8, -15, 2.5, 3.5, '#564b38');
    ellipse(8, -15, 2.5, 3.5, '#564b38');
    ellipse(-15, -6, 5, 3, '#e99e78');
    ellipse(15, -6, 5, 3, '#e99e78');
    ctx.beginPath();
    ctx.arc(0, -7, 4, 0.15, Math.PI - 0.15);
    ctx.strokeStyle = '#796042';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function bug(enemy) {
    const colors = ['#e7a58f', '#afbd8e', '#c9acd0', '#e7c477'];
    const { x, y, row } = enemy;
    ellipse(x, y, 27, 28, '#fffdf346');
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.strokeStyle = '#fffdf5ba';
    ctx.lineWidth = 2;
    ctx.stroke();
    ellipse(x - 15, y - 16, 5, 2.8, '#ffffffb0', -0.7);
    ellipse(x - 15, y, 9, 14, '#fffdf4', -0.65);
    ellipse(x + 15, y, 9, 14, '#fffdf4', 0.65);
    ellipse(x, y + 1, 19, 17, colors[row]);
    line(
      [
        [x - 7, y - 12],
        [x - 10, y - 23],
      ],
      '#847452',
      2,
    );
    line(
      [
        [x + 7, y - 12],
        [x + 10, y - 23],
      ],
      '#847452',
      2,
    );
    ellipse(x - 6, y - 2, 2, 2.7, '#625641');
    ellipse(x + 6, y - 2, 2, 2.7, '#625641');
    ellipse(x - 11, y + 5, 3.3, 2, '#f8d3b7');
    ellipse(x + 11, y + 5, 3.3, 2, '#f8d3b7');
    line(
      [
        [x - 2, y + 6],
        [x, y + 8],
        [x + 2, y + 6],
      ],
      '#8d7056',
      1.4,
    );
  }

  function flower(x, y, size, color) {
    line(
      [
        [x, y],
        [x, y + size * 2.5],
      ],
      '#8ca167',
      2,
    );
    ellipse(x + size * 0.45, y + size * 1.7, size * 0.55, size * 0.23, '#97ad71', -0.6);
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      ellipse(
        x + Math.cos(angle) * size * 0.6,
        y + Math.sin(angle) * size * 0.6,
        size * 0.48,
        size * 0.48,
        color,
      );
    }
    ellipse(x, y, size * 0.35, size * 0.35, '#e2b650');
  }

  function cloud(x, y, size) {
    ellipse(x, y, size, size * 0.25, '#fffdf0b0');
    ellipse(x - size * 0.25, y - size * 0.12, size * 0.45, size * 0.32, '#fffdf0b0');
    ellipse(x + size * 0.22, y - size * 0.23, size * 0.32, size * 0.35, '#fffdf0b0');
  }

  function background(time) {
    const w = game.width;
    ctx.fillStyle = '#e9f1df';
    ctx.fillRect(0, 0, w, 600);
    ellipse(w - 78, 65, 39, 39, '#f4d989');
    ellipse(w - 87, 65, 2, 3, '#b39758');
    ellipse(w - 69, 65, 2, 3, '#b39758');
    line(
      [
        [w - 82, 76],
        [w - 78, 78],
        [w - 74, 76],
      ],
      '#b39758',
      2,
    );
    const drift = reducedMotion ? 0 : Math.sin(time * 0.15) * 10;
    cloud(65 + drift, 50, 69);
    cloud(w * 0.59 + drift, 29, 48);
    cloud(w * 0.83 - drift, 246, 54);
    cloud(45, 300, 53);
    ellipse(w * 0.14, 616, w * 0.65, 148, '#d8e4bf');
    ellipse(w * 0.92, 625, w * 0.61, 180, '#ceddb3');
    ellipse(w * 0.43, 657, w * 0.8, 113, '#bdcf9b');
    for (let i = 0; i < 15; i++) {
      const x = (i / 14) * w;
      const y = 570 + Math.sin(i * 2.7) * 18;
      flower(x, y, 6 + (i % 3) * 2, ['#fffdf0', '#e8b4a3', '#f0d78b'][i % 3]);
    }
    // The painted flowers at the sides frame the play area without hiding targets.
    flower(26, 488, 12, '#fffbee');
    flower(w - 26, 503, 15, '#f1beac');
    flower(w - 46, 530, 9, '#fff9e8');
    for (let i = 0; i < 9; i++) {
      ellipse((i * 137 + 64) % w, 330 + (i % 3) * 49, 1.5, 1.5, '#adc29260');
    }
  }

  function render(time) {
    const rect = canvas.getBoundingClientRect();
    ctx.setTransform(canvas.width / game.width, 0, 0, canvas.height / 600, 0, 0);
    if (rect.width === 0) return;
    background(time);
    for (const enemy of game.enemies) bug(enemy);
    for (const shot of game.shots) {
      ellipse(shot.x, shot.y + 10, 3, 9, '#e4b34935');
      star(shot.x, shot.y, 8, '#d5a037');
    }
    for (const bubble of game.bubbles) {
      ellipse(bubble.x, bubble.y, 10, 11, '#e9b5b979');
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, 11, 0, Math.PI * 2);
      ctx.strokeStyle = '#c87d898f';
      ctx.lineWidth = 2;
      ctx.stroke();
      ellipse(bubble.x - 3, bubble.y - 4, 3, 2, '#fff9f1');
    }
    for (const effect of game.effects) {
      ctx.globalAlpha = Math.max(0, effect.life / 0.55);
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const spread = reducedMotion ? 18 : (1 - effect.life / 0.55) * 40;
        star(
          effect.x + Math.cos(angle) * spread,
          effect.y + Math.sin(angle) * spread,
          5,
          '#d9ab4e',
          angle,
        );
      }
      ctx.globalAlpha = 1;
    }
    if (game.player.shield > 0) {
      ellipse(game.player.x, game.player.y, 44, 47, '#fffcde90');
      ctx.beginPath();
      ctx.arc(game.player.x, game.player.y, 44, 0, Math.PI * 2);
      ctx.strokeStyle = '#d9b04a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ellipse(game.player.x, game.player.y + 47, 28, 6, '#83956226');
    bee(game.player.x, game.player.y, 1, game.status === 'playing' ? game.time : 0);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    game.resize((rect.width / rect.height) * 600);
    render(game.time);
  }

  function tone(type) {
    if (!soundOn) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!audio) audio = new Audio();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(
        type === 'hurt' ? 220 : type === 'pop' ? 690 : 880,
        audio.currentTime,
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        type === 'hurt' ? 180 : 1100,
        audio.currentTime + 0.12,
      );
      gain.gain.setValueAtTime(0.035, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.18);
    } catch {
      // Audio is optional; blocked audio must never stop the game.
    }
  }

  function releaseControls() {
    held.clear();
    pointer = null;
    for (const button of document.querySelectorAll('.direction-buttons button'))
      button.classList.remove('held');
  }

  function sync() {
    if (previousScore !== game.score) {
      document.getElementById('score').textContent = game.score;
      previousScore = game.score;
    }
    document.getElementById('level').textContent = `花园第 ${game.level} 关`;
    const hearts = document.querySelector('.hearts');
    hearts.firstElementChild.textContent = '♥ '.repeat(game.hearts) + '♡ '.repeat(3 - game.hearts);
    hearts.setAttribute('aria-label', `还有${game.hearts}颗爱心`);
    announcement.hidden = game.transitionIn <= 0 || game.status !== 'playing';
    announcement.textContent = `真棒！下一站，第 ${game.level + 1} 关`;
    pause.disabled = !['playing', 'paused'].includes(game.status);
    pause.textContent = game.status === 'paused' ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-label', game.status === 'paused' ? '继续游戏' : '暂停游戏');
    if (previousStatus === game.status) return;
    previousStatus = game.status;
    overlay.hidden = game.status === 'playing';
    if (game.status === 'playing') return;
    releaseControls();
    const copy = {
      ready: [
        '翅膀准备好了吗？',
        '今天，你是小小飞行员',
        '左右飞一飞，小星星会自动发射哦！',
        '出发啦',
        '不用着急，没有倒计时',
      ],
      paused: [
        '小蜜蜂歇一歇',
        '休息一下，再出发',
        '花园会等着你，准备好再继续。',
        '继续飞',
        '按空格键，也可以继续',
      ],
      rest: [
        '每一次尝试都很棒',
        '小蜜蜂需要休息啦',
        `你收获了 ${game.score} 颗小星星！再试一次吧。`,
        '再飞一次',
        '小提示：左右移动，躲开粉色泡泡',
      ],
      won: [
        '三座花园，都飞过啦',
        '你是勇敢的小飞行员！',
        `收获 ${game.score} 颗小星星，给自己一个大大的拥抱。`,
        '再玩一次',
        '也可以和爸爸妈妈轮流玩哦',
      ],
    }[game.status];
    document.getElementById('overlay-kicker').textContent = copy[0];
    document.getElementById('overlay-title').textContent = copy[1];
    document.getElementById('overlay-description').textContent = copy[2];
    start.textContent = `${copy[3]} ➜`;
    document.getElementById('overlay-note').textContent = copy[4];
    document.getElementById('status').textContent = copy[1];
    if (!help.open && game.status !== 'ready') start.focus({ preventScroll: true });
  }

  function togglePause() {
    releaseControls();
    if (game.status === 'playing') game.pause();
    else if (game.status === 'paused') {
      game.resume();
      canvas.focus({ preventScroll: true });
    }
    sync();
  }

  start.addEventListener('click', () => {
    if (game.status === 'paused') game.resume();
    else {
      game.reset();
      game.start();
    }
    tone('start');
    sync();
    canvas.focus({ preventScroll: true });
  });
  pause.addEventListener('click', togglePause);
  sound.addEventListener('click', () => {
    soundOn = !soundOn;
    sound.setAttribute('aria-pressed', String(soundOn));
    sound.textContent = soundOn ? '♪ 声音开' : '♪ 声音关';
    if (soundOn) tone('start');
  });
  for (const [id, direction] of [
    ['left', -1],
    ['right', 1],
  ]) {
    const button = document.getElementById(id);
    button.addEventListener('pointerdown', (event) => {
      if (game.status !== 'playing') return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      held.add(id);
      button.classList.add('held');
    });
    const release = () => {
      held.delete(id);
      button.classList.remove('held');
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    // Keyboard / assistive-technology activation of the native buttons.
    button.addEventListener('click', (event) => {
      if (event.detail === 0) game.moveTo(game.player.x + direction * 45);
    });
  }
  function pointTo(event) {
    const rect = canvas.getBoundingClientRect();
    game.moveTo(((event.clientX - rect.left) / rect.width) * game.width);
  }
  canvas.addEventListener('pointerdown', (event) => {
    if (game.status !== 'playing' || pointer !== null) return;
    event.preventDefault();
    pointer = event.pointerId;
    canvas.setPointerCapture(pointer);
    pointTo(event);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId === pointer) pointTo(event);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, (event) => {
      if (event.pointerId === pointer) pointer = null;
    });
  }
  window.addEventListener('keydown', (event) => {
    if (help.open) return;
    if (['ArrowLeft', 'ArrowRight'].includes(event.code) && game.status === 'playing') {
      event.preventDefault();
      held.add(event.code);
    }
    if (event.code === 'Escape' && ['playing', 'paused'].includes(game.status) && !event.repeat)
      togglePause();
    if (event.code === 'Space' && event.target === canvas && !event.repeat) {
      event.preventDefault();
      togglePause();
    }
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  const autoPause = () => {
    releaseControls();
    game.pause();
    sync();
  };
  window.addEventListener('blur', autoPause);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) autoPause();
  });
  document.getElementById('help').addEventListener('click', () => {
    resumeAfterHelp = game.status === 'playing';
    game.pause();
    releaseControls();
    help.showModal();
    sync();
  });
  help.addEventListener('close', () => {
    if (resumeAfterHelp) {
      game.resume();
      canvas.focus({ preventScroll: true });
    }
    resumeAfterHelp = false;
    sync();
  });
  new window.ResizeObserver(resize).observe(canvas);

  function frame(timestamp) {
    const dt = lastTime ? (timestamp - lastTime) / 1000 : 0;
    lastTime = timestamp;
    const direction =
      Number(held.has('right') || held.has('ArrowRight')) -
      Number(held.has('left') || held.has('ArrowLeft'));
    game.update(dt, direction);
    for (const event of game.events.splice(0)) {
      tone(event);
      if (event === 'hurt')
        document.getElementById('status').textContent =
          `还有${game.hearts}颗爱心，护盾会保护你一会儿。`;
      if (event === 'wave')
        document.getElementById('status').textContent = `第${game.level}关，继续加油！`;
    }
    sync();
    render(game.time);
    window.requestAnimationFrame(frame);
  }
  resize();
  sync();
  window.requestAnimationFrame(frame);
})();
