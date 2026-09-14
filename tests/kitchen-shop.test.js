import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load shared.js data for recipe/ingredient tests
const sandbox = {
  setTimeout: globalThis.setTimeout,
  Math: globalThis.Math,
  JSON: globalThis.JSON,
  Error: globalThis.Error,
  Array: globalThis.Array,
  Object: globalThis.Object,
  console: globalThis.console,
  window: { location: { href: '' } },
  document: { body: { style: { opacity: '', transition: '' } } },
  localStorage: (() => {
    let store = {};
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { store = {}; },
    };
  })(),
};
sandbox.window = sandbox;
vm.createContext(sandbox);

const shared = readFileSync(join(__dirname, '..', 'kitchen-game', 'shared.js'), 'utf-8');
vm.runInContext(shared + `
  ;(function(_s){
    _s.ALL_INGREDIENTS = ALL_INGREDIENTS;
    _s.RECIPES = RECIPES;
    _s.INGREDIENT_MAP = INGREDIENT_MAP;
  })(this);
`, sandbox);

const { ALL_INGREDIENTS, RECIPES, INGREDIENT_MAP } = sandbox;

function createShopPageSandbox() {
  const elements = new Map();

  function createElement() {
    const listeners = new Map();
    return {
      children: [],
      className: '',
      classList: { add() {}, remove() {} },
      dataset: {},
      disabled: false,
      innerHTML: '',
      listeners,
      style: {},
      textContent: '',
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
      appendChild(child) {
        if (child.isFragment) this.children.push(...child.children);
        else this.children.push(child);
        return child;
      },
    };
  }

  const document = {
    body: createElement(),
    createDocumentFragment() {
      return { ...createElement(), isFragment: true };
    },
    createElement,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElement());
      return elements.get(id);
    },
  };

  const stored = new Map([
    ['pcg_kitchen-back-to-shop', '1'],
    ['pcg_kitchen-money', '18'],
    ['pcg_kitchen-cart', '["tomato"]'],
  ]);
  const localStorage = {
    getItem(key) {
      return stored.has(key) ? stored.get(key) : null;
    },
    removeItem(key) {
      stored.delete(key);
    },
    setItem(key, value) {
      stored.set(key, String(value));
    },
  };

  const pageSandbox = {
    Array,
    Error,
    Float32Array,
    JSON,
    Math,
    Object,
    console,
    document,
    localStorage,
    navigator: { vibrate() {} },
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    setTimeout,
    window: {},
  };
  pageSandbox.window = pageSandbox;
  vm.createContext(pageSandbox);
  return { elements, sandbox: pageSandbox };
}

describe('shop: recipe affordability', () => {
  test('every recipe can be made with starting money (20)', () => {
    for (const recipe of RECIPES) {
      const cost = recipe.required.reduce((sum, id) => sum + INGREDIENT_MAP[id].price, 0);
      assert.ok(cost <= 20, `recipe ${recipe.id} requires ${cost} (> 20 starting money)`);
    }
  });

  test('no recipe has duplicate required ingredients', () => {
    for (const recipe of RECIPES) {
      const unique = new Set(recipe.required);
      assert.equal(unique.size, recipe.required.length, `recipe ${recipe.id} has duplicate required`);
    }
  });

  test('required and optional do not overlap', () => {
    for (const recipe of RECIPES) {
      const reqSet = new Set(recipe.required);
      for (const opt of recipe.optional) {
        assert.ok(!reqSet.has(opt), `recipe ${recipe.id}: ${opt} is both required and optional`);
      }
    }
  });
});

describe('shop: ingredient pricing', () => {
  test('all prices are positive integers', () => {
    for (const ing of ALL_INGREDIENTS) {
      assert.ok(Number.isInteger(ing.price), `${ing.id} price ${ing.price} is not integer`);
      assert.ok(ing.price > 0, `${ing.id} price ${ing.price} is not positive`);
    }
  });

  test('cheapest recipe costs at least 3', () => {
    const cheapest = Math.min(
      ...RECIPES.map((r) => r.required.reduce((s, id) => s + INGREDIENT_MAP[id].price, 0)),
    );
    assert.ok(cheapest >= 3, `cheapest recipe costs only ${cheapest}`);
  });

  test('categories are known values', () => {
    const valid = ['蔬菜', '蛋奶', '肉类', '主食', '调料'];
    for (const ing of ALL_INGREDIENTS) {
      assert.ok(valid.includes(ing.category), `${ing.id} has unknown category ${ing.category}`);
    }
  });
});

describe('shop: cart state persistence', () => {
  test('saveGameState stores money and cart with pcg_ prefix', () => {
    sandbox.localStorage.clear();
    sandbox.saveGameState(15, ['tomato', 'egg']);
    assert.equal(sandbox.localStorage.getItem('pcg_kitchen-money'), '15');
    assert.equal(sandbox.localStorage.getItem('pcg_kitchen-cart'), '["tomato","egg"]');
  });

  test('loadGameState returns saved values', () => {
    sandbox.localStorage.clear();
    sandbox.saveGameState(8, ['beef']);
    const state = sandbox.loadGameState();
    assert.equal(state.money, 8);
    assert.equal(JSON.stringify(state.cart), '["beef"]');
  });

  test('clearGameState removes all kitchen keys', () => {
    sandbox.saveGameState(10, ['carrot']);
    sandbox.localStorage.setItem('pcg_kitchen-back-to-shop', '1');
    sandbox.clearGameState();
    assert.equal(sandbox.localStorage.getItem('pcg_kitchen-money'), null);
    assert.equal(sandbox.localStorage.getItem('pcg_kitchen-cart'), null);
    assert.equal(sandbox.localStorage.getItem('pcg_kitchen-back-to-shop'), null);
  });
});

test('shop page initializes shelves and a persisted cart without a script error', () => {
  const page = createShopPageSandbox();
  const utilsCode = readFileSync(join(__dirname, '..', 'shared', 'utils.js'), 'utf-8');
  const sharedCode = readFileSync(join(__dirname, '..', 'kitchen-game', 'shared.js'), 'utf-8');
  const shopCode = readFileSync(join(__dirname, '..', 'kitchen-game', 'shop.js'), 'utf-8');

  assert.doesNotThrow(() => {
    vm.runInContext(utilsCode, page.sandbox);
    vm.runInContext(sharedCode, page.sandbox);
    vm.runInContext(shopCode, page.sandbox);
  });

  const shelfSections = page.elements.get('shelves').children;
  const shelfItems = shelfSections.flatMap((section) => section.children[0].children);
  assert.equal(shelfItems.length, 15);
  assert.ok(shelfItems.every((item) => typeof item.listeners.get('click') === 'function'));
  assert.equal(page.elements.get('cart-items').children.length, 1);
  assert.equal(typeof page.elements.get('cart-items').children[0].listeners.get('click'), 'function');
  assert.equal(page.elements.get('wallet-amount').textContent, 18);
  assert.equal(page.elements.get('btn-go-home').disabled, false);
});
