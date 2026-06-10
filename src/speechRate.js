import { isMaleAzureVoice } from './azureVoices';

/** 語速／快取結構版本 — 變更時自動作廢舊 IndexedDB 快取 */
export const SPEECH_RATE_VERSION = 'v6';

/** 本機瀏覽器男聲名稱特徵（Azure 以外降級路徑） */
const MALE_BROWSER_VOICE_HINTS = [
  'danny', 'david', 'mark', 'wanlung', 'yunxi', 'yunyang', 'kangkang', 'yunjian',
];

export function isMaleSpeechVoice(voiceKey) {
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

/** 男聲獨立語速（雲龍等）— Azure 下限 0.5 */
const MALE_AZURE_RATES = {
  'zh-HK': { sen: 0.50, normal: 0.50 },
  'zh-CN': { sen: 0.50, normal: 0.50 },
  'en-US': { sen: 0.52, normal: 0.54 },
};

/** 男聲播放時再放慢（修正舊快取／Azure 實際語速偏快） */
export const MALE_PLAYBACK_RATE = 0.82;

const FEMALE_BROWSER_RATES = {
  'zh-HK': { sen: 0.92, normal: 1.0 },
  'zh-CN': { sen: 0.88, normal: 0.96 },
  'en-US': { sen: 0.94, normal: 1.02 },
};

const MALE_BROWSER_RATES = {
  'zh-HK': { sen: 0.58, normal: 0.62 },
  'zh-CN': { sen: 0.54, normal: 0.58 },
  'en-US': { sen: 0.62, normal: 0.66 },
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
  const pct = Math.round(getAzureSpeechRate(lang, isSEN, voiceKey) * 100);
  return `${SPEECH_RATE_VERSION}-${lang}-${pct}${male}`;
}

/** 合成語速 + 播放倍率 → 使用者聽到的有效語速 */
export function getEffectiveSpeechRate(lang, isSEN = false, voiceKey = null) {
  const synthesis = getAzureSpeechRate(lang, isSEN, voiceKey);
  const playback = isMaleSpeechVoice(voiceKey) ? MALE_PLAYBACK_RATE : 1;
  return synthesis * playback;
}
