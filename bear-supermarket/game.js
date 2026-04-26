// ==================== GAME STATE ====================
let state = {
    screen: 'welcome',
    phase: 'idle',
    totalEarnings: 0,
    todayEarnings: 0,
    customersServed: 0,
    todayCustomers: 0,
    maxCustomersPerDay: 8,
    dayNumber: 1,
    currentCustomer: null,
    currentToy: null,
    myPrice: 0,
    customerBudget: 0,
    customerOffer: 0,
    round: 0,
    maxRounds: 3,
    inventory: JSON.parse(JSON.stringify(TOYS)),
    itemsSoldToday: 0,
    recentCustomerIndices: [],
};

// ==================== UTILITY ====================
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function scrollChatToBottom() {
    const chat = document.getElementById('chat-area');
    if (chat) setTimeout(() => chat.scrollTop = chat.scrollHeight, 50);
}

// ==================== RENDERING ====================
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
        card.className = 'toy-card' + (isOut ? ' out-of-stock' : '') + (isHighlight ? ' highlight' : '');
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
        card.innerHTML = `<div class="toy-emoji">${toy.emoji}</div>` +
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
        chip.className = 'mobile-toy-chip' + (isOut ? ' out-of-stock' : '') + (isHighlight ? ' highlight' : '');
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
    // Trim oldest messages to cap DOM size
    while (chat.children.length >= 25) {
        chat.removeChild(chat.firstChild);
    }
    const avatar = from === 'customer' ? state.currentCustomer.emoji :
                   from === 'bear' ? '🐻' : '';
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
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(name).classList.add('active');
    state.screen = name;
}

// ==================== GAME LOGIC ====================
function startGame() {
    state.totalEarnings = 0;
    state.todayEarnings = 0;
    state.customersServed = 0;
    state.todayCustomers = 0;
    state.dayNumber = 1;
    state.itemsSoldToday = 0;
    state.inventory = JSON.parse(JSON.stringify(TOYS));
    state.recentCustomerIndices = [];

    showScreen('game');
    renderHeader();
    renderInventory();
    clearChat();
    showIdleState();
}

function showIdleState() {
    state.phase = 'idle';
    state.currentCustomer = null;
    state.currentToy = null;
    renderInventory();

    const inStock = state.inventory.filter(t => t.stock > 0);
    if (inStock.length === 0) {
        endDay();
        return;
    }

    if (state.todayCustomers >= state.maxCustomersPerDay) {
        endDay();
        return;
    }

    const chat = document.getElementById('chat-area');
    chat.innerHTML = `
        <div class="idle-prompt">
            <div class="idle-bear">🐻</div>
            <div class="idle-text">等待下一位顾客...</div>
        </div>
    `;

    renderActions(`
        <button class="action-btn next" onclick="nextCustomer()">
            🔔 迎接下一位顾客！
        </button>
        <button class="action-btn secondary" style="margin-top:6px" onclick="endDay()">
            🌙 今天打烊
        </button>
    `);
}

function nextCustomer() {
    clearChat();
    state.todayCustomers++;
    state.round = 0;

    // Pick a customer (avoid recent repeats)
    let ci;
    do {
        ci = Math.floor(Math.random() * CUSTOMERS.length);
    } while (state.recentCustomerIndices.includes(ci) && CUSTOMERS.length > 3);
    state.recentCustomerIndices.push(ci);
    if (state.recentCustomerIndices.length > 4) state.recentCustomerIndices.shift();

    state.currentCustomer = { ...CUSTOMERS[ci] };

    // Pick a random in-stock toy
    const inStock = state.inventory.filter(t => t.stock > 0);
    if (inStock.length === 0) {
        endDay();
        return;
    }
    state.currentToy = inStock[Math.floor(Math.random() * inStock.length)];

    // Calculate customer budget
    const range = BUDGET_RANGES[state.currentCustomer.personality];
    const ratio = range.min + Math.random() * (range.max - range.min);
    state.customerBudget = Math.max(1, Math.round(state.currentToy.price * ratio));

    state.phase = 'greeting';
    renderInventory();

    // Show greeting
    const greeting = pick(GREETINGS);
    const want = pick(WANT_PHRASES)(state.currentToy.name);
    addChatMessage('customer', greeting);

    setTimeout(() => {
        addChatMessage('customer', want);
        setTimeout(() => {
            addToyDisplay(state.currentToy);
            setTimeout(() => {
                addChatMessage('system', '给这位顾客报个价吧！');
                showPriceSetter();
            }, 300);
        }, 400);
    }, 500);
}

