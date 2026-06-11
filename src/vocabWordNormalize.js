/**
 * 詞表用字 — 繁簡去重 + 配對物件正規化
 */
import { convertToSimplified } from './chineseScript.js';
import { VOCAB_HINTS } from './vocabHints.js';
import { toTraditionalVocabWord } from './vocabTrad.js';

export { toTraditionalVocabWord } from './vocabTrad.js';

/** 保留順序 — 繁簡視為同一詞，只留繁體 */
export function dedupeVocabWords(words = []) {
  const seen = new Set();
  const out = [];

  words.forEach((entry) => {
    const raw = typeof entry === 'string' ? entry : (entry?.word ?? entry?.tc ?? '');
    const canon = toTraditionalVocabWord(raw);
    if (!canon || seen.has(canon)) return;
    seen.add(canon);
    out.push(canon);
  });

  return out;
}

/** 正規化配對物件 — word / tc 一律繁體 */
export function normalizeVocabMatchItem(item, index = 0) {
  if (!item || typeof item !== 'object') return item;

  const word = toTraditionalVocabWord(item.word ?? item.idiomWord ?? item.tc ?? item.sc);
  if (!word) return item;

  const hintEntry = VOCAB_HINTS[word] ?? VOCAB_HINTS[item.word] ?? VOCAB_HINTS[item.sc];
  const correctIdx = Number(item.correctAnswerIndex ?? 0);

  return {
    ...item,
    id: item.id ?? `vocab-${word}-${index}`,
    word,
    idiomWord: word,
    tc: word,
    sc: convertToSimplified(word),
    ...(Array.isArray(item.options) && item.options.length && hintEntry?.tc
      ? {
        options: item.options.map((opt, i) => (i === correctIdx ? hintEntry.tc : opt)),
      }
      : {}),
  };
}

export function dedupeVocabMatchItems(items = []) {
  const seen = new Set();
  return items
    .map((item, index) => normalizeVocabMatchItem(item, index))
    .filter((item) => {
      const key = item?.word;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
