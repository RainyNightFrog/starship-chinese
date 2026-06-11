/**
 * 詞語繁體正規化 — 無 vocabHints 依賴，避免循環引用
 */
import * as OpenCC from 'opencc-js';
import { IDIOM_EXAM_POOL } from './idiomExamPool.js';
import { WORKSHEET_VOCAB_HINTS } from './worksheetVocabLexicon.js';

let cnToHk = null;

function getCnToHkConverter() {
  if (!cnToHk) {
    cnToHk = OpenCC.Converter({ from: 'cn', to: 'hk' });
  }
  return cnToHk;
}

const MANUAL_CANONICAL = new Map([
  ['了解', '瞭解'],
  ['仿佛', '彷彿'],
  ['星羅棋布', '星羅棋佈'],
  ['百折不挠', '百折不撓'],
  ['启发', '啟發'],
  ['传授', '傳授'],
  ['沉着', '沉著'],
]);

const CANONICAL_BY_FORM = new Map();
let canonicalReady = false;

function pickPreferredTrad(trad, original) {
  if (WORKSHEET_VOCAB_HINTS[trad]) return trad;
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

function ensureCanonicalMap() {
  if (canonicalReady) return;
  canonicalReady = true;
  Object.keys(WORKSHEET_VOCAB_HINTS).forEach(registerWordForm);
  IDIOM_EXAM_POOL.forEach((item) => registerWordForm(item.word));
  MANUAL_CANONICAL.forEach((canonical, alias) => {
    CANONICAL_BY_FORM.set(alias, canonical);
    CANONICAL_BY_FORM.set(canonical, canonical);
  });
}

/** 詞語 → 香港繁體 canonical */
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
