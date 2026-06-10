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

/** 女聲基準語速（曉佳／曉曉等）— 1.0 = Azure 正常語速；上限 1.2 */
const FEMALE_AZURE_RATES = {
  'zh-HK': { sen: 1.05, normal: 1.18 },
  'zh-CN': { sen: 0.98, normal: 1.12 },
  'en-US': { sen: 1.02, normal: 1.15 },
};

/** 男聲獨立語速（雲龍等）— 明顯慢於女聲，方便跟讀 */
const MALE_AZURE_RATES = {
  'zh-HK': { sen: 0.66, normal: 0.72 },
  'zh-CN': { sen: 0.64, normal: 0.70 },
  'en-US': { sen: 0.70, normal: 0.76 },
};

const FEMALE_BROWSER_RATES = {
  'zh-HK': { sen: 0.92, normal: 1.0 },
  'zh-CN': { sen: 0.88, normal: 0.96 },
  'en-US': { sen: 0.94, normal: 1.02 },
};

const MALE_BROWSER_RATES = {
  'zh-HK': { sen: 0.68, normal: 0.74 },
  'zh-CN': { sen: 0.64, normal: 0.70 },
  'en-US': { sen: 0.72, normal: 0.78 },
};

function resolveLangKey(lang) {
  if (lang === 'zh-CN' || lang === 'en-US') return lang;
  return 'zh-HK';
}

/** Azure SSML rate 倍率（1.0 = 正常語速；伺服器下限 0.5、上限 1.2） */
export function getAzureSpeechRate(lang, isSEN = false, voiceKey = null) {
  const key = resolveLangKey(lang);
  const male = isMaleSpeechVoice(voiceKey);
  const table = male
    ? (MALE_AZURE_RATES[key] ?? MALE_AZURE_RATES['zh-HK'])
    : (FEMALE_AZURE_RATES[key] ?? FEMALE_AZURE_RATES['zh-HK']);
  return isSEN ? table.sen : table.normal;
}

/** Web Speech API utter.rate（1.0 = 正常） */
export function getBrowserSpeechRate(lang, isSEN = false, voiceKey = null) {
  const key = resolveLangKey(lang);
  const male = isMaleSpeechVoice(voiceKey);
  const table = male
    ? (MALE_BROWSER_RATES[key] ?? MALE_BROWSER_RATES['zh-HK'])
    : (FEMALE_BROWSER_RATES[key] ?? FEMALE_BROWSER_RATES['zh-HK']);
  return isSEN ? table.sen : table.normal;
}

export function getSpeechRateTag(lang, isSEN = false, voiceKey = null) {
  const male = isMaleSpeechVoice(voiceKey) ? '-M' : '';
  return `${lang}-${Math.round(getAzureSpeechRate(lang, isSEN, voiceKey) * 100)}${male}`;
}
