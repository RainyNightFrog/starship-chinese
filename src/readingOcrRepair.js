/**
 * 閱讀 OCR 常見誤判修復 — 呈分試掃描 / Tesseract chi_tra 高頻錯字
 * 在 sanitize / 顯示 / 出題前統一套用
 */

/** 整詞替換（長模式優先） */
const PHRASE_FIXES = [
  ['生倩備', '準備'],
  ['生倩', '準'],
  ['準倩', '準'],
  ['悄倩', '悄悄'],
];

/** 行內 regex 修復 */
const REGEX_FIXES = [
  [/悄悄\s*[（(]\s*的\s*[\/／]\s*地\s*[）)]/g, '悄悄地'],
  [/([^\s，。！？；]{1,8})\s*[（(]\s*[的得]\s*[\/／]\s*[的地]\s*[）)]/g, '$1'],
  [/我還要\s*G@/gi, '我還要做'],
  [/要\s*G@/gi, '要做'],
  [/G@\s*(?=美味|三|薄)/g, '要做'],
  [/G@/g, '做'],
  [/修@/g, ''],
  [/([^\s])@([^\s])/g, '$1$2'],
];

/**
 * 修復 OCR 誤判字元（保留繁體標點「」、？）
 * @param {string} text
 * @returns {string}
 */
export function repairReadingOcrText(text = '') {
  let s = String(text ?? '');

  s = s.replace(/[①②③④⑤⑥⑦⑧⑨⑩⓪◯○]/g, '');

  PHRASE_FIXES.forEach(([wrong, right]) => {
    s = s.split(wrong).join(right);
  });

  REGEX_FIXES.forEach(([re, rep]) => {
    s = s.replace(re, rep);
  });

  s = stripWorksheetWatermarks(s);

  s = s.replace(
    /([\u4e00-\u9fff，「『：])([A-Za-z@#]{1,4})([\u4e00-\u9fff])/g,
    (all, before, mid, after) => {
      if (/^G@$/i.test(mid)) return `${before}做${after}`;
      if (/^[@#]+$/.test(mid)) return `${before}${after}`;
      if (/^[a-zA-Z]{1,3}$/.test(mid)) return `${before}${after}`;
      return all;
    },
  );

  return s;
}

/** 剝除試卷頁眉/頁腳水印（避免與正文黏連導致整段被誤判為無效行） */
export function stripWorksheetWatermarks(text = '') {
  return String(text ?? '')
    .replace(/更多練習\s*[,，]?\s*歡迎到\s*www\.[a-zA-Z0-9.-]+\.[a-z]{2,}\s*免費下載/gi, '')
    .replace(/更多練習\s*[,，]?\s*歡迎到\s*[a-zA-Z0-9-]+\.(?:com|hk|org|net)\s*免費下載/gi, '')
    .replace(/www\.[a-zA-Z0-9.-]+\.[a-z]{2,}/gi, '')
    .replace(/beasmartc9\.com/gi, '')
    .replace(/免費下載(?=[\u4e00-\u9fff「])/g, '');
}

/** 修復後是否仍含可疑 OCR 殘留 */
export function hasSuspiciousOcrArtifacts(text = '') {
  const s = String(text ?? '');
  return /G@|生倩|修@|[A-Za-z]{2,}@/.test(s);
}
