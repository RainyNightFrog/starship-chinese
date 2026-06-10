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

/** 女聲基準語速（曉佳／曉曉等）— 1.0 = Azure 正常語速；上限 1.2 */
const FEMALE_AZURE_RATES = {
  'zh-HK': { sen: 1.05, normal: 1.18 },
  'zh-CN': { sen: 0.98, normal: 1.12 },
  'en-US': { sen: 1.02, normal: 1.15 },
};

const FEMALE_BROWSER_RATES = {
  'zh-HK': { sen: 0.92, normal: 1.0 },
  'zh-CN': { sen: 0.88, normal: 0.96 },
  'en-US': { sen: 0.94, normal: 1.02 },
};

function resolveLangKey(lang) {
  if (lang === 'zh-CN' || lang === 'en-US') return lang;
  return 'zh-HK';
}

/** Azure SSML rate 倍率（1.0 = 正常語速；伺服器下限 0.5、上限 1.2） */
export function getAzureSpeechRate(lang, isSEN = false, voiceKey = null) {
  const key = resolveLangKey(lang);
  const table = FEMALE_AZURE_RATES[key] ?? FEMALE_AZURE_RATES['zh-HK'];
  let rate = isSEN ? table.sen : table.normal;

  if (isMaleSpeechVoice(voiceKey)) {
    const cantoneseExtra = key === 'zh-HK' ? 0.04 : 0;
    rate = applyMaleSlowdown(rate, 0.5, cantoneseExtra);
  }
  return rate;
}

/** Web Speech API utter.rate（1.0 = 正常） */
export function getBrowserSpeechRate(lang, isSEN = false, voiceKey = null) {
  const key = resolveLangKey(lang);
  const table = FEMALE_BROWSER_RATES[key] ?? FEMALE_BROWSER_RATES['zh-HK'];
  let rate = isSEN ? table.sen : table.normal;

  if (isMaleSpeechVoice(voiceKey)) {
    const cantoneseExtra = key === 'zh-HK' ? 0.04 : 0;
    rate = applyMaleSlowdown(rate, 0.30, cantoneseExtra);
  }
  return rate;
}

export function getSpeechRateTag(lang, isSEN = false, voiceKey = null) {
  const male = isMaleSpeechVoice(voiceKey) ? '-M' : '';
  return `${lang}-${Math.round(getAzureSpeechRate(lang, isSEN, voiceKey) * 100)}${male}`;
}
