/**
 * 默書詞表 OCR 解析 — 從 Tesseract 全文提取純詞彙清單
 * ─────────────────────────────────────────────────────────
 * · 小學字詞表：剝除拼音 → 依格子順序 2 字 / 4 字切分（非呈分試池盲抽）
 * · 過濾標題雜訊；對照 worksheetVocabLexicon 驗證
 */

import { IDIOM_EXAM_POOL } from './idiomExamPool.js';
import { VOCAB_HINTS } from './vocabHints.js';
import { PRESTUDY_IDIOM_COUNT } from './prestudyDictationBridge.js';
import { resolveCustomVocabFromInput } from './customVocabMatcher.js';
import {
  WORKSHEET_TITLE_PATTERN,
  ALL_WORKSHEET_WORDS,
  WORKSHEET_IDIOM_ANCHORS,
} from './worksheetVocabLexicon.js';

/** 默書／詞表版面特徵 */
const VOCAB_SHEET_SIGNALS = /默書|默写|詞表|词表|詞語|词语|聽寫|听写|生字|默寫|新詞|新词|成語|成语|詞彙|词汇|校本詞|校本词|範文詞|范文词|溫習詞|温习词|字詞表/;

const NOISE_LINE = /姓名|班別|学号|學號|日期|分數|分数|滿分|满分|學校|学校|請在|请在|下列|造句|填空|改正|選出|选出|圈出|_{2,}|…{2,}|\.{4,}|^\(\s*\d+\s*分\s*\)/;

const TITLE_NOISE = /字詞表|词表|詞語表|词语表|默書|默写|年級|年级|高年級|高年级|字表|封面|目錄|目录|單元|单元|呈分|溫習单|默書單|詞彙表|词汇表|第\s*[\d一二三四五六七八九十]+\s*[页頁章節]/;

const KNOWN_WORDS_SORTED = [...new Set([
  ...IDIOM_EXAM_POOL.map((item) => item.word),
  ...Object.keys(VOCAB_HINTS),
  ...ALL_WORKSHEET_WORDS,
])].sort((a, b) => b.length - a.length);

const KNOWN_WORD_SET = new Set(KNOWN_WORDS_SORTED);

/** 剝除拼音、數字、標點 — 保留中文與換行（供逐頁處理） */
function stripPinyinAndNoise(text = '') {
  return String(text)
    .replace(WORKSHEET_TITLE_PATTERN, '\n')
    .replace(/小學/g, ' ')
    .replace(/高年級/g, ' ')
    .replace(/[a-zA-Z\u0100-\u024F\u1E00-\u1EFF\u0300-\u036f\u0350-\u036F\u0483-\u0489\u0323-\u0328]+/g, ' ')
    .replace(/[0-9０-９]+/g, ' ');
}

/** 只保留漢字，依 OCR 閱讀順序排列 */
function extractHanCharStream(text = '') {
  return [...String(text).replace(/[^\u4e00-\u9fff]/g, '')];
}

function isTitleOrNoise(token = '') {
  if (!token) return true;
  if (TITLE_NOISE.test(token)) return true;
  if (/錯別字|辨正|填空|成語題|試卷|分數/.test(token)) return true;
  return false;
}

/** 有效詞語：2 字或 4 字；3 字、5+ 字一律拒絕 */
function isValidWorksheetWord(word) {
  if (!word || !/^[\u4e00-\u9fff]+$/.test(word)) return false;
  if (word.length !== 2 && word.length !== 4) return false;
  if (isTitleOrNoise(word)) return false;
  return true;
}

/** 判斷該頁是否為四字成語表 */
function isIdiomWorksheetPage(rawPage = '', chars = []) {
  if (/成語|汗流|鰥寡|彬彬|恍然|自暴/.test(rawPage)) return true;
  if (chars.length >= 8 && chars.length % 4 === 0) {
    let anchorHits = 0;
    for (let i = 0; i + 4 <= chars.length; i += 4) {
      const w = chars.slice(i, i + 4).join('');
      if (WORKSHEET_IDIOM_ANCHORS.includes(w) || ALL_WORKSHEET_WORDS.has(w)) {
        anchorHits += 1;
      }
    }
    if (anchorHits >= 2) return true;
    if (chars.length <= 52 && chars.length % 4 === 0) return true;
  }
  return false;
}

