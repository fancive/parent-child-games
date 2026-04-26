// ==================== RENDERING ====================
function scrollChatToBottom() {
  const chat = document.getElementById('chat-area');
  if (chat) setTimeout(() => (chat.scrollTop = chat.scrollHeight), 50);
}

function renderInventory() {
  const grid = document.getElementById('inventory-grid');
  const mobile = document.getElementById('mobile-inventory');
  if (!grid) return;

  const gridFrag = document.createDocumentFragment();
  const mobileFrag = document.createDocumentFragment();

  for (const toy of state.inventory) {
    const isOut = toy.stock <= 0;
    const isHighlight = state.currentToy && state.currentToy.id === toy.id;

    const card = document.createElement('div');
    card.className =
      'toy-card' + (isOut ? ' out-of-stock' : '') + (isHighlight ? ' highlight' : '');
    const maxDots = Math.min(toy.maxStock, 8);
    const dotsFrag = document.createDocumentFragment();
    for (let i = 0; i < maxDots; i++) {
      const dot = document.createElement('div');
      dot.className = 'stock-dot' + (i < toy.stock ? '' : ' empty');
      dotsFrag.appendChild(dot);
    }
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'stock-dots';
    dotsContainer.appendChild(dotsFrag);
    card.innerHTML =
      `<div class="toy-emoji">${toy.emoji}</div>` +
      `<div class="toy-name">${toy.name}</div>` +
      `<div class="toy-price">${toy.price}元</div>` +
      `<div class="toy-stock">库存: ${toy.stock}个</div>`;
    card.appendChild(dotsContainer);
    if (isOut) {
      const badge = document.createElement('div');
      badge.className = 'sold-badge';
      badge.textContent = '售罄';
      card.appendChild(badge);
    }
    gridFrag.appendChild(card);

    const chip = document.createElement('div');
    chip.className =
      'mobile-toy-chip' + (isOut ? ' out-of-stock' : '') + (isHighlight ? ' highlight' : '');
    chip.innerHTML = `<span class="chip-emoji">${toy.emoji}</span><span class="chip-stock">${toy.stock}</span>`;
    mobileFrag.appendChild(chip);
  }

  grid.innerHTML = '';
  grid.appendChild(gridFrag);
  mobile.innerHTML = '';
  mobile.appendChild(mobileFrag);
}

function renderHeader() {
  document.getElementById('hdr-money').textContent = state.totalEarnings;
  document.getElementById('hdr-customers').textContent = state.customersServed;
  document.getElementById('hdr-day').textContent = `第${state.dayNumber}天`;
}

function addChatMessage(from, text, extra = '') {
  const chat = document.getElementById('chat-area');
  while (chat.children.length >= 25) {
    chat.removeChild(chat.firstChild);
  }
  const avatar = from === 'customer' ? state.currentCustomer.emoji : from === 'bear' ? '🐻' : '';
  const className = from;
  const html = `
    <div class="chat-msg ${className}">
      ${avatar ? `<div class="chat-avatar">${avatar}</div>` : ''}
      <div class="chat-bubble">${text}${extra}</div>
    </div>
  `;
  chat.insertAdjacentHTML('beforeend', html);
  scrollChatToBottom();
}

function addToyDisplay(toy) {
  const chat = document.getElementById('chat-area');
  const dots = [];
  const maxDots = Math.min(toy.maxStock, 8);
  for (let i = 0; i < maxDots; i++) {
    dots.push(`<div class="stock-dot ${i < toy.stock ? '' : 'empty'}"></div>`);
  }
  const html = `
    <div class="toy-display">
      <div class="toy-emoji">${toy.emoji}</div>
      <div class="toy-name">${toy.name}</div>
      <div class="toy-price">标价：${toy.price}元</div>
      <div class="toy-stock">库存还有 ${toy.stock} 个</div>
      <div class="stock-dots">${dots.join('')}</div>
    </div>
  `;
  chat.insertAdjacentHTML('beforeend', html);
  scrollChatToBottom();
}

function renderActions(html) {
  document.getElementById('action-area').innerHTML = html;
}

function clearChat() {
  document.getElementById('chat-area').innerHTML = '';
}

// ==================== SCREEN MANAGEMENT ====================
function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  state.screen = name;
}

// ==================== ANIMATIONS ====================
function showCoinAnimation(amount) {
  const coins = Math.min(amount, 8);
  for (let i = 0; i < coins; i++) {
    setTimeout(() => {
      const coin = document.createElement('div');
      coin.className = 'coin-fly';
      coin.textContent = '🪙';
      coin.style.left = 40 + Math.random() * 20 + '%';
      coin.style.top = 50 + Math.random() * 20 + '%';
      document.body.appendChild(coin);
      setTimeout(() => coin.remove(), 1000);
    }, i * 100);
  }
}
