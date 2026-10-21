import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { UNITS, WORDS, WORD_BY_ID } from '../english-game/data.js';
import {
  answerQuestion,
  advanceRound,
  availableWords,
  completeRound,
  createRound,
  freshState,
  makeQuestion,
  parseState,
  ROUND_SIZE,
  setRange,
} from '../english-game/model.js';

function seededRandom(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function solveRound(initialState, initialRound) {
  let state = initialState;
  let round = initialRound;
  while (!round.finished) {
    ({ state, round } = answerQuestion(state, round, round.questions[round.index].correct));
    round = advanceRound(round);
  }
  return { state, round };
}

describe('复习范围与教材词族', () => {
  test('两本书默认五单元全部开放，范围独立保存', () => {
    const original = freshState();
    assert.deepEqual(original.ranges, { theme: 5, phonics: 5 });
    const state = setRange(original, 'theme', 2);
    assert.deepEqual(state.ranges, { theme: 2, phonics: 5 });
    assert.deepEqual(original.ranges, { theme: 5, phonics: 5 });
    assert.ok(availableWords(state, 'theme').every((word) => word.unit <= 2));
    assert.deepEqual(availableWords(state, 'theme', 3), []);
    assert.deepEqual(availableWords(state, 'theme', -1), []);
    assert.deepEqual(availableWords(state, 'unknown'), []);
    for (const invalid of [0, 6, 1.5, '2', NaN])
      assert.equal(setRange(state, 'theme', invalid), state);
    assert.equal(setRange(state, 'unknown', 2), state);
  });

  test('拼读每单元覆盖官方列明词族，首音与词尾能拼成真实目标词', () => {
    const families = [
      ['ad', 'ag', 'ap', 'ab', 'at'],
      ['am', 'an', 'ack', 'ed', 'eg'],
      ['en', 'et', 'ell', 'it', 'ix', 'ick'],
      ['ig', 'in', 'ill', 'og'],
      ['ob', 'od', 'op', 'ot', 'ox', 'ock'],
    ];
    UNITS.phonics.forEach((unit, index) => {
      assert.deepEqual(new Set(unit.words.map((word) => word.rime)), new Set(families[index]));
      for (const word of unit.words) {
        assert.equal(word.onset + word.rime, word.word);
        assert.match(word.onset, /^[a-z]$/);
        assert.equal(word.letters.filter((letter) => letter === word.onset).length, 1);
      }
    });
    assert.equal(WORDS.theme.length, 36);
    assert.equal(WORDS.phonics.length, 36);
    assert.equal(WORD_BY_ID.size, 72);
  });

  test('所有书、单元、随机种子的题目恰好三个选项且正确项唯一', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const random = seededRandom(seed);
      for (const word of WORD_BY_ID.values()) {
        const question = makeQuestion(word, random);
        assert.equal(question.options.length, 3);
        assert.equal(new Set(question.options.map((option) => option.value)).size, 3);
        assert.equal(
          question.options.filter((option) => option.value === question.correct).length,
          1,
        );
        if (word.book === 'theme') {
          assert.ok(
            question.options.every((option) => WORD_BY_ID.get(option.value).unit === word.unit),
          );
          assert.equal(new Set(question.options.map((option) => option.picture)).size, 3);
        }
      }
    }
  });

  test('每轮六题；小词库允许复现，但不会越过指定单元与范围', () => {
    for (const book of ['theme', 'phonics']) {
      for (let limit = 1; limit <= 5; limit++) {
        const state = setRange(freshState(), book, limit);
        const mixed = createRound(state, { book }, seededRandom(limit));
        assert.equal(mixed.questions.length, ROUND_SIZE);
        assert.ok(mixed.questions.every((question) => question.target.unit <= limit));
        for (let unit = 1; unit <= limit; unit++) {
          const round = createRound(state, { book, unit }, seededRandom(unit));
          assert.equal(round.questions.length, ROUND_SIZE);
          assert.ok(round.questions.every((question) => question.target.unit === unit));
        }
        assert.equal(createRound(state, { book, unit: limit + 1 }), null);
      }
    }
  });
});

