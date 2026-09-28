(function () {
  'use strict';
  const { Adventure, LEVELS, LENGTH } = window.NumberAdventure;
  const $ = (id) => document.getElementById(id);
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
    $('stages').replaceChildren();
    LEVELS.forEach((level, index) => {
      const complete = index < game.progress.completed;
      const locked = index > game.progress.completed;
      const button = document.createElement('button');
      button.className = 'stage';
      button.disabled = locked;
      const label = locked ? '先完成上一站' : complete ? '✓ 已完成 · 再玩一次' : '出发';
      button.innerHTML = `<span class="stage-icon" aria-hidden="true">${level.icon}</span><strong>${level.name}</strong><small>${level.skill}</small><span class="stage-state">${label}</span>`;
      button.setAttribute('aria-label', `${level.name}，${level.skill}，${label}`);
      button.addEventListener('click', () => {
        if (game.progress.round?.stage !== index) game.start(index);
        else if (complete) game.start(index);
        persist();
        renderQuestion();
      });
      $('stages').appendChild(button);
    });
    const r = game.progress.round;
    $('resume').hidden = !r;
    if (r) $('resume').textContent = `继续${LEVELS[r.stage].name} · 第 ${r.index + 1} 题`;
    $('collection').textContent =
      game.progress.completed === 3
        ? '🍎 🥕 🍓 野餐准备好啦！也可以再去玩一遍。'
        : `🧺 野餐徽章 ${game.progress.completed} / 3`;
    screen('map', focus ? 'map-title' : null);
  }
  function makePile(amount, title, icon, given = false) {
    const pile = document.createElement('div');
    pile.className = given ? 'pile given' : 'pile';
    const label = document.createElement('p');
    label.className = 'pile-label';
    label.textContent = title;
    const tokens = document.createElement('div');
    tokens.className = 'tokens';
    pile.append(label, tokens);
    if (amount === 0) {
      const zero = document.createElement('p');
      zero.className = 'zero';
      zero.textContent = '全都送走啦！一个也没有，就是 0。';
      tokens.appendChild(zero);
    }
    for (let i = 0; i < amount; i++) {
      const token = document.createElement(given ? 'span' : 'button');
      token.className = 'token';
      token.textContent = icon;
      if (given) token.setAttribute('aria-label', '已送走的草莓');
      else {
        token.setAttribute('aria-label', `${title}，第 ${i + 1} 个，点一点数数`);
        token.setAttribute('aria-pressed', 'false');
        token.addEventListener('click', () => {
          if (token.classList.contains('counted')) return;
          counted++;
          token.classList.add('counted');
          token.setAttribute('aria-pressed', 'true');
          const badge = document.createElement('span');
          badge.className = 'count-badge';
          badge.textContent = counted;
          token.appendChild(badge);
          $('count-help').textContent = `数到 ${counted} 啦！每个物品只数一次。`;
          speak(String(counted));
        });
      }
      tokens.appendChild(token);
    }
    return pile;
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
    $('stage-name').textContent = `${level.icon} ${level.name}`;
    $('progress-label').textContent = `${r.index + 1} / ${LENGTH}`;
    $('steps').innerHTML = Array.from(
      { length: LENGTH },
      (_, i) =>
        `<span class="step ${i < r.index ? 'done' : i === r.index ? 'current' : ''}" aria-hidden="true"></span>`,
    ).join('');
    $('steps').setAttribute('aria-label', `第 ${r.index + 1} 题，共 ${LENGTH} 题`);
    $('story').textContent =
      r.stage === 0
        ? '帮小兔摘苹果'
        : r.stage === 1
          ? `摘了 ${q.a} 根，又摘了 ${q.b} 根。`
          : `有 ${q.a} 颗草莓，送给朋友 ${q.b} 颗。`;
    $('question-title').textContent =
      r.stage === 0
        ? '树下有几个苹果？'
        : r.stage === 1
          ? '一共有几根胡萝卜？'
          : '还剩下几颗草莓？';
    $('equation').textContent =
      r.stage === 0 ? '数一数，选数字' : `${q.a} ${r.stage === 1 ? '+' : '−'} ${q.b} = ?`;
    $('objects').replaceChildren();
    if (r.stage === 0) $('objects').appendChild(makePile(q.a, '摘好的苹果', level.icon));
    if (r.stage === 1) {
      const plus = document.createElement('span');
      plus.className = 'operator';
      plus.textContent = '+';
      plus.setAttribute('aria-hidden', 'true');
      $('objects').append(
        makePile(q.a, '先摘的', level.icon),
        plus,
        makePile(q.b, '又摘的', level.icon),
      );
    }
    if (r.stage === 2)
      $('objects').append(
        makePile(q.b, '送给朋友的', level.icon, true),
        makePile(q.answer, '留下的', level.icon),
      );
    $('count-help').textContent =
      r.stage === 2
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
          $('feedback').textContent = '再数一数就好啦，点一点物品来帮忙。';
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
    else speak(`${$('story').textContent}。${$('question-title').textContent}`);
  }
  function showCorrect(announce = true) {
    const q = game.question;
    for (const button of $('answers').children) {
      button.disabled = true;
      button.classList.remove('retry');
      if (Number(button.textContent) === q.answer) button.classList.add('correct');
    }
    $('feedback').textContent = `✓ 答对啦，是 ${q.answer}！小兔和你击个掌。`;
    $('next').hidden = false;
    if (announce) {
      speak($('feedback').textContent);
      $('next').focus({ preventScroll: true });
    }
  }
  function renderReward() {
    const all = game.progress.completed === 3;
    $('reward-subtitle').textContent = `${LEVELS[lastStage].name} · 5 题完成`;
    $('reward-title').textContent = all
      ? '开饭啦，数字小探险家！'
      : `收好你的${LEVELS[lastStage].reward}！`;
    $('reward-description').textContent = all
      ? '会数数、会加法、会分享。谢谢你帮小兔准备了这场野餐！'
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
    if (game.progress.completed === 3) renderMap();
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
  $('read').addEventListener('click', () =>
    speak(`${$('story').textContent}。${$('question-title').textContent}`, true),
  );
  window.addEventListener('pagehide', () => {
    if (canSpeak) window.speechSynthesis.cancel();
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
  persist();
  renderMap(false);
})();
