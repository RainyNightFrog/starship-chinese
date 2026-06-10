/**
 * Web Speech API 語音匹配
 * 問題：只設 utter.lang=zh-HK 時，Windows/Chrome 仍會用 Huihui 等普通話引擎
 */

import { isMaleAzureVoice } from './azureVoices';

const CANTONESE_NAME_HINTS = [
  'tracy', 'danny', 'cantonese', 'hong kong', 'hongkong', 'yue',
  'sin-ji', 'sinji', 'hiugaai', 'wanlung',
  '粵語', '粤语', '廣東', '广东',
];

const MALE_BROWSER_HINTS = [
  'danny', 'david', 'mark', 'wanlung', 'yunxi', 'yunyang', 'kangkang', 'yunjian',
  '男', 'male',
];

const FEMALE_BROWSER_HINTS = [
  'tracy', 'sin-ji', 'sinji', 'hiugaai', 'huihui', 'xiaoxiao', 'zira', 'aria',
  '女', 'female',
];

const MANDARIN_NAME_HINTS = [
  'huihui', 'kangkang', 'xiaoxiao', 'xiaoyi', 'yunxi', 'yunyang',
  'xiaohan', 'mandarin', '普通话', '普通話', '国语', '國語',
  'simplified', '简体', '簡體', 'prc', 'china',
];

const ENGLISH_NAME_HINTS = ['zira', 'david', 'mark', 'google us english', 'english united states'];

function norm(s) {
  return (s || '').toLowerCase();
}

export function getBrowserVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

/** 是否為普通話引擎（選粵語時必須排除） */
export function isMandarinVoice(voice) {
  const vLang = norm(voice.lang);
  const vName = norm(voice.name);
  if (vLang.startsWith('zh-cn') || vLang.includes('zh_cn')) return true;
  if (vLang.startsWith('cmn-cn') || vLang === 'cmn') return true;
  if (MANDARIN_NAME_HINTS.some((h) => vName.includes(h))) return true;
  return false;
}

/** 是否為粵語引擎 */
export function isCantoneseVoice(voice) {
  const vLang = norm(voice.lang);
  const vName = norm(voice.name);
  if (isMandarinVoice(voice)) return false;
  if (vLang.startsWith('zh-hk') || vLang.includes('zh_hk')) return true;
  if (vLang.startsWith('yue') || vLang.includes('yue-')) return true;
  if (vLang.includes('hong') && vLang.includes('kong')) return true;
  if (CANTONESE_NAME_HINTS.some((h) => vName.includes(h))) return true;
  if (vName.includes('google') && (vName.includes('粵') || vName.includes('粤') || vName.includes('cantonese'))) return true;
  return false;
}

function scoreVoice(voice, lang) {
  const vLang = norm(voice.lang);
  const vName = norm(voice.name);
  let score = 0;

  if (lang === 'zh-HK') {
    if (!isCantoneseVoice(voice)) return -999;
    if (vLang === 'zh-hk') score += 100;
    else if (vLang.startsWith('zh-hk')) score += 95;
    else if (vLang.startsWith('yue')) score += 90;
    if (CANTONESE_NAME_HINTS.some((h) => vName.includes(h))) score += 80;
    if (vName.includes('tracy')) score += 30;
    if (vName.includes('danny')) score += 28;
    if (voice.localService) score += 10;
  } else if (lang === 'zh-CN') {
    if (isCantoneseVoice(voice)) return -999;
    if (!isMandarinVoice(voice) && !vLang.startsWith('zh')) return -999;
    if (vLang === 'zh-cn') score += 100;
    else if (vLang.startsWith('zh-cn')) score += 90;
    if (MANDARIN_NAME_HINTS.some((h) => vName.includes(h))) score += 60;
    if (voice.localService) score += 10;
  } else if (lang === 'en-US') {
    if (vLang.startsWith('zh') || vLang.startsWith('yue')) return -999;
    if (vLang === 'en-us') score += 100;
    else if (vLang.startsWith('en-us')) score += 90;
    else if (vLang.startsWith('en-gb')) score += 70;
    else if (vLang.startsWith('en')) score += 50;
    if (ENGLISH_NAME_HINTS.some((h) => vName.includes(h))) score += 40;
  } else {
    return -999;
  }

  return score;
}

