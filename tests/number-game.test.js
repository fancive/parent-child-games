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
    for (let stage = 0; stage < 3; stage++) {
      const batch = questions(stage, seed);
      assert.equal(batch.length, 5);
      for (const q of batch) {
        assert.equal(q.answer, stage === 0 ? q.a : stage === 1 ? q.a + q.b : q.a - q.b);
        assert.ok(q.a >= 1 && q.a <= 10);
        assert.ok(q.answer >= 0 && q.answer <= 10);
        if (stage === 1) assert.ok(q.a > 0 && q.b > 0);
        if (stage === 2) assert.ok(q.b > 0 && q.b <= q.a);
        assert.equal(q.options.length, 3);
        assert.equal(new Set(q.options).size, 3);
        assert.ok(q.options.includes(q.answer));
        assert.ok(q.options.every((x) => Number.isInteger(x) && x >= 0 && x <= 10));
      }
      if (stage < 2) {
        for (let i = 1; i < batch.length; i++) {
          assert.ok(batch[i].answer > batch[i - 1].answer, 'quantity grows across the round');
        }
      }
      if (stage === 2) assert.equal(batch[4].answer, 0, 'every subtraction round teaches zero');
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

test('fifteen problems unlock three stages; replay never removes completed stages', () => {
  const game = new Adventure();
  for (let stage = 0; stage < 3; stage++) {
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
  assert.equal(game.progress.completed, 3);
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
      version: 1,
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