function showPriceSetter() {
    state.phase = 'pricing';
    state.myPrice = state.currentToy.price;

    function renderPriceUI() {
        renderActions(`
            <div class="price-hint">
                标价 ${state.currentToy.price}元 · 库存 ${state.currentToy.stock}个
                ${state.currentToy.stock <= 2 ? ' · <span style="color:var(--red)">快卖完啦！</span>' : ''}
            </div>
            <div class="price-setter">
                <button class="price-btn minus" onclick="adjustPrice(-1)">−</button>
                <div class="price-display">${state.myPrice}<small>元</small></div>
                <button class="price-btn plus" onclick="adjustPrice(1)">+</button>
            </div>
            <div class="action-buttons">
                <button class="action-btn primary" onclick="confirmPrice()">
                    💬 就卖 ${state.myPrice} 元！
                </button>
            </div>
        `);
    }

    renderPriceUI();

    let _priceAdjusting = false;
    window.adjustPrice = function(delta) {
        if (_priceAdjusting) return;
        _priceAdjusting = true;
        state.myPrice = clamp(state.myPrice + delta, 1, 99);
        renderPriceUI();
        setTimeout(() => { _priceAdjusting = false; }, 80);
    };
}

function confirmPrice() {
    state.phase = 'response';
    addChatMessage('bear', `这个${state.currentToy.name}卖${state.myPrice}元！`);
    renderActions('');

    setTimeout(() => {
        if (state.customerBudget >= state.myPrice) {
            // Customer can afford it!
            addChatMessage('customer', pick(AFFORDABLE_PHRASES));
            setTimeout(() => completeDeal(state.myPrice), 600);
        } else {
            // Customer can't afford
            state.customerOffer = state.customerBudget;
            const phrase = pick(CANT_AFFORD_PHRASES)(state.customerBudget);
            addChatMessage('customer', phrase);
            setTimeout(() => showNegotiationOptions(), 500);
        }
    }, 600);
}

