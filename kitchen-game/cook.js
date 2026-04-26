// ===== STATE =====
const state = loadGameState();
const cart = state.cart;
if (cart.length === 0) {
  window.location.replace('index.html');
}

const usedIngredients = new Set();
const STEP_EMOJI = { wash: '🫧', cut: '🔪', pot: '🍳', stir: '🔥', plate: '🍽️' };

let recipe = null;
let stepList = [];
let stepIdx = 0;
let stepIngs = []; // all ingredient ids for this cook
let washList = [],
  cutList = [];
let washedSet, cutIdx, chopCnt, potSet, stirProg, stirDir;
const CHOPS = 3;

function available() {
  return cart.filter((id) => !usedIngredients.has(id));
}

// ===== EVENTS =====
document.getElementById('btn-back-shop').addEventListener('click', () => {
  localStorage.setItem('pcg_kitchen-back-to-shop', '1');
  navigateTo('index.html');
});
document.getElementById('btn-change-dish').addEventListener('click', backToRecipes);
document.getElementById('btn-cook-again').addEventListener('click', () => {
  document.getElementById('celebration-overlay').classList.remove('active');
  recipe = null;
  backToRecipes();
});
document.getElementById('btn-restart').addEventListener('click', () => {
  clearGameState();
  navigateTo('index.html');
});

// ===== RECIPE SELECTION =====
function showRecipes() {
  document.getElementById('recipe-selection').style.display = '';
  document.getElementById('cooking-steps').style.display = 'none';
  const cards = document.getElementById('recipe-cards');
  cards.innerHTML = '';
  const avail = available();

  RECIPES.forEach((r, i) => {
    const hasAll = r.required.every((id) => avail.includes(id));
    const missing = r.required.filter((id) => !avail.includes(id));
    const card = document.createElement('div');
    card.className = 'recipe-card ' + (hasAll ? 'available' : 'unavailable');
    card.style.animationDelay = i * 70 + 'ms';
    card.innerHTML = `
      <div class="rc-emoji">${r.emoji}</div>
      <div class="rc-name">${r.name}</div>
      <div class="rc-ingredients">必要: ${r.required
        .map((id) => {
          const g = getIngredient(id);
          const h = avail.includes(id);
          return `<span style="opacity:${h ? 1 : 0.4}">${h ? '' : '❌'}${g.emoji}${g.name}</span>`;
        })
        .join(' ')}</div>
      <div class="rc-ingredients">可选: ${r.optional
        .map(
          (id) =>
            `<span style="opacity:${avail.includes(id) ? 1 : 0.4}">${getIngredient(id).emoji}</span>`,
        )
        .join('')}</div>
      ${!hasAll ? `<div class="rc-missing">缺少: ${missing.map((id) => getIngredient(id).name).join('、')}</div>` : ''}`;
    if (hasAll) card.addEventListener('click', () => selectRecipe(r));
    cards.appendChild(card);
  });
}

function backToRecipes() {
  recipe = null;
  showRecipes();
}

// ===== COOKING STEPS =====
function selectRecipe(r) {
  recipe = r;
  const avail = available();
  stepIngs = [...r.required, ...r.optional.filter((id) => avail.includes(id))];
  washList = stepIngs.filter((id) => getIngredient(id).wash);
  cutList = stepIngs.filter((id) => getIngredient(id).cut);

  stepList = [];
  if (washList.length) stepList.push('wash');
  if (cutList.length) stepList.push('cut');
  stepList.push('pot', 'stir', 'plate');

  stepIdx = 0;
  washedSet = new Set();
  cutIdx = 0;
  chopCnt = 0;
  potSet = new Set();
  stirProg = 0;
  stirDir = false;

  playSound('bell');
  document.getElementById('recipe-selection').style.display = 'none';
  document.getElementById('cooking-steps').style.display = 'flex';
  document.getElementById('cooking-dish-name').textContent = r.emoji + ' ' + r.name;
  renderStep();
}

function renderProgress() {
  const bar = document.getElementById('step-progress');
  bar.innerHTML = '';
  stepList.forEach((s, i) => {
    if (i) {
      const ln = document.createElement('div');
      ln.className = 'progress-line' + (i <= stepIdx ? ' done' : '');
      bar.appendChild(ln);
    }
    const d = document.createElement('div');
    d.className = 'progress-dot';
    if (i < stepIdx) d.classList.add('done');
    else if (i === stepIdx) d.classList.add('active');
    d.textContent = STEP_EMOJI[s];
    bar.appendChild(d);
  });
}

