/**
 * 中央共享詞彙池品質閘 — 過濾 OCR 碎片與無法作答的「文中詞義」題
 */

/** 四字詞內不應出現的虛詞／標點（OCR 切碎片段） */
const IDIOM_PARTICLE_CHARS = /[的了是在有和与與這那你我他她它們嗎呢啊吧又也都很就還要會能對把被讓向從到為上下中？，。！；：「」『』（）]/;

/** 掃描時排除的試卷結構用字 */
const SCAN_STOP_WORDS = new Set([
  '錯別字', '填空', '成語', '學校', '試卷', '姓名', '班別', '學號',
  '滿分', '得分', '日期', '小學', '中學', '香港', '中文', '語文',
  '根據文', '從文中', '下列哪', '哪一項', '適當的', '詞語在',
]);

/** 無原文卻要求「回到原文」的 meta 選項（wrapIdiomAsStandardQuestion 舊版） */
const META_READING_OPTION_MARKERS = /結合上下文|望文生義|只按字面|敘述重點完全無關|概括該詞在文中的語境義/;

/** 題幹引用「文中」但無 passage 時視為不可作答 */
const PASSAGE_DEPENDENT_STEM = /文中使用了|回到原文|從前後文推斷/;

export function isGarbageIdiomWord(word = '') {
  const w = String(word ?? '').trim();
  if (w.length !== 4) return true;
  if (!/^[\u4e00-\u9fff]{4}$/.test(w)) return true;
  if (IDIOM_PARTICLE_CHARS.test(w)) return true;
  if (SCAN_STOP_WORDS.has(w)) return true;
  if (/^[第行選項題分課本文根據]/.test(w)) return true;
  return false;
}

export function hasMetaReadingStrategyOptions(options = []) {
  return (options ?? []).some((opt) => META_READING_OPTION_MARKERS.test(String(opt ?? '')));
}

export function isPassageDependentVocabStem(text = '') {
  return PASSAGE_DEPENDENT_STEM.test(String(text ?? ''));
}

/**
 * 是否可作呈分試／單元測驗的詞彙語意題（須有真實語意選項，不可依賴原文）
 */
export function isPlayableVocabExamItem(item = {}) {
  if (!item || item.dictationOnly) return false;

  const options = item.options ?? [];
  if (options.length < 4) return false;
  if (hasMetaReadingStrategyOptions(options)) return false;

  const stem = item.questionText ?? item.text ?? '';
  const word = String(item.word ?? '').trim();

  /** 成語填空題 — 題幹自帶完整語境 */
  if (/_{2,}|＿{2,}/.test(stem)) return true;

  if (word) {
    if (isGarbageIdiomWord(word)) return false;
    if (isPassageDependentVocabStem(stem) && !item.passageContext) return false;
    return true;
  }

  /** 無 word 欄的靜態呈分試題（長題幹 + 四字選項） */
  if (stem.length >= 20 && !isPassageDependentVocabStem(stem)) return true;

  return false;
}

/** 掃描 OCR 正文時，是否值得收錄為校本詞彙 */
export function isScannableIdiomCandidate(word = '') {
  return !isGarbageIdiomWord(word);
}
