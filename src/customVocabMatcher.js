/**
 * 家長自訂詞彙 — 精準配對引擎（Strict Vocabulary Matching）
 * ─────────────────────────────────────────────────────────────
 * · 禁止 Math.random() 盲抽舊題庫
 * · 依家長輸入順序，逐詞對 IDIOM_EXAM_POOL 做中文字串精準匹配
 * · 庫中無對應詞 → 自動組裝 fallback 物件（不卡死）
 */

import { VOCAB_HINTS } from './vocabHints.js';
import { IDIOM_EXAM_POOL } from './idiomExamPool.js';
import { WORKSHEET_VOCAB_HINTS } from './worksheetVocabLexicon.js';
import { extractPreviewWord } from './previewWordFormat.js';
import {
  toTraditionalVocabWord,
  dedupeVocabWords,
  dedupeVocabMatchItems,
  normalizeVocabMatchItem,
} from './vocabWordNormalize.js';

/** 單次上載詞數上限（與 uploadMetaUtils.MAX_UPLOAD_IMAGES 多頁策略對齊） */
const CUSTOM_WORD_CAP = 48;

/** 黃金 30 題核心庫 — 詞語 → 完整題目物件（O(1) 查找） */
const POOL_BY_WORD = new Map(
  IDIOM_EXAM_POOL.map((item) => [item.word, item]),
);

/**
 * 從 OCR 結果 / 貼上文字 / 混合格式輸入中，提取「純中文詞語」陣列
 * 保留家長輸入順序，去重但不洗牌
 */
export function normalizeCustomWordList(input = [], options = {}) {
  const cap = options.maxWords ?? CUSTOM_WORD_CAP;
  const seen = new Set();
  const words = [];

  const pushWord = (raw) => {
    const extracted = extractPreviewWord(raw) || String(raw ?? '').trim().replace(/\s/g, '');
    const word = toTraditionalVocabWord(extracted);
    if (!word || !/^[\u4e00-\u9fff]{2,8}$/.test(word)) return;
    /** 拒絕 OCR 長串亂碼與標題 */
    if (/字詞表|词表|年級|年级|高年級|默書|封面|目錄/.test(word)) return;
    if (!POOL_BY_WORD.has(word) && !VOCAB_HINTS[word] && !WORKSHEET_VOCAB_HINTS[word] && word.length > 4) return;
    if (seen.has(word)) return;
    seen.add(word);
    words.push(word);
  };

  if (typeof input === 'string') {
    input.split(/\n+/).forEach((line) => pushWord(line));
    return words.slice(0, cap);
  }

  if (!Array.isArray(input)) return [];

  input.forEach((item) => {
    if (typeof item === 'string') {
      item.split(/\n+/).forEach((line) => pushWord(line));
      return;
    }
    if (item && typeof item === 'object') {
      pushWord(item);
    }
  });

  return words.slice(0, cap);
}

/**
 * 庫中無對應詞時 — 組裝臨時乾淨物件（全港首發自訂詞）
 */
export function buildFallbackIdiomEntry(userWord, index = 0) {
  const word = toTraditionalVocabWord(userWord);
  const hintEntry = VOCAB_HINTS[word] ?? WORKSHEET_VOCAB_HINTS[word] ?? VOCAB_HINTS[userWord];
  const correctMeaning = hintEntry?.tc
    ?? `（家長自訂詞彙「${word}」— 請向老師請教準確字義）`;

  return {
    id: `custom_${Date.now()}_${index}`,
    word,
    questionText: `以下哪一個選項最適合用來解釋「${userWord}」的意思？`,
    options: [
      correctMeaning,
      '與原文語境完全無關的錯誤理解',
      '只符合字面字形但曲解文意的解釋',
      '文中並未提及的相反意思',
    ],
    correctAnswerIndex: 0,
    hint: `提示：這是家長新增的自訂溫習詞彙「${word}」。`,
    source: 'custom_vocab_upload',
  };
}

/**
 * 精準配對核心 — 逐詞查找 IDIOM_EXAM_POOL（禁止隨機 index 盲抽）
 * @param {string[]|object[]|string} customWordsInput
 * @returns {Array<{ id, word, questionText, options, correctAnswerIndex, hint, ... }>}
 */
export function matchCustomWordsStrict(customWordsInput = [], options = {}) {
  const words = normalizeCustomWordList(customWordsInput, options);
  if (!words.length) return [];

  return words.map((userWord, index) => {
    const canon = toTraditionalVocabWord(userWord);
    const matched = POOL_BY_WORD.get(canon) ?? POOL_BY_WORD.get(userWord);
    if (matched) {
      return normalizeVocabMatchItem({
        ...matched,
        source: matched.source ?? 'idiom_exam_pool',
        matchedFromUpload: true,
      }, index);
    }
    return buildFallbackIdiomEntry(canon, index);
  });
}

/**
 * 上載管道主入口 — OCR / 貼上 / 家長自訂欄位 → 精準配對結果
 */
export function resolveCustomVocabFromInput(customWordsInput = [], options = {}) {
  const customWords = dedupeVocabWords(normalizeCustomWordList(customWordsInput, options));
  const matchedQuestions = dedupeVocabMatchItems(matchCustomWordsStrict(customWords, options));

  return {
    customWordsInput: customWords,
    matchedQuestions,
    matchedCount: matchedQuestions.filter((q) => POOL_BY_WORD.has(q.word)).length,
    fallbackCount: matchedQuestions.filter((q) => q.source === 'custom_vocab_upload').length,
    source: options.source ?? 'custom_vocab_matcher',
  };
}

/**
 * 詞表模式出題 — 只出指定詞彙，絕不隨機抽題（非閱讀理解）
 */
export function generateQuestionsFromCustomWords(customWordsInput = [], options = {}) {
  return resolveCustomVocabFromInput(customWordsInput, options);
}