function renderStep() {
  renderProgress();
  const box = document.getElementById('step-content');
  const hint = document.getElementById('step-hint');
  box.innerHTML = '';
  const inner = document.createElement('div');
  inner.className = 'step-inner';
  box.appendChild(inner);

  const fn = {
    wash: renderWash,
    cut: renderCut,
    pot: renderPot,
    stir: renderStir,
    plate: renderPlate,
  };
  fn[stepList[stepIdx]](inner, hint);
}

function nextStep() {
  const dots = document.querySelectorAll('#step-progress .progress-dot');
  if (dots[stepIdx]) dots[stepIdx].classList.add('just-done');
  stepIdx++;
  if (stepIdx < stepList.length) {
    playSound('ding');
    renderStep();
  }
}

// ----- WASH -----
function renderWash(box, hint) {
  hint.textContent = '👆 点击食材洗一洗！';
  box.innerHTML = `
    <div class="wash-scene">
      <div class="sink">
        <div class="faucet">🚿</div>
        <div class="water-stream"></div>
        <span class="sink-item" id="sink-cur" style="opacity:0"></span>
      </div>
      <div class="wash-items" id="wash-items"></div>
    </div>`;
  const container = document.getElementById('wash-items');
  washList.forEach((id) => {
    const ing = getIngredient(id);
    const el = document.createElement('div');
    el.className = 'wash-item dirty';
    el.dataset.id = id;
    el.innerHTML = `<span class="wi-emoji">${ing.emoji}</span><span class="wi-name">${ing.name}</span>`;
    el.addEventListener(
      'click',
      debounceClick(() => doWash(id), 600),
    );
    container.appendChild(el);
  });
}

function doWash(id) {
  if (washedSet.has(id)) return;
  const el = document.querySelector(`.wash-item[data-id="${id}"]`);
  if (!el) return;
  playSound('splash');

  const cur = document.getElementById('sink-cur');
  cur.textContent = getIngredient(id).emoji;
  cur.style.opacity = '1';

  const sink = document.querySelector('.sink');
  for (let i = 0; i < 3; i++) {
    const s = document.createElement('span');
    s.className = 'sink-splash';
    s.textContent = '💧';
    s.style.left = 30 + Math.random() * 40 + '%';
    s.style.top = 20 + Math.random() * 30 + '%';
    sink.appendChild(s);
    setTimeout(() => s.remove(), 500);
  }

  el.classList.add('washing');
  setTimeout(() => {
    washedSet.add(id);
    el.classList.remove('washing', 'dirty');
    el.classList.add('washed');
    cur.style.opacity = '0';
    const left = washList.length - washedSet.size;
    const h = document.getElementById('step-hint');
    if (!left) {
      h.textContent = '✅ 全部洗好啦！';
      setTimeout(nextStep, 700);
    } else h.textContent = `👆 还有 ${left} 个要洗！`;
  }, 550);
}

// ----- CUT -----
function renderCut(box, hint) {
  cutIdx = 0;
  chopCnt = 0;
  hint.textContent = '👆 点击砧板切一切！';
  const first = getIngredient(cutList[0]);
  box.innerHTML = `
    <div class="cut-scene">
      <div class="cutting-board" id="board">
        <span class="board-item" id="board-item">${first.emoji}</span>
        <span class="knife" id="knife">🔪</span>
      </div>
      <div class="cut-counter" id="cut-counter">
        <span>切 ${first.name}：</span>
        ${Array.from({ length: CHOPS }, (_, i) => `<span class="chop-dot" id="cd-${i}"></span>`).join('')}
      </div>
      <div class="chopped-bowl" id="bowl">🥣 </div>
    </div>`;
  document.getElementById('board').addEventListener('click', debounceClick(doChop, 180));
}

