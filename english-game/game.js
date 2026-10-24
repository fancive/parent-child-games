import { BOOKS, LANDMARKS, STORAGE_KEY, UNITS } from './data.js';
import {
  answerQuestion,
  advanceRound,
  availableWords,
  completeRound,
  createRound,
  parseState,
  setRange,
} from './model.js';
import { selectEnglishVoice } from './speech.js';

const $ = (selector) => document.querySelector(selector);
let storageAvailable = true;
let initialSave = null;
try {
  initialSave = localStorage.getItem(STORAGE_KEY);
} catch {
  storageAvailable = false;
}
let state = parseState(initialSave);
let book = 'theme';
let unit = 1;
let round = null;
let hintVisible = false;
let lastSticker = null;
let utterance = null;
let speechTimer = null;
let speechToken = 0;
let advanceTimer = null;

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
const announce = (text) => {
  $('#app-announcement').textContent = text;
};

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  showStorageStatus();
}

function showStorageStatus() {
  $('#storage-warning').hidden = storageAvailable;
  if (!storageAvailable)
    $('#storage-warning').textContent =
      '这台设备暂时无法保存记录，仍然可以玩；刷新后，本次贴纸和错题可能会消失。';
}

function cancelSpeech() {
  speechToken += 1;
  clearTimeout(speechTimer);
  speechTimer = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  utterance = null;
}

function cancelAdvance() {
  clearTimeout(advanceTimer);
  advanceTimer = null;
}

function scheduleAdvance() {
  cancelAdvance();
  if (document.hidden || !round || round.finished || !round.questions[round.index].solved) return;
  const answeredRound = round;
  advanceTimer = setTimeout(() => {
    advanceTimer = null;
    if (round === answeredRound && !document.hidden) nextQuestion();
  }, 1000);
}

function findVoice() {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return null;
  return selectEnglishVoice(window.speechSynthesis.getVoices());
}

function voiceDescription() {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    return '这个浏览器不支持英文朗读。可以开启“家长读词模式”，或在题目里点“显示单词”。';
  }
  if (!findVoice())
    return '这台设备暂时没有可用的英语声音。可以开启“家长读词模式”，或在题目里点“显示单词”请家长读。';
  return '英语声音已就绪。点击题目里的喇叭才会朗读，可以重复播放；设备音量与静音设置也会影响声音。';
}

function updateVoiceStatus() {
  $('#voice-status').textContent = voiceDescription();
  const speaker = $('#speak-word');
  if (speaker) {
    const voice = findVoice();
    speaker.disabled = !voice;
    const message = $('#speech-message');
    message.textContent = voice ? '点喇叭听一听，想听几遍都可以。' : voiceDescription();
    message.classList.toggle('warning', !voice);
  }
  const sentenceButton = $('#speak-sentence');
  if (sentenceButton) sentenceButton.disabled = !findVoice();
}

function speak(text) {
  cancelSpeech();
  const voice = findVoice();
  const message = $('#speech-message');
  if (!voice) {
    if (message) {
      message.textContent = voiceDescription();
      message.classList.add('warning');
    }
    announce(voiceDescription());
    return;
  }
  cancelAdvance();
  const token = speechToken;
  utterance = new window.SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 0.8;
  utterance.pitch = 1;
  const failure = () => {
    if (token !== speechToken || !message?.isConnected) return;
    clearTimeout(speechTimer);
    message.textContent = '这次朗读没有成功。可以再点一次，或点“显示单词”请家长读。';
    message.classList.add('warning');
    announce(message.textContent);
    scheduleAdvance();
  };
  utterance.onstart = () => {
    if (token !== speechToken || !message?.isConnected) return;
    clearTimeout(speechTimer);
    speechTimer = setTimeout(failure, 15000);
    message.textContent = '正在朗读… 如果听不到，请检查设备音量，或点“显示单词”。';
    message.classList.remove('warning');
  };
  utterance.onend = () => {
    if (token !== speechToken || !message?.isConnected) return;
    clearTimeout(speechTimer);
    message.textContent = '还想听一遍？再点喇叭就好。';
    scheduleAdvance();
  };
  utterance.onerror = failure;
  if (message) {
    message.textContent = '正在请求英语朗读…';
    message.classList.remove('warning');
  }
  speechTimer = setTimeout(failure, 7000);
  try {
    window.speechSynthesis.speak(utterance);
  } catch {
    failure();
  }
}

function missedCount() {
  return availableWords(state, book, unit, true).length;
}

