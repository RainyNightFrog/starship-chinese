/**
 * 默書詞表 OCR 解析 — 從 Tesseract 全文提取純詞彙清單（非閱讀理解題）
 * ─────────────────────────────────────────────────────────────────────
 * · 優先從 IDIOM_EXAM_POOL / VOCAB_HINTS 詞庫「最長匹配」掃描（避免 8 字亂串）
 * · 逐行以標點 / 空格切詞；禁止對長行做 {2,8} 滑窗盲切
 * · 過濾標題雜訊（字詞表、年級…）
 */

import { IDIOM_EXAM_POOL } from './idiomExamPool.js';
import { VOCAB_HINTS } from './vocabHints.js';
import { PRESTUDY_IDIOM_COUNT } from './prestudyDictationBridge.js';
import { resolveCustomVocabFromInput } from './customVocabMatcher.js';

/** 默書／詞表版面特徵 */
const VOCAB_SHEET_SIGNALS = /默書|默写|詞表|词表|詞語|词语|聽寫|听写|生字|默寫|新詞|新词|成語|成语|詞彙|词汇|校本詞|校本词|範文詞|范文词|溫習詞|温习词/;

/** 試卷／封面雜訊行 */
const NOISE_LINE = /姓名|班別|学号|學號|日期|分數|分数|滿分|满分|學校|学校|請在|请在|下列|造句|填空|改正|選出|选出|圈出|_{2,}|…{2,}|\.{4,}|^\(\s*\d+\s*分\s*\)/;

/** 標題／版面用語 — 絕不可當詞彙 */
const TITLE_NOISE = /字詞表|词表|詞語表|词语表|默書|默写|年級|年级|高年級|高年级|字表|封面|目錄|目录|單元|单元|呈分|溫習单|默書單|詞彙表|词汇表|校本|範文|范文|第\s*[\d一二三四五六七八九十]+\s*[页頁章節]/;

/** 黃金詞庫 + 字義表 — 供 OCR 最長匹配 */
const KNOWN_WORDS_SORTED = [...new Set([
  ...IDIOM_EXAM_POOL.map((item) => item.word),
  ...Object.keys(VOCAB_HINTS),
])].sort((a, b) => b.length - a.length);

const KNOWN_WORD_SET = new Set(KNOWN_WORDS_SORTED);

const STOP_TOKENS = new Set([
  '的', '了', '在', '是', '我', '他', '她', '它', '們', '这', '這', '那', '有', '和', '與', '与',
  '也', '就', '都', '而', '及', '或', '把', '被', '让', '讓', '向', '从', '從', '到', '為', '为',
  '上', '下', '中', '不', '很', '更', '最', '能', '會', '会', '要', '可以', '應該', '应该', '請', '请',
  '下列', '哪一', '哪项', '哪項', '根據', '根据', '文章', '作者', '本文', '句子', '詞語', '词语', '選項', '选项',
  '第一', '第二', '第三', '第四', '第五', '第六', '第七', '第八', '第九', '第十',
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
]);

