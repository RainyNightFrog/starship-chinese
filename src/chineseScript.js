import * as OpenCC from 'opencc-js';

let hkToCn = null;

function getHkToCnConverter() {
  if (!hkToCn) {
    hkToCn = OpenCC.Converter({ from: 'hk', to: 'cn' });
  }
  return hkToCn;
}

export function isSimplifiedScript(language, studentType) {
  return studentType === 'mainland' || language === 'zh-CN';
}

/** 將簡體字串轉為香港繁體（OpenCC） */
export function convertToTraditional(text) {
  if (!text || typeof text !== 'string') return text;
  return getCnToHkConverter()(text);
}

let cnToHk = null;

function getCnToHkConverter() {
  if (!cnToHk) {
    cnToHk = OpenCC.Converter({ from: 'cn', to: 'hk' });
  }
  return cnToHk;
}

/** 將繁體字串轉為簡體（OpenCC） */
export function convertToSimplified(text) {
  if (!text || typeof text !== 'string') return text;
  return getHkToCnConverter()(text);
}

/** 依 UI 語言設定顯示繁體或簡體 */
export function getDisplayText(text, { language = 'zh-HK', studentType } = {}) {
  if (!text) return text;
  if (!isSimplifiedScript(language, studentType)) return text;
  return convertToSimplified(text);
}

/** 建立綁定語言設定的顯示函數，供元件重複使用 */
export function makeDisplayText(language, studentType) {
  return (text) => getDisplayText(text, { language, studentType });
}