function renderAlbum() {
  $('#sticker-count').textContent = state.stickers.length;
  $('#album-description').textContent =
    `已经完成 ${state.totalRounds} 次小冒险。每本书、每个单元都有一张贴纸。`;
  $('#sticker-grid').innerHTML = Object.keys(BOOKS)
    .flatMap((key) =>
      LANDMARKS.map((landmark, index) => {
        const collected = state.stickers.includes(`${key}-${index + 1}`);
        return `<span class="sticker ${collected ? 'collected' : ''}" role="img" aria-label="${BOOKS[key].name}第 ${index + 1} 单元：${collected ? '已收集' : '待收集'}">${landmark.sticker}<small>${key === 'theme' ? '主' : '拼'}${index + 1}</small></span>`;
      }),
    )
    .join('');
}

function renderHome() {
  $('#explore-panel').hidden = false;
  $('#intro').hidden = false;
  $('#play-section').hidden = true;
  $('#parent-settings').hidden = false;
  for (const tab of document.querySelectorAll('[data-book]')) {
    tab.setAttribute('aria-selected', String(tab.dataset.book === book));
    tab.tabIndex = tab.dataset.book === book ? 0 : -1;
  }
  $('#island-panel').setAttribute('aria-labelledby', `tab-${book}`);
  $('#map-range').textContent = `${state.ranges[book]} 个单元，随心出发`;
  $('#map-nodes').innerHTML = UNITS[book]
    .map((entry, index) => {
      const number = index + 1;
      const available = number <= state.ranges[book];
      return `<button type="button" class="map-node" data-unit="${number}" aria-pressed="${unit === number}" aria-label="第 ${number} 单元 ${entry.title}${available ? '' : '，不在当前复习范围'}" ${available ? '' : 'disabled'}><span class="landmark" aria-hidden="true">${LANDMARKS[index].icon}<span class="unit-number">${number}</span></span><span class="landmark-name">${entry.title}</span></button>`;
    })
    .join('');
  $('#selection-kicker').textContent = `${BOOKS[book].english}`;
  $('#departure-title').textContent = UNITS[book][unit - 1].title;
  $('#selection-description').textContent = `第 ${unit} 单元 · ${UNITS[book][unit - 1].english}`;
  $('#activity-description').textContent =
    book === 'theme'
      ? '先听一个英文，再从三张图里找到它。图片有中文小标签帮帮忙。'
      : '听完整单词，看图选一块首字母，和后面的词尾拼在一起。';
  $('#missed-count').textContent = missedCount();
  $('#review-missed').disabled = !missedCount();
  $('#theme-range').value = state.ranges.theme;
  $('#phonics-range').value = state.ranges.phonics;
  $('#parent-reading').checked = state.parentReading;
  renderAlbum();
  updateVoiceStatus();
}

function startRound(review = false) {
  cancelAdvance();
  cancelSpeech();
  round = createRound(state, { book, unit, review });
  if (!round) {
    announce('当前单元没有需要重练的错题。');
    return;
  }
  lastSticker = null;
  $('#explore-panel').hidden = true;
  $('#intro').hidden = true;
  $('#sticker-album').hidden = true;
  $('#album-toggle').setAttribute('aria-expanded', 'false');
  $('#parent-settings').open = false;
  $('#parent-settings').hidden = true;
  $('#play-section').hidden = false;
  renderQuestion();
  $('#play-section').scrollIntoView({ block: 'start', behavior: 'auto' });
}

function sentenceFor(target) {
  if (target.sentence) return target.sentence;
  if (target.unit === 1)
    return `I see ${['owl'].includes(target.word) ? 'an' : 'a'} ${target.word}.`;
  if (target.unit === 2) return `This is the ${target.word}.`;
  if (target.unit === 3) return `I like ${target.word === 'carrot' ? 'carrots' : target.word}.`;
  if (target.unit === 4) return `I am ${target.word === 'astronaut' ? 'an' : 'a'} ${target.word}.`;
  return `It is ${target.word}.`;
}

