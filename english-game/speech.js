const EXCLUDED_VOICE_NAMES = new Set([
  'albert',
  'bad news',
  'bahh',
  'bells',
  'boing',
  'bubbles',
  'cellos',
  'deranged',
  'good news',
  'hysterical',
  'jester',
  'junior',
  'organ',
  'superstar',
  'trinoids',
  'whisper',
  'wobble',
  'zarvox',
]);

const PREFERRED_VOICE_NAMES = new Set([
  'alex',
  'samantha',
  'daniel',
  'karen',
  'moira',
  'rishi',
  'tessa',
]);

const voiceName = (voice) => voice.name.trim().toLowerCase();
const isAmericanEnglish = (voice) => /^en[-_]US$/i.test(voice.lang);

export function selectEnglishVoice(voices) {
  const englishVoices = voices.filter(
    (voice) => /^en(?:[-_]|$)/i.test(voice.lang) && !EXCLUDED_VOICE_NAMES.has(voiceName(voice)),
  );
  const preferredVoices = englishVoices.filter((voice) =>
    PREFERRED_VOICE_NAMES.has(voiceName(voice)),
  );
  return (
    englishVoices.find((voice) => voice.default) ??
    preferredVoices.find(isAmericanEnglish) ??
    preferredVoices[0] ??
    englishVoices.find(isAmericanEnglish) ??
    englishVoices[0] ??
    null
  );
}
