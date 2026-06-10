/**
 * 閱讀理解 — 選項前綴自動去重過濾器（Option Prefix Cleaner）
 *
 * 本地 LLaVA / 雲端 Vision 回傳的 options 常自帶「A.」「B、」等標記；
 * 前端若再拼接 `{字母}. {文字}` 便會出現「A. A. …」雙重前綴。
 * 本模組在渲染前剝除模型殘留標記，字母序號統一由 UI 控制。
 */

/** 半形／全形 A–D 字母（含大小寫） */
const OPTION_LETTER = '[A-Da-dＡ-Ｄ]';

/**
 * 單次匹配：選項開頭的字母前綴
 * 支援：A. / A、 / A) / (A) / （A） / A． 及前後空白
 */
const OPTION_PREFIX_ONCE = new RegExp(
  `^[\\s(（]*${OPTION_LETTER}\\s*[.)）．、,，]\\s*`,
  'u',
);

/**
 * 剝除選項文字開頭的重複字母前綴（可連續多層，如「A. A. 答案」）
 * @param {string} text — 原始選項文字
 * @returns {string} — 清洗後純文字（不含 A/B/C/D 前綴）
 */
export function stripOptionLetterPrefix(text = '') {
  let cleaned = String(text ?? '').trim();
  let prev = '';
  // 迴圈直到不再變化，徹底根除「A. A.」類雙重前綴
  while (cleaned !== prev) {
    prev = cleaned;
    cleaned = cleaned.replace(OPTION_PREFIX_ONCE, '').trim();
  }
  return cleaned;
}

/**
 * 產生前端標準選項標籤：「A. 文字」
 * @param {number} index — 0-based 選項索引
 * @param {string} rawOption — 模型回傳的原始選項字串
 * @returns {{ letter: string, label: string, display: string }}
 */
export function formatReadingChoiceOption(index, rawOption = '') {
  const letter = String.fromCharCode(65 + index);
  const label = stripOptionLetterPrefix(rawOption);
  return {
    letter,
    label,
    display: `${letter}. ${label}`,
  };
}

/**
 * 批量清洗 options 陣列（保留原長度與索引，供 correctIndex 對位）
 * @param {string[]} options
 * @returns {string[]}
 */
export function cleanReadingOptionLabels(options = []) {
  return options.map((opt) => stripOptionLetterPrefix(String(opt ?? '')));
}
