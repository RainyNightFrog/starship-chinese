/**
 * 默書詞表 OCR 解析
 * ─────────────────
 * · 剝除拼音 + 標題後，僅對「校本／呈分試詞庫」做最長匹配（禁止 2 字盲切）
 * · 杜絕「小學、高年、級字、企鄉」等標題碎片與 OCR 亂碼
 */

import { IDIOM_EXAM_POOL } from './idiomExamPool.js';
import { VOCAB_HINTS } from './vocabHints.js';
import { PRESTUDY_IDIOM_COUNT } from './prestudyDictationBridge.js';
import { resolveCustomVocabFromInput } from './customVocabMatcher.js';
import {
  WORKSHEET_TITLE_PATTERN,
  ALL_WORKSHEET_WORDS,
} from './worksheetVocabLexicon.js';

const VOCAB_SHEET_SIGNALS = /默書|默写|詞表|词表|詞語|词语|聽寫|听写|生字|默寫|新詞|新词|成語|成语|詞彙|词汇|校本詞|校本词|範文詞|范文词|溫習詞|温习词|字詞表/;

const NOISE_LINE = /姓名|班別|学号|學號|日期|分數|分数|滿分|满分|學校|学校|請在|请在|下列|造句|填空|改正|選出|选出|圈出|_{2,}|…{2,}|\.{4,}|^\(\s*\d+\s*分\s*\)/;

/** 標題被 2 字盲切後的碎片 — 絕不可當詞彙 */
const TITLE_FRAGMENT = new Set([
  '小學', '小学', '高年', '年級', '年级', '級字', '字詞', '词表', '詞表', '字表',
  '高年級', '詞語', '词语', '而出', '脫穎', '穎而', '而出',
]);

const KNOWN_WORDS_SORTED = [...new Set([
  ...IDIOM_EXAM_POOL.map((item) => item.word),
  ...Object.keys(VOCAB_HINTS),
  ...ALL_WORKSHEET_WORDS,
])].sort((a, b) => b.length - a.length);

const KNOWN_WORD_SET = new Set(KNOWN_WORDS_SORTED);

/** 徹底剝除標題（整句 + 逐段） */
function stripWorksheetTitle(text = '') {
  return String(text)
    .replace(/小學高年級字詞表/g, ' ')
    .replace(/高年級字詞表/g, ' ')
    .replace(WORKSHEET_TITLE_PATTERN, ' ')
    .replace(/小學\s*高年級\s*字詞表/g, ' ');
}

/** 剝除拼音、數字、標點 */
function stripPinyinAndNoise(text = '') {
  return stripWorksheetTitle(text)
    .replace(/[a-zA-Z\u0100-\u024F\u1E00-\u1EFF\u0300-\u036f\u0350-\u036F\u0483-\u0489\u0323-\u0328]+/g, ' ')
    .replace(/[0-9０-９]+/g, ' ');
}

function toPlainHan(text = '') {
  return stripPinyinAndNoise(text).replace(/[^\u4e00-\u9fff]/g, '');
}

/**
 * 詞庫最長匹配 — 只輸出 KNOWN_WORD_SET 內的詞（保留出現順序）
 * 未知字逐字跳過，絕不拼成 2 字亂碼
 */
function mineLexiconWordsFromPlain(plainHan = '') {
  const hits = [];
  const seen = new Set();

  for (let i = 0; i < plainHan.length; ) {
    let matched = null;
    for (const word of KNOWN_WORDS_SORTED) {
      if (plainHan.startsWith(word, i)) {
        matched = word;
        break;
      }
    }
    if (matched) {
      if (!seen.has(matched) && !TITLE_FRAGMENT.has(matched)) {
        seen.add(matched);
        hits.push({ word: matched, pos: i });
      }
      i += matched.length;
    } else {
      i += 1;
    }
  }

  return hits.sort((a, b) => a.pos - b.pos).map((h) => h.word);
}