/** 列出某語言可用的引擎（供手動選擇） */
export function listVoicesForLang(lang, voices = getBrowserVoices()) {
  return voices
    .map((voice) => ({ voice, score: scoreVoice(voice, lang) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.voice);
}

/** 依語言自動選擇最佳引擎 — 絕不使用普通話代替粵語 */
export function pickVoiceForLang(lang, voices = getBrowserVoices()) {
  const ranked = listVoicesForLang(lang, voices);
  return ranked[0] ?? null;
}

export function isMaleBrowserVoice(voice) {
  const vName = norm(voice?.name);
  return MALE_BROWSER_HINTS.some((h) => vName.includes(h));
}

export function isFemaleBrowserVoice(voice) {
  const vName = norm(voice?.name);
  return FEMALE_BROWSER_HINTS.some((h) => vName.includes(h));
}

/** Azure 神經語音 ID → 瀏覽器備援時依性別對應本機引擎 */
function pickBrowserVoiceForAzureEngine(lang, voices, azureEngineKey) {
  const ranked = listVoicesForLang(lang, voices);
  if (!ranked.length) return null;

  const wantMale = isMaleAzureVoice(azureEngineKey);
  if (wantMale) {
    const maleVoice = ranked.find((v) => isMaleBrowserVoice(v));
    if (maleVoice) return maleVoice;
    return ranked[0] ?? null;
  }

  const femaleVoice = ranked.find((v) => isFemaleBrowserVoice(v));
  return femaleVoice ?? ranked[0];
}

/** 解析最終使用的引擎（手動優先） */
export function resolveVoice(lang, voices = getBrowserVoices(), manualKey = null) {
  if (manualKey && manualKey !== 'auto') {
    const manual = voices.find(
      (v) => v.voiceURI === manualKey || v.name === manualKey,
    );
    if (manual) {
      if (lang === 'zh-HK' && isMandarinVoice(manual)) return null;
      if (lang === 'zh-CN' && isCantoneseVoice(manual)) return null;
      return manual;
    }

    if (manualKey.includes('Neural')) {
      return pickBrowserVoiceForAzureEngine(lang, voices, manualKey);
    }
  }
  return pickVoiceForLang(lang, voices);
}

export function getVoiceKey(voice) {
  return voice?.voiceURI || voice?.name || '';
}

export function getVoiceStatus(lang, voices = getBrowserVoices(), manualKey = null) {
  const voice = resolveVoice(lang, voices, manualKey);
  if (voice) {
    const tag = lang === 'zh-HK' && isMandarinVoice(voice) ? '（警告：疑似普通話）' : '';
    return { ok: true, voice, label: `${voice.name}${tag}` };
  }

  const available = listVoicesForLang(lang, voices);
  const hints = {
    'zh-HK': available.length
      ? '請在下方「引擎」手動選擇粵語語音'
      : '找不到粵語語音！請安裝：Windows 設定 → 時間與語言 → 語音 → 新增「中文(香港)」，或使用 Microsoft Edge 瀏覽器',
    'zh-CN': '找不到普通話語音。請在系統安裝中文(简体)語音包',
    'en-US': '找不到英文語音。請在系統安裝 English 語音包',
  };

  return { ok: false, voice: null, label: hints[lang] ?? '找不到對應語音', available };
}

/** 等待 getVoices() 載入 — Chrome 線上語音需較長時間 */
export function waitForVoices(timeoutMs = 3000) {
  return new Promise((resolve) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth) {
      resolve([]);
      return;
    }

    const collect = () => {
      const list = synth.getVoices();
      return list.length ? list : [];
    };

    let best = collect();
    if (best.length >= 3) {
      resolve(best);
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      synth.onvoiceschanged = null;
      const list = collect();
      resolve(list.length ? list : best);
    };

    synth.onvoiceschanged = () => {
      best = collect();
      if (best.length >= 3) finish();
    };

    setTimeout(finish, timeoutMs);
  });
}
