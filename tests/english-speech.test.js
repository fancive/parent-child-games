import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { selectEnglishVoice } from '../english-game/speech.js';

function voice(name, lang = 'en-US', isDefault = false) {
  return { name, lang, default: isDefault, localService: true };
}

const specialVoiceNames = [
  'Albert',
  'Bad News',
  'Bahh',
  'Bells',
  'Boing',
  'Bubbles',
  'Cellos',
  'Deranged',
  'Good News',
  'Hysterical',
  'Jester',
  'Junior',
  'Organ',
  'Superstar',
  'Trinoids',
  'Whisper',
  'Wobble',
  'Zarvox',
];

describe('英语音色选择', () => {
  test('Mac 实测顺序中选择 Samantha，而非首位 Albert、效果音或旧音色', () => {
    const voices = [
      voice('Albert'),
      voice('Bad News'),
      voice('Bahh'),
      voice('Bells'),
      voice('Boing'),
      voice('Bubbles'),
      voice('Cellos'),
      voice('Daniel', 'en-GB'),
      voice('Eddy (英语（英国）)', 'en-GB'),
      voice('Eddy (英语（美国）)'),
      voice('Flo (英语（英国）)', 'en-GB'),
      voice('Flo (英语（美国）)'),
      voice('Fred'),
      voice('Good News'),
      voice('Grandma (英语（英国）)', 'en-GB'),
      voice('Grandma (英语（美国）)'),
      voice('Grandpa (英语（英国）)', 'en-GB'),
      voice('Grandpa (英语（美国）)'),
      voice('Jester'),
      voice('Junior'),
      voice('Karen', 'en-AU'),
      voice('Kathy'),
      voice('Moira', 'en-IE'),
      voice('Organ'),
      voice('Ralph'),
      voice('Reed (英语（英国）)', 'en-GB'),
      voice('Reed (英语（美国）)'),
      voice('Rishi', 'en-IN'),
      voice('Rocko (英语（英国）)', 'en-GB'),
      voice('Rocko (英语（美国）)'),
      voice('Samantha'),
      voice('Sandy (英语（英国）)', 'en-GB'),
      voice('Sandy (英语（美国）)'),
      voice('Shelley (英语（英国）)', 'en-GB'),
      voice('Shelley (英语（美国）)'),
      voice('Superstar'),
      voice('Tessa', 'en-ZA'),
      voice('Trinoids'),
      voice('Whisper'),
      voice('Wobble'),
      voice('Zarvox'),
    ];
    assert.equal(
      selectEnglishVoice(voices),
      voices.find((entry) => entry.name === 'Samantha'),
    );
  });

  test('Albert 单独存在或与其他特殊音色混合时不可用', () => {
    assert.equal(selectEnglishVoice([voice('Albert')]), null);
    assert.equal(selectEnglishVoice(specialVoiceNames.map((name) => voice(name))), null);
  });

  test('即使 Albert 或效果音被标为默认，也不能压过 Samantha', () => {
    const samantha = voice('Samantha');
    for (const name of specialVoiceNames) {
      assert.equal(selectEnglishVoice([voice(name, 'en-US', true), samantha]), samantha);
    }
    assert.equal(selectEnglishVoice([voice('  ALBERT  ', 'en-US', true), samantha]), samantha);
  });

  test('普通英语系统默认声音优先，包括非美式英语和未知平台音色', () => {
    const systemDefault = voice('Platform English Narrator', 'en-GB', true);
    const voices = [voice('Samantha'), voice('中文', 'zh-CN', true), systemDefault];
    assert.equal(selectEnglishVoice(voices), systemDefault);
  });

  test('没有默认时，常规朗读音色优先于旧音色，并在其中优先美式英语', () => {
    const daniel = voice('Daniel', 'en-GB');
    const samantha = voice('Samantha');
    assert.equal(selectEnglishVoice([voice('Fred'), voice('Ralph'), daniel]), daniel);
    assert.equal(selectEnglishVoice([daniel, voice('Eddy'), samantha]), samantha);
  });

  test('保留未知平台普通英语声音，并在普通回退中优先美式英语', () => {
    const british = voice('Platform English B', 'en-GB');
    const american = voice('Platform English A', 'EN_us');
    assert.equal(selectEnglishVoice([voice('Whisper'), british]), british);
    assert.equal(selectEnglishVoice([british, american]), american);
    const generic = voice('Platform English', 'en');
    assert.equal(selectEnglishVoice([generic]), generic);
    assert.equal(selectEnglishVoice([voice('Fred')]).name, 'Fred');
  });

  test('无英语或空列表返回 null，非英语默认声音不能启用朗读', () => {
    assert.equal(selectEnglishVoice([]), null);
    assert.equal(
      selectEnglishVoice([voice('中文', 'zh-CN', true), voice('French', 'fr-FR')]),
      null,
    );
    assert.equal(selectEnglishVoice([voice('Not an English language tag', 'eng')]), null);
  });

  test('调整浏览器返回顺序不会重新选中特殊音色，也不会修改原列表', () => {
    const samantha = voice('Samantha');
    const voices = Object.freeze([...specialVoiceNames.map((name) => voice(name)), samantha]);
    assert.equal(selectEnglishVoice(voices), samantha);
    assert.equal(voices[0].name, 'Albert');
    for (let index = 0; index < voices.length; index++) {
      const reordered = [...voices.slice(index), ...voices.slice(0, index)];
      assert.equal(selectEnglishVoice(reordered), samantha);
      assert.equal(selectEnglishVoice(reordered.reverse()), samantha);
    }
  });
});