describe('答题、错题与奖励', () => {
  test('错误可重试，重复点同一错误不增加次数；必须答对并显式前进', () => {
    const state = freshState();
    const round = createRound(state, { id: 'retry-round' }, seededRandom(7));
    const question = round.questions[0];
    const wrong = question.options.find((option) => option.value !== question.correct).value;
    assert.equal(advanceRound(round), round);
    const first = answerQuestion(state, round, wrong);
    assert.equal(first.result, 'retry');
    assert.equal(first.round.index, 0);
    assert.equal(first.round.questions[0].attempts, 1);
    assert.deepEqual(first.state.missed, [question.target.id]);
    assert.equal(answerQuestion(first.state, first.round, wrong).result, 'ignored');
    assert.equal(answerQuestion(first.state, first.round, 'not-a-choice').result, 'ignored');
    const correct = answerQuestion(first.state, first.round, question.correct);
    assert.equal(correct.result, 'correct');
    assert.equal(correct.round.questions[0].attempts, 2);
    assert.equal(correct.round.index, 0);
    assert.equal(answerQuestion(correct.state, correct.round, question.correct).result, 'ignored');
    assert.equal(advanceRound(correct.round).index, 1);
    assert.deepEqual(correct.state.missed, [question.target.id]);
    assert.equal(correct.state.totalRounds, 0);
    assert.equal(completeRound(correct.state, correct.round).awarded, false);
  });

  test('完整六题后只奖励一次，重载保存仍防止同一轮重复发奖', () => {
    const state = freshState();
    const round = createRound(state, { book: 'phonics', unit: 4, id: 'one-sticker' });
    const solved = solveRound(state, round);
    const completed = completeRound(solved.state, solved.round);
    assert.equal(completed.awarded, true);
    assert.equal(completed.sticker.id, 'phonics-4');
    assert.equal(completed.state.totalRounds, 1);
    assert.deepEqual(completed.state.stickers, ['phonics-4']);
    const reloaded = parseState(JSON.stringify(completed.state));
    const repeated = completeRound(reloaded, solved.round);
    assert.equal(repeated.awarded, false);
    assert.equal(repeated.state.totalRounds, 1);
    assert.equal(advanceRound(solved.round), solved.round);
    assert.equal(answerQuestion(reloaded, solved.round, 'p').result, 'ignored');
    const unsolved = {
      ...solved.round,
      questions: solved.round.questions.map((question, index) =>
        index ? question : { ...question, solved: false },
      ),
    };
    assert.equal(completeRound(state, unsolved).awarded, false);
  });

  test('不同轮可以继续完成，同一单元贴纸不会重复计数', () => {
    let state = freshState();
    for (let index = 0; index < 3; index++) {
      const round = createRound(state, { book: 'theme', unit: 2, id: `round-${index}` });
      const solved = solveRound(state, round);
      state = completeRound(solved.state, solved.round).state;
    }
    assert.equal(state.totalRounds, 3);
    assert.deepEqual(state.stickers, ['theme-2']);
  });

  test('错题按书、范围和指定单元筛选，缩小范围不删除远处错题', () => {
    let state = freshState();
    state.missed = ['theme-1-hen', 'theme-5-sunny', 'phonics-1-cat', 'phonics-4-pig'];
    state = setRange(state, 'theme', 2);
    assert.deepEqual(
      availableWords(state, 'theme', 0, true).map((word) => word.id),
      ['theme-1-hen'],
    );
    assert.deepEqual(
      availableWords(state, 'phonics', 4, true).map((word) => word.id),
      ['phonics-4-pig'],
    );
    assert.equal(createRound(state, { book: 'theme', unit: 2, review: true }), null);
    const round = createRound(state, { book: 'theme', review: true });
    assert.ok(round.questions.every((question) => question.target.id === 'theme-1-hen'));
    assert.ok(state.missed.includes('theme-5-sunny'));
    state = setRange(state, 'theme', 5);
    assert.equal(availableWords(state, 'theme', 0, true).length, 2);
  });

  test('错题重练一次答对才移除；答错后的本题重试仍留待下轮', () => {
    const state = { ...freshState(), missed: ['phonics-1-cat'] };
    const round = createRound(state, { book: 'phonics', unit: 1, review: true });
    const correct = answerQuestion(state, round, 'c');
    assert.deepEqual(correct.state.missed, []);
    const wrong = answerQuestion(state, round, 'h');
    assert.deepEqual(wrong.state.missed, ['phonics-1-cat']);
    const retried = answerQuestion(wrong.state, wrong.round, 'c');
    assert.deepEqual(retried.state.missed, ['phonics-1-cat']);
    assert.deepEqual(state.missed, ['phonics-1-cat']);
  });
});

describe('保存兼容', () => {
  test('损坏、缺失、旧版本记录回到两本全部开放的安全默认值', () => {
    for (const raw of [null, undefined, '', '{broken', 'null', '42', '[]', '{"version":9}']) {
      assert.deepEqual(parseState(raw), freshState());
    }
  });

  test('保存字段分别校验，保留有效范围、奖励和错题', () => {
    const result = parseState(
      JSON.stringify({
        version: 1,
        ranges: { theme: 3, phonics: 999 },
        parentReading: true,
        missed: ['theme-1-hen', 'theme-1-hen', '__proto__', 42, 'phonics-4-pig'],
        stickers: ['theme-1', 'theme-1', 'phonics-5', 'theme-6', null],
        completed: ['good', 'good', null, '', 'x'.repeat(101)],
        totalRounds: -1,
      }),
    );
    assert.deepEqual(result.ranges, { theme: 3, phonics: 5 });
    assert.deepEqual(result.missed, ['theme-1-hen', 'phonics-4-pig']);
    assert.deepEqual(result.stickers, ['theme-1', 'phonics-5']);
    assert.deepEqual(result.completed, ['good']);
    assert.equal(result.totalRounds, 0);
    assert.equal(result.parentReading, true);
    assert.deepEqual(parseState(JSON.stringify(result)), result);
  });
});
