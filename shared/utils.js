// shared/utils.js — cross-game utilities for parent-child-games

// ===== AUDIO =====
let _pcgAudioCtx;
function _pcgGetAudio() {
  if (!_pcgAudioCtx) _pcgAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _pcgAudioCtx;
}

function vibrate(pattern) {
  try {
    navigator.vibrate && navigator.vibrate(pattern);
  } catch (e) {}
}

function playSound(type) {
  try {
    const ctx = _pcgGetAudio();
    const t = ctx.currentTime;

    const makeOsc = (freq, dur, vol = 0.2, wave = 'sine') => {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = wave;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + dur);
      o.start(t);
      o.stop(t + dur);
      return o;
    };

    const makeNoise = (dur, vol = 0.15) => {
      const bs = ctx.sampleRate * dur;
      const buf = ctx.createBuffer(1, bs, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bs; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bs);
      const s = ctx.createBufferSource();
      s.buffer = buf;
      const g = ctx.createGain();
      s.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + dur);
      s.start(t);
    };

    switch (type) {
      case 'buy': {
        const o = makeOsc(800, 0.12);
        o.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
        vibrate(30);
        break;
      }
      case 'return': {
        const o = makeOsc(600, 0.12);
        o.frequency.exponentialRampToValueAtTime(300, t + 0.12);
        vibrate(20);
        break;
      }
      case 'error': {
        makeOsc(200, 0.2, 0.15, 'square');
        vibrate([40, 20, 40]);
        break;
      }
      case 'splash': {
        const o = makeOsc(1000, 0.2);
        o.frequency.exponentialRampToValueAtTime(400, t + 0.15);
        vibrate(25);
        break;
      }
      case 'chop': {
        makeNoise(0.08, 0.25);
        vibrate(20);
        break;
      }
      case 'plop': {
        const o = makeOsc(500, 0.15, 0.25);
        o.frequency.exponentialRampToValueAtTime(250, t + 0.1);
        vibrate(20);
        break;
      }
      case 'sizzle': {
        makeNoise(0.3, 0.1);
        break;
      }
      case 'fanfare': {
        [0, 0.12, 0.24, 0.4].forEach((dt, i) => {
          const o = ctx.createOscillator(),
            g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = [523, 659, 784, 1047][i];
          g.gain.setValueAtTime(0.18, t + dt);
          g.gain.exponentialRampToValueAtTime(0.01, t + dt + 0.25);
          o.start(t + dt);
          o.stop(t + dt + 0.25);
        });
        vibrate([30, 50, 30, 50, 100]);
        break;
      }
      case 'bell': {
        makeOsc(1200, 0.4);
        vibrate(25);
        break;
      }
      case 'ding': {
        const o = makeOsc(880, 0.5, 0.25);
        o.frequency.setValueAtTime(1320, t + 0.1);
        vibrate(20);
        break;
      }
    }
  } catch (e) {}
}

// ===== CONFETTI =====
(function () {
  if (document.getElementById('_pcg_confetti_style')) return;
  const s = document.createElement('style');
  s.id = '_pcg_confetti_style';
  s.textContent =
    '@keyframes pcgConfettiFall{to{transform:translateY(110vh) rotate(720deg);opacity:0}}';
  document.head.appendChild(s);
})();

function showConfetti(container, count = 30) {
  while (container.children.length > 30) container.removeChild(container.firstChild);
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#FFE66D',
    '#95E1D3',
    '#F38181',
    '#AA96DA',
    '#FCBAD3',
    '#A8D8EA',
  ];
  const frag = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const dur = +(1.5 + Math.random() * 2).toFixed(2);
    const delay = +(Math.random() * 0.5).toFixed(2);
    el.style.cssText =
      'position:fixed;top:-10px;pointer-events:none;z-index:9999;' +
      `left:${(Math.random() * 100).toFixed(1)}%;` +
      `width:${8 + ((Math.random() * 8) | 0)}px;height:${8 + ((Math.random() * 8) | 0)}px;` +
      `background:${colors[(Math.random() * colors.length) | 0]};` +
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'};` +
      `animation:pcgConfettiFall ${dur}s linear ${delay}s forwards`;
    frag.appendChild(el);
    setTimeout(() => el.remove(), (dur + delay + 0.1) * 1000);
  }

  container.appendChild(frag);
}

// ===== DEBOUNCE =====
function debounceClick(fn, ms = 300) {
  let blocked = false;
  return function (...args) {
    if (blocked) return;
    blocked = true;
    fn.apply(this, args);
    setTimeout(() => {
      blocked = false;
    }, ms);
  };
}

// ===== STATE =====
function saveState(key, value) {
  try {
    localStorage.setItem('pcg_' + key, JSON.stringify(value));
  } catch (e) {}
}

function loadState(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem('pcg_' + key);
    return raw === null ? defaultValue : JSON.parse(raw);
  } catch (e) {
    return defaultValue;
  }
}