/** 逐頁 + 全文詞庫匹配 */
function extractWorksheetWordsStrict(rawText = '') {
  const pages = String(rawText).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const pageList = pages.length > 1 ? pages : [rawText];

  const allWords = [];
  const seen = new Set();

  const pushWords = (words) => {
    words.forEach((w) => {
      if (!KNOWN_WORD_SET.has(w) || TITLE_FRAGMENT.has(w) || seen.has(w)) return;
      seen.add(w);
      allWords.push(w);
    });
  };

  pageList.forEach((page) => {
    pushWords(mineLexiconWordsFromPlain(toPlainHan(page)));
  });

  if (allWords.length < 4) {
    pushWords(mineLexiconWordsFromPlain(toPlainHan(rawText)));
  }

  return allWords;
}

/** 貼上文字：一行一詞（僅接受詞庫內或 2/4 字純中文） */
function extractLineTokens(rawText = '', { lexiconOnly = false } = {}) {
  const tokens = [];
  const seen = new Set();

  String(rawText).split(/\n+/).forEach((rawLine) => {
    if (NOISE_LINE.test(rawLine)) return;
    const line = stripPinyinAndNoise(rawLine).trim();
    if (!line) return;

    line.split(/[\s\u3000、，,。；;·|\/\\]+/)
      .map((s) => s.replace(/[^\u4e00-\u9fff]/g, ''))
      .filter((w) => w.length === 2 || w.length === 4)
      .forEach((w) => {
        if (TITLE_FRAGMENT.has(w) || seen.has(w)) return;
        if (lexiconOnly && !KNOWN_WORD_SET.has(w)) return;
        seen.add(w);
        tokens.push(w);
      });
  });

  return tokens;
}

function isWorksheetUpload(rawText = '') {
  if (WORKSHEET_TITLE_PATTERN.test(rawText)) return true;
  if (/lián|jié|huī|huáng|píng|fán|lián jié/i.test(rawText) && /廉|輝|烹|詞表/.test(rawText)) return true;
  const hanCount = (rawText.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinCount = (rawText.match(/[a-zA-Z]/g) || []).length;
  return (hanCount >= 20 && latinCount >= 8) || (VOCAB_SHEET_SIGNALS.test(rawText) && hanCount >= 12);
}

export function isVocabWorksheetContent(rawText = '') {
  const text = String(rawText ?? '').trim();
  if (!text) return false;
  if (WORKSHEET_TITLE_PATTERN.test(text)) return true;
  if (VOCAB_SHEET_SIGNALS.test(text)) return true;
  if (isWorksheetUpload(text)) return true;
  if (extractWorksheetWordsStrict(text).length >= 4) return true;
  return false;
}

/**
 * 從 OCR 全文提取詞彙 → 只輸出詞庫命中詞（禁止 fallback 亂碼）
 */
export function parseVocabFromOcrText(rawText = '', options = {}) {
  const maxWords = options.maxWords ?? PRESTUDY_IDIOM_COUNT;
  const seed = options.seed ?? Date.now();
  const ocrWorksheet = isWorksheetUpload(rawText) || WORKSHEET_TITLE_PATTERN.test(rawText);

  let candidates = extractWorksheetWordsStrict(rawText);

  if (candidates.length < 1) {
    candidates = extractLineTokens(rawText, { lexiconOnly: ocrWorksheet });
  }

  /** OCR 字詞表：零容錯 — 不在詞庫的一律丟棄 */
  if (ocrWorksheet) {
    candidates = candidates.filter((w) => KNOWN_WORD_SET.has(w) && !TITLE_FRAGMENT.has(w));
  }

  if (!candidates.length) {
    return [];
  }

  const { matchedQuestions } = resolveCustomVocabFromInput(candidates.slice(0, maxWords), {
    source: 'ocr_vocab_parser',
    seed,
  });

  return matchedQuestions
    .filter((q) => KNOWN_WORD_SET.has(q.word) && !TITLE_FRAGMENT.has(q.word))
    .slice(0, maxWords);
}