function renderQuestion() {
  hintVisible = state.parentReading;
  const question = round.questions[round.index];
  const target = question.target;
  const progress = round.questions
    .map(
      (item, index) =>
        `<span class="progress-dot ${item.solved ? 'done' : index === round.index ? 'current' : ''}" aria-hidden="true"></span>`,
    )
    .join('');
  const instruction = book === 'theme' ? '听一听，哪张图是它？' : '少了一块，帮它拼完整！';
  const subtitle =
    book === 'theme'
      ? '点喇叭听英文，再选一张图片。答对自动开始下一题。'
      : '先听整个单词，再选择开头的字母。答对自动开始下一题。';
  const phonicsPicture =
    book === 'phonics'
      ? `<div class="phonics-picture" role="img" aria-label="${target.label}">${target.picture}</div><p class="phonics-label">${target.label}</p><div class="word-blocks" aria-label="空格，加上词尾 ${target.rime}"><span class="word-block blank" id="onset-block">_</span><span class="word-block plus" aria-hidden="true">+</span><span class="word-block">${target.rime}</span></div>`
      : '';
  $('#play-section').innerHTML =
    `<div class="play-top"><button type="button" class="exit-round" id="exit-round">← 回小岛</button><div class="round-position"><div class="progress-dots">${progress}</div><span>第 ${round.index + 1} / ${round.questions.length} 题</span></div></div><div class="question-card"><p class="eyebrow">${BOOKS[book].activity} · 第 ${target.unit} 单元${round.review ? ' · 错题重练' : ''}</p><h2 id="question-title" tabindex="-1">${instruction}</h2><p class="question-subtitle">${subtitle}</p><button type="button" class="speak-button" id="speak-word"><span aria-hidden="true">🔊</span> 听一听</button><p id="speech-message" class="speech-message" role="status"></p><button type="button" class="hint-button" id="show-hint" aria-expanded="${hintVisible}" aria-controls="word-hint">${hintVisible ? '收起单词' : '显示单词 / 小提示'}</button><div id="word-hint" class="word-hint" ${hintVisible ? '' : 'hidden'}><span lang="en">${escapeHtml(target.word)}</span><small>${target.label}</small></div>${phonicsPicture}<div class="${book === 'theme' ? 'picture-options' : 'letter-options'}" role="group" aria-label="${book === 'theme' ? '选择图片' : '选择开头字母'}">${question.options.map((option) => `<button type="button" class="answer-option" data-answer="${option.value}" aria-label="${option.label}">${book === 'theme' ? `<span class="picture" aria-hidden="true">${option.picture}</span><span class="option-label">${option.label}</span>` : `<span lang="en">${option.label}</span>`}</button>`).join('')}</div><p id="answer-feedback" class="answer-feedback" role="status" aria-live="polite">慢慢来，准备好了就选一个。</p><div id="sentence-reward" class="sentence-reward" hidden></div></div>`;
  $('#question-title').focus({ preventScroll: true });
  updateVoiceStatus();
}

function chooseAnswer(value) {
  const result = answerQuestion(state, round, value);
  if (result.result === 'ignored') return;
  state = result.state;
  round = result.round;
  save();
  const question = round.questions[round.index];
  for (const button of document.querySelectorAll('[data-answer]')) {
    const wrong = question.wrongOptions.includes(button.dataset.answer);
    button.classList.toggle('incorrect', wrong);
    button.classList.toggle(
      'correct',
      question.solved && button.dataset.answer === question.correct,
    );
    button.disabled = question.solved || wrong;
  }
  const feedback = $('#answer-feedback');
  feedback.classList.toggle('retry', result.result === 'retry');
  if (result.result === 'retry') {
    feedback.textContent =
      book === 'theme' ? '差一点点！再听一次，换一张图试试。' : '差一点点！再听一次，换一块试试。';
    const remaining = [...document.querySelectorAll('[data-answer]')].find(
      (button) => !button.disabled,
    );
    remaining?.focus({ preventScroll: true });
    return;
  }
  feedback.textContent = `找到了！${question.target.word}，${question.target.label}。${question.attempts > 1 ? '试一试，就会啦！' : '真棒！'}`;
  if (book === 'phonics') {
    $('#onset-block').textContent = question.target.onset;
    $('#onset-block').classList.remove('blank');
  } else {
    const sentence = sentenceFor(question.target);
    $('#sentence-reward').innerHTML =
      `<span lang="en">${escapeHtml(sentence)}</span><button type="button" id="speak-sentence" ${findVoice() ? '' : 'disabled'}>🔊 读一句</button>`;
    $('#sentence-reward').hidden = false;
  }
  feedback.textContent +=
    round.index === round.questions.length - 1 ? ' 马上收集贴纸！' : ' 马上开始下一题。';
  scheduleAdvance();
}

function nextQuestion() {
  cancelAdvance();
  const next = advanceRound(round);
  if (next === round) return;
  cancelSpeech();
  round = next;
  if (!round.finished) {
    renderQuestion();
    return;
  }
  const reward = completeRound(state, round);
  state = reward.state;
  lastSticker = reward.sticker;
  save();
  renderAlbum();
  renderFinish();
}

