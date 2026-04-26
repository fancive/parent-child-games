// ===== GAME DATA =====
const ALL_INGREDIENTS = [
  { id: 'tomato',   emoji: '🍅', name: '番茄',   price: 2, category: '蔬菜', wash: true,  cut: true  },
  { id: 'carrot',   emoji: '🥕', name: '胡萝卜', price: 1, category: '蔬菜', wash: true,  cut: true  },
  { id: 'pepper',   emoji: '🫑', name: '青椒',   price: 1, category: '蔬菜', wash: true,  cut: true  },
  { id: 'cabbage',  emoji: '🥬', name: '白菜',   price: 1, category: '蔬菜', wash: true,  cut: true  },
  { id: 'corn',     emoji: '🌽', name: '玉米',   price: 2, category: '蔬菜', wash: true,  cut: false },
  { id: 'mushroom', emoji: '🍄', name: '蘑菇',   price: 2, category: '蔬菜', wash: true,  cut: true  },
  { id: 'egg',      emoji: '🥚', name: '鸡蛋',   price: 2, category: '蛋奶', wash: false, cut: false },
  { id: 'cheese',   emoji: '🧀', name: '芝士',   price: 3, category: '蛋奶', wash: false, cut: true  },
  { id: 'beef',     emoji: '🥩', name: '牛肉',   price: 5, category: '肉类', wash: true,  cut: true  },
  { id: 'chicken',  emoji: '🍗', name: '鸡腿',   price: 4, category: '肉类', wash: true,  cut: false },
  { id: 'shrimp',   emoji: '🦐', name: '虾仁',   price: 5, category: '肉类', wash: true,  cut: false },
  { id: 'bacon',    emoji: '🥓', name: '培根',   price: 3, category: '肉类', wash: false, cut: true  },
  { id: 'rice',     emoji: '🍚', name: '米饭',   price: 2, category: '主食', wash: false, cut: false },
  { id: 'noodle',   emoji: '🍜', name: '面条',   price: 2, category: '主食', wash: false, cut: false },
  { id: 'butter',   emoji: '🧈', name: '黄油',   price: 3, category: '调料', wash: false, cut: false },
];

const RECIPES = [
  { id: 'pizza', emoji: '🍕', name: '美味披萨', pot: '🍕', required: ['tomato','cheese'], optional: ['bacon','mushroom','pepper'] },
  { id: 'friedrice', emoji: '🍳', name: '蛋炒饭', pot: '🍳', required: ['rice','egg'], optional: ['carrot','corn','shrimp'] },
  { id: 'pasta', emoji: '🍝', name: '番茄肉酱面', pot: '🍲', required: ['noodle','tomato','beef'], optional: ['mushroom','pepper'] },
  { id: 'salad', emoji: '🥗', name: '缤纷沙拉', pot: '🥣', required: ['tomato','carrot','corn'], optional: ['egg','shrimp'] },
  { id: 'tomatoegg', emoji: '🥘', name: '番茄炒蛋', pot: '🍳', required: ['tomato','egg'], optional: ['pepper','mushroom'] },
  { id: 'burger', emoji: '🍔', name: '芝士汉堡', pot: '🍔', required: ['beef','cheese'], optional: ['tomato','bacon','cabbage'] },
  { id: 'soup', emoji: '🍲', name: '蔬菜浓汤', pot: '🍲', required: ['cabbage','carrot','tomato'], optional: ['mushroom','corn','egg'] },
  { id: 'butterchicken', emoji: '🍗', name: '黄油烤鸡腿', pot: '🍗', required: ['chicken','butter'], optional: ['mushroom','pepper','corn'] },
  { id: 'cheesyrice', emoji: '🧀', name: '芝士焗饭', pot: '🍚', required: ['rice','cheese','butter'], optional: ['bacon','corn','mushroom'] },
  { id: 'shrimnoodle', emoji: '🦐', name: '鲜虾拌面', pot: '🍜', required: ['noodle','shrimp','egg'], optional: ['pepper','carrot'] },
];

const INGREDIENT_MAP = Object.fromEntries(ALL_INGREDIENTS.map(i => [i.id, i]));
function getIngredient(id) { return INGREDIENT_MAP[id]; }

// ===== LOCALSTORAGE (with error handling) =====
function saveGameState(money, cart) {
  try {
    localStorage.setItem('pcg_kitchen-money', JSON.stringify(money));
    localStorage.setItem('pcg_kitchen-cart', JSON.stringify(cart));
  } catch (e) { /* quota exceeded or private browsing */ }
}

function loadGameState() {
  try {
    const money = JSON.parse(localStorage.getItem('pcg_kitchen-money') || '20');
    const cart = JSON.parse(localStorage.getItem('pcg_kitchen-cart') || '[]');
    if (typeof money !== 'number' || !Array.isArray(cart)) throw new Error();
    return { money, cart };
  } catch (e) {
    clearGameState();
    return { money: 20, cart: [] };
  }
}

function clearGameState() {
  localStorage.removeItem('pcg_kitchen-money');
  localStorage.removeItem('pcg_kitchen-cart');
  localStorage.removeItem('pcg_kitchen-back-to-shop');
}

// ===== DEBOUNCE =====
function debounceClick(fn, ms = 300) {
  let blocked = false;
  return function (...args) {
    if (blocked) return;
    blocked = true;
    fn.apply(this, args);
    setTimeout(() => { blocked = false; }, ms);
  };
}

// ===== AUDIO =====
let audioCtx;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function vibrate(pattern) {
  try { navigator.vibrate && navigator.vibrate(pattern); } catch (e) {}
}

function playSound(type) {
  try {
    const ctx = getAudio();
    const t = ctx.currentTime;

    const makeOsc = (freq, dur, vol = 0.2, wave = 'sine') => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = wave;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + dur);
      o.start(t); o.stop(t + dur);
      return o;
    };

    const makeNoise = (dur, vol = 0.15) => {
      const bs = ctx.sampleRate * dur;
      const buf = ctx.createBuffer(1, bs, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bs; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bs);
      const s = ctx.createBufferSource(); s.buffer = buf;
      const g = ctx.createGain();
      s.connect(g); g.connect(ctx.destination);
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
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = [523, 659, 784, 1047][i];
          g.gain.setValueAtTime(0.18, t + dt);
          g.gain.exponentialRampToValueAtTime(0.01, t + dt + 0.25);
          o.start(t + dt); o.stop(t + dt + 0.25);
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
function spawnConfetti() {
  const colors = ['#ff5722', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0', '#e91e63'];
  const emojis = ['🎉', '⭐', '❤️', '🎊', '✨'];
  const frag = document.createDocumentFragment();

  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.top = '-10px';
    if (i % 5 === 0) {
      c.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      c.style.fontSize = (0.8 + Math.random() * 0.8) + 'rem';
    } else {
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      c.style.width = (6 + Math.random() * 8) + 'px';
      c.style.height = (6 + Math.random() * 8) + 'px';
    }
    const dur = 1.5 + Math.random() * 2;
    c.style.animation = `confetti-fall ${dur}s linear ${Math.random() * 0.5}s forwards`;
    frag.appendChild(c);
    setTimeout(() => c.remove(), (dur + 0.5) * 1000);
  }

  document.body.appendChild(frag);
}

// ===== NAV HELPERS =====
function navigateTo(url) {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.2s';
  setTimeout(() => { window.location.href = url; }, 200);
}
