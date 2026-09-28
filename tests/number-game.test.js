import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const code = readFileSync(new URL('number-game/model.js', root), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(code, sandbox);
const { Adventure, questions, restore } = sandbox.window.NumberAdventure;

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

test('ten problems unlock two stages; replay never removes completed stages', () => {
  const game = new Adventure();
  for (let stage = 0; stage < 2; stage++) {
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
  assert.equal(game.progress.completed, 2);
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
    assert.equal(progress.version, 2);
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

test('map and entry advertise only addition and subtraction', () => {
  assert.deepEqual(
    Array.from(sandbox.window.NumberAdventure.LEVELS, (level) => level.skill),
    ['加一加', '减一减'],
  );
  const html = readFileSync(new URL('number-game/index.html', root), 'utf8');
  const home = readFileSync(new URL('index.html', root), 'utf8');
  assert.doesNotMatch(html, /数一数、|苹果林/);
  assert.doesNotMatch(home, /陪小兔数苹果/);
});
