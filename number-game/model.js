(function () {
  'use strict';
  const LEVELS = [
    {
      name: '胡萝卜田',
      skill: '加一加',
      icon: '🥕',
      item: '胡萝卜',
      intro: '把胡萝卜装在一起',
      reward: '胡萝卜篮',
    },
    {
      name: '野餐地',
      skill: '减一减',
      icon: '🍓',
      item: '草莓',
      intro: '给朋友们分草莓',
      reward: '分享徽章',
    },
  ];
  const LENGTH = 5;
  function randomFrom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }
  function questions(stage, seed) {
    const random = randomFrom(seed);
    const int = (min, max) => min + Math.floor(random() * (max - min + 1));
    return Array.from({ length: LENGTH }, (_, i) => {
      let a;
      let b = 0;
      if (stage === 0) {
        const total = int(2 + i * 2, Math.min(10, 3 + i * 2));
        a = int(1, total - 1);
        b = total - a;
      } else {
        a = int(2 + i, Math.min(10, 5 + i));
        b = i === LENGTH - 1 ? a : int(1, a - 1);
      }
      const answer = stage === 0 ? a + b : a - b;
      const candidates = Array.from({ length: 11 }, (_, n) => n).filter((n) => n !== answer);
      const options = [answer];
      while (options.length < 3)
        options.push(candidates.splice(int(0, candidates.length - 1), 1)[0]);
      for (let j = options.length - 1; j > 0; j--) {
        const k = int(0, j);
        [options[j], options[k]] = [options[k], options[j]];
      }
      return { a, b, answer, options };
    });
  }
  function fresh() {
    return { version: 2, completed: 0, round: null };
  }
  function restore(raw) {
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (
        !data ||
        ![1, 2].includes(data.version) ||
        !Number.isInteger(data.completed) ||
        data.completed < 0 ||
        data.completed > (data.version === 1 ? 3 : LEVELS.length)
      )
        return fresh();
      const legacy = data.version === 1;
      const result = {
        version: 2,
        completed: legacy ? Math.max(0, data.completed - 1) : data.completed,
        round: null,
      };
      const r = data.round;
      if (
        r &&
        Number.isInteger(r.stage) &&
        r.stage >= 0 &&
        r.stage < (legacy ? 3 : LEVELS.length) &&
        (!legacy || r.stage > 0) &&
        r.stage <= data.completed &&
        Number.isInteger(r.index) &&
        r.index >= 0 &&
        r.index < LENGTH &&
        Number.isInteger(r.seed) &&
        r.seed >= 0 &&
        r.seed <= 4294967295 &&
        typeof r.solved === 'boolean'
      ) {
        result.round = {
          stage: legacy ? r.stage - 1 : r.stage,
          index: r.index,
          seed: r.seed,
          solved: r.solved,
        };
      }
      return result;
    } catch {
      return fresh();
    }
  }
  class Adventure {
    constructor(saved) {
      this.progress = restore(saved);
    }
    start(stage, seed = Math.floor(Math.random() * 4294967296)) {
      if (
        !Number.isInteger(stage) ||
        stage < 0 ||
        stage >= LEVELS.length ||
        stage > this.progress.completed
      )
        return false;
      this.progress.round = { stage, index: 0, seed: seed >>> 0, solved: false };
      return true;
    }
    get question() {
      const r = this.progress.round;
      return r ? questions(r.stage, r.seed)[r.index] : null;
    }
    answer(value) {
      const r = this.progress.round;
      if (!r || r.solved) return 'ignored';
      if (value !== this.question.answer) return 'retry';
      r.solved = true;
      return 'correct';
    }
    next() {
      const r = this.progress.round;
      if (!r || !r.solved) return 'ignored';
      if (r.index === LENGTH - 1) {
        this.progress.completed = Math.max(this.progress.completed, r.stage + 1);
        this.progress.round = null;
        return 'complete';
      }
      r.index++;
      r.solved = false;
      return 'question';
    }
    serialize() {
      return JSON.stringify(this.progress);
    }
  }
  window.NumberAdventure = { LEVELS, LENGTH, questions, restore, Adventure };
})();
