import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gameDir = join(__dirname, '..', 'princess-dressup');

// Sandbox with a DOM-less `document` stub so game.js can load without running
// its guarded init (getElementById returns null → init skipped).
const sandbox = {
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
  Math: globalThis.Math,
  JSON: globalThis.JSON,
  Error: globalThis.Error,
  Array: globalThis.Array,
  Object: globalThis.Object,
  console: globalThis.console,
  document: { getElementById: () => null },
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

function load(file) {
  vm.runInContext(readFileSync(join(gameDir, file), 'utf-8'), sandbox);
}

// data.js is self-contained; game.js adds the pure logic under test. Capture
// the const declarations onto the sandbox via an appended IIFE.
load('data.js');
load('game.js');
vm.runInContext(
  `;(function(_s){
    _s.PRINCESS_CATEGORIES = PRINCESS_CATEGORIES;
    _s.PRINCESS_DEFAULT_OUTFIT = PRINCESS_DEFAULT_OUTFIT;
    _s.PRINCESS_PRAISES = PRINCESS_PRAISES;
    _s.PRINCESS_KEYS = PRINCESS_KEYS;
    _s.PRINCESS_OPTIONAL = PRINCESS_OPTIONAL;
    _s.sanitizeOutfit = sanitizeOutfit;
    _s.buildRandomOutfit = buildRandomOutfit;
  })(this);`,
  sandbox,
);

const {
  PRINCESS_CATEGORIES,
  PRINCESS_DEFAULT_OUTFIT,
  PRINCESS_PRAISES,
  PRINCESS_KEYS,
  PRINCESS_OPTIONAL,
  sanitizeOutfit,
  buildRandomOutfit,
} = sandbox;

const CAT = Object.fromEntries(PRINCESS_CATEGORIES.map((c) => [c.key, c]));

describe('categories', () => {
  test('the six expected categories exist and are non-empty', () => {
    // Array.from builds the array in this realm (PRINCESS_CATEGORIES is a
    // cross-realm vm array whose prototype differs from a plain literal's).
    assert.deepEqual(Array.from(PRINCESS_CATEGORIES, (c) => c.key), [
      'hair',
      'hairAcc',
      'dress',
      'shoes',
      'acc',
      'bg',
    ]);
    for (const c of PRINCESS_CATEGORIES) {
      assert.ok(c.items.length > 0, `category ${c.key} is empty`);
      assert.ok(c.label, `category ${c.key} missing label`);
      assert.ok(c.emoji, `category ${c.key} missing emoji`);
      assert.equal(typeof c.optional, 'boolean', `category ${c.key} missing optional flag`);
    }
  });

  test('expected item counts per category', () => {
    assert.equal(CAT.hair.items.length, 5);
    assert.equal(CAT.hairAcc.items.length, 4);
    assert.equal(CAT.dress.items.length, 6);
    assert.equal(CAT.shoes.items.length, 4);
    assert.equal(CAT.acc.items.length, 4);
    assert.equal(CAT.bg.items.length, 4);
  });
});

describe('item ids', () => {
  test('every item id is globally unique', () => {
    const seen = new Set();
    for (const c of PRINCESS_CATEGORIES) {
      for (const item of c.items) {
        assert.ok(item.id, `item in ${c.key} missing id`);
        assert.ok(!seen.has(item.id), `duplicate item id '${item.id}'`);
        seen.add(item.id);
      }
    }
  });
});

describe('required fields per category', () => {
  test('every item has id + name', () => {
    for (const c of PRINCESS_CATEGORIES) {
      for (const item of c.items) {
        assert.equal(typeof item.id, 'string', `${c.key} item id should be string`);
        assert.ok(item.name, `${item.id} missing name`);
      }
    }
  });

  test('hair items have back/front layers + thumbBox', () => {
    for (const item of CAT.hair.items) {
      assert.ok(item.back && item.back.includes('<'), `${item.id} missing back svg`);
      assert.ok(item.front && item.front.includes('<'), `${item.id} missing front svg`);
      assert.ok(item.thumbBox, `${item.id} missing thumbBox`);
    }
  });

  test('hairAcc / dress / shoes items have svg + thumbBox', () => {
    for (const key of ['hairAcc', 'dress', 'shoes']) {
      for (const item of CAT[key].items) {
        assert.ok(item.svg && item.svg.includes('<'), `${item.id} missing svg`);
        assert.ok(item.thumbBox, `${item.id} missing thumbBox`);
      }
    }
  });

  test('acc items have svg + a valid layer', () => {
    for (const item of CAT.acc.items) {
      assert.ok(item.svg && item.svg.includes('<'), `${item.id} missing svg`);
      assert.ok(['accFront', 'wingsBack'].includes(item.layer), `${item.id} bad layer`);
    }
  });

  test('bg items have cls + swatch + emoji', () => {
    for (const item of CAT.bg.items) {
      assert.ok(item.cls, `${item.id} missing cls`);
      assert.ok(item.swatch, `${item.id} missing swatch`);
      assert.ok(item.emoji, `${item.id} missing emoji`);
    }
  });
});

describe('default outfit', () => {
  test('references only ids that exist (or null for optional slots)', () => {
    for (const key of PRINCESS_KEYS) {
      assert.ok(key in PRINCESS_DEFAULT_OUTFIT, `default missing key '${key}'`);
      const val = PRINCESS_DEFAULT_OUTFIT[key];
      if (val === null) {
        assert.ok(PRINCESS_OPTIONAL.includes(key), `mandatory slot '${key}' cannot be null`);
      } else {
        assert.ok(
          CAT[key].items.some((it) => it.id === val),
          `default ${key} '${val}' invalid`,
        );
      }
    }
  });
});

describe('sanitizeOutfit', () => {
  test('returns the default outfit for null/garbage input', () => {
    assert.deepEqual(sanitizeOutfit(null), PRINCESS_DEFAULT_OUTFIT);
    assert.deepEqual(sanitizeOutfit({ hair: 'nope', dress: 42 }), PRINCESS_DEFAULT_OUTFIT);
  });

  test('drops invalid optional ids to null but keeps valid ones', () => {
    const out = sanitizeOutfit({ ...PRINCESS_DEFAULT_OUTFIT, hairAcc: 'ha_crown', acc: 'bogus' });
    assert.equal(out.hairAcc, 'ha_crown');
    assert.equal(out.acc, null);
  });

  test('output only contains valid ids for every mandatory slot', () => {
    const out = sanitizeOutfit({ hair: 'h_long', dress: 'd_mint', shoes: 's_boot', bg: 'bg_ball' });
    assert.equal(out.hair, 'h_long');
    assert.equal(out.dress, 'd_mint');
    assert.equal(out.shoes, 's_boot');
    assert.equal(out.bg, 'bg_ball');
  });
});

describe('buildRandomOutfit', () => {
  test('always produces a valid outfit across many rolls', () => {
    for (let i = 0; i < 200; i++) {
      const out = buildRandomOutfit();
      for (const key of PRINCESS_KEYS) {
        const val = out[key];
        if (val === null) {
          assert.ok(PRINCESS_OPTIONAL.includes(key), `mandatory slot '${key}' rolled null`);
        } else {
          assert.ok(
            CAT[key].items.some((it) => it.id === val),
            `random ${key} '${val}' invalid`,
          );
        }
      }
    }
  });

  test('mandatory slots are never null', () => {
    for (let i = 0; i < 50; i++) {
      const out = buildRandomOutfit();
      assert.notEqual(out.hair, null);
      assert.notEqual(out.dress, null);
      assert.notEqual(out.shoes, null);
      assert.notEqual(out.bg, null);
    }
  });
});

describe('praises', () => {
  test('has at least four praise phrases', () => {
    assert.ok(PRINCESS_PRAISES.length >= 4);
    for (const p of PRINCESS_PRAISES) assert.ok(typeof p === 'string' && p.length > 0);
  });
});
