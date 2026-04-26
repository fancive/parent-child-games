import assert from 'node:assert/strict';
import { test, describe, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Build a sandbox with localStorage and minimal DOM
const sandbox = {
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
  Math: globalThis.Math,
  JSON: globalThis.JSON,
  Error: globalThis.Error,
  Array: globalThis.Array,
  Object: globalThis.Object,
  console: globalThis.console,
  window: { location: { href: '' } },
  document: {
    body: { style: { opacity: '', transition: '' } },
  },
  localStorage: (() => {
    let store = {};
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v);
      },
      removeItem: (k) => {
        delete store[k];
      },
      clear: () => {
        store = {};
      },
    };
  })(),
};
sandbox.window = sandbox;

vm.createContext(sandbox);

// Load kitchen-game/shared.js
const code = readFileSync(join(__dirname, '..', 'kitchen-game', 'shared.js'), 'utf-8');
// Wrap in IIFE to capture const declarations onto sandbox
vm.runInContext(
  code +
    `
;(function(_s){
  _s.ALL_INGREDIENTS = ALL_INGREDIENTS;
  _s.RECIPES = RECIPES;
  _s.INGREDIENT_MAP = INGREDIENT_MAP;
})(this);
`,
  sandbox,
);

const {
  ALL_INGREDIENTS,
  RECIPES,
  INGREDIENT_MAP,
  getIngredient,
  saveGameState,
  loadGameState,
  clearGameState,
  navigateTo,
} = sandbox;

describe('ALL_INGREDIENTS', () => {
  test('has 15 ingredients', () => {
    assert.equal(ALL_INGREDIENTS.length, 15);
  });

  test('each ingredient has required fields', () => {
    for (const ing of ALL_INGREDIENTS) {
      assert.ok(ing.id, `ingredient missing id`);
      assert.ok(ing.emoji, `${ing.id} missing emoji`);
      assert.ok(ing.name, `${ing.id} missing name`);
      assert.equal(typeof ing.price, 'number', `${ing.id} price should be number`);
      assert.ok(ing.category, `${ing.id} missing category`);
    }
  });
});

describe('RECIPES', () => {
  test('has 10 recipes', () => {
    assert.equal(RECIPES.length, 10);
  });

  test('each recipe references valid ingredients', () => {
    for (const recipe of RECIPES) {
      for (const id of recipe.required) {
        assert.ok(INGREDIENT_MAP[id], `recipe ${recipe.id} references unknown ingredient '${id}'`);
      }
      for (const id of recipe.optional) {
        assert.ok(
          INGREDIENT_MAP[id],
          `recipe ${recipe.id} references unknown optional ingredient '${id}'`,
        );
      }
    }
  });
});

describe('getIngredient', () => {
  test('returns ingredient by id', () => {
    const tomato = getIngredient('tomato');
    assert.equal(tomato.name, '番茄');
    assert.equal(tomato.price, 2);
  });

  test('returns undefined for unknown id', () => {
    assert.equal(getIngredient('nonexistent'), undefined);
  });
});

describe('saveGameState / loadGameState', () => {
  beforeEach(() => {
    sandbox.localStorage.clear();
  });

  test('saves and loads money and cart', () => {
    saveGameState(15, ['tomato', 'egg']);
    const state = loadGameState();
    assert.equal(state.money, 15);
    assert.deepEqual(state.cart, ['tomato', 'egg']);
  });

  test('returns defaults when empty', () => {
    const state = loadGameState();
    assert.equal(state.money, 20);
    assert.deepEqual(state.cart, []);
  });

  test('returns defaults on corrupted data', () => {
    sandbox.localStorage.setItem('pcg_kitchen-money', 'not-json{{{');
    sandbox.localStorage.setItem('pcg_kitchen-cart', 'not-json{{{');
    const state = loadGameState();
    assert.equal(state.money, 20);
    // Cross-realm array: compare via JSON since vm arrays have different prototype
    assert.equal(JSON.stringify(state.cart), '[]');
  });
});

describe('clearGameState', () => {
  test('removes all kitchen keys', () => {
    saveGameState(10, ['carrot']);
    sandbox.localStorage.setItem('pcg_kitchen-back-to-shop', '1');
    clearGameState();
    assert.equal(sandbox.localStorage.getItem('pcg_kitchen-money'), null);
    assert.equal(sandbox.localStorage.getItem('pcg_kitchen-cart'), null);
    assert.equal(sandbox.localStorage.getItem('pcg_kitchen-back-to-shop'), null);
  });
});

describe('navigateTo', () => {
  test('is a function', () => {
    assert.equal(typeof navigateTo, 'function');
  });
});
