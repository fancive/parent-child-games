import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const code = readFileSync(new URL('number-game/model.js', root), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(code, sandbox);
const { Adventure, questions, restore, LEVELS } = sandbox.window.NumberAdventure;

test('all generated problems have valid arithmetic and three distinct bounded choices', () => {
  for (let seed = 0; seed < 500; seed++) {
    for (let stage = 0; stage < 2; stage++) {
      const batch = questions(stage, seed);
      assert.equal(batch.length, 5);
      for (const q of batch) {
        assert.equal(q.answer, stage === 0 ? q.a + q.b : q.a - q.b);
        assert.ok(q.a >= 1 && q.a <= 10);
        assert.ok(q.answer >= 0 && q.answer <= 10);
        if (stage === 0) assert.ok(q.a > 0 && q.b > 0);
        if (stage === 1) assert.ok(q.b > 0 && q.b <= q.a);
        assert.equal(q.options.length, 3);
        assert.equal(new Set(q.options).size, 3);
        assert.ok(q.options.includes(q.answer));
        assert.ok(q.options.every((x) => Number.isInteger(x) && x >= 0 && x <= 10));
      }
      if (stage === 0) {
        for (let i = 1; i < batch.length; i++) {
          assert.ok(batch[i].answer > batch[i - 1].answer, 'quantity grows across the round');
        }
      }
      if (stage === 1) assert.equal(batch[4].answer, 0, 'every subtraction round teaches zero');
    }
  }
});

test('wrong answers, skipping and repeated answers never advance or duplicate rewards', () => {
  const game = new Adventure();
  assert.equal(game.start(1), false);
  assert.equal(game.start(0, 42), true);
  const before = game.serialize();
  assert.equal(game.next(), 'ignored');
  assert.equal(game.answer(game.question.answer + 1), 'retry');
  assert.equal(game.serialize(), before);
  assert.equal(game.answer(game.question.answer), 'correct');
  assert.equal(game.answer(game.question.answer), 'ignored');
  assert.equal(game.progress.round.index, 0);
  assert.equal(game.next(), 'question');
  assert.equal(game.next(), 'ignored');
  assert.equal(game.progress.round.index, 1);
});

test('forty problems unlock eight stages; replay never removes completed stages', () => {
  const game = new Adventure();
  for (let stage = 0; stage < 8; stage++) {
    assert.equal(game.start(stage + 1, 123), false);
    assert.equal(game.start(stage, 123), true);
    for (let i = 0; i < 5; i++) {
      game.answer(game.question.answer);
      assert.equal(game.progress.completed, stage);
      assert.equal(game.next(), i === 4 ? 'complete' : 'question');
    }
    assert.equal(game.progress.completed, stage + 1);
    assert.equal(game.progress.round, null);
    assert.equal(game.next(), 'ignored');
  }
  game.start(0, 20);
  for (let i = 0; i < 5; i++) {
    game.answer(game.question.answer);
    game.next();
  }
  assert.equal(game.progress.completed, 8);
});

test('refresh restores the exact question, choices and solved state', () => {
  const game = new Adventure();
  game.start(0, 1000);
  game.answer(game.question.answer);
  game.next();
  let restored = new Adventure(game.serialize());
  assert.equal(JSON.stringify(restored.question), JSON.stringify(game.question));
  assert.equal(restored.progress.round.index, 1);
  game.answer(game.question.answer);
  restored = new Adventure(game.serialize());
  assert.equal(restored.answer(restored.question.answer), 'ignored');
  assert.equal(restored.next(), 'question');
  assert.equal(restored.progress.round.index, 2);
});

test('invalid or incompatible saves fall back safely, retaining valid completed progress', () => {
  for (const raw of [
    null,
    '{broken',
    'null',
    '[]',
    '{}',
    '{"version":2,"completed":3}',
    '{"version":1,"completed":99}',
  ]) {
    assert.equal(restore(raw).completed, 0);
    assert.equal(restore(raw).round, null);
  }
  for (const patch of [
    { stage: 2 },
    { index: 5 },
    { index: -1 },
    { seed: -1 },
    { solved: 'yes' },
  ]) {
    const saved = {
      version: 2,
      completed: 1,
      round: { stage: 1, index: 0, seed: 5, solved: false, ...patch },
    };
    assert.equal(restore(saved).completed, 1);
    assert.equal(restore(saved).round, null);
  }
});

test('home, offline cache and published artifact include every game resource', () => {
  const home = readFileSync(new URL('index.html', root), 'utf8');
  const sw = readFileSync(new URL('sw.js', root), 'utf8');
  const workflow = readFileSync(new URL('.github/workflows/deploy.yml', root), 'utf8');
  assert.match(home, /href="number-game\/index.html"/);
  assert.doesNotMatch(home, /数字冒险 - 即将上线/);
  assert.match(workflow, /cp -r number-game _site\//);
  for (const name of ['index.html', 'styles.css', 'model.js', 'game.js']) {
    assert.ok(sw.includes(`'./number-game/${name}'`));
    assert.ok(existsSync(new URL(`number-game/${name}`, root)));
  }
});

test('legacy counting progress is removed without unlocking subtraction', () => {
  for (const completed of [0, 1]) {
    const progress = restore({
      version: 1,
      completed,
      round: { stage: 0, index: 4, seed: 42, solved: true },
    });
    assert.equal(progress.version, 6);
    assert.equal(progress.completed, 0);
    assert.equal(progress.round, null);
    const game = new Adventure(progress);
    assert.equal(game.start(1), false);
    assert.equal(game.start(0), true);
    assert.equal(game.question.answer, game.question.a + game.question.b);
  }
});

test('legacy arithmetic saves keep their exact question and migrate only once', () => {
  const fixtures = [
    { stage: 1, completed: 1, expected: { a: 6, b: 1, answer: 7, options: [0, 5, 7] } },
    { stage: 2, completed: 2, expected: { a: 6, b: 5, answer: 1, options: [0, 6, 1] } },
  ];
  for (const { stage, completed, expected } of fixtures) {
    for (const solved of [false, true]) {
      const game = new Adventure({
        version: 1,
        completed,
        round: { stage, index: 2, seed: 42, solved },
      });
      assert.equal(game.progress.completed, completed - 1);
      assert.equal(game.progress.round.stage, stage - 1);
      assert.equal(game.progress.round.solved, solved);
      assert.deepEqual(JSON.parse(JSON.stringify(game.question)), expected);
      assert.equal(new Adventure(game.serialize()).serialize(), game.serialize());
    }
  }
  assert.equal(restore({ version: 1, completed: 3, round: null }).completed, 2);
});

test('map offers introductory arithmetic, twenty-range arithmetic and missing numbers', () => {
  assert.deepEqual(
    Array.from(sandbox.window.NumberAdventure.LEVELS, (level) => level.skill),
    [
      '加一加',
      '减一减',
      '20 以内加减法',
      '20 以内填空加减法',
      '50 以内加减法',
      '50 以内填空加减法',
      '100 以内加减法',
      '100 以内填空加减法',
      '100 以内进位加法',
      '100 以内退位减法',
      '100 以内两位数加减法',
      '100 以内综合填空',
    ],
  );
  const html = readFileSync(new URL('number-game/index.html', root), 'utf8');
  const home = readFileSync(new URL('index.html', root), 'utf8');
  assert.doesNotMatch(html, /数一数、|苹果林/);
  assert.doesNotMatch(home, /陪小兔数苹果/);
});

test('advanced rounds mix arithmetic within twenty with crossing-ten examples', () => {
  let sawZero = false;
  for (let seed = 0; seed < 500; seed++) {
    const batch = questions(2, seed);
    assert.equal(batch.length, 5);
    assert.deepEqual(
      Array.from(batch, (q) => q.operation),
      ['+', '−', '+', '−', '+'],
    );
    for (const q of batch) {
      assert.equal(q.answer, q.operation === '+' ? q.a + q.b : q.a - q.b);
      assert.ok([q.a, q.b, q.answer].every((n) => Number.isInteger(n) && n >= 0 && n <= 20));
      assert.equal(q.options.length, 3);
      assert.equal(new Set(q.options).size, 3);
      assert.ok(q.options.includes(q.answer));
      assert.ok(q.options.every((n) => Number.isInteger(n) && n >= 0 && n <= 20));
      if (q.answer === 0) sawZero = true;
    }
    assert.ok(batch[2].a < 10 && batch[2].b < 10 && batch[2].answer > 10);
    assert.ok(batch[3].a > 10 && batch[3].b > batch[3].a % 10 && batch[3].answer < 10);
    assert.equal(batch[4].answer, 20);
  }
  assert.ok(sawZero, 'zero remains a valid subtraction result');
});

test('previous two-stage completion unlocks the new stage without completing it', () => {
  for (const saved of [
    { version: 2, completed: 2, round: null },
    { version: 1, completed: 3, round: null },
  ]) {
    const game = new Adventure(saved);
    assert.equal(game.progress.completed, 2);
    assert.equal(game.start(2, 42), true);
    assert.equal(game.start(3), false);
    const before = game.serialize();
    assert.equal(game.answer(game.question.answer + 1), 'retry');
    assert.equal(game.serialize(), before);
    game.answer(game.question.answer);
    const restored = new Adventure(game.serialize());
    assert.equal(restored.progress.round.stage, 2);
    assert.equal(restored.progress.round.solved, true);
    assert.deepEqual(
      JSON.parse(JSON.stringify(restored.question)),
      JSON.parse(JSON.stringify(game.question)),
    );
    assert.equal(restored.answer(restored.question.answer), 'ignored');
    assert.equal(restored.next(), 'question');
    assert.equal(restored.progress.round.index, 1);
  }
  assert.equal(new Adventure({ version: 2, completed: 1, round: null }).start(2), false);
});

test('version two in-flight questions survive upgrade exactly', () => {
  for (const stage of [0, 1]) {
    const original = {
      version: 2,
      completed: stage,
      round: { stage, index: 3, seed: 71, solved: true },
    };
    const game = new Adventure(original);
    assert.deepEqual(JSON.parse(JSON.stringify(game.progress.round)), original.round);
    assert.equal(game.progress.completed, stage);
    assert.equal(game.progress.version, 6);
    assert.equal(new Adventure(game.serialize()).serialize(), game.serialize());
  }
});

const oldQuestionFixtures = [
  [
    { a: 1, b: 1, answer: 2, options: [3, 2, 6] },
    { a: 1, b: 3, answer: 4, options: [9, 4, 10] },
    { a: 6, b: 1, answer: 7, options: [0, 5, 7] },
    { a: 8, b: 1, answer: 9, options: [1, 9, 5] },
    { a: 8, b: 2, answer: 10, options: [8, 10, 1] },
  ],
  [
    { a: 3, b: 1, answer: 2, options: [3, 2, 6] },
    { a: 4, b: 1, answer: 3, options: [9, 3, 10] },
    { a: 6, b: 5, answer: 1, options: [0, 6, 1] },
    { a: 8, b: 7, answer: 1, options: [2, 1, 6] },
    { a: 9, b: 9, answer: 0, options: [9, 0, 2] },
  ],
  [
    { a: 11, b: 1, answer: 12, options: [4, 12, 11], operation: '+' },
    { a: 15, b: 2, answer: 13, options: [18, 13, 20], operation: '−' },
    { a: 8, b: 9, answer: 17, options: [1, 11, 17], operation: '+' },
    { a: 18, b: 9, answer: 9, options: [3, 9, 12], operation: '−' },
    { a: 15, b: 5, answer: 20, options: [16, 20, 2], operation: '+' },
  ],
  [
    { a: 7, b: 4, operation: '+', result: 11, unknown: 'b', answer: 4, options: [11, 12, 4] },
    { a: 11, b: 5, operation: '−', result: 6, unknown: 'a', answer: 11, options: [11, 6, 2] },
    { a: 17, b: 2, operation: '+', result: 19, unknown: 'a', answer: 17, options: [17, 19, 12] },
    { a: 11, b: 3, operation: '−', result: 8, unknown: 'b', answer: 3, options: [3, 8, 20] },
    { a: 20, b: 20, operation: '−', result: 0, unknown: 'b', answer: 20, options: [11, 0, 20] },
  ],
];

test('all four original stages retain the 99ab414 question and choice fixtures', () => {
  for (let stage = 0; stage < 4; stage++) {
    assert.deepEqual(JSON.parse(JSON.stringify(questions(stage, 42))), oldQuestionFixtures[stage]);
    for (const solved of [false, true]) {
      const original = {
        version: 4,
        completed: stage,
        round: { stage, index: 3, seed: 42, solved },
      };
      const game = new Adventure(original);
      assert.equal(game.progress.version, 6);
      assert.equal(game.progress.completed, stage);
      assert.deepEqual(JSON.parse(JSON.stringify(game.progress.round)), original.round);
      assert.deepEqual(JSON.parse(JSON.stringify(game.question)), oldQuestionFixtures[stage][3]);
      assert.equal(new Adventure(game.serialize()).serialize(), game.serialize());
    }
  }
});

test('rainbow rounds find missing operands within twenty and cover every missing-number skill', () => {
  const boundaryAnswers = new Set();
  for (let seed = 0; seed < 500; seed++) {
    const batch = questions(3, seed);
    assert.equal(batch.length, 5);
    assert.equal(JSON.stringify(batch), JSON.stringify(questions(3, seed)));
    const skills = new Set();
    for (const q of batch) {
      assert.ok(['+', '−'].includes(q.operation));
      assert.ok(['a', 'b'].includes(q.unknown));
      assert.equal(q.result, q.operation === '+' ? q.a + q.b : q.a - q.b);
      assert.equal(q.answer, q[q.unknown]);
      assert.notEqual(q.answer, q.result, 'answer is the missing operand, not the visible result');
      assert.ok(
        [q.a, q.b, q.result, q.answer].every((n) => Number.isInteger(n) && n >= 0 && n <= 20),
      );
      assert.equal(q.options.length, 3);
      assert.equal(new Set(q.options).size, 3);
      assert.ok(q.options.includes(q.answer));
      assert.ok(q.options.every((n) => Number.isInteger(n) && n >= 0 && n <= 20));
      skills.add(`${q.operation}${q.unknown}`);
      boundaryAnswers.add(q.answer);
    }
    assert.ok(skills.has('+a') && skills.has('+b'), 'both addend positions are covered');
    assert.ok(skills.has('−a'), 'the minuend can be missing');
    assert.ok(skills.has('−b'), 'the subtrahend can be missing');
    assert.ok(batch.some((q) => q.operation === '+' && q.a < 10 && q.b < 10 && q.result > 10));
    assert.ok(
      batch.some((q) => q.operation === '−' && q.a > 10 && q.b > q.a % 10 && q.result < 10),
    );
  }
  assert.ok(
    boundaryAnswers.has(0) && boundaryAnswers.has(20),
    'zero and twenty can be missing numbers',
  );
});

test('version three completion unlocks rainbow but cannot claim fourth-stage progress', () => {
  const game = new Adventure({ version: 3, completed: 3, round: null });
  assert.equal(game.progress.completed, 3);
  assert.equal(game.start(3, 42), true);
  assert.equal(game.progress.completed, 3);
  assert.equal(new Adventure({ version: 3, completed: 2, round: null }).start(3), false);
  for (const completed of [3, 4]) {
    const progress = restore({
      version: 3,
      completed,
      round: { stage: 3, index: 2, seed: 42, solved: true },
    });
    assert.equal(progress.round, null);
    assert.equal(progress.completed, completed === 3 ? 3 : 0);
    assert.equal(progress.version, 6);
  }
  assert.equal(restore({ version: 4, completed: 5, round: null }).completed, 0);
});

test('rainbow retries, refresh, solved refresh and replay preserve progress and choices', () => {
  const game = new Adventure({ version: 3, completed: 3, round: null });
  game.start(3, 71);
  for (let i = 0; i < 5; i++) {
    const before = game.serialize();
    assert.equal(game.next(), 'ignored');
    const wrong = game.question.options.find((value) => value !== game.question.answer);
    assert.equal(game.answer(wrong), 'retry');
    assert.equal(game.serialize(), before);
    let restored = new Adventure(before);
    assert.equal(restored.progress.version, 6);
    assert.equal(restored.progress.round.stage, 3);
    assert.equal(JSON.stringify(restored.question), JSON.stringify(game.question));
    assert.equal(restored.progress.round.solved, false);
    assert.equal(game.answer(game.question.answer), 'correct');
    restored = new Adventure(game.serialize());
    assert.equal(restored.progress.round.solved, true);
    assert.equal(JSON.stringify(restored.question), JSON.stringify(game.question));
    assert.equal(restored.answer(restored.question.answer), 'ignored');
    assert.equal(game.answer(game.question.answer), 'ignored');
    assert.equal(game.progress.completed, 3);
    assert.equal(game.next(), i === 4 ? 'complete' : 'question');
  }
  assert.equal(game.progress.completed, 4);
  assert.equal(game.progress.round, null);
  assert.equal(game.next(), 'ignored');
  for (const stage of [0, 3]) {
    assert.equal(game.start(stage, 42), true);
    for (let i = 0; i < 5; i++) {
      game.answer(game.question.answer);
      game.next();
    }
    assert.equal(game.progress.completed, 4);
  }
});

test('the first eight levels keep their numeric ranges and map identities', () => {
  assert.equal(LEVELS.length, 12);
  assert.deepEqual(
    Array.from(LEVELS.slice(0, 8), (level) => level.max),
    [10, 10, 20, 20, 50, 50, 100, 100],
  );
  assert.deepEqual(
    Array.from(LEVELS.slice(0, 8), (level) => level.kind),
    ['addition', 'subtraction', 'mixed', 'missing', 'mixed', 'missing', 'mixed', 'missing'],
  );
  assert.deepEqual(
    Array.from(LEVELS.slice(4, 8), (level) => [level.name, level.icon, level.reward]),
    [
      ['松果溪谷', '🪵', '溪谷徽章'],
      ['迷雾森林', '🌲', '森林徽章'],
      ['云朵城堡', '🏰', '城堡徽章'],
      ['星空航站', '🚀', '航站徽章'],
    ],
  );
});

test('the original four stages retain every generated question and option across 500 seeds', () => {
  // Captured from the published fourth-level candidate 99ab414 before this expansion.
  const hash = createHash('sha256');
  for (let seed = 0; seed < 500; seed++) {
    for (let stage = 0; stage < 4; stage++)
      hash.update(JSON.stringify(questions(stage, seed)) + '\n');
  }
  assert.equal(
    hash.digest('hex'),
    '9f0ad2496477267ce613412195f807f81b6b20b9824555d4e01af9355643b0b3',
  );
});

test('new fifty and hundred rounds use larger numbers, carrying, borrowing and bounded distinct choices', () => {
  for (let stage = 4; stage < 8; stage++) {
    const { max, kind } = LEVELS[stage];
    const previousMax = LEVELS[stage - 2].max;
    const boundaryAnswers = new Set();
    for (let seed = 0; seed < 500; seed++) {
      const batch = questions(stage, seed);
      assert.equal(batch.length, 5);
      assert.equal(JSON.stringify(batch), JSON.stringify(questions(stage, seed)));
      assert.ok(batch.some((q) => q.operation === '+'));
      assert.ok(batch.some((q) => q.operation === '−'));
      const skills = new Set();
      for (const q of batch) {
        const result = q.operation === '+' ? q.a + q.b : q.a - q.b;
        const values = [q.a, q.b, q.answer, ...q.options];
        assert.ok(['+', '−'].includes(q.operation));
        assert.ok(
          [q.a, q.b, result].some((n) => n > previousMax),
          'each question reaches the new range',
        );
        assert.equal(q.options.length, 3);
        assert.equal(new Set(q.options).size, 3);
        assert.ok(q.options.includes(q.answer));
        if (kind === 'missing') {
          assert.ok(['a', 'b'].includes(q.unknown));
          assert.equal(q.result, result);
          assert.equal(q.answer, q[q.unknown]);
          assert.notEqual(
            q.answer,
            q.result,
            'solve the unknown operand rather than the visible result',
          );
          assert.ok(
            q.options.includes(q.result),
            'the visible result remains a meaningful distractor',
          );
          values.push(q.result);
          skills.add(`${q.operation}${q.unknown}`);
        } else {
          assert.equal(q.answer, result);
          assert.equal(q.result, undefined);
          assert.equal(q.unknown, undefined);
        }
        assert.ok(values.every((n) => Number.isInteger(n) && n >= 0 && n <= max));
      }
      assert.ok(
        batch.some((q) => q.operation === '+' && (q.a % 10) + (q.b % 10) >= 10),
        'each round includes carrying',
      );
      assert.ok(
        batch.some((q) => q.operation === '−' && q.b % 10 > q.a % 10),
        'each round includes borrowing',
      );
      if (kind === 'missing') {
        for (const skill of ['+a', '+b', '−a', '−b']) assert.ok(skills.has(skill));
        assert.ok(
          batch.some((q) => q.answer > previousMax),
          'unknown operands also reach the new range',
        );
      }
      assert.ok([0, max].includes(batch[4].answer), 'last question practices a range boundary');
      boundaryAnswers.add(batch[4].answer);
    }
    assert.ok(
      boundaryAnswers.has(0) && boundaryAnswers.has(max),
      'both boundaries occur across seeds',
    );
  }
});

test('version four completion unlocks the fifth stage without claiming the eight-stage finale', () => {
  const game = new Adventure({ version: 4, completed: 4, round: null });
  assert.equal(game.progress.version, 6);
  assert.equal(game.progress.completed, 4);
  assert.equal(game.start(4, 42), true);
  assert.equal(game.start(5, 42), false);
  assert.equal(game.progress.completed < LEVELS.length, true);
  assert.equal(
    restore({ version: 4, completed: 4, round: { stage: 4, index: 1, seed: 42, solved: false } })
      .round,
    null,
  );
  assert.equal(
    restore({ version: 4, completed: 5, round: { stage: 4, index: 1, seed: 42, solved: false } })
      .completed,
    0,
  );
});

test('every historical save version retains its own completed and active-stage limit', () => {
  for (const [version, limit] of [
    [1, 3],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 8],
    [6, 12],
  ]) {
    assert.equal(restore({ version, completed: limit + 1, round: null }).completed, 0);
    const restored = restore({
      version,
      completed: limit,
      round: { stage: limit, index: 1, seed: 42, solved: false },
    });
    assert.equal(restored.version, 6);
    assert.equal(restored.completed, version === 1 ? limit - 1 : limit);
    assert.equal(restored.round, null);
  }
});

test('all historical in-flight arithmetic questions retain seed, index, options and solved status', () => {
  for (const [version, count] of [
    [1, 2],
    [2, 2],
    [3, 3],
    [4, 4],
  ]) {
    for (let stage = 0; stage < count; stage++) {
      for (let index = 0; index < 5; index++) {
        for (const solved of [false, true]) {
          const oldStage = version === 1 ? stage + 1 : stage;
          const saved = {
            version,
            completed: oldStage,
            round: { stage: oldStage, index, seed: 42, solved },
          };
          const game = new Adventure(saved);
          assert.equal(game.progress.version, 6);
          assert.equal(game.progress.completed, stage);
          assert.deepEqual(JSON.parse(JSON.stringify(game.progress.round)), {
            stage,
            index,
            seed: 42,
            solved,
          });
          assert.deepEqual(
            JSON.parse(JSON.stringify(game.question)),
            oldQuestionFixtures[stage][index],
          );
          assert.equal(new Adventure(game.serialize()).serialize(), game.serialize());
        }
      }
    }
  }
});

test('new stages retain retries, refresh, solved refresh, repeated answers and replay without losing unlocks', () => {
  let game = new Adventure({ version: 4, completed: 4, round: null });
  for (let stage = 4; stage < 8; stage++) {
    assert.equal(game.start(stage, 71), true);
    for (let index = 0; index < 5; index++) {
      const before = game.serialize();
      const question = JSON.stringify(game.question);
      const wrong = game.question.options.find((value) => value !== game.question.answer);
      assert.equal(game.next(), 'ignored');
      assert.equal(game.answer(wrong), 'retry');
      assert.equal(game.serialize(), before);
      game = new Adventure(before);
      assert.equal(JSON.stringify(game.question), question);
      assert.equal(game.progress.round.index, index);
      assert.equal(game.answer(game.question.answer), 'correct');
      game = new Adventure(game.serialize());
      assert.equal(JSON.stringify(game.question), question);
      assert.equal(game.progress.round.solved, true);
      assert.equal(game.answer(game.question.answer), 'ignored');
      assert.equal(game.progress.completed, stage);
      assert.equal(game.next(), index === 4 ? 'complete' : 'question');
    }
    assert.equal(game.progress.completed, stage + 1);
    assert.equal(game.progress.round, null);
  }
  for (const stage of [0, 4, 7]) {
    assert.equal(game.start(stage, 42), true);
    for (let index = 0; index < 5; index++) {
      game.answer(game.question.answer);
      game.next();
    }
    assert.equal(game.progress.completed, 8);
  }
});

test('all eight original stages retain every question and option across 500 seeds', () => {
  // Captured from HEAD before adding the four hundred-range practice stages.
  const hash = createHash('sha256');
  for (let seed = 0; seed < 500; seed++) {
    for (let stage = 0; stage < 8; stage++)
      hash.update(JSON.stringify(questions(stage, seed)) + '\n');
  }
  assert.equal(
    hash.digest('hex'),
    'dbb338283a645dd29168e88092157a77c6a1a51cfdddc94cddff9812c093aa7f',
  );
});

test('four new hundred-range destinations each describe a specific practice skill', () => {
  assert.deepEqual(
    Array.from(LEVELS.slice(8), ({ name, icon, reward, skill, kind, max, item, intro }) => ({
      name,
      icon,
      reward,
      skill,
      kind,
      max,
      item,
      hasIntro: typeof intro === 'string' && intro.length > 0,
    })),
    [
      {
        name: '蜜蜂花园',
        icon: '🐝',
        reward: '花园徽章',
        skill: '100 以内进位加法',
        kind: 'addition',
        max: 100,
        item: '积木',
        hasIntro: true,
      },
      {
        name: '月亮湖',
        icon: '🌙',
        reward: '月亮徽章',
        skill: '100 以内退位减法',
        kind: 'subtraction',
        max: 100,
        item: '积木',
        hasIntro: true,
      },
      {
        name: '宝石矿洞',
        icon: '💎',
        reward: '宝石徽章',
        skill: '100 以内两位数加减法',
        kind: 'mixed',
        max: 100,
        item: '积木',
        hasIntro: true,
      },
      {
        name: '太阳营地',
        icon: '☀️',
        reward: '太阳徽章',
        skill: '100 以内综合填空',
        kind: 'missing',
        max: 100,
        item: '积木',
        hasIntro: true,
      },
    ],
  );
});

test('new hundred rounds teach carrying, borrowing, mixed two-digit arithmetic and missing operands', () => {
  for (let stage = 8; stage < 12; stage++) {
    const boundaries = new Set();
    for (const seed of [...Array.from({ length: 500 }, (_, n) => n), 2147483648, 4294967295]) {
      const batch = questions(stage, seed);
      assert.equal(batch.length, 5);
      assert.equal(JSON.stringify(batch), JSON.stringify(questions(stage, seed)));
      const skills = new Set();
      for (const [index, q] of batch.entries()) {
        assert.ok(['+', '−'].includes(q.operation));
        const result = q.operation === '+' ? q.a + q.b : q.a - q.b;
        assert.ok(
          [q.a, q.b, result, q.answer, ...q.options].every(
            (n) => Number.isInteger(n) && n >= 0 && n <= 100,
          ),
        );
        assert.equal(q.options.length, 3);
        assert.equal(new Set(q.options).size, 3);
        assert.equal(q.options.filter((n) => n === q.answer).length, 1);
        if (stage === 11) {
          assert.ok(['a', 'b'].includes(q.unknown));
          assert.equal(q.result, result);
          assert.equal(q.answer, q[q.unknown]);
          assert.notEqual(q.answer, q.result);
          assert.ok(q.options.includes(q.result));
          skills.add(`${q.operation}${q.unknown}`);
        } else {
          assert.equal(q.answer, result);
          assert.equal(q.result, undefined);
          assert.equal(q.unknown, undefined);
        }
        if (stage < 10 || index < 4) {
          assert.ok(
            q.a >= 10 && q.a <= 99 && q.b >= 10 && q.b <= 99,
            'practice uses two-digit operands',
          );
        }
        if (stage === 8) {
          assert.equal(q.operation, '+');
          assert.ok((q.a % 10) + (q.b % 10) >= 10, 'every addition requires carrying');
        }
        if (stage === 9) {
          assert.equal(q.operation, '−');
          assert.ok(q.b % 10 > q.a % 10, 'every subtraction requires borrowing');
        }
        boundaries.add(q.answer);
      }
      if (stage >= 10) {
        assert.ok(batch.some((q) => q.operation === '+' && (q.a % 10) + (q.b % 10) >= 10));
        assert.ok(batch.some((q) => q.operation === '−' && q.b % 10 > q.a % 10));
        assert.ok([0, 100].includes(batch[4].answer));
      }
      if (stage === 11) {
        for (const skill of ['+a', '+b', '−a', '−b']) assert.ok(skills.has(skill));
      }
    }
    if (stage >= 10) assert.ok(boundaries.has(0) && boundaries.has(100));
  }
});

test('version five in-flight saves retain every original question and cannot claim new progress', () => {
  for (let stage = 0; stage < 8; stage++) {
    for (let index = 0; index < 5; index++) {
      for (const solved of [false, true]) {
        const round = { stage, index, seed: 4294967295, solved };
        const game = new Adventure({ version: 5, completed: stage, round });
        assert.equal(game.progress.version, 6);
        assert.equal(game.progress.completed, stage);
        assert.deepEqual(JSON.parse(JSON.stringify(game.progress.round)), round);
        assert.equal(
          JSON.stringify(game.question),
          JSON.stringify(questions(stage, round.seed)[index]),
        );
        assert.equal(new Adventure(game.serialize()).serialize(), game.serialize());
      }
    }
  }
  const upgraded = new Adventure({ version: 5, completed: 8, round: null });
  assert.equal(upgraded.progress.completed, 8);
  assert.equal(upgraded.start(8, 42), true);
  assert.equal(upgraded.start(9, 42), false);
  for (const completed of [9, 10, 11, 12]) {
    assert.equal(restore({ version: 5, completed, round: null }).completed, 0);
  }
  for (const stage of [8, 9, 10, 11]) {
    assert.equal(
      restore({ version: 5, completed: 8, round: { stage, index: 1, seed: 42, solved: true } })
        .round,
      null,
    );
  }
});

test('new hundred stages keep retries, refresh, solved refresh and replay while unlocking all twelve', () => {
  let game = new Adventure({ version: 5, completed: 8, round: null });
  for (let stage = 8; stage < 12; stage++) {
    assert.equal(game.start(stage + 1, 71), false);
    assert.equal(game.start(stage, 71), true);
    for (let index = 0; index < 5; index++) {
      const before = game.serialize();
      const question = JSON.stringify(game.question);
      const wrong = game.question.options.find((value) => value !== game.question.answer);
      assert.equal(game.next(), 'ignored');
      assert.equal(game.answer(wrong), 'retry');
      assert.equal(game.serialize(), before);
      game = new Adventure(before);
      assert.equal(game.progress.version, 6);
      assert.equal(game.progress.round.index, index);
      assert.equal(game.progress.round.solved, false);
      assert.equal(JSON.stringify(game.question), question);
      assert.equal(game.answer(game.question.answer), 'correct');
      game = new Adventure(game.serialize());
      assert.equal(JSON.stringify(game.question), question);
      assert.equal(game.progress.round.solved, true);
      assert.equal(game.answer(game.question.answer), 'ignored');
      assert.equal(game.progress.completed, stage);
      assert.equal(game.next(), index === 4 ? 'complete' : 'question');
    }
    assert.equal(game.progress.completed, stage + 1);
    assert.equal(game.progress.round, null);
  }
  assert.equal(game.start(12, 42), false);
  for (let stage = 0; stage < 12; stage++) {
    assert.equal(game.start(stage, 42), true);
    for (let index = 0; index < 5; index++) {
      game.answer(game.question.answer);
      game.next();
    }
    assert.equal(game.progress.completed, 12);
    assert.equal(new Adventure(game.serialize()).progress.completed, 12);
  }
});
