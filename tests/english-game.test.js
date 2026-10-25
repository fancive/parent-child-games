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
    assert.deepEqual(
      availableWords(state, 'theme'),
      WORDS.theme.filter((word) => word.unit === 1),
    );
    assert.deepEqual(availableWords(state, 'theme', 3), []);
    assert.deepEqual(availableWords(state, 'theme', -1), []);
    assert.deepEqual(availableWords(state, 'unknown'), []);
    for (const invalid of [0, 6, 1.5, '2', NaN])
      assert.equal(setRange(state, 'theme', invalid), state);
    assert.equal(setRange(state, 'unknown', 2), state);
  });

  test('默认只练第一单元，全部开放与缩小范围都不会混合单元', () => {
    for (const book of ['theme', 'phonics']) {
      for (let limit = 1; limit <= 5; limit++) {
        const state = setRange(freshState(), book, limit);
        assert.deepEqual(
          availableWords(state, book),
          WORDS[book].filter((word) => word.unit === 1),
        );
        const round = createRound(state, { book }, seededRandom(limit));
        assert.equal(round.book, book);
        assert.equal(round.unit, 1);
        assert.equal(round.questions.length, WORDS[book].filter((word) => word.unit === 1).length);
        assert.ok(
          round.questions.every(
            (question) => question.target.book === book && question.target.unit === 1,
          ),
        );
      }
    }
    const round = createRound(freshState());
    assert.equal(round.book, 'theme');
    assert.equal(round.unit, 1);
    assert.ok(round.questions.every((question) => question.target.unit === 1));
  });

  test('非法单元不会回退为混合复习，普通轮和错题轮都拒绝', () => {
    const state = { ...freshState(), missed: ['theme-1-hen', 'phonics-1-cat'] };
    for (const book of ['theme', 'phonics']) {
      for (const unit of [0, -1, 1.5, 6, '1', null, false, NaN, Infinity]) {
        for (const review of [false, true]) {
          assert.deepEqual(availableWords(state, book, unit, review), []);
          assert.equal(createRound(state, { book, unit, review }), null);
        }
      }
    }
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
        assert.equal(word.letters.length, 3);
        assert.equal(new Set(word.letters).size, 3);
        assert.equal(word.letters.filter((letter) => letter === word.onset).length, 1);
      }
    });
    for (const unit of UNITS.theme)
      assert.equal(new Set(unit.words.map((word) => word.picture)).size, unit.words.length);
    assert.ok(WORDS.theme.length >= 65);
    assert.ok(WORDS.phonics.length >= 75);
    assert.equal(WORD_BY_ID.size, WORDS.theme.length + WORDS.phonics.length);
  });

  test('补齐第三册较早单元和后续单元的词汇，新增词能进入各自单元题库', () => {
    const additions = {
      theme: [
        ['morning', 'night', 'moon'],
        ['mopping', 'sweeping', 'scrubbing', 'sofa'],
        ['sweets', 'apple', 'milk'],
        ['hose', 'baton', 'hairdryer'],
        ['swim', 'walk', 'jog', 'nap'],
      ],
      phonics: [
        ['pad', 'rag', 'cap', 'lab', 'mat'],
        ['ram', 'can', 'pack', 'red', 'peg'],
        ['pen', 'jet', 'well', 'fix', 'kick'],
        ['dig', 'fig', 'bin', 'tin', 'mill', 'fog'],
        ['cod', 'pod', 'dock', 'lock', 'rock', 'top', 'hot'],
      ],
    };
    for (const [book, units] of Object.entries(additions)) {
      units.forEach((words, index) => {
        const pool = availableWords(freshState(), book, index + 1);
        for (const word of words)
          assert.ok(
            pool.some((entry) => entry.word === word),
            `${book} ${index + 1}: ${word}`,
          );
      });
    }
    for (const word of WORDS.theme) {
      assert.ok(word.sentence.length > 0, word.id);
      assert.match(word.sentence, /[.!?]$/);
    }
    assert.equal(WORD_BY_ID.get('theme-2-mopping').sentence, 'I am mopping the floor.');
    assert.equal(WORD_BY_ID.get('theme-4-hose').sentence, 'The fireman uses a hose.');
    assert.equal(WORD_BY_ID.get('theme-5-swim').sentence, 'I like to swim.');
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

  test('图片字段不包含可打印的Unicode转义残留', () => {
    for (const word of WORD_BY_ID.values())
      assert.doesNotMatch(word.picture, /\\[uU][0-9a-fA-F]{4}|U[0-9a-fA-F]{8}/, word.id);
    assert.equal(WORD_BY_ID.get('phonics-5-pod').picture, '🫛');
    assert.equal(WORD_BY_ID.get('phonics-5-job').picture, '🧑‍💼');
  });

  test('每轮完整覆盖所选单元，每词一次，且不越过指定单元与范围', () => {
    for (const book of ['theme', 'phonics']) {
      for (let limit = 1; limit <= 5; limit++) {
        const state = setRange(freshState(), book, limit);
        for (let unit = 1; unit <= limit; unit++) {
          const expected = WORDS[book].filter((word) => word.unit === unit).map((word) => word.id);
          for (let seed = 1; seed <= 25; seed++) {
            const round = createRound(state, { book, unit }, seededRandom(seed));
            const actual = round.questions.map((question) => question.target.id);
            assert.equal(round.book, book);
            assert.equal(round.unit, unit);
            assert.equal(actual.length, expected.length, `${book} unit ${unit}, seed ${seed}`);
            assert.equal(new Set(actual).size, expected.length);
            assert.deepEqual([...actual].sort(), [...expected].sort());
          }
        }
        assert.equal(createRound(state, { book, unit: limit + 1 }), null);
      }
    }
  });

  test('错题轮完整覆盖本单元全部错词，单词数少于或多于六个都不重复补题', () => {
    for (const book of ['theme', 'phonics']) {
      for (const unit of [1, 3, 5]) {
        const pool = WORDS[book].filter((word) => word.unit === unit);
        const otherUnit = WORDS[book].find((word) => word.unit !== unit).id;
        for (const count of [1, 2, 8]) {
          const expected = pool.slice(0, count).map((word) => word.id);
          const missed = [...expected, otherUnit];
          const state = { ...freshState(), missed };
          for (const seed of [1, 7, 25]) {
            const round = createRound(state, { book, unit, review: true }, seededRandom(seed));
            const actual = round.questions.map((question) => question.target.id);
            assert.equal(actual.length, count);
            assert.equal(new Set(actual).size, count);
            assert.deepEqual([...actual].sort(), [...expected].sort());
            assert.deepEqual(state.missed, missed);
          }
        }
      }
    }
  });

  test('全量轮可以打乱顺序，且不会改动原始词库的顺序', () => {
    for (const book of ['theme', 'phonics']) {
      const original = WORDS[book].map((word) => word.id);
      const first = createRound(freshState(), { book, unit: 1 }, seededRandom(1));
      const second = createRound(freshState(), { book, unit: 1 }, seededRandom(2));
      assert.notDeepEqual(
        first.questions.map((question) => question.target.id),
        second.questions.map((question) => question.target.id),
      );
      assert.deepEqual(
        WORDS[book].map((word) => word.id),
        original,
      );
    }
  });
});

