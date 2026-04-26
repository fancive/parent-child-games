let money = 20;
let cart = [];

// ===== INIT =====
(function init() {
  if (localStorage.getItem('pcg_kitchen-back-to-shop')) {
    const state = loadGameState();
    money = state.money;
    cart = state.cart;
    localStorage.removeItem('pcg_kitchen-back-to-shop');
  }
  document.getElementById('wallet-amount').textContent = money;
  buildShelves();
  syncCartDOM();
  updateCartBadge();
  updateGoHomeBtn();

  // Event delegation
  document.getElementById('btn-go-home').addEventListener('click', goHome);
  document.getElementById('btn-recipe').addEventListener('click', openRecipeBook);
  document.getElementById('btn-rb-close').addEventListener('click', closeRecipeBook);
  document.getElementById('recipe-book-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeRecipeBook();
  });
})();

// ===== SHELVES =====
function buildShelves() {
  const shelves = document.getElementById('shelves');
  const frag = document.createDocumentFragment();
  const categories = {};
  ALL_INGREDIENTS.forEach((ing) => {
    (categories[ing.category] ||= []).push(ing);
  });
  const catEmojis = { 蔬菜: '🥦', 蛋奶: '🥛', 肉类: '🥩', 主食: '🍚', 调料: '🧂' };

  let idx = 0;
  for (const [cat, items] of Object.entries(categories)) {
    const section = document.createElement('div');
    section.className = 'shelf-section';
    section.innerHTML = `<div class="shelf-label">${catEmojis[cat] || ''} ${cat}</div>`;
    const grid = document.createElement('div');
    grid.className = 'shelf-items';

    for (const ing of items) {
      const el = document.createElement('div');
      el.className = 'shop-item' + (cart.includes(ing.id) ? ' bought entered' : '');
      el.dataset.id = ing.id;
      el.innerHTML = `
        <span class="item-emoji">${ing.emoji}</span>
        <span class="item-name">${ing.name}</span>
        <span class="item-price">${ing.price}元</span>`;
      el.addEventListener('click', onShopItemClick);
      if (!cart.includes(ing.id)) {
        el.style.animationDelay = idx * 40 + 80 + 'ms';
        el.classList.add('entering');
      }
      grid.appendChild(el);
      idx++;
    }
    section.appendChild(grid);
    frag.appendChild(section);
  }
  shelves.appendChild(frag);
}

// Debounced buy
const onShopItemClick = debounceClick(function (e) {
  const el = this;
  const id = el.dataset.id;
  const ing = getIngredient(id);
  if (!ing || cart.includes(id)) return;

  if (money < ing.price) {
    playSound('error');
    flashClass('wallet', 'shake', 400);
    el.classList.add('cant-afford');
    setTimeout(() => el.classList.remove('cant-afford'), 300);
    return;
  }

  money -= ing.price;
  cart.push(id);
  playSound('buy');
  document.getElementById('wallet-amount').textContent = money;
  flashClass('wallet', 'pulse', 300);

  // Ripple
  spawnRipple(el, e);

  // Fly to cart
  flyToCart(ing, el);

  // Mark bought
  el.classList.add('bought');
  updateGoHomeBtn();
}, 200);

function spawnRipple(el, e) {
  const rect = el.getBoundingClientRect();
  const x = (e.clientX || rect.left + rect.width / 2) - rect.left;
  const y = (e.clientY || rect.top + rect.height / 2) - rect.top;
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.cssText = `left:${x}px;top:${y}px;width:40px;height:40px;margin:-20px 0 0 -20px;`;
  el.appendChild(r);
  setTimeout(() => r.remove(), 500);
}

function flyToCart(ing, fromEl) {
  const fromRect = fromEl.getBoundingClientRect();
  const cartRect = document.getElementById('cart-area').getBoundingClientRect();
  const clone = document.createElement('div');
  clone.className = 'flying-item';
  clone.textContent = ing.emoji;
  const sx = fromRect.left + fromRect.width / 2 - 20;
  const sy = fromRect.top;
  const tx = cartRect.left + cartRect.width / 2 - 20;
  const ty = cartRect.top + 10;
  clone.style.left = sx + 'px';
  clone.style.top = sy + 'px';
  document.body.appendChild(clone);

  const dur = 400;
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const ease = 1 - (1 - p) ** 3;
    clone.style.left = sx + (tx - sx) * ease + 'px';
    clone.style.top = sy + (ty - sy) * ease - 70 * Math.sin(p * Math.PI) + 'px';
    clone.style.transform = `scale(${1 - p * 0.5}) rotate(${p * 360}deg)`;
    clone.style.opacity = 1 - p * 0.3;
    if (p < 1) return requestAnimationFrame(tick);
    clone.remove();
    appendCartItem(ing.id);
    flashClass('cart-area', 'bounce', 350);
  })(performance.now());
}

