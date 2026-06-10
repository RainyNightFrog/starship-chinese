import { isMaleAzureVoice } from './azureVoices';

/** 本機瀏覽器男聲名稱特徵（Azure 以外降級路徑） */
const MALE_BROWSER_VOICE_HINTS = [
  'danny', 'david', 'mark', 'wanlung', 'yunxi', 'yunyang', 'kangkang', 'yunjian',
];

function isMaleSpeechVoice(voiceKey) {
  if (!voiceKey) return false;
  if (isMaleAzureVoice(voiceKey)) return true;
  const norm = String(voiceKey).toLowerCase();
  return MALE_BROWSER_VOICE_HINTS.some((h) => norm.includes(h));
}

/** 男聲再放慢（Azure 下限 0.5） */
function applyMaleSlowdown(rate, min = 0.5, extra = 0) {
  return Math.max(min, rate - 0.10 - extra);
}

/** Azure SSML rate 倍率（1.0 = 正常語速；伺服器下限 0.5） */
export function getAzureSpeechRate(lang, isSEN = false, voiceKey = null) {
  let rate;
  if (lang === 'zh-CN') rate = isSEN ? 0.50 : 0.54;
  else if (lang === 'en-US') rate = isSEN ? 0.58 : 0.64;
  else rate = isSEN ? 0.56 : 0.62;

  if (isMaleSpeechVoice(voiceKey)) {
    const cantoneseExtra = lang === 'zh-HK' ? 0.04 : 0;
    rate = applyMaleSlowdown(rate, 0.5, cantoneseExtra);
  }
  return rate;
}

/** Web Speech API utter.rate（1.0 = 正常） */
export function getBrowserSpeechRate(lang, isSEN = false, voiceKey = null) {
  let rate;
  if (lang === 'zh-CN') rate = isSEN ? 0.38 : 0.44;
  else if (lang === 'en-US') rate = isSEN ? 0.48 : 0.54;
  else rate = isSEN ? 0.42 : 0.48;

  if (isMaleSpeechVoice(voiceKey)) {
    const cantoneseExtra = lang === 'zh-HK' ? 0.04 : 0;
    rate = applyMaleSlowdown(rate, 0.30, cantoneseExtra);
  }
  return rate;
}

export function getSpeechRateTag(lang, isSEN = false, voiceKey = null) {
  const male = isMaleSpeechVoice(voiceKey) ? '-M' : '';
  return `${lang}-${Math.round(getAzureSpeechRate(lang, isSEN, voiceKey) * 100)}${male}`;
}