function renderFinish() {
  const firstTry = round.questions.filter((question) => question.attempts === 1).length;
  const remaining = availableWords(state, book, unit, true).length;
  $('#play-section').innerHTML =
    `<div class="finish-card"><p class="eyebrow">A LITTLE ADVENTURE, A BIG SMILE</p><div class="reward-sticker" role="img" aria-label="本轮收集的贴纸">${lastSticker?.icon ?? '🌈'}</div><h2 id="question-title" tabindex="-1">六小步，真了不起！</h2><p>6 道题都完成啦，${firstTry} 道一次就找对。<br>${lastSticker?.isNew ? `收到了第 ${lastSticker.unit} 单元的新贴纸！` : '又为小岛添了一份快乐！'}${remaining ? `<br>还有 ${remaining} 个词可以慢慢再练。` : '<br>这一片的错题都复习好啦。'}</p><div class="finish-actions"><button type="button" class="button primary" id="play-again">再玩一轮 →</button><button type="button" class="button secondary" id="finish-home">带贴纸回小岛</button>${remaining ? '<button type="button" class="button secondary" id="finish-review">再练练错题</button>' : ''}</div><p>错题重练时，一次答对的词会从错题本移走。</p></div>`;
  $('#question-title').focus({ preventScroll: true });
}

function goHome() {
  cancelAdvance();
  cancelSpeech();
  round = null;
  renderHome();
  $('#tab-' + book).focus({ preventScroll: true });
  announce('回到小岛。已保存贴纸、错题和复习范围；下次出发开启新的一轮。');
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.book) {
    cancelSpeech();
    book = button.dataset.book;
    unit = 1;
    renderHome();
  } else if (button.dataset.unit) {
    unit = Number(button.dataset.unit);
    renderHome();
    $('#start-round').focus({ preventScroll: true });
    $('.departure-card').scrollIntoView({ block: 'nearest', behavior: 'auto' });
    announce(`已选第 ${unit} 单元，${UNITS[book][unit - 1].title}。点击出发开始复习。`);
  } else if (button.dataset.answer) {
    chooseAnswer(button.dataset.answer);
  } else {
    switch (button.id) {
      case 'start-round':
      case 'play-again':
        startRound();
        break;
      case 'review-missed':
      case 'finish-review':
        startRound(true);
        break;
      case 'exit-round':
      case 'finish-home':
        goHome();
        break;
      case 'speak-word':
        speak(round.questions[round.index].target.word);
        break;
      case 'speak-sentence':
        speak(sentenceFor(round.questions[round.index].target));
        break;
      case 'show-hint':
        hintVisible = !hintVisible;
        $('#word-hint').hidden = !hintVisible;
        button.setAttribute('aria-expanded', String(hintVisible));
        button.textContent = hintVisible ? '收起单词' : '显示单词 / 小提示';
        break;
      case 'album-toggle': {
        const open = $('#sticker-album').hidden;
        $('#sticker-album').hidden = !open;
        button.setAttribute('aria-expanded', String(open));
        break;
      }
    }
  }
});

document.addEventListener('change', (event) => {
  if (event.target.dataset.range) {
    state = setRange(state, event.target.dataset.range, Number(event.target.value));
    if (unit > state.ranges[book]) unit = 1;
    save();
    renderHome();
    announce('复习范围已保存。已有贴纸和错题会保留。');
  } else if (event.target.id === 'parent-reading') {
    state = { ...state, parentReading: event.target.checked };
    save();
    announce(
      state.parentReading
        ? '家长读词模式已开启，题目将直接显示英文。'
        : '家长读词模式已关闭，题目中的单词默认隐藏。',
    );
  }
});

$('.book-tabs').addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  book =
    event.key === 'Home'
      ? 'theme'
      : event.key === 'End'
        ? 'phonics'
        : book === 'theme'
          ? 'phonics'
          : 'theme';
  unit = 1;
  renderHome();
  $(`#tab-${book}`).focus();
});

window.addEventListener('pagehide', () => {
  cancelAdvance();
  cancelSpeech();
});
window.addEventListener('pageshow', scheduleAdvance);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAdvance();
    cancelSpeech();
  } else scheduleAdvance();
});
if ('speechSynthesis' in window)
  window.speechSynthesis.addEventListener('voiceschanged', updateVoiceStatus);
if ('serviceWorker' in navigator)
  navigator.serviceWorker.register('../sw.js').catch(() => {
    // Playing online still works when this browser does not allow offline caching.
  });
showStorageStatus();
renderHome();