// ===== CART =====
function appendCartItem(id) {
  const ing = getIngredient(id);
  const el = document.createElement('div');
  el.className = 'cart-item entering';
  el.dataset.id = id;
  el.innerHTML = `<span class="ci-emoji">${ing.emoji}</span><span class="ci-name">${ing.name}</span>`;
  el.addEventListener('click', onCartItemClick);
  document.getElementById('cart-items').appendChild(el);
  setTimeout(() => el.classList.remove('entering'), 400);
  updateCartBadge();
}

const onCartItemClick = debounceClick(function () {
  const el = this;
  const id = el.dataset.id;
  const idx = cart.indexOf(id);
  if (idx === -1) return;

  playSound('return');
  el.classList.add('removing');
  setTimeout(() => {
    el.remove();
    const ing = getIngredient(id);
    cart.splice(idx, 1);
    money += ing.price;
    document.getElementById('wallet-amount').textContent = money;
    flashClass('wallet', 'pulse', 300);
    // Un-gray shop item
    const shopEl = document.querySelector(`.shop-item[data-id="${id}"]`);
    if (shopEl) shopEl.classList.remove('bought');
    updateCartBadge();
    updateGoHomeBtn();
  }, 300);
}, 350);

function syncCartDOM() {
  const container = document.getElementById('cart-items');
  container.innerHTML = '';
  cart.forEach((id) => {
    const ing = getIngredient(id);
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.dataset.id = id;
    el.innerHTML = `<span class="ci-emoji">${ing.emoji}</span><span class="ci-name">${ing.name}</span>`;
    el.addEventListener('click', onCartItemClick);
    container.appendChild(el);
  });
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (cart.length > 0) {
    badge.style.display = '';
    badge.textContent = cart.length;
    badge.classList.remove('pop');
    void badge.offsetWidth;
    badge.classList.add('pop');
  } else {
    badge.style.display = 'none';
  }
}

function updateGoHomeBtn() {
  document.getElementById('btn-go-home').disabled = cart.length === 0;
}

// ===== NAVIGATE =====
function goHome() {
  if (cart.length === 0) return;
  saveGameState(money, cart);
  playSound('bell');
  navigateTo('ride.html');
}

// ===== RECIPE BOOK =====
function openRecipeBook() {
  const list = document.getElementById('rb-list');
  list.innerHTML = '';
  for (const recipe of RECIPES) {
    const hasAll = recipe.required.every((id) => cart.includes(id));
    const cost = recipe.required.reduce((s, id) => s + getIngredient(id).price, 0);
    const card = document.createElement('div');
    card.className = 'rb-card' + (hasAll ? ' can-make' : '');
    card.innerHTML = `
      <div class="rb-card-emoji">${recipe.emoji}</div>
      <div class="rb-card-info">
        <div class="rb-card-name">${recipe.name}${hasAll ? ' ✅' : ''}</div>
        <div class="rb-card-row"><span class="label">必要:</span>${recipe.required
          .map((id) => {
            const ing = getIngredient(id);
            const has = cart.includes(id);
            return `<span class="rb-ing ${has ? 'has' : 'missing'}">${has ? '✅' : '⬜'}${ing.emoji}${ing.name}</span>`;
          })
          .join('')}</div>
        <div class="rb-card-row"><span class="label">可选:</span>${recipe.optional
          .map((id) => {
            const ing = getIngredient(id);
            return `<span class="rb-ing ${cart.includes(id) ? 'has' : 'missing'}">${ing.emoji}</span>`;
          })
          .join('')}</div>
        <div class="rb-card-cost">必要食材共 ${cost} 元</div>
      </div>`;
    list.appendChild(card);
  }
  document.getElementById('recipe-book-overlay').classList.add('active');
  playSound('bell');
}

function closeRecipeBook() {
  document.getElementById('recipe-book-overlay').classList.remove('active');
}

// ===== UTILS =====
function flashClass(id, cls, ms) {
  const el = document.getElementById(id);
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}
