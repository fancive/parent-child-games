import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load shared data for recipe logic tests
const sandbox = {
  setTimeout: globalThis.setTimeout,
  Math: globalThis.Math,
  JSON: globalThis.JSON,
  Error: globalThis.Error,
  Array: globalThis.Array,
  Object: globalThis.Object,
  Set: globalThis.Set,
  console: globalThis.console,
  window: { location: { href: '', replace() {} } },
  document: { body: { style: {} } },
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
    _s.getIngredient = getIngredient;
  })(this);
`, sandbox);

const { ALL_INGREDIENTS, RECIPES, INGREDIENT_MAP, getIngredient } = sandbox;

describe('cook: recipe matching with cart', () => {
  test('cart with tomato+cheese can make pizza', () => {
    const cart = ['tomato', 'cheese'];
    const pizza = RECIPES.find((r) => r.id === 'pizza');
    const canMake = pizza.required.every((id) => cart.includes(id));
    assert.ok(canMake, 'should be able to make pizza with tomato + cheese');
  });

  test('cart with only tomato cannot make pizza', () => {
    const cart = ['tomato'];
    const pizza = RECIPES.find((r) => r.id === 'pizza');
    const canMake = pizza.required.every((id) => cart.includes(id));
    assert.ok(!canMake, 'should not make pizza without cheese');
  });

  test('empty cart cannot make any recipe', () => {
    const cart = [];
    for (const recipe of RECIPES) {
      const canMake = recipe.required.every((id) => cart.includes(id));
      assert.ok(!canMake, `empty cart should not make ${recipe.id}`);
    }
  });

  test('full cart (all ingredients) can make all recipes', () => {
    const cart = ALL_INGREDIENTS.map((i) => i.id);
    for (const recipe of RECIPES) {
      const canMake = recipe.required.every((id) => cart.includes(id));
      assert.ok(canMake, `full cart should make ${recipe.id}`);
    }
  });
});

describe('cook: step generation logic', () => {
  test('recipe with wash+cut ingredients produces all 5 steps', () => {
    // pizza: tomato (wash+cut), cheese (cut only)
    const cart = ['tomato', 'cheese'];
    const pizza = RECIPES.find((r) => r.id === 'pizza');
    const stepIngs = [...pizza.required, ...pizza.optional.filter((id) => cart.includes(id))];
    const washList = stepIngs.filter((id) => getIngredient(id).wash);
    const cutList = stepIngs.filter((id) => getIngredient(id).cut);

    const steps = [];
    if (washList.length) steps.push('wash');
    if (cutList.length) steps.push('cut');
    steps.push('pot', 'stir', 'plate');

    assert.deepEqual(steps, ['wash', 'cut', 'pot', 'stir', 'plate']);
  });

  test('recipe with no-wash no-cut ingredients skips wash and cut', () => {
    // friedrice: rice (no wash/cut), egg (no wash/cut)
    const cart = ['rice', 'egg'];
    const friedrice = RECIPES.find((r) => r.id === 'friedrice');
    const stepIngs = [...friedrice.required, ...friedrice.optional.filter((id) => cart.includes(id))];
    const washList = stepIngs.filter((id) => getIngredient(id).wash);
    const cutList = stepIngs.filter((id) => getIngredient(id).cut);

    const steps = [];
    if (washList.length) steps.push('wash');
    if (cutList.length) steps.push('cut');
    steps.push('pot', 'stir', 'plate');

    assert.deepEqual(steps, ['pot', 'stir', 'plate']);
  });
});

describe('cook: ingredient properties', () => {
  test('all ingredients have wash and cut boolean fields', () => {
    for (const ing of ALL_INGREDIENTS) {
      assert.equal(typeof ing.wash, 'boolean', `${ing.id} wash is not boolean`);
      assert.equal(typeof ing.cut, 'boolean', `${ing.id} cut is not boolean`);
    }
  });

  test('vegetables generally require washing', () => {
    const vegs = ALL_INGREDIENTS.filter((i) => i.category === '蔬菜');
    const washable = vegs.filter((i) => i.wash);
    assert.ok(washable.length >= vegs.length * 0.8, 'most vegetables should need washing');
  });
});
