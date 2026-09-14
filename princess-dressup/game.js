// ==================== CONSTANTS ====================
const PRINCESS_KEYS = ['hair', 'hairAcc', 'dress', 'shoes', 'acc', 'bg'];
const PRINCESS_OPTIONAL = ['hairAcc', 'acc'];
const CELEBRATE_CONFETTI = 40;
const BOUNCE_MS = 420;
const CHEER_MS = 720;
const SPARKLE_MS = 900;
const SPARKLE_COUNT = 8;
const SPARKLE_GLYPHS = ['✦', '✨', '⭐', '💖', '✧'];

// ==================== GAME STATE ====================
let state = {
  screen: 'welcome',
  activeCat: 'hair',
  outfit: { ...PRINCESS_DEFAULT_OUTFIT },
};

// ==================== PURE LOGIC ====================
function isOptionalCat(cat) {
  return PRINCESS_OPTIONAL.includes(cat);
}

function itemsForCat(cat) {
  const category = PRINCESS_CATEGORIES.find((c) => c.key === cat);
  return category ? category.items : [];
}

function isValidId(cat, id) {
  return itemsForCat(cat).some((it) => it.id === id);
}

// Coerce a possibly-stale saved outfit into a valid one: keep valid ids,
// fall back to the default for mandatory slots and to null for optional slots.
function sanitizeOutfit(raw) {
  const out = {};
  for (const key of PRINCESS_KEYS) {
    const val = raw ? raw[key] : undefined;
    if (isValidId(key, val)) {
      out[key] = val;
    } else {
      out[key] = isOptionalCat(key) ? null : PRINCESS_DEFAULT_OUTFIT[key];
    }
  }
  return out;
}

// Random but always-valid outfit; optional slots may roll to "不戴" (null).
function buildRandomOutfit() {
  const out = {};
  for (const key of PRINCESS_KEYS) {
    const items = itemsForCat(key);
    if (isOptionalCat(key)) {
      const idx = Math.floor(Math.random() * (items.length + 1));
      out[key] = idx === items.length ? null : items[idx].id;
    } else {
      out[key] = items[Math.floor(Math.random() * items.length)].id;
    }
  }
  return out;
}

// ==================== VIEW HELPERS ====================
function renderAll() {
  renderTabs(state.activeCat);
  renderTray(state.activeCat, state.outfit);
  renderDoll(state.outfit);
  renderStageBg(state.outfit.bg);
}

function persist() {
  saveState('princess_outfit', state.outfit);
}

function bounceDoll() {
  const doll = document.getElementById('doll');
  if (!doll) return;
  doll.classList.remove('bounce');
  // Force reflow so the animation restarts on repeated selections.
  void doll.offsetWidth;
  doll.classList.add('bounce');
  setTimeout(() => doll.classList.remove('bounce'), BOUNCE_MS);
}

// ==================== INTERACTIONS ====================
function setActiveCat(cat) {
  if (state.activeCat === cat) return;
  state.activeCat = cat;
  renderTabs(cat);
  renderTray(cat, state.outfit);
}

function selectItem(cat, id) {
  const current = state.outfit[cat];
  if (isOptionalCat(cat) && current === id) {
    // Re-tapping a worn optional item takes it off.
    state.outfit = { ...state.outfit, [cat]: null };
    playSound('buy');
  } else {
    state.outfit = { ...state.outfit, [cat]: id };
    playSound('plop');
    bounceDoll();
  }
  persist();
  renderTray(state.activeCat, state.outfit);
  renderDoll(state.outfit);
  if (cat === 'bg') renderStageBg(state.outfit.bg);
}

function clearItem(cat) {
  if (state.outfit[cat] === null) return;
  state.outfit = { ...state.outfit, [cat]: null };
  playSound('buy');
  persist();
  renderTray(state.activeCat, state.outfit);
  renderDoll(state.outfit);
}

function onRandom() {
  state.outfit = buildRandomOutfit();
  playSound('ding');
  bounceDoll();
  persist();
  renderAll();
}

function onReset() {
  state.outfit = { ...PRINCESS_DEFAULT_OUTFIT };
  playSound('bell');
  persist();
  renderAll();
}

function onDone() {
  const praise = PRINCESS_PRAISES[Math.floor(Math.random() * PRINCESS_PRAISES.length)];
  document.getElementById('celebrate-praise').textContent = praise;

  const stageBg = findItem('bg', state.outfit.bg);
  const dollWrap = document.getElementById('celebrate-doll');
  dollWrap.className = 'celebrate-doll' + (stageBg ? ' ' + stageBg.cls : '');
  dollWrap.innerHTML = buildDollSvg(state.outfit);

  const overlay = document.getElementById('celebrate');
  overlay.hidden = false;
  showConfetti(document.getElementById('confetti'), CELEBRATE_CONFETTI);
  playSound('fanfare');
}

function hideCelebrate() {
  document.getElementById('celebrate').hidden = true;
}

function startDressing() {
  state.activeCat = 'hair';
  showScreen('dressing');
  renderAll();
}

// ==================== EVENT DELEGATION ====================
function onTabsClick(e) {
  const btn = e.target.closest('button[data-cat]');
  if (!btn) return;
  setActiveCat(btn.dataset.cat);
}

function onTrayClick(e) {
  const btn = e.target.closest('button[data-cell]');
  if (!btn) return;
  const cat = btn.dataset.cat;
  if (btn.dataset.none === '1') {
    clearItem(cat);
  } else {
    selectItem(cat, btn.dataset.id);
  }
}

// ==================== INIT ====================
function initDressup() {
  state.outfit = sanitizeOutfit(loadState('princess_outfit', PRINCESS_DEFAULT_OUTFIT));

  document
    .getElementById('btn-start-dressup')
    .addEventListener('click', debounceClick(startDressing));
  document.getElementById('btn-random').addEventListener('click', debounceClick(onRandom));
  document.getElementById('btn-reset').addEventListener('click', debounceClick(onReset));
  document.getElementById('btn-done').addEventListener('click', debounceClick(onDone));
  document.getElementById('btn-continue').addEventListener('click', debounceClick(hideCelebrate));

  document.getElementById('tabs').addEventListener('click', onTabsClick);
  document.getElementById('tray').addEventListener('click', onTrayClick);
}

// Guard so this file can be loaded in a DOM-less test sandbox.
if (
  typeof document !== 'undefined' &&
  document.getElementById &&
  document.getElementById('welcome')
) {
  initDressup();
}