describe('答题、错题与奖励', () => {
  test('完整单元或单词错题轮仅在最后一题答对并前进后奖励', () => {
    const initial = freshState();
    for (const [state, options] of [
      [initial, { book: 'theme', unit: 1, id: 'full-unit-reward' }],
      [
        { ...initial, missed: ['theme-1-hen'] },
        { book: 'theme', unit: 1, review: true, id: 'single-word-reward' },
      ],
    ]) {
      let current = state;
      let round = createRound(current, options, seededRandom(3));
      for (let index = 0; index < round.questions.length; index++) {
        assert.equal(round.finished, false);
        assert.equal(completeRound(current, round).awarded, false);
        ({ state: current, round } = answerQuestion(
          current,
          round,
          round.questions[index].correct,
        ));
        assert.equal(completeRound(current, round).awarded, false);
        round = advanceRound(round);
        assert.equal(round.finished, index === round.questions.length - 1);
      }
      const reward = completeRound(current, round);
      assert.equal(reward.awarded, true);
      assert.equal(reward.state.totalRounds, 1);
      assert.equal(completeRound(reward.state, round).awarded, false);
    }
  });

  test('错误可重试，重复点同一错误不增加次数；模型仅允许答对后推进', () => {
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

  test('完整单元后只奖励一次，重载保存仍防止同一轮重复发奖', () => {
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

  test('错题只按当前书和单元重练，范围变化与重练保留其他单元错题', () => {
    let state = freshState();
    const missed = [
      'theme-1-hen',
      'theme-2-kitchen',
      'theme-5-sunny',
      'phonics-1-cat',
      'phonics-4-pig',
    ];
    state.missed = missed;
    state = setRange(state, 'theme', 2);
    assert.deepEqual(
      availableWords(state, 'theme', undefined, true).map((word) => word.id),
      ['theme-1-hen'],
    );
    assert.deepEqual(
      availableWords(state, 'theme', 2, true).map((word) => word.id),
      ['theme-2-kitchen'],
    );
    assert.deepEqual(
      availableWords(state, 'phonics', 4, true).map((word) => word.id),
      ['phonics-4-pig'],
    );
    assert.equal(createRound(state, { book: 'theme', unit: 5, review: true }), null);
    const round = createRound(state, { book: 'theme', review: true });
    assert.ok(round.questions.every((question) => question.target.id === 'theme-1-hen'));
    assert.deepEqual(state.missed, missed);
    const solved = solveRound(state, round);
    assert.deepEqual(
      solved.state.missed,
      missed.filter((id) => id !== 'theme-1-hen'),
    );
    assert.deepEqual(state.missed, missed);
    state = solved.state;
    state = setRange(state, 'theme', 1);
    assert.equal(createRound(state, { book: 'theme', review: true }), null);
    assert.deepEqual(availableWords(state, 'theme', 2, true), []);
    assert.ok(state.missed.includes('theme-2-kitchen'));
    assert.ok(state.missed.includes('theme-5-sunny'));
    state = setRange(state, 'theme', 5);
    assert.deepEqual(
      availableWords(state, 'theme', 5, true).map((word) => word.id),
      ['theme-5-sunny'],
    );
    assert.equal(availableWords(state, 'theme', undefined, true).length, 0);
    const second = createRound(state, { book: 'theme', unit: 2, review: true });
    assert.ok(second.questions.every((question) => question.target.id === 'theme-2-kitchen'));
    const reviewed = solveRound(state, second);
    assert.deepEqual(reviewed.state.missed, ['theme-5-sunny', 'phonics-1-cat', 'phonics-4-pig']);
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
  test('扩词后原有72个词的ID和所有单元存档仍然有效', () => {
    const legacy = {
      theme: [
        ['hen', 'squirrel', 'rabbit', 'bat', 'owl', 'firefly'],
        ['living-room', 'dining-room', 'kitchen', 'bedroom', 'bathroom', 'garage', 'storeroom'],
        [
          'carrot',
          'cabbage',
          'bread',
          'rice',
          'noodles',
          'ice-cream',
          'peas',
          'fish',
          'chicken',
          'beef',
          'jello',
        ],
        ['chef', 'pilot', 'astronaut', 'fireman', 'hairdresser', 'policeman', 'postman', 'waiter'],
        ['sunny', 'cloudy', 'windy', 'rainy'],
      ],
      phonics: [
        ['dad', 'bag', 'map', 'cab', 'cat', 'hat'],
        ['jam', 'ham', 'van', 'fan', 'sack', 'bed', 'leg'],
        ['hen', 'ten', 'net', 'wet', 'bell', 'sit', 'six', 'lick'],
        ['pig', 'wig', 'pin', 'fin', 'hill', 'dog', 'log'],
        ['cob', 'rod', 'mop', 'hop', 'pot', 'fox', 'box', 'sock'],
      ],
    };
    const missed = Object.entries(legacy).flatMap(([book, units]) =>
      units.flatMap((words, index) => words.map((word) => `${book}-${index + 1}-${word}`)),
    );
    assert.equal(missed.length, 72);
    const stickers = ['theme-1', 'theme-5', 'phonics-1', 'phonics-5'];
    const saved = { ...freshState(), missed, stickers, totalRounds: 12 };
    assert.deepEqual(parseState(JSON.stringify(saved)), saved);
  });

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