/** 字流切詞：2 字詞表 or 4 字成語表 */
function charStreamToWords(chars, chunkSize) {
  const words = [];
  for (let i = 0; i + chunkSize <= chars.length; i += chunkSize) {
    words.push(chars.slice(i, i + chunkSize).join(''));
  }
  return words;
}

/**
 * 小學字詞表專用 — 剝拼音後依閱讀順序切 2/4 字
 * （解決 OCR 把 lián jié 與漢字混排導致「蘭若」「歐陸」亂碼）
 */
function extractFromWorksheetFormat(rawText = '') {
  const pages = String(rawText).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const pageList = pages.length > 1 ? pages : [rawText];

  const allWords = [];
  const seen = new Set();

  pageList.forEach((page) => {
    const stripped = stripPinyinAndNoise(page);
    const chars = extractHanCharStream(stripped);
    if (chars.length < 4) return;

    const chunkSize = isIdiomWorksheetPage(page, chars) ? 4 : 2;
    const words = charStreamToWords(chars, chunkSize);

    words.forEach((word) => {
      if (!isValidWorksheetWord(word) || seen.has(word)) return;
      seen.add(word);
      allWords.push(word);
    });
  });

  return allWords;
}

/** 逐行提取（貼上文字 / 一行一詞） */
function extractLineTokens(rawText = '') {
  const tokens = [];
  const seen = new Set();

  String(rawText).split(/\n+/).forEach((rawLine) => {
    if (NOISE_LINE.test(rawLine)) return;
    const line = stripPinyinAndNoise(rawLine).trim();
    if (!line || NOISE_LINE.test(line)) return;

    line.split(/[\s\u3000、，,。；;·|\/\\]+/)
      .map((s) => s.replace(/[^\u4e00-\u9fff]/g, ''))
      .filter((w) => isValidWorksheetWord(w))
      .forEach((w) => {
        if (seen.has(w)) return;
        seen.add(w);
        tokens.push(w);
      });
  });

  return tokens;
}

function isWorksheetUpload(rawText = '') {
  if (WORKSHEET_TITLE_PATTERN.test(rawText)) return true;
  if (/lián|jié|huī|huáng|píng|fán/i.test(rawText) && /廉|輝|烹/.test(rawText)) return true;
  const hanCount = (rawText.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinCount = (rawText.match(/[a-zA-Z]/g) || []).length;
  return hanCount >= 20 && latinCount >= 10 && VOCAB_SHEET_SIGNALS.test(rawText);
}

/**
 * 判斷 OCR 全文是否為默書詞表（而非閱讀文章）
 */
export function isVocabWorksheetContent(rawText = '') {
  const text = String(rawText ?? '').trim();
  if (!text) return false;
  if (WORKSHEET_TITLE_PATTERN.test(text)) return true;
  if (VOCAB_SHEET_SIGNALS.test(text)) return true;
  if (isWorksheetUpload(text)) return true;

  const worksheetWords = extractFromWorksheetFormat(text);
  if (worksheetWords.length >= 6) return true;

  const lines = text.split(/\n+/).filter(Boolean);
  if (lines.length >= 8 && text.replace(/\s/g, '').length < 800) return true;

  return false;
}

/**
 * 從 OCR 全文提取詞彙 → 精準配對詞庫字義
 */
export function parseVocabFromOcrText(rawText = '', options = {}) {
  const maxWords = options.maxWords ?? PRESTUDY_IDIOM_COUNT;
  const seed = options.seed ?? Date.now();

  let candidates = [];

  /** 字詞表優先：剝拼音 + 字流切分（不用呈分試池滑窗匹配） */
  if (isWorksheetUpload(rawText) || WORKSHEET_TITLE_PATTERN.test(rawText)) {
    candidates = extractFromWorksheetFormat(rawText);
  }

  if (candidates.length < 3) {
    const worksheetTry = extractFromWorksheetFormat(rawText);
    if (worksheetTry.length > candidates.length) {
      candidates = worksheetTry;
    }
  }

  if (candidates.length < 3) {
    candidates = extractLineTokens(rawText);
  }

  if (!candidates.length) {
    return [];
  }

  const { matchedQuestions } = resolveCustomVocabFromInput(candidates.slice(0, maxWords), {
    source: 'ocr_vocab_parser',
    seed,
  });

  return matchedQuestions
    .filter((q) => q.word.length === 2 || q.word.length === 4)
    .slice(0, maxWords);
}
