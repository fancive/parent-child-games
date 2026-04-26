// ===== GAME DATA =====
const ALL_INGREDIENTS = [
  { id: 'tomato', emoji: '🍅', name: '番茄', price: 2, category: '蔬菜', wash: true, cut: true },
  { id: 'carrot', emoji: '🥕', name: '胡萝卜', price: 1, category: '蔬菜', wash: true, cut: true },
  { id: 'pepper', emoji: '🫑', name: '青椒', price: 1, category: '蔬菜', wash: true, cut: true },
  { id: 'cabbage', emoji: '🥬', name: '白菜', price: 1, category: '蔬菜', wash: true, cut: true },
  { id: 'corn', emoji: '🌽', name: '玉米', price: 2, category: '蔬菜', wash: true, cut: false },
  { id: 'mushroom', emoji: '🍄', name: '蘑菇', price: 2, category: '蔬菜', wash: true, cut: true },
  { id: 'egg', emoji: '🥚', name: '鸡蛋', price: 2, category: '蛋奶', wash: false, cut: false },
  { id: 'cheese', emoji: '🧀', name: '芝士', price: 3, category: '蛋奶', wash: false, cut: true },
  { id: 'beef', emoji: '🥩', name: '牛肉', price: 5, category: '肉类', wash: true, cut: true },
  { id: 'chicken', emoji: '🍗', name: '鸡腿', price: 4, category: '肉类', wash: true, cut: false },
  { id: 'shrimp', emoji: '🦐', name: '虾仁', price: 5, category: '肉类', wash: true, cut: false },
  { id: 'bacon', emoji: '🥓', name: '培根', price: 3, category: '肉类', wash: false, cut: true },
  { id: 'rice', emoji: '🍚', name: '米饭', price: 2, category: '主食', wash: false, cut: false },
  { id: 'noodle', emoji: '🍜', name: '面条', price: 2, category: '主食', wash: false, cut: false },
  { id: 'butter', emoji: '🧈', name: '黄油', price: 3, category: '调料', wash: false, cut: false },
];

const RECIPES = [
  {
    id: 'pizza',
    emoji: '🍕',
    name: '美味披萨',
    pot: '🍕',
    required: ['tomato', 'cheese'],
    optional: ['bacon', 'mushroom', 'pepper'],
  },
  {
    id: 'friedrice',
    emoji: '🍳',
    name: '蛋炒饭',
    pot: '🍳',
    required: ['rice', 'egg'],
    optional: ['carrot', 'corn', 'shrimp'],
  },
  {
    id: 'pasta',
    emoji: '🍝',
    name: '番茄肉酱面',
    pot: '🍲',
    required: ['noodle', 'tomato', 'beef'],
    optional: ['mushroom', 'pepper'],
  },
  {
    id: 'salad',
    emoji: '🥗',
    name: '缤纷沙拉',
    pot: '🥣',
    required: ['tomato', 'carrot', 'corn'],
    optional: ['egg', 'shrimp'],
  },
  {
    id: 'tomatoegg',
    emoji: '🥘',
    name: '番茄炒蛋',
    pot: '🍳',
    required: ['tomato', 'egg'],
    optional: ['pepper', 'mushroom'],
  },
  {
    id: 'burger',
    emoji: '🍔',
    name: '芝士汉堡',
    pot: '🍔',
    required: ['beef', 'cheese'],
    optional: ['tomato', 'bacon', 'cabbage'],
  },
  {
    id: 'soup',
    emoji: '🍲',
    name: '蔬菜浓汤',
    pot: '🍲',
    required: ['cabbage', 'carrot', 'tomato'],
    optional: ['mushroom', 'corn', 'egg'],
  },
  {
    id: 'butterchicken',
    emoji: '🍗',
    name: '黄油烤鸡腿',
    pot: '🍗',
    required: ['chicken', 'butter'],
    optional: ['mushroom', 'pepper', 'corn'],
  },
  {
    id: 'cheesyrice',
    emoji: '🧀',
    name: '芝士焗饭',
    pot: '🍚',
    required: ['rice', 'cheese', 'butter'],
    optional: ['bacon', 'corn', 'mushroom'],
  },
  {
    id: 'shrimnoodle',
    emoji: '🦐',
    name: '鲜虾拌面',
    pot: '🍜',
    required: ['noodle', 'shrimp', 'egg'],
    optional: ['pepper', 'carrot'],
  },
];

const INGREDIENT_MAP = Object.fromEntries(ALL_INGREDIENTS.map((i) => [i.id, i]));
function getIngredient(id) {
  return INGREDIENT_MAP[id];
}

// ===== LOCALSTORAGE (with error handling) =====
function saveGameState(money, cart) {
  try {
    localStorage.setItem('pcg_kitchen-money', JSON.stringify(money));
    localStorage.setItem('pcg_kitchen-cart', JSON.stringify(cart));
  } catch (e) {
    /* quota exceeded or private browsing */
  }
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

// ===== NAV HELPERS =====
function navigateTo(url) {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.2s';
  setTimeout(() => {
    window.location.href = url;
  }, 200);
}