function showNegotiationOptions() {
    state.phase = 'negotiating';
    state.round++;

    if (state.round > state.maxRounds) {
        customerLeaves();
        return;
    }

    // Generate counter-offer options
    const diff = state.myPrice - state.customerOffer;
    let counterOptions = [];
    if (diff >= 3) {
        const step = Math.max(1, Math.floor(diff / 3));
        for (let p = state.customerOffer + step; p < state.myPrice; p += step) {
            counterOptions.push(p);
        }
        if (counterOptions.length > 3) counterOptions = counterOptions.slice(0, 3);
    } else if (diff === 2) {
        counterOptions = [state.customerOffer + 1];
    }

    let counterHtml = '';
    if (counterOptions.length > 0) {
        counterHtml = `
            <div style="font-size:14px;color:var(--brown-light);margin-top:4px;margin-bottom:4px;text-align:center">或者便宜一点？</div>
            <div class="counter-options">
                ${counterOptions.map(p => `
                    <button class="counter-option" onclick="makeCounterOffer(${p})">
                        ${p}元
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderActions(`
        <div class="action-buttons">
            <button class="action-btn accept" onclick="acceptOffer()">
                😊 好吧，${state.customerOffer}元卖给你！
            </button>
            <button class="action-btn reject" onclick="rejectOffer()">
                😤 不行，太少了！
            </button>
            ${counterHtml}
        </div>
    `);
}

function acceptOffer() {
    addChatMessage('bear', `好吧，${state.customerOffer}元卖给你！`);
    setTimeout(() => {
        addChatMessage('customer', pick(ACCEPT_PHRASES));
        setTimeout(() => completeDeal(state.customerOffer), 500);
    }, 400);
}

function rejectOffer() {
    addChatMessage('bear', '不行哦，太少了！');
    setTimeout(() => {
        if (state.round >= state.maxRounds) {
            addChatMessage('customer', pick(LEAVE_PHRASES));
            setTimeout(() => customerLeaves(), 600);
        } else {
            // Customer may raise offer slightly
            const raise = rand(1, Math.max(1, Math.floor((state.myPrice - state.customerOffer) * 0.3)));
            const newOffer = Math.min(state.customerBudget, state.customerOffer + raise);

            if (newOffer > state.customerOffer) {
                state.customerOffer = newOffer;
                const phrase = pick(COUNTER_RESPONSE)(newOffer);
                addChatMessage('customer', phrase);
                setTimeout(() => showNegotiationOptions(), 400);
            } else {
                addChatMessage('customer', pick(LEAVE_PHRASES));
                setTimeout(() => customerLeaves(), 600);
            }
        }
    }, 500);
}

function makeCounterOffer(price) {
    state.myPrice = price;
    addChatMessage('bear', `那${price}元行不行？`);
    renderActions('');

    setTimeout(() => {
        if (price <= state.customerBudget) {
            addChatMessage('customer', pick(ACCEPT_PHRASES));
            setTimeout(() => completeDeal(price), 500);
        } else {
            // Customer tries to meet halfway
            const newOffer = Math.min(state.customerBudget, state.customerOffer + rand(1, Math.max(1, price - state.customerOffer - 1)));
            if (newOffer > state.customerOffer) {
                state.customerOffer = newOffer;
            }
            const phrase = pick(COUNTER_RESPONSE)(state.customerOffer);
            addChatMessage('customer', phrase);
            setTimeout(() => showNegotiationOptions(), 400);
        }
    }, 600);
}

function completeDeal(finalPrice) {
    state.phase = 'deal';
    state.totalEarnings += finalPrice;
    state.todayEarnings += finalPrice;
    state.customersServed++;
    state.itemsSoldToday++;

    // Decrease stock
    const toy = state.inventory.find(t => t.id === state.currentToy.id);
    if (toy) toy.stock--;

    renderHeader();
    renderInventory();

    // Show celebration
    const chat = document.getElementById('chat-area');
    chat.insertAdjacentHTML('beforeend', `
        <div class="deal-celebration">
            <div class="deal-emoji">🎉</div>
            <div class="deal-text">成交！</div>
            <div class="deal-amount">+${finalPrice}元</div>
        </div>
    `);
    scrollChatToBottom();

    showConfetti(document.getElementById('confetti'), 25);
    showCoinAnimation(finalPrice);

    renderActions(`
        <button class="action-btn next" onclick="showIdleState()">
            👋 下一位顾客
        </button>
    `);
}

function customerLeaves() {
    state.phase = 'nodeal';

    const chat = document.getElementById('chat-area');
    chat.insertAdjacentHTML('beforeend', `
        <div style="text-align:center;padding:16px;animation:msgAppear 0.4s ease-out">
            <div class="no-deal-face">😢</div>
            <div style="font-size:16px;color:var(--brown-light)">顾客走了...没关系，下一位会更好！</div>
        </div>
    `);
    scrollChatToBottom();

    renderActions(`
        <button class="action-btn next" onclick="showIdleState()">
            💪 下一位顾客
        </button>
    `);
}

function endDay() {
    showScreen('summary');

    // Calculate stars
    let stars = 0;
    if (state.todayEarnings >= 30) stars = 1;
    if (state.todayEarnings >= 60) stars = 2;
    if (state.todayEarnings >= 100) stars = 3;
    if (state.todayEarnings >= 150) stars = 4;
    if (state.todayEarnings >= 200) stars = 5;

    const starLabels = ['继续加油哦！', '不错不错！', '很棒！', '太厉害了！', '超级售货员！', '传说级售货员！'];

    document.getElementById('summary-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
    document.getElementById('summary-star-label').textContent = starLabels[stars];

    document.getElementById('summary-stats').innerHTML = `
        <div class="summary-stat">
            <div class="summary-stat-value">${state.todayEarnings}元</div>
            <div class="summary-stat-label">今日收入</div>
        </div>
        <div class="summary-stat">
            <div class="summary-stat-value">${state.totalEarnings}元</div>
            <div class="summary-stat-label">总收入</div>
        </div>
        <div class="summary-stat">
            <div class="summary-stat-value">${state.itemsSoldToday}件</div>
            <div class="summary-stat-label">今日售出</div>
        </div>
        <div class="summary-stat">
            <div class="summary-stat-value">${state.todayCustomers}位</div>
            <div class="summary-stat-label">接待顾客</div>
        </div>
    `;

    if (stars >= 3) showConfetti(document.getElementById('confetti'), 25);
}

function startNewDay() {
    state.dayNumber++;
    state.todayEarnings = 0;
    state.todayCustomers = 0;
    state.itemsSoldToday = 0;
    state.recentCustomerIndices = [];

    // Restock: add 1-2 to each toy's stock (up to max)
    state.inventory.forEach(toy => {
        const add = rand(1, 2);
        toy.stock = Math.min(toy.maxStock, toy.stock + add);
    });

    showScreen('game');
    renderHeader();
    renderInventory();
    clearChat();
    showIdleState();
}

function backToWelcome() {
    showScreen('welcome');
}

// ==================== ANIMATIONS ====================

function showCoinAnimation(amount) {
    const coins = Math.min(amount, 8);
    for (let i = 0; i < coins; i++) {
        setTimeout(() => {
            const coin = document.createElement('div');
            coin.className = 'coin-fly';
            coin.textContent = '🪙';
            coin.style.left = (40 + Math.random() * 20) + '%';
            coin.style.top = (50 + Math.random() * 20) + '%';
            document.body.appendChild(coin);
            setTimeout(() => coin.remove(), 1000);
        }, i * 100);
    }
}