function doChop() {
  if (cutIdx >= cutList.length) return;
  const knife = document.getElementById('knife');
  const item = document.getElementById('board-item');
  knife.classList.remove('chop');
  void knife.offsetWidth;
  knife.classList.add('chop');
  item.style.transform = 'scale(0.85)';
  setTimeout(() => (item.style.transform = ''), 90);
  playSound('chop');

  // Particles
  const board = document.getElementById('board');
  for (let i = 0; i < 2; i++) {
    const p = document.createElement('span');
    p.className = 'chop-fx';
    p.textContent = '✨';
    p.style.left = 40 + Math.random() * 20 + '%';
    p.style.top = 30 + Math.random() * 20 + '%';
    p.style.setProperty('--dx', Math.random() * 50 - 25 + 'px');
    p.style.setProperty('--dy', Math.random() * -35 - 10 + 'px');
    board.appendChild(p);
    setTimeout(() => p.remove(), 400);
  }

  chopCnt++;
  const dot = document.getElementById('cd-' + (chopCnt - 1));
  if (dot) dot.classList.add('filled');

  if (chopCnt >= CHOPS) {
    const ing = getIngredient(cutList[cutIdx]);
    const bowl = document.getElementById('bowl');
    const ci = document.createElement('span');
    ci.className = 'chopped-item';
    ci.textContent = ing.emoji;
    bowl.appendChild(ci);

    cutIdx++;
    chopCnt = 0;
    if (cutIdx >= cutList.length) {
      document.getElementById('step-hint').textContent = '✅ 全部切好啦！';
      setTimeout(nextStep, 700);
    } else {
      const next = getIngredient(cutList[cutIdx]);
      item.textContent = next.emoji;
      document.getElementById('cut-counter').innerHTML =
        `<span>切 ${next.name}：</span>` +
        Array.from({ length: CHOPS }, (_, i) => `<span class="chop-dot" id="cd-${i}"></span>`).join(
          '',
        );
      document.getElementById('step-hint').textContent =
        `👆 继续切 ${next.name}！(${cutIdx + 1}/${cutList.length})`;
    }
  }
}

// ----- POT -----
function renderPot(box, hint) {
  potSet = new Set();
  hint.textContent = '👆 把食材放进锅里！';
  box.innerHTML = `
    <div class="pot-scene">
      <div class="stove">
        <span class="stove-pot">${recipe.pot}</span>
        <div class="stove-fire"><span>🔥</span><span>🔥</span><span>🔥</span></div>
        <div class="pot-steam" id="pot-steam"></div>
        <div class="pot-contents" id="pot-contents"></div>
      </div>
      <div class="pot-items" id="pot-items"></div>
    </div>`;
  const container = document.getElementById('pot-items');
  stepIngs.forEach((id) => {
    const ing = getIngredient(id);
    const el = document.createElement('div');
    el.className = 'pot-item';
    el.dataset.id = id;
    el.innerHTML = `<span class="pi-emoji">${ing.emoji}</span><span class="pi-name">${ing.name}</span>`;
    el.addEventListener(
      'click',
      debounceClick(() => doPot(id), 450),
    );
    container.appendChild(el);
  });
}

function doPot(id) {
  if (potSet.has(id)) return;
  const el = document.querySelector(`.pot-item[data-id="${id}"]`);
  if (!el) return;
  el.classList.add('flying');
  playSound('plop');
  setTimeout(() => {
    potSet.add(id);
    el.classList.remove('flying');
    el.classList.add('added');
    const pc = document.getElementById('pot-contents');
    const s = document.createElement('span');
    s.textContent = getIngredient(id).emoji;
    pc.appendChild(s);
    playSound('sizzle');
    if (potSet.size >= 2) {
      const steam = document.getElementById('pot-steam');
      if (!steam.children.length) steam.innerHTML = '<span>💨</span><span>💨</span><span>💨</span>';
    }
    const left = stepIngs.length - potSet.size;
    const h = document.getElementById('step-hint');
    if (!left) {
      h.textContent = '✅ 全部放进去啦！';
      setTimeout(nextStep, 700);
    } else h.textContent = `👆 还有 ${left} 个食材！`;
  }, 380);
}

// ----- STIR -----
function renderStir(box, hint) {
  stirProg = 0;
  stirDir = false;
  hint.textContent = '👆 快速点击翻炒！';
  box.innerHTML = `
    <div class="stir-scene">
      <div class="stir-pot" id="stir-pot">
        <span class="stir-pot-emoji">${recipe.pot}</span>
        <span class="stir-spatula" id="spatula">🥄</span>
        <div class="stir-fire small" id="stir-fire"><span>🔥</span><span>🔥</span><span>🔥</span><span>🔥</span><span>🔥</span></div>
        <div class="stir-steam" id="stir-steam">
          <span style="font-size:1.1rem;animation:steam-rise 1s ease-in-out infinite">💨</span>
          <span style="font-size:0.9rem;animation:steam-rise 1s ease-in-out infinite .3s">💨</span>
        </div>
      </div>
      <div class="stir-label" id="stir-label">翻炒进度</div>
      <div class="progress-bar"><div class="progress-fill" id="stir-fill"></div></div>
    </div>`;
  document.getElementById('stir-pot').addEventListener('click', doStir);
}

