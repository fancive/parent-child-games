(function () {
  'use strict';
  const { Adventure, LEVELS, LENGTH } = window.NumberAdventure;
  const $ = (id) => document.getElementById(id);
  // Keep the existing key so version 1 saves can migrate without losing arithmetic progress.
  const SAVE_KEY = 'pcg-number-adventure-v1';
  let saved = null;
  let storageAvailable = true;
  try {
    saved = localStorage.getItem(SAVE_KEY);
  } catch {
    storageAvailable = false;
  }
  const game = new Adventure(saved);
  let voice = false;
  let lastStage = 0;
  let counted = 0;
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  function persist() {
    try {
      localStorage.setItem(SAVE_KEY, game.serialize());
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
    $('storage-note').textContent = storageAvailable
      ? ''
      : '这次可以继续玩，但浏览器无法保存进度。请先不要关闭页面。';
  }
  function speak(text, force = false) {
    if (!canSpeak || (!voice && !force)) return;
    try {
      window.speechSynthesis.cancel();
      const message = new window.SpeechSynthesisUtterance(text);
      message.lang = 'zh-CN';
      message.rate = 0.85;
      window.speechSynthesis.speak(message);
    } catch {
      /* Visual instructions remain available. */
    }
  }
  function screen(name, title) {
    if (canSpeak) window.speechSynthesis.cancel();
    ['map', 'play', 'celebrate'].forEach((id) => {
      $(id).hidden = id !== name;
    });
    if (title) $(title).focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function renderMap(focus = true) {
    $('map-description').textContent =
      `从 10 以内到 ${LEVELS.at(-1).max} 以内，再挑战进位、退位和填空，走过 ${LEVELS.length} 站，集齐野餐徽章。`;
    $('stages').replaceChildren();
    LEVELS.forEach((level, index) => {
      if (index % 2 === 0) {
        const group = document.createElement('section');
        group.className = 'stage-group';
        const heading = document.createElement('h2');
        heading.id = `tier-${index / 2}`;
        heading.innerHTML = `<span>第 ${index + 1}–${Math.min(index + 2, LEVELS.length)} 关</span>${level.max} 以内`;
        group.setAttribute('aria-labelledby', heading.id);
        const pair = document.createElement('div');
        pair.className = 'stage-pair';
        group.append(heading, pair);
        $('stages').appendChild(group);
      }
      const complete = index < game.progress.completed;
      const locked = index > game.progress.completed;
      const button = document.createElement('button');
      button.className = 'stage';
      button.dataset.stage = index;
      button.disabled = locked;
      const label = locked ? '先完成上一站' : complete ? '✓ 已完成 · 再玩一次' : '出发';
      button.innerHTML = `<span class="stage-icon" aria-hidden="true">${level.icon}</span><span class="stage-number">第 ${index + 1} 关 · ${level.max} 以内</span><strong>${level.name}</strong><small>${level.skill}</small><span class="stage-state">${label}</span>`;
      button.setAttribute(
        'aria-label',
        `第 ${index + 1} 关，${level.max} 以内，${level.name}，${level.skill}，${label}`,
      );
      button.addEventListener('click', () => {
        if (game.progress.round?.stage !== index) game.start(index);
        else if (complete) game.start(index);
        persist();
        renderQuestion();
      });
      $('stages').lastElementChild.querySelector('.stage-pair').appendChild(button);
    });
    const r = game.progress.round;
    $('resume').hidden = !r;
    if (r) $('resume').textContent = `继续${LEVELS[r.stage].name} · 第 ${r.index + 1} 题`;
    const collected = LEVELS.slice(0, game.progress.completed)
      .map((level) => level.icon)
      .join(' ');
    $('collection').textContent =
      game.progress.completed === LEVELS.length
        ? `${collected} ${LEVELS.length} 枚徽章集齐啦！也可以再去玩一遍。`
        : `🧺 野餐徽章 ${game.progress.completed} / ${LEVELS.length}${collected ? ` · ${collected}` : ''}`;
    screen('map', focus ? 'map-title' : null);
  }
  function makePile(amount, title, options) {
    const {
      icon,
      given = false,
      tenFrames = false,
      independent = false,
      grouped = false,
      item,
      unit,
    } = options;
    let pileCount = 0;
    const pile = document.createElement('div');
    pile.className = given ? 'pile given' : 'pile';
    const label = document.createElement('p');
    label.className = 'pile-label';
    label.textContent = title;
    const tokens = document.createElement('div');
    tokens.className = grouped ? 'place-value' : tenFrames ? 'ten-groups' : 'tokens';
    pile.append(label, tokens);
    if (amount === 0) {
      const zero = document.createElement('p');
      zero.className = 'zero';
      zero.textContent =
        independent || given ? `这里没有${item}，就是 0。` : '全都送走啦！一个也没有，就是 0。';
      tokens.appendChild(zero);
    }
    function makeToken(value, index) {
      const token = document.createElement(given ? 'span' : 'button');
      token.className = `token${grouped ? (value === 10 ? ' ten-token' : ' one-token') : ''}`;
      token.textContent = value === 10 ? '10' : icon;
      const tokenLabel =
        value === 10
          ? `一组10块${item}，${title}，第 ${index + 1} 组`
          : `${title}，第 ${index + 1} ${unit}${item}`;
      token.setAttribute(
        'aria-label',
        given ? `${tokenLabel}，已送走` : `${tokenLabel}，点一点数数`,
      );
      if (!given) {
        token.setAttribute('aria-pressed', 'false');
        token.addEventListener('click', () => {
          if (token.classList.contains('counted')) return;
          if (independent) pileCount += value;
          else counted += value;
          token.classList.add('counted');
          token.setAttribute('aria-pressed', 'true');
          const badge = document.createElement('span');
          badge.className = 'count-badge';
          badge.textContent = independent ? pileCount : counted;
          token.appendChild(badge);
          $('count-help').textContent = independent
            ? `${title}，数到 ${pileCount} ${unit}啦！每个托盘分开数。`
            : grouped
              ? `数到 ${counted} 块啦！十位一组数 10，个位一块数 1。`
              : `数到 ${counted} 啦！每个物品只数一次。`;
          speak(String(independent ? pileCount : counted));
        });
      }
      return token;
    }
    if (grouped) {
      const tens = Math.floor(amount / 10);
      const ones = amount % 10;
      [
        [tens, 10, '十位 · 每组 10 块', 'block-tens'],
        [ones, 1, '个位 · 每块 1', 'block-ones'],
      ].forEach(([quantity, value, caption, className]) => {
        if (!quantity) return;
        const section = document.createElement('div');
        section.className = `value-section ${className}`;
        const heading = document.createElement('p');
        heading.className = 'value-label';
        heading.textContent = caption;
        const group = document.createElement('div');
        group.className = 'value-tokens';
        for (let i = 0; i < quantity; i++) group.appendChild(makeToken(value, i));
        section.append(heading, group);
        tokens.appendChild(section);
      });
    } else {
      let tokenGroup = tokens;
      for (let i = 0; i < amount; i++) {
        if (tenFrames && i % 10 === 0) {
          tokenGroup = document.createElement('div');
          tokenGroup.className = 'ten-group';
          tokenGroup.setAttribute('aria-label', `每框最多 10 ${unit}${item}`);
          tokens.appendChild(tokenGroup);
        }
        tokenGroup.appendChild(makeToken(1, i));
      }
    }
    return pile;
  }
  function missingEquation(q, solved = false, spoken = false) {
    const blank = spoken ? '方框' : '□';
    const a = q.unknown === 'a' && !solved ? blank : q.a;
    const b = q.unknown === 'b' && !solved ? blank : q.b;
    const operation = spoken ? (q.operation === '+' ? '加' : '减') : q.operation;
    return `${a} ${operation} ${b} ${spoken ? '等于' : '='} ${q.result}`;
  }
  function questionSpeech() {
    return game.question.unknown
      ? `${missingEquation(game.question, false, true)}。请找出方框里的数字。`
      : `${$('story').textContent}${game.question.a} ${game.question.operation === '+' || LEVELS[game.progress.round.stage].kind === 'addition' ? '加' : '减'} ${game.question.b} 等于几？${$('question-title').textContent}`;
  }
  function hiddenPile(title) {
    const pile = document.createElement('div');
    pile.className = 'pile mystery-pile';
    const label = document.createElement('p');
    label.className = 'pile-label';
    label.textContent = title;
    const number = document.createElement('div');
    number.id = 'hidden-number';
    number.className = 'hidden-number';
    number.textContent = '?';
    number.setAttribute('aria-label', '藏起来的数量，填入方框');
    pile.append(label, number);
    return pile;
  }
  function renderMissingObjects(q, level) {
    const knownPile = (amount, title) =>
      makePile(amount, `${title} · ${amount} 块`, {
        icon: '🟨',
        tenFrames: level.max === 20,
        grouped: level.max > 20,
        independent: true,
        item: '积木',
        unit: '块',
      });
    const diagram = document.createElement('div');
    diagram.className = 'part-whole';
    const whole = document.createElement('div');
    whole.className = 'whole';
    const parts = document.createElement('div');
    parts.className = 'parts';
    const join = document.createElement('span');
    join.className = 'part-join';
    join.textContent = '+';
    join.setAttribute('aria-hidden', 'true');
    if (q.operation === '+') {
      whole.appendChild(knownPile(q.result, '合起来一共'));
      const first =
        q.unknown === 'a' ? hiddenPile('藏起来的一部分') : knownPile(q.a, '已知的一部分');
      const second =
        q.unknown === 'b' ? hiddenPile('藏起来的一部分') : knownPile(q.b, '已知的一部分');
      parts.append(first, join, second);
    } else {
      whole.appendChild(
        q.unknown === 'a' ? hiddenPile('原来一共有几块？') : knownPile(q.a, '原来一共'),
      );
      parts.append(
        q.unknown === 'b' ? hiddenPile('拿走了几块？') : knownPile(q.b, '拿走的'),
        join,
        knownPile(q.result, '剩下的'),
      );
    }
    const relation = document.createElement('p');
    relation.className = 'part-relation';
    relation.textContent = '一共的数量 = 两部分合起来';
    diagram.append(whole, relation, parts);
    $('objects').appendChild(diagram);
  }
  function renderQuestion() {
    const r = game.progress.round;
    if (!r) {
      renderMap();
      return;
    }
    counted = 0;
    const q = game.question;
    const level = LEVELS[r.stage];
    $('stage-name').textContent =
      `${level.icon} 第 ${r.stage + 1} 关 · ${level.name} · ${level.max} 以内`;
    $('progress-label').textContent = `${r.index + 1} / ${LENGTH}`;
    $('steps').innerHTML = Array.from(
      { length: LENGTH },
      (_, i) =>
        `<span class="step ${i < r.index ? 'done' : i === r.index ? 'current' : ''}" aria-hidden="true"></span>`,
    ).join('');
    $('steps').setAttribute('aria-label', `第 ${r.index + 1} 题，共 ${LENGTH} 题`);
    const missing = level.kind === 'missing';
    const advanced = level.max > 10;
    const grouped = level.max > 20;
    const addition = level.kind === 'addition' || q.operation === '+';
    const unit = grouped ? '块' : advanced ? '颗' : addition ? '根' : '颗';
    const item = level.item;
    const pileOptions = {
      icon: grouped ? '🟨' : level.icon,
      tenFrames: advanced && !grouped,
      grouped,
      item,
      unit,
    };
    $('story').textContent = missing
      ? '一个数字藏起来了，算式两边要一样多。'
      : addition
        ? grouped
          ? `有 ${q.a} 块积木，又放入 ${q.b} 块。`
          : `${advanced ? '亮了' : '摘了'} ${q.a} ${unit}${item}，又${advanced ? '亮了' : '摘了'} ${q.b} ${unit}。`
        : `有 ${q.a} ${unit}${item}，送给朋友 ${q.b} ${unit}。`;
    $('question-title').textContent = missing
      ? '方框里应该填几？'
      : addition
        ? `一共有几${unit}${item}？`
        : `还剩下几${unit}${item}？`;
    $('equation').textContent = missing
      ? missingEquation(q)
      : `${q.a} ${addition ? '+' : '−'} ${q.b} = ?`;
    $('equation').setAttribute(
      'aria-label',
      missing ? missingEquation(q, false, true) : `${q.a} ${addition ? '加' : '减'} ${q.b} 等于几`,
    );
    $('objects').replaceChildren();
    $('objects').classList.toggle('advanced', advanced);
    $('objects').classList.toggle('missing', missing);
    $('objects').classList.toggle('grouped', grouped);
    if (missing) {
      renderMissingObjects(q, level);
    } else if (addition) {
      const plus = document.createElement('span');
      plus.className = 'operator';
      plus.textContent = '+';
      plus.setAttribute('aria-hidden', 'true');
      $('objects').append(
        makePile(q.a, grouped ? '原来有的' : advanced ? '先亮起的' : '先摘的', pileOptions),
        plus,
        makePile(q.b, grouped ? '又放入的' : advanced ? '又亮起的' : '又摘的', pileOptions),
      );
    } else {
      $('objects').append(
        makePile(q.b, '送给朋友的', { ...pileOptions, given: true }),
        makePile(q.answer, '留下的', pileOptions),
      );
    }
    $('count-help').textContent = missing
      ? grouped
        ? '十位每组 10 块，个位每块 1。每个托盘分开数，问号表示藏起来的数量。'
        : '点一点已知的积木，每组分开数。问号只表示藏起来的一部分。'
      : grouped
        ? addition
          ? '十位每组 10 块，个位每块 1。点一点，把两个托盘合起来数。'
          : q.answer === 0
            ? '全都送走了，就是 0。'
            : '十位每组 10 块，个位每块 1。只点留下的积木，送走的不用数。'
        : advanced
          ? addition
            ? '每框最多 10 颗。先找出一组十，再加上剩下的。'
            : q.answer === 0
              ? '全都送走了，就是 0。'
              : '每框最多 10 颗，只看留下的星星。'
          : !addition
            ? q.answer === 0
              ? '一个也没留下，就是 0。'
              : '点一点留下的草莓，送走的不用数。'
            : '点一点物品，一起数数。';
    $('feedback').textContent = '';
    $('next').hidden = true;
    $('next').textContent = r.index === LENGTH - 1 ? '领取野餐徽章' : '下一题';
    $('answers').replaceChildren();
    q.options.forEach((value) => {
      const button = document.createElement('button');
      button.className = 'answer';
      button.textContent = value;
      button.setAttribute('aria-label', `答案 ${value}`);
      button.addEventListener('click', () => {
        const outcome = game.answer(value);
        if (outcome === 'ignored') return;
        if (outcome === 'retry') {
          button.classList.add('retry');
          $('feedback').textContent = missing
            ? '再试试，把选的数放进方框，两边一样多吗？'
            : '再数一数就好啦，点一点物品来帮忙。';
          speak($('feedback').textContent);
        } else {
          persist();
          showCorrect();
        }
      });
      $('answers').appendChild(button);
    });
    screen('play', 'question-title');
    if (r.solved) showCorrect(false);
    else speak(questionSpeech());
  }
  function showCorrect(announce = true) {
    const q = game.question;
    for (const button of $('answers').children) {
      button.disabled = true;
      button.classList.remove('retry');
      if (Number(button.textContent) === q.answer) button.classList.add('correct');
    }
    if (q.unknown) {
      $('equation').textContent = missingEquation(q, true);
      $('equation').setAttribute('aria-label', missingEquation(q, true, true));
      $('hidden-number').textContent = q.answer;
      $('hidden-number').classList.add('revealed');
      $('hidden-number').setAttribute('aria-label', `藏起来的是 ${q.answer} 块积木`);
      $('feedback').textContent =
        q.operation === '+'
          ? `✓ ${q.a} 和 ${q.b} 合起来是 ${q.result}，方框里填 ${q.answer}！`
          : `✓ 原来有 ${q.a} 块，拿走 ${q.b} 块，还剩 ${q.result} 块，方框里填 ${q.answer}！`;
      $('count-help').textContent = '把找到的数字放回算式，两边一样多啦！';
    } else {
      const addition = LEVELS[game.progress.round.stage].kind === 'addition' || q.operation === '+';
      $('equation').textContent = `${q.a} ${addition ? '+' : '−'} ${q.b} = ${q.answer}`;
      $('equation').setAttribute(
        'aria-label',
        `${q.a} ${addition ? '加' : '减'} ${q.b} 等于 ${q.answer}`,
      );
      $('feedback').textContent =
        `✓ ${q.a} ${addition ? '加' : '减'} ${q.b} 等于 ${q.answer}，答对啦！小兔和你击个掌。`;
    }
    $('next').hidden = false;
    if (announce) {
      speak($('feedback').textContent);
      $('next').focus({ preventScroll: true });
    }
  }
  function renderReward() {
    const all = game.progress.completed === LEVELS.length;
    $('reward-subtitle').textContent = `${LEVELS[lastStage].name} · ${LENGTH} 题完成`;
    $('reward-title').textContent = all
      ? '开饭啦，数字小探险家！'
      : `收好你的${LEVELS[lastStage].reward}！`;
    $('reward-description').textContent = all
      ? `从 10 以内到 ${LEVELS.at(-1).max} 以内，你找齐了 ${LEVELS.length} 枚徽章。谢谢你陪小兔走到${LEVELS.at(-1).name}！`
      : '这一站完成啦！带着新本领，去看看下一站吧。';
    $('badges').innerHTML = LEVELS.slice(0, game.progress.completed)
      .map(
        (level) =>
          `<div class="badge"><span aria-hidden="true">${level.icon}</span>${level.reward}</div>`,
      )
      .join('');
    $('continue').textContent = all ? '再去冒险' : `去${LEVELS[game.progress.completed].name}`;
    screen('celebrate', 'reward-title');
    speak($('reward-title').textContent);
  }
  $('next').addEventListener('click', () => {
    if (!game.progress.round) return;
    lastStage = game.progress.round.stage;
    const outcome = game.next();
    persist();
    if (outcome === 'complete') renderReward();
    else if (outcome === 'question') renderQuestion();
  });
  $('to-map').addEventListener('click', () => renderMap());
  $('reward-map').addEventListener('click', () => renderMap());
  $('resume').addEventListener('click', () => renderQuestion());
  $('continue').addEventListener('click', () => {
    if (game.progress.completed === LEVELS.length) renderMap();
    else {
      game.start(game.progress.completed);
      persist();
      renderQuestion();
    }
  });
  $('voice').disabled = !canSpeak;
  $('read').disabled = !canSpeak;
  if (!canSpeak) {
    $('voice').textContent = '声音不可用';
    $('read').textContent = '可以看图数数';
  }
  $('voice').addEventListener('click', () => {
    voice = !voice;
    $('voice').setAttribute('aria-pressed', String(voice));
    $('voice').textContent = `声音：${voice ? '开' : '关'}`;
    if (!voice) window.speechSynthesis.cancel();
    else speak('一起开始数字冒险吧。');
  });
  $('read').addEventListener('click', () => speak(questionSpeech(), true));
  window.addEventListener('pagehide', () => {
    if (canSpeak) window.speechSynthesis.cancel();
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
  persist();
  renderMap(false);
})();
