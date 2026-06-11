/**
 * 默書詞表 OCR 解析
 * ─────────────────
 * 多層提取：詞庫最長匹配 → 滑窗掃描 → 逐字分行配對 → 校本詞子串掃描
 * 只輸出詞庫內詞彙，拒絕標題碎片與亂碼
 */

import { IDIOM_EXAM_POOL } from './idiomExamPool.js';
import { VOCAB_HINTS } from './vocabHints.js';
import { PRESTUDY_IDIOM_COUNT } from './prestudyDictationBridge.js';
import { resolveCustomVocabFromInput } from './customVocabMatcher.js';
import {
  WORKSHEET_TITLE_PATTERN,
  ALL_WORKSHEET_WORDS,
  WORKSHEET_ORDERED_WORDS,
} from './worksheetVocabLexicon.js';

const VOCAB_SHEET_SIGNALS = /默書|默写|詞表|词表|詞語|词语|聽寫|听写|生字|默寫|新詞|新词|成語|成语|詞彙|词汇|校本詞|校本词|範文詞|范文词|溫習詞|温习词|字詞表/;

const NOISE_LINE = /姓名|班別|学号|學號|日期|分數|分数|滿分|满分|學校|学校|請在|请在|下列|造句|填空|改正|選出|选出|圈出|_{2,}|…{2,}|\.{4,}|^\(\s*\d+\s*分\s*\)/;

const TITLE_FRAGMENT = new Set([
  '小學', '小学', '高年', '年級', '年级', '級字', '字詞', '词表', '詞表', '字表',
  '高年級', '詞語', '词语', '而出', '脫穎', '穎而',
]);

const KNOWN_WORDS_SORTED = [...new Set([
  ...IDIOM_EXAM_POOL.map((item) => item.word),
  ...Object.keys(VOCAB_HINTS),
  ...ALL_WORKSHEET_WORDS,
])].sort((a, b) => b.length - a.length);

const KNOWN_WORD_SET = new Set(KNOWN_WORDS_SORTED);

function isKnownWord(word) {
  return KNOWN_WORD_SET.has(word) && !TITLE_FRAGMENT.has(word);
}

function stripWorksheetTitle(text = '') {
  return String(text)
    .replace(/小學高年級字詞表/g, ' ')
    .replace(/高年級字詞表/g, ' ')
    .replace(WORKSHEET_TITLE_PATTERN, ' ')
    .replace(/小學\s*高年級\s*字詞表/g, ' ');
}

function stripPinyinAndNoise(text = '') {
  return stripWorksheetTitle(text)
    .replace(/[a-zA-Z\u0100-\u024F\u1E00-\u1EFF\u0300-\u036f\u0350-\u036F\u0483-\u0489\u0323-\u0328]+/g, ' ')
    .replace(/[0-9０-９]+/g, ' ');
}

function toPlainHan(text = '') {
  return stripPinyinAndNoise(text).replace(/[^\u4e00-\u9fff]/g, '');
}

function removeTitleFromPlain(plainHan = '') {
  return plainHan
    .replace(/小學高年級字詞表/g, '')
    .replace(/高年級字詞表/g, '');
}

/** 詞庫最長匹配（連續子串） */
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
      if (!seen.has(matched) && isKnownWord(matched)) {
        seen.add(matched);
        hits.push({ word: matched, pos: i });
      }
      i += matched.length;
    } else {
      i += 1;
    }
  }

  return hits;
}

/** 滑窗掃描 2/4 字 — 僅保留詞庫命中（容忍 OCR 字間插入雜字） */
function slidingWindowLexiconScan(plainHan = '') {
  const hits = [];
  const seen = new Set();

  [4, 2].forEach((len) => {
    for (let i = 0; i + len <= plainHan.length; i += 1) {
      const word = plainHan.slice(i, i + len);
      if (!isKnownWord(word) || seen.has(word)) continue;
      seen.add(word);
      hits.push({ word, pos: i });
    }
  });

  return hits;
}

/**
 * 格子 OCR 常逐字分行 — 廉\n潔\n輝\n煌 → 組成 廉潔、輝煌
 */
