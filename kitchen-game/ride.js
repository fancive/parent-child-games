// Guard: redirect if no cart
const state = loadGameState();
if (state.cart.length === 0) {
  window.location.replace('index.html');
} else {
  setTimeout(startBikeRide, 250);
}

function startBikeRide() {
  // Clouds
  const skyLayer = document.getElementById('sky-layer');
  const cloudEmojis = ['☁️', '⛅', '🌤️'];
  for (let i = 0; i < 8; i++) {
    const c = document.createElement('div');
    c.className = 'cloud';
    c.textContent = cloudEmojis[i % 3];
    c.style.top = 10 + Math.random() * 60 + '%';
    c.style.left = Math.random() * 200 + '%';
    c.style.fontSize = 1.5 + Math.random() * 2 + 'rem';
    skyLayer.appendChild(c);
  }

  // Buildings
  const bs = document.getElementById('building-strip');
  '🏠🏡🏢🌳🌲🏪🏫🌳🏠🌲🏬🌳🏡🏠🌲🏢🌳🏠🏡🌳'.match(/./gu).forEach((b) => {
    const el = document.createElement('span');
    el.className = 'building-obj';
    el.textContent = b;
    bs.appendChild(el);
  });

  // Road dashes
  const rs = document.getElementById('road-strip');
  for (let i = 0; i < 40; i++) {
    const d = document.createElement('div');
    d.className = 'road-dash';
    rs.appendChild(d);
  }

  // Road stars
  const page = document.querySelector('.page');
  const starEmojis = ['⭐', '🌟', '💫'];
  const stars = [];
  for (let i = 0; i < 5; i++) {
    const s = document.createElement('div');
    s.className = 'road-star';
    s.textContent = starEmojis[i % 3];
    s.style.left = 20 + i * 15 + '%';
    s.style.animationDelay = i * 0.15 + 's';
    s.addEventListener('click', () => {
      if (!s.classList.contains('collected')) {
        s.classList.add('collected');
        playSound('bell');
      }
    });
    page.appendChild(s);
    stars.push({ el: s, initPct: 20 + i * 15 });
  }

  const vw = window.innerWidth;
  const markerStart = document.getElementById('marker-start');
  const markerEnd = document.getElementById('marker-end');
  markerStart.style.left = vw * 0.7 + 'px';
  markerEnd.style.left = vw * 2 + 'px';

  playSound('bell');

  const duration = 5500;
  const t0 = performance.now();

  (function tick(now) {
    const p = Math.min((now - t0) / duration, 1);
    const ease = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;

    skyLayer.querySelectorAll('.cloud').forEach((c) => {
      c.style.transform = `translateX(${-ease * vw * 0.4}px)`;
    });
    bs.style.transform = `translateX(${-ease * vw * 1.5}px)`;
    rs.style.transform = `translateX(${-ease * vw * 2.5}px)`;
    markerStart.style.left = vw * 0.7 - ease * vw * 1.5 + 'px';
    markerEnd.style.left = vw * 2 - ease * vw * 1.8 + 'px';

    stars.forEach(({ el, initPct }) => {
      el.style.left = `calc(${initPct}% - ${ease * vw * 2}px)`;
    });

    if (p < 1) return requestAnimationFrame(tick);

    // Arrival
    document.getElementById('home-icon').classList.add('home-arrived');
    playSound('fanfare');
    setTimeout(() => navigateTo('kitchen.html'), 900);
  })(performance.now());
}
