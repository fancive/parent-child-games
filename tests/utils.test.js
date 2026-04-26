import assert from 'node:assert/strict';
import { test, describe, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Build a minimal browser-like sandbox
const sandbox = {
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
  Math: globalThis.Math,
  JSON: globalThis.JSON,
  Float32Array: globalThis.Float32Array,
  String: globalThis.String,
  Error: globalThis.Error,
  console: globalThis.console,
  navigator: { vibrate: () => true },
  document: {
    getElementById: () => null,
    head: { appendChild: () => {} },
    createElement: () => ({
      id: '',
      textContent: '',
      style: { cssText: '' },
      children: [],
      appendChild(c) { this.children.push(c); },
      remove() {},
    }),
    createDocumentFragment: () => ({
      children: [],
      appendChild(c) { this.children.push(c); },
    }),
  },
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
    createBuffer(_ch, len) {
      return { getChannelData: () => new Float32Array(len) };
    }
    createBufferSource() {
      return { connect() {}, start() {}, buffer: null };
    }
  },
  localStorage: (() => {
    let store = {};
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { store = {}; },
      _store: () => store,
    };
  })(),
};
sandbox.window = sandbox;

// Execute shared/utils.js in the sandbox so function declarations become sandbox properties
const utilsCode = readFileSync(join(__dirname, '..', 'shared', 'utils.js'), 'utf-8');
vm.createContext(sandbox);
vm.runInContext(utilsCode, sandbox);

const { playSound, vibrate, debounceClick, saveState, loadState, showConfetti } = sandbox;

describe('playSound', () => {
  test('does not throw for known sound types', () => {
    for (const type of ['buy', 'return', 'error', 'splash', 'chop', 'plop', 'sizzle', 'fanfare', 'bell', 'ding']) {
      assert.doesNotThrow(() => playSound(type));
    }
  });

  test('does not throw for unknown sound type', () => {
    assert.doesNotThrow(() => playSound('nonexistent'));
  });
});

describe('vibrate', () => {
  test('does not throw', () => {
    assert.doesNotThrow(() => vibrate(30));
    assert.doesNotThrow(() => vibrate([30, 50, 30]));
  });
});

describe('debounceClick', () => {
  test('calls function on first invocation', () => {
    let count = 0;
    const fn = debounceClick(() => { count++; }, 50);
    fn();
    assert.equal(count, 1);
  });

  test('blocks rapid re-invocations', () => {
    let count = 0;
    const fn = debounceClick(() => { count++; }, 50);
    fn();
    fn();
    fn();
    assert.equal(count, 1);
  });
});

describe('saveState / loadState', () => {
  beforeEach(() => {
    sandbox.localStorage.clear();
  });

  test('saves and loads a string value', () => {
    saveState('test-key', 'hello');
    assert.equal(loadState('test-key'), 'hello');
  });

  test('saves and loads an object', () => {
    const obj = { a: 1, b: [2, 3] };
    saveState('obj-key', obj);
    assert.deepEqual(loadState('obj-key'), obj);
  });

  test('returns default for missing key', () => {
    assert.equal(loadState('missing'), null);
    assert.equal(loadState('missing', 42), 42);
  });

  test('prefixes keys with pcg_', () => {
    saveState('mykey', 'val');
    assert.equal(sandbox.localStorage.getItem('pcg_mykey'), '"val"');
    assert.equal(sandbox.localStorage.getItem('mykey'), null);
  });
});

describe('showConfetti', () => {
  test('appends children to container without throwing', () => {
    const children = [];
    const container = {
      get children() { return children; },
      removeChild(c) { const i = children.indexOf(c); if (i >= 0) children.splice(i, 1); },
      appendChild(frag) { children.push(frag); },
    };
    assert.doesNotThrow(() => showConfetti(container, 3));
    assert.ok(children.length > 0, 'should have appended at least one child');
  });
});
