import { BOOKS, LANDMARKS, WORDS, WORD_BY_ID } from './data.js';

export const ROUND_SIZE = 6;

export function freshState() {
  return {
    version: 1,
    ranges: { theme: 5, phonics: 5 },
    parentReading: false,
    missed: [],
    stickers: [],
    completed: [],
    totalRounds: 0,
  };
}

function isBook(book) {
  return Object.hasOwn(BOOKS, book);
}

function unitLimit(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 5;
}

export function parseState(raw) {
  const fallback = freshState();
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!value || typeof value !== 'object' || value.version !== 1) return fallback;
    const uniqueStrings = (items, valid) =>
      Array.isArray(items)
        ? [...new Set(items.filter((item) => typeof item === 'string' && valid(item)))]
        : [];
    return {
      version: 1,
      ranges: { theme: unitLimit(value.ranges?.theme), phonics: unitLimit(value.ranges?.phonics) },
      parentReading: value.parentReading === true,
      missed: uniqueStrings(value.missed, (id) => WORD_BY_ID.has(id)),
      stickers: uniqueStrings(value.stickers, (id) => /^(theme|phonics)-[1-5]$/.test(id)),
      completed: uniqueStrings(value.completed, (id) => id.length > 0 && id.length <= 100).slice(
        -100,
      ),
      totalRounds:
        Number.isSafeInteger(value.totalRounds) && value.totalRounds >= 0 ? value.totalRounds : 0,
    };
  } catch {
    return fallback;
  }
}

export function setRange(state, book, maxUnit) {
  if (!isBook(book) || !Number.isInteger(maxUnit) || maxUnit < 1 || maxUnit > 5) return state;
  return { ...state, ranges: { ...state.ranges, [book]: maxUnit } };
}

export function availableWords(state, book, unit = 1, review = false) {
  if (!isBook(book) || !Number.isInteger(unit) || unit < 1 || unit > state.ranges[book]) return [];
  return WORDS[book].filter(
    (word) => word.unit === unit && (!review || state.missed.includes(word.id)),
  );
}

function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const sample = random();
    const j = Math.min(
      i,
      Math.max(0, Math.floor((Number.isFinite(sample) ? sample : 0) * (i + 1))),
    );
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function makeQuestion(word, random = Math.random) {
  const candidates =
    word.book === 'theme'
      ? shuffled(
          WORDS.theme.filter((other) => other.unit === word.unit && other.id !== word.id),
          random,
        ).slice(0, 2)
      : [];
  return {
    target: word,
    options:
      word.book === 'theme'
        ? shuffled([word, ...candidates], random).map((option) => ({
            value: option.id,
            picture: option.picture,
            label: option.label,
          }))
        : shuffled(word.letters, random).map((letter) => ({ value: letter, label: letter })),
    correct: word.book === 'theme' ? word.id : word.onset,
    solved: false,
    attempts: 0,
    wrongOptions: [],
  };
}

export function createRound(
  state,
  {
    book = 'theme',
    unit = 1,
    review = false,
    id = `round-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  } = {},
  random = Math.random,
) {
  const pool = availableWords(state, book, unit, review);
  if (!pool.length) return null;
  const selected = [];
  while (selected.length < ROUND_SIZE)
    selected.push(...shuffled(pool, random).slice(0, ROUND_SIZE - selected.length));
  return {
    id,
    book,
    unit,
    review,
    index: 0,
    questions: selected.map((word) => makeQuestion(word, random)),
    finished: false,
  };
}

export function answerQuestion(state, round, choice) {
  if (!round || round.finished) return { state, round, result: 'ignored' };
  const question = round.questions[round.index];
  if (
    question.solved ||
    !question.options.some((option) => option.value === choice) ||
    question.wrongOptions.includes(choice)
  ) {
    return { state, round, result: 'ignored' };
  }
  const correct = choice === question.correct;
  const updated = {
    ...question,
    solved: correct,
    attempts: question.attempts + 1,
    wrongOptions: correct ? question.wrongOptions : [...question.wrongOptions, choice],
  };
  const questions = round.questions.map((item, index) => (index === round.index ? updated : item));
  let missed = state.missed;
  if (!correct && !missed.includes(question.target.id)) missed = [...missed, question.target.id];
  if (correct && round.review && question.attempts === 0)
    missed = missed.filter((id) => id !== question.target.id);
  return {
    state: { ...state, missed },
    round: { ...round, questions },
    result: correct ? 'correct' : 'retry',
  };
}

export function advanceRound(round) {
  if (!round || round.finished || !round.questions[round.index].solved) return round;
  if (round.index === round.questions.length - 1) return { ...round, finished: true };
  return { ...round, index: round.index + 1 };
}

export function completeRound(state, round) {
  if (
    !round?.finished ||
    !round.questions.every((question) => question.solved) ||
    state.completed.includes(round.id)
  ) {
    return { state, sticker: null, awarded: false };
  }
  const eligible = [...new Set(round.questions.map((question) => question.target.unit))];
  const unit =
    eligible.find((candidate) => !state.stickers.includes(`${round.book}-${candidate}`)) ??
    eligible[0];
  const sticker = {
    id: `${round.book}-${unit}`,
    icon: LANDMARKS[unit - 1].sticker,
    unit,
    isNew: !state.stickers.includes(`${round.book}-${unit}`),
  };
  return {
    state: {
      ...state,
      stickers: [...new Set([...state.stickers, sticker.id])],
      completed: [...state.completed, round.id].slice(-100),
      totalRounds: state.totalRounds + 1,
    },
    sticker,
    awarded: true,
  };
}