function extractSingleCharLinePairs(rawText = '') {
  const hits = [];
  const seen = new Set();

  const flushPairs = (charLines, chunkSize) => {
    for (let i = 0; i + chunkSize <= charLines.length; i += chunkSize) {
      const word = charLines.slice(i, i + chunkSize).join('');
      if (!isKnownWord(word) || seen.has(word)) continue;
      seen.add(word);
      hits.push({ word, pos: i });
    }
  };

  String(rawText).split(/\n{2,}/).forEach((page) => {
    const charLines = [];
    page.split(/\n+/).forEach((line) => {
      const han = line.replace(/[^\u4e00-\u9fff]/g, '');
      if (han.length === 1) charLines.push(han);
      else if (han.length === 2 && isKnownWord(han)) {
        if (!seen.has(han)) {
          seen.add(han);
          hits.push({ word: han, pos: charLines.length });
        }
      } else if (han.length === 4 && isKnownWord(han)) {
        if (!seen.has(han)) {
          seen.add(han);
          hits.push({ word: han, pos: charLines.length });
        }
      }
    });

    if (charLines.length >= 4) {
      const isIdiomPage = /成語|汗流|恍然|百折不/.test(page);
      flushPairs(charLines, isIdiomPage ? 4 : 2);
    }
  });

  return hits;
}

/** 在校本詞表固定順序中，掃描 OCR 全文是否含該詞（子串存在即可） */
function scanWorksheetLexiconPresence(plainHan = '') {
  const hits = [];
  const seen = new Set();

  WORKSHEET_ORDERED_WORDS.forEach((word) => {
    if (!isKnownWord(word) || seen.has(word)) return;
    const pos = plainHan.indexOf(word);
    if (pos >= 0) {
      seen.add(word);
      hits.push({ word, pos });
    }
  });

  return hits;
}

/** 合併多種提取結果，按 OCR 位置排序去重 */
function mergeWordHits(...hitLists) {
  const byWord = new Map();

  hitLists.flat().forEach(({ word, pos }) => {
    if (!isKnownWord(word)) return;
    if (!byWord.has(word) || pos < byWord.get(word)) {
      byWord.set(word, pos);
    }
  });

  return [...byWord.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([word]) => word);
}

/** 多層校本詞表提取 */
function extractWorksheetWordsHybrid(rawText = '') {
  const plainFull = toPlainHan(rawText);
  const plainBody = removeTitleFromPlain(plainFull);

  const pages = String(rawText).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const pagePlains = (pages.length > 1 ? pages : [rawText]).map((p) => removeTitleFromPlain(toPlainHan(p)));

  const perPageHits = pagePlains.flatMap((plain) => [
    ...mineLexiconWordsFromPlain(plain),
    ...slidingWindowLexiconScan(plain),
  ]);

  return mergeWordHits(
    perPageHits,
    mineLexiconWordsFromPlain(plainBody),
    slidingWindowLexiconScan(plainBody),
    extractSingleCharLinePairs(rawText),
    scanWorksheetLexiconPresence(plainFull),
  );
}

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
        if (!isKnownWord(w) || seen.has(w)) return;
        if (lexiconOnly && !KNOWN_WORD_SET.has(w)) return;
        seen.add(w);
        tokens.push(w);
      });
  });

  return tokens;
}

function isWorksheetUpload(rawText = '') {
  if (WORKSHEET_TITLE_PATTERN.test(rawText)) return true;
  if (/lián|jié|huī|huáng|píng|fán|lián jié/i.test(rawText) && /廉|輝|烹|詞表|字詞表/.test(rawText)) return true;
  const hanCount = (rawText.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinCount = (rawText.match(/[a-zA-Z]/g) || []).length;
  return (hanCount >= 20 && latinCount >= 5) || (VOCAB_SHEET_SIGNALS.test(rawText) && hanCount >= 12);
}

export function isVocabWorksheetContent(rawText = '') {
  const text = String(rawText ?? '').trim();
  if (!text) return false;
  if (WORKSHEET_TITLE_PATTERN.test(text)) return true;
  if (VOCAB_SHEET_SIGNALS.test(text)) return true;
  if (isWorksheetUpload(text)) return true;
  if (extractWorksheetWordsHybrid(text).length >= 3) return true;
  return false;
}

export function parseVocabFromOcrText(rawText = '', options = {}) {
  const maxWords = options.maxWords ?? PRESTUDY_IDIOM_COUNT;
  const seed = options.seed ?? Date.now();

  let candidates = extractWorksheetWordsHybrid(rawText);

  if (candidates.length < 1) {
    candidates = extractLineTokens(rawText, { lexiconOnly: true });
  }

  candidates = candidates.filter(isKnownWord);

  if (!candidates.length) {
    return [];
  }

  const { matchedQuestions } = resolveCustomVocabFromInput(candidates.slice(0, maxWords), {
    source: 'ocr_vocab_parser',
    seed,
  });

  return matchedQuestions.filter((q) => isKnownWord(q.word)).slice(0, maxWords);
}
