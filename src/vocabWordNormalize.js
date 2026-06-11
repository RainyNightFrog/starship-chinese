/**
 * 詞表用字 — 統一繁體（香港）+ 繁簡去重
 */
import * as OpenCC from 'opencc-js';
import { convertToSimplified } from './chineseScript.js';
import { VOCAB_HINTS } from './vocabHints.js';
import { IDIOM_EXAM_POOL } from './idiomExamPool.js';

let cnToHk = null;

function getCnToHkConverter() {
  if (!cnToHk) {
    cnToHk = OpenCC.Converter({ from: 'cn', to: 'hk' });
  }
  return cnToHk;
}

/** 繁簡同義異体字 — OpenCC 未必合併 */
const MANUAL_CANONICAL = new Map([
  ['了解', '瞭解'],
  ['仿佛', '彷彿'],
  ['星羅棋布', '星羅棋佈'],
  ['百折不挠', '百折不撓'],
  ['启发', '啟發'],
]);

const CANONICAL_BY_FORM = new Map();
let canonicalReady = false;

function ensureCanonicalMap() {
  if (canonicalReady) return;
  canonicalReady = true;

  Object.keys(VOCAB_HINTS).forEach(registerWordForm);
  IDIOM_EXAM_POOL.forEach((item) => registerWordForm(item.word));
  MANUAL_CANONICAL.forEach((canonical, alias) => {
    CANONICAL_BY_FORM.set(alias, canonical);
    CANONICAL_BY_FORM.set(canonical, canonical);
  });
}

function pickPreferredTrad(trad, original) {
  if (VOCAB_HINTS[trad]) return trad;
  if (MANUAL_CANONICAL.has(original)) return MANUAL_CANONICAL.get(original);
  if (MANUAL_CANONICAL.has(trad)) return MANUAL_CANONICAL.get(trad);
  return trad;
}

function registerWordForm(form) {
  if (!form || !/^[\u4e00-\u9fff]{2,8}$/.test(form)) return;
  const trad = getCnToHkConverter()(form);
  const canonical = pickPreferredTrad(trad, form);
  CANONICAL_BY_FORM.set(form, canonical);
  CANONICAL_BY_FORM.set(trad, canonical);
  CANONICAL_BY_FORM.set(canonical, canonical);
}

/** 詞語 → 香港繁體 canonical（上載／OCR／顯示一律用此） */
export function toTraditionalVocabWord(word = '') {
  ensureCanonicalMap();
  const raw = String(word ?? '').trim().replace(/\s/g, '');
  if (!raw || !/^[\u4e00-\u9fff]{2,8}$/.test(raw)) return raw;

  if (CANONICAL_BY_FORM.has(raw)) {
    return CANONICAL_BY_FORM.get(raw);
  }

  const trad = getCnToHkConverter()(raw);
  const canonical = pickPreferredTrad(trad, raw);
  CANONICAL_BY_FORM.set(raw, canonical);
  CANONICAL_BY_FORM.set(trad, canonical);
  return canonical;
}

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
  ensureCanonicalMap();
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