function stripLineNoise(line = '') {
  return String(line)
    .replace(/^\s*[\d①②③④⑤⑥⑦⑧⑨⑩]+[\.\．、\)\）\s]*/g, '')
    .replace(/^[A-DＡ-Ｄa-d][\.．、\)\）\s]+/g, '')
    .replace(/[（(][^）)]{0,12}[）)]/g, '')
    .replace(/[：:].*$/, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function isTitleOrNoise(token = '') {
  if (!token) return true;
  if (TITLE_NOISE.test(token)) return true;
  if (/錯別字|辨正|填空|成語題|試卷|分數/.test(token)) return true;
  return false;
}

/**
 * 是否為可接受的詞語 token
 * · 詞庫內：2–8 字
 * · 詞庫外：僅 2–4 字（防止 OCR 長串亂碼）
 */
function isValidExtractedToken(token) {
  if (!token || !/^[\u4e00-\u9fff]+$/.test(token)) return false;
  if (STOP_TOKENS.has(token)) return false;
  if (isTitleOrNoise(token)) return false;
  if (/^[A-Za-z0-9]+$/.test(token)) return false;

  if (KNOWN_WORD_SET.has(token)) {
    return token.length >= 2 && token.length <= 8;
  }
  return token.length >= 2 && token.length <= 4;
}

/** 逐字空格排版 → 合併成詞，如「賞 心 悅 目」→「賞心悅目」 */
function collapseSpacedChineseLine(line = '') {
  const trimmed = line.trim();
  if (/^([\u4e00-\u9fff](?:[\s\u3000]+[\u4e00-\u9fff])+)$/.test(trimmed)) {
    return trimmed.replace(/[\s\u3000]+/g, '');
  }
  return trimmed;
}

/**
 * 在純中文串中，依序最長匹配詞庫詞語（保留出現順序、去重）
 */
function mineKnownWordsFromPlainText(rawText = '') {
  const plain = String(rawText)
    .replace(/[ \t\r\n\dA-Za-z0-9，,。、；;：:「」""''（）()[\]【】\-—·|\/\\_.]+/g, '');

  const hits = [];
  const seen = new Set();

  for (let i = 0; i < plain.length; ) {
    let matched = null;
    for (const word of KNOWN_WORDS_SORTED) {
      if (plain.startsWith(word, i)) {
        matched = word;
        break;
      }
    }
    if (matched) {
      if (!seen.has(matched)) {
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

/** 從單行 OCR 文字提取詞語（標點 / 空格切分，禁止長行滑窗） */
function extractLineTokens(rawLine = '') {
  if (NOISE_LINE.test(rawLine)) return [];

  const line = collapseSpacedChineseLine(stripLineNoise(rawLine));
  if (!line || NOISE_LINE.test(line)) return [];

  const compact = line.replace(/[\s\u3000]/g, '');
  if (isValidExtractedToken(compact)) {
    return [compact];
  }

  const tokens = [];
  line.split(/[\s\u3000、，,。；;·|\/\\]+/)
    .map((s) => s.trim().replace(/[\s\u3000]/g, ''))
    .filter(Boolean)
    .forEach((chunk) => {
      if (isValidExtractedToken(chunk)) tokens.push(chunk);
    });
  if (tokens.length) return tokens;

  /** 空格分隔的多個 2–4 字詞：「向上 卻說 雖然」 */
  const spaceWords = line.split(/[\s\u3000]+/)
    .map((s) => s.trim())
    .filter((w) => /^[\u4e00-\u9fff]{2,4}$/.test(w) && isValidExtractedToken(w));
  if (spaceWords.length >= 2) return spaceWords;

  return [];
}

function mergeCandidates(minedWords = [], lineTokens = [], { preferKnown = false } = {}) {
  const seen = new Set();
  const out = [];

  const push = (word) => {
    if (!isValidExtractedToken(word) || seen.has(word)) return;
    if (preferKnown && !KNOWN_WORD_SET.has(word) && word.length > 4) return;
    seen.add(word);
    out.push(word);
  };

  minedWords.forEach(push);
  lineTokens.forEach(push);

  return out;
}

/**
 * 判斷 OCR 全文是否為默書詞表（而非閱讀文章）
 */
export function isVocabWorksheetContent(rawText = '') {
  const text = String(rawText ?? '').trim();
  if (!text) return false;

  if (VOCAB_SHEET_SIGNALS.test(text)) return true;

  const lines = text.split(/\n+/).map(stripLineNoise).filter(Boolean);
  const shortWordLines = lines.filter((line) => {
    const compact = line.replace(/\s/g, '');
    return isValidExtractedToken(compact);
  });

  if (shortWordLines.length >= 8) return true;

  const mined = mineKnownWordsFromPlainText(text);
  if (mined.length >= 8) return true;

  const totalLen = text.replace(/\s/g, '').length;
  const avgLineLen = lines.length
    ? lines.reduce((sum, line) => sum + line.replace(/\s/g, '').length, 0) / lines.length
    : 0;

  if (lines.length >= 10 && avgLineLen < 14 && totalLen < 600) return true;

  return false;
}

/**
 * 從 OCR 全文提取詞彙清單 → 精準配對 IDIOM_EXAM_POOL
 * @returns {Array<{ id, word, options, correctAnswerIndex, hint, ... }>}
 */
export function parseVocabFromOcrText(rawText = '', options = {}) {
  const maxWords = options.maxWords ?? PRESTUDY_IDIOM_COUNT;
  const seed = options.seed ?? Date.now();

  const mined = mineKnownWordsFromPlainText(rawText);

  const lineTokens = [];
  String(rawText ?? '').split(/\n+/).forEach((rawLine) => {
    extractLineTokens(rawLine).forEach((token) => lineTokens.push(token));
  });

  /** 詞庫已掃到 ≥3 詞 → 優先詞庫命中，丟棄 5+ 字 OCR 亂串 */
  const preferKnown = mined.length >= 3;
  let candidates = mergeCandidates(mined, lineTokens, { preferKnown });

  if (!candidates.length && mined.length) {
    candidates = mined;
  }

  if (!candidates.length) {
    return [];
  }

  const { matchedQuestions } = resolveCustomVocabFromInput(candidates.slice(0, maxWords), {
    source: 'ocr_vocab_parser',
    seed,
  });

  /** 最終防線：剔除 5+ 字且不在詞庫的 fallback 亂碼 */
  return matchedQuestions.filter(
    (q) => KNOWN_WORD_SET.has(q.word) || q.word.length <= 4,
  ).slice(0, maxWords);
}
