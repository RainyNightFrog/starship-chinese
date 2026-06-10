/**
 * 瀏覽器原生 Web Speech API — 默書聽音（離線備援）
 */

/**
 * 使用 SpeechSynthesisUtterance 朗讀單詞
 * @param {string} text
 * @param {'zh-HK'|'zh-CN'|'en-US'} [lang='zh-HK']
 */
export function speakWithBrowserSynthesis(text, lang = 'zh-HK') {
  if (!text || typeof window === 'undefined') return false;
  const synth = window.speechSynthesis;
  if (!synth) return false;

  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.92;
  synth.speak(utterance);
  return true;
}

/** 停止瀏覽器 TTS */
export function cancelBrowserSynthesis() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}
