import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal DOM sandbox
const sandbox = {
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
  Math: globalThis.Math,
  JSON: globalThis.JSON,
  Error: globalThis.Error,
  Array: globalThis.Array,
  Object: globalThis.Object,
  console: globalThis.console,
  performance: { now: () => Date.now() },
  requestAnimationFrame: (fn) => setTimeout(fn, 0),
  document: {
    getElementById: () => null,
    querySelectorAll: () => [],
    head: { appendChild: () => {} },
    createElement: (tag) => ({
      tagName: tag,
      className: '',
      innerHTML: '',
      textContent: '',
      style: { cssText: '' },
      dataset: {},
      classList: { add() {}, remove() {}, contains() { return false; } },
      children: [],
      appendChild(c) { this.children.push(c); },
      remove() {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    }),
    createDocumentFragment: () => ({
      children: [],
      appendChild(c) { this.children.push(c); },
    }),
    body: {
      appendChild() {},
      style: {},
    },
  },
  navigator: { vibrate: () => true },
  window: {},
  AudioContext: class {
    constructor() { this.currentTime = 0; this.destination = {}; this.sampleRate = 44100; }
    createOscillator() {
      return {
        connect() {}, start() {}, stop() {},
        type: 'sine',
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, value: 0 },
      };
    }
    createGain() {
      return {
        connect() {},
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      };
    }
    createBuffer(_ch, len) { return { getChannelData: () => new Float32Array(len) }; }
    createBufferSource() { return { connect() {}, start() {}, buffer: null }; }
  },
  localStorage: (() => {
    let store = {};
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { store = {}; },
    };
  })(),
  Float32Array: globalThis.Float32Array,
};
sandbox.window = sandbox;

vm.createContext(sandbox);

// Load shared utils, data, then game
const utils = readFileSync(join(__dirname, '..', 'shared', 'utils.js'), 'utf-8');
const data = readFileSync(join(__dirname, '..', 'bear-supermarket', 'data.js'), 'utf-8');
const game = readFileSync(join(__dirname, '..', 'bear-supermarket', 'game.js'), 'utf-8');

vm.runInContext(utils, sandbox);
vm.runInContext(data + `
;(function(_s){
  _s.TOYS = TOYS; _s.CUSTOMERS = CUSTOMERS; _s.BUDGET_RANGES = BUDGET_RANGES;
  _s.GREETINGS = GREETINGS; _s.WANT_PHRASES = WANT_PHRASES;
  _s.AFFORDABLE_PHRASES = AFFORDABLE_PHRASES; _s.CANT_AFFORD_PHRASES = CANT_AFFORD_PHRASES;
  _s.ACCEPT_PHRASES = ACCEPT_PHRASES; _s.LEAVE_PHRASES = LEAVE_PHRASES;
  _s.COUNTER_RESPONSE = COUNTER_RESPONSE;
})(this);
`, sandbox);
vm.runInContext(game + `
;(function(_s){
  _s.state = state;
})(this);
`, sandbox);

const { rand, pick, clamp, state, TOYS, CUSTOMERS, BUDGET_RANGES } = sandbox;

describe('rand', () => {
  test('returns value within range', () => {
    for (let i = 0; i < 50; i++) {
      const v = rand(3, 7);
      assert.ok(v >= 3 && v <= 7, `${v} not in [3,7]`);
    }
  });

  test('returns integer', () => {
    for (let i = 0; i < 20; i++) {
      assert.equal(rand(1, 10) % 1, 0);
    }
  });
});

describe('pick', () => {
  test('returns element from array', () => {
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 20; i++) {
      assert.ok(arr.includes(pick(arr)));
    }
  });
});

describe('clamp', () => {
  test('clamps below min', () => {
    assert.equal(clamp(-5, 0, 10), 0);
  });

  test('clamps above max', () => {
    assert.equal(clamp(15, 0, 10), 10);
  });

  test('returns value when in range', () => {
    assert.equal(clamp(5, 0, 10), 5);
  });

  test('handles min === max', () => {
    assert.equal(clamp(5, 3, 3), 3);
  });
});

describe('TOYS data', () => {
  test('has 30 toys', () => {
    assert.equal(TOYS.length, 30);
  });

  test('each toy has required fields', () => {
    for (const toy of TOYS) {
      assert.ok(toy.id, 'missing id');
      assert.ok(toy.emoji, `toy ${toy.id} missing emoji`);
      assert.ok(toy.name, `toy ${toy.id} missing name`);
      assert.equal(typeof toy.price, 'number');
      assert.equal(typeof toy.stock, 'number');
      assert.equal(typeof toy.maxStock, 'number');
      assert.ok(toy.stock <= toy.maxStock, `toy ${toy.id} stock > maxStock`);
    }
  });

  test('unique ids', () => {
    const ids = TOYS.map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});

describe('CUSTOMERS data', () => {
  test('has 15 customers', () => {
    assert.equal(CUSTOMERS.length, 15);
  });

  test('each customer has a valid personality', () => {
    const validPersonalities = Object.keys(BUDGET_RANGES);
    for (const c of CUSTOMERS) {
      assert.ok(validPersonalities.includes(c.personality), `${c.name} has invalid personality ${c.personality}`);
    }
  });
});

describe('BUDGET_RANGES', () => {
  test('all ranges have min < max', () => {
    for (const [key, range] of Object.entries(BUDGET_RANGES)) {
      assert.ok(range.min < range.max, `${key}: min ${range.min} >= max ${range.max}`);
    }
  });
});

describe('game state', () => {
  test('initial state has expected defaults', () => {
    assert.equal(state.screen, 'welcome');
    assert.equal(state.phase, 'idle');
    assert.equal(state.totalEarnings, 0);
    assert.equal(state.dayNumber, 1);
    assert.equal(state.maxCustomersPerDay, 8);
    assert.equal(state.maxRounds, 3);
  });

  test('inventory is a deep copy of TOYS', () => {
    assert.equal(state.inventory.length, TOYS.length);
    // Mutating inventory should not affect TOYS
    const origStock = TOYS[0].stock;
    state.inventory[0].stock = 999;
    assert.equal(TOYS[0].stock, origStock);
    state.inventory[0].stock = origStock; // restore
  });
});