function doStir() {
  if (stirProg >= 100) return;
  stirProg = Math.min(stirProg + 5, 100);
  vibrate(12);

  stirDir = !stirDir;
  document.getElementById('spatula').className = 'stir-spatula ' + (stirDir ? 'left' : 'right');
  const pot = document.getElementById('stir-pot');
  pot.classList.add('stirring');
  setTimeout(() => pot.classList.remove('stirring'), 200);

  const fire = document.getElementById('stir-fire');
  if (stirProg > 60) fire.className = 'stir-fire big';
  else if (stirProg > 30) fire.className = 'stir-fire medium';

  if (stirProg > 50) {
    document.getElementById('stir-steam').innerHTML = `
      <span style="font-size:1.4rem;animation:steam-rise .7s ease-in-out infinite">💨</span>
      <span style="font-size:1.2rem;animation:steam-rise .7s ease-in-out infinite .2s">💨</span>
      <span style="font-size:1rem;animation:steam-rise .7s ease-in-out infinite .4s">💨</span>`;
  }

  document.getElementById('stir-fill').style.width = stirProg + '%';
  if (stirProg % 15 === 0) playSound('sizzle');

  const h = document.getElementById('step-hint');
  if (stirProg < 30) h.textContent = '👆 继续翻炒！加油！';
  else if (stirProg < 60) h.textContent = '🔥 好香啊！继续！';
  else if (stirProg < 100) h.textContent = '🔥🔥 快好了！';

  if (stirProg >= 100) {
    h.textContent = '✅ 烹饪完成！';
    document.getElementById('stir-label').textContent = '🎉 熟了！';
    playSound('fanfare');
    setTimeout(nextStep, 900);
  }
}

// ----- PLATE -----
function renderPlate(box, hint) {
  hint.textContent = '🍽️ 装盘啦！';
  box.innerHTML = `
    <div class="plate-scene">
      <div class="plate">
        <span class="plate-dish">${recipe.emoji}</span>
        <div class="plate-sparkles">
          <span class="plate-sparkle" style="top:0;left:10%">✨</span>
          <span class="plate-sparkle" style="top:5%;right:15%;animation-delay:.3s">✨</span>
          <span class="plate-sparkle" style="bottom:10%;left:5%;animation-delay:.6s">⭐</span>
          <span class="plate-sparkle" style="bottom:5%;right:10%;animation-delay:.9s">✨</span>
          <span class="plate-sparkle" style="top:40%;left:-5%;animation-delay:.2s">⭐</span>
          <span class="plate-sparkle" style="top:30%;right:-5%;animation-delay:.5s">✨</span>
        </div>
      </div>
    </div>`;
  stepIngs.forEach((id) => usedIngredients.add(id));
  setTimeout(() => {
    playSound('fanfare');
    showCelebration();
  }, 1400);
}

// ===== CELEBRATION =====
function showCelebration() {
  document.getElementById('celeb-dish').textContent = recipe.emoji;
  const optUsed = stepIngs.filter((id) => recipe.optional.includes(id)).length;
  const stars = Math.min(optUsed + 1, 3);
  document.getElementById('celeb-title').textContent = ['不错哦！', '太棒了！', '完美大厨！'][
    stars - 1
  ];
  document.getElementById('celeb-msg').textContent = [
    `你做了一道${recipe.name}！`,
    `好厉害！你的${recipe.name}真好看！`,
    `哇！最棒的小厨师！${recipe.name}一定超好吃！`,
  ][stars - 1];
  document.getElementById('celeb-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

  const avail = available();
  document.getElementById('btn-cook-again').style.display = RECIPES.some((r) =>
    r.required.every((id) => avail.includes(id)),
  )
    ? ''
    : 'none';

  document.getElementById('celebration-overlay').classList.add('active');
  showConfetti(document.body, 40);
}

// ===== INIT =====
showRecipes();
